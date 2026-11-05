// Dev-only routes (architecture §8.2 Ontwikkeling, §10.3). Owner WP-3.
// Only server.dev.ts loads this module, via modules.dev.gen.ts; the production bundle never contains it.
import { DomainError } from '@rewarded/contracts';
import { devRoutes, type AaCheckResponse } from '@rewarded/contracts/dev';
import { armAt } from '../../db/services/experiments.ts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { DevClock, DevMailer, DevSmsSender, type DevInbox } from '../../platform/dev.ts';
import { createScheduler, loadJobs, type Scheduler } from '../../jobs/scheduler.ts';
import type { ExperimentFactor } from '@rewarded/contracts';

/** Marker used by the production-bundle test to prove this module is absent. */
export const DEV_MODULE_MARKER = 'rewarded:dev-module';

function inboxOf(deps: ModuleDeps): DevInbox | undefined {
  if (deps.platform.mailer instanceof DevMailer) return deps.platform.mailer.inbox;
  if (deps.platform.sms instanceof DevSmsSender) return deps.platform.sms.inbox;
  return undefined;
}

/** Empties every table except the migration log; triggers that guard append-only tables are put back. */
export function resetDatabase(deps: ModuleDeps): void {
  const { db } = deps;
  const tables = db
    .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migration'")
    .map((t) => t.name);
  const triggers = db.all<{ name: string; sql: string }>("SELECT name, sql FROM sqlite_master WHERE type = 'trigger'");
  db.exec('PRAGMA foreign_keys = OFF');
  try {
    db.transaction(() => {
      for (const t of triggers) db.exec(`DROP TRIGGER "${t.name}"`);
      for (const t of tables) db.exec(`DELETE FROM "${t}"`);
      for (const t of triggers) db.exec(t.sql);
    });
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

/** A/A check (voorregistratie §9.3) on the assignment rule: balance per block and stratum, no minor in B. */
export function aaCheck(users: number, seed: string): AaCheckResponse {
  const factors: ExperimentFactor[] = ['bonus', 'belofte', 'rest', 'prompt'];
  const strata = ['club_a|club', 'club_b|club', 'none|squad_invite', 'none|waitlist'];
  const counts = new Map<string, Record<string, number>>();
  const pos = new Map<string, number>();
  let minorInB = 0;
  let unbalancedBlocks = 0;
  const blocks = new Map<string, Record<string, number>>();
  for (let i = 0; i < users; i++) {
    const stratum = strata[i % strata.length]!;
    const minor = i % 10 === 0;
    for (const factor of factors) {
      const s = factor === 'prompt' ? stratum.split('|')[1]! : stratum;
      const k = `${factor}|${s}`;
      const p = pos.get(k) ?? 0;
      pos.set(k, p + 1);
      const { arm, block } = armAt(seed, factor, s, p);
      const personal = minor && factor === 'bonus' ? 'A' : minor && factor === 'rest' ? 'continue' : arm;
      if (minor && factor === 'bonus' && personal === 'B') minorInB++;
      const c = counts.get(k) ?? {};
      c[arm] = (c[arm] ?? 0) + 1;
      counts.set(k, c);
      const b = blocks.get(block) ?? {};
      b[arm] = (b[arm] ?? 0) + 1;
      blocks.set(block, b);
    }
  }
  for (const b of blocks.values()) {
    const v = Object.values(b);
    const total = v.reduce((x, y) => x + y, 0);
    if (total === 4 && (v.length !== 2 || v.some((n) => n !== 2))) unbalancedBlocks++;
  }
  const maxImbalance = Math.max(...[...counts.values()].map((c) => Math.abs(Object.values(c).reduce((a, n, i) => (i === 0 ? n : a - n), 0))));
  return {
    factors: [...counts.entries()].map(([k, c]) => ({ factor: k.split('|')[0]!, stratum: k.slice(k.indexOf('|') + 1).slice(0, 32), counts: c })),
    checks: [
      { name: 'complete_blocks_balanced', passed: unbalancedBlocks === 0, detail: `${unbalancedBlocks} complete blocks out of balance` },
      { name: 'stratum_imbalance_at_most_2', passed: maxImbalance <= 2, detail: `largest difference between arms in a stratum: ${maxImbalance}` },
      { name: 'no_minor_in_arm_b', passed: minorInB === 0, detail: `${minorInB} minors in arm B` },
      { name: 'reproducible', passed: JSON.stringify(armAt(seed, 'bonus', 's', 5)) === JSON.stringify(armAt(seed, 'bonus', 's', 5)), detail: 'same seed, same arm' },
    ],
  };
}

export const module: ApiModule = {
  name: 'dev',
  owner: 'WP-3',
  register(api, deps) {
    let scheduler: Promise<Scheduler> | undefined;
    const getScheduler = () =>
      (scheduler ??= loadJobs().then((jobs) => {
        const s = createScheduler({ clock: deps.platform.clock, moduleDeps: deps });
        for (const j of jobs) s.register(j);
        return s;
      }));

    api.get('/dev/health', (c) => c.json({ module: 'dev', status: 'ok', marker: DEV_MODULE_MARKER }));

    mount(api, devRoutes['dev.inbox'], ({ query }) => {
      const inbox = inboxOf(deps);
      const messages = (inbox?.list(query.to?.toLowerCase()) ?? []).slice(-50).map((m) =>
        m.channel === 'email'
          ? { channel: 'email' as const, at: m.at, to: m.to, subject: m.subject, text: m.text, ...(m.html !== undefined ? { html: m.html } : {}) }
          : { channel: 'sms' as const, at: m.at, to: m.to, text: m.text },
      );
      return { messages };
    });

    mount(api, devRoutes['dev.clock'], ({ body }) => {
      const clock = deps.platform.clock;
      if (!(clock instanceof DevClock)) throw new DomainError('FEATURE_DISABLED', { reason: 'clock_not_settable' });
      if (body.set !== undefined) clock.set(new Date(body.set));
      if (body.advance_ms !== undefined) clock.advance(body.advance_ms);
      return { now: clock.now().toISOString() };
    });

    mount(api, devRoutes['dev.runJob'], async ({ params, body }) => {
      const s = await getScheduler();
      if (!s.jobNames().includes(params.job)) throw new DomainError('NOT_FOUND', { job: params.job });
      const r = await s.runNow(params.job, body.run_key);
      return { status: r.status, run_key: r.runKey.slice(0, 64) };
    });

    mount(api, devRoutes['dev.reset'], async ({ c, body }) => {
      resetDatabase(deps);
      inboxOf(deps)?.clear();
      c.var.limiter.reset();
      if (body.seed === 'demo') {
        // The demo seed belongs to WP-11 (tooling/seed); it plugs in as `seedDemo(deps)`.
        const path = new URL('../../../../../tooling/seed/index.ts', import.meta.url).href;
        const mod = (await import(/* @vite-ignore */ path).catch(() => undefined)) as { seedDemo?: (d: ModuleDeps) => unknown } | undefined;
        if (!mod?.seedDemo) throw new DomainError('VALIDATION_FAILED', { reason: 'demo_seed_missing' });
        await mod.seedDemo(deps);
      }
      return { ok: true as const };
    });

    mount(api, devRoutes['dev.aaCheck'], ({ body }) => aaCheck(body.users, body.seed));
  },
};
