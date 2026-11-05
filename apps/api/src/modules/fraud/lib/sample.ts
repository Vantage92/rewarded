// Weekly sample of 30 accounts (spec §6.7; architecture §6.5; voorregistratie §7.1–7.2), the
// judgement with criteria and reason code, the declaration of an interest, and the ambassador sample
// (voorregistratie §7.4). A judgement books nothing: suspect or fraud opens a SAMPLE flag in the
// normal queue with appeal.
import { DomainError } from '@rewarded/contracts';
import { CURRENT_PARAMS, addDays, type FocusDay } from '@rewarded/core';
import { drawSample, drawSimple, isValidSampleReason, mayJudgeSampleItem, sampleRules, stratumOf, type DrawResult } from '@rewarded/core/fraud';
import { isoWeekKey } from '@rewarded/core/catalog';
import { isFeatureEnabled } from '../../../db/flags.ts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { AdminActor } from '../../../services/flags.ts';
import { installWp6Services } from './install.ts';
import { sampleSeedOf } from './seed.ts';
import type { SqlFlagService } from './flags.ts';
import { eventFor, hasTables, idsOf, parseJson } from './util.ts';

export interface SampleItemRow {
  id: string;
  sample_id: string;
  user_id: string | null;
  stratum: string;
  score: string;
  checks: string;
  judgement: 'none' | 'suspect' | 'fraud';
  reason_code: string | null;
  judged_by: string | null;
  judged_at: string | null;
  interest_declared_by: string | null;
  reassigned_to: string | null;
  contact_requested_at: string | null;
  contact_confirmed_at: string | null;
  contact_channel: 'institution' | 'account' | null;
  address_mismatch: number;
  flag_id: string | null;
}

/** Candidates: accounts with ≥ 1 completed session in the week, teams excluded, with their stratum. */
export function weeklyCandidates(db: Db, week: FocusDay): { userId: string; stratum: string }[] {
  const expansion = isFeatureEnabled(db, 'expansion');
  const clubs = hasTables(db, 'club_membership');
  const rows = db.all<{ id: string; cohort: 'experiment' | 'expansion'; club_id: string | null }>(
    `SELECT DISTINCT u.id, u.cohort, ${clubs ? '(SELECT m.club_id FROM club_membership m WHERE m.user_id = u.id AND m.left_at IS NULL AND m.pending_admin = 0 LIMIT 1)' : 'NULL'} AS club_id
       FROM focus_session s JOIN user u ON u.id = s.user_id
      WHERE s.status = 'completed' AND s.is_practice = 0 AND s.focus_day >= ? AND s.focus_day <= ? AND u.is_team = 0 AND u.status <> 'deleted'
      ORDER BY u.id`,
    [week, addDays(week, 6)],
  );
  return rows.map((r) => ({ userId: r.id, stratum: stratumOf({ clubId: r.club_id, cohort: r.cohort }, expansion) }));
}

/** Draws (once) the weekly sample for the week starting `week`; returns its id. */
export function drawWeeklySample(deps: ModuleDeps, week: FocusDay): string | null {
  const { db } = deps;
  if (!hasTables(db, 'fraud_sample', 'focus_session')) return null;
  installWp6Services(deps);
  const existing = db.get<{ id: string }>("SELECT id FROM fraud_sample WHERE kind = 'weekly' AND week_key = ?", [week]);
  if (existing) return existing.id;
  const { seed, version } = sampleSeedOf(deps);
  const r = sampleRules(CURRENT_PARAMS);
  const draw: DrawResult = drawSample({ seed, kind: 'weekly', key: week, candidates: weeklyCandidates(db, week), size: r.weeklySize, minPerStratum: r.minPerStratum, minStratumActives: r.minStratumActives });
  const ids = idsOf(deps);
  const id = ids.ulid();
  const now = deps.platform.clock.now().toISOString();
  db.transaction(() => {
    db.run("INSERT INTO fraud_sample (id, kind, week_key, seed_version, size, allocation, drawn_at) VALUES (?, 'weekly', ?, ?, ?, ?, ?)", [id, week, version, draw.items.length, JSON.stringify(draw.allocation), now]);
    for (const it of draw.items) {
      const anchor = db.get<{ h: string | null }>('SELECT institution_email_hash AS h FROM user WHERE id = ?', [it.userId])?.h ?? null;
      // Contact runs through the institution address when the account has an anchor (founder J4).
      db.run(
        'INSERT INTO fraud_sample_item (id, sample_id, user_id, stratum, score, checks, contact_requested_at, contact_channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ids.ulid(), id, it.userId, it.stratum, it.score, '{}', anchor ? now : null, anchor ? 'institution' : 'account'],
      );
      eventFor(deps, db, it.userId, 'sample_drawn', { week: isoWeekKey(week), stratum: it.stratum.slice(0, 32) });
    }
  });
  return id;
}

/** Recomputes a stored sample from the seed and the stored candidates; true when identical. */
export function verifyStoredSample(deps: ModuleDeps, sampleId: string): { ok: boolean; expected: string[]; stored: string[] } {
  const s = deps.db.get<{ kind: string; week_key: string }>('SELECT kind, week_key FROM fraud_sample WHERE id = ?', [sampleId]);
  if (!s || s.kind !== 'weekly') throw new DomainError('NOT_FOUND');
  const { seed } = sampleSeedOf(deps);
  const r = sampleRules(CURRENT_PARAMS);
  const expected = drawSample({ seed, kind: 'weekly', key: s.week_key, candidates: weeklyCandidates(deps.db, s.week_key), size: r.weeklySize, minPerStratum: r.minPerStratum, minStratumActives: r.minStratumActives })
    .items.map((i) => i.score)
    .sort();
  const stored = deps.db.all<{ score: string }>('SELECT score FROM fraud_sample_item WHERE sample_id = ? ORDER BY score', [sampleId]).map((x) => x.score);
  return { ok: expected.join() === stored.join(), expected, stored };
}

export interface JudgeInput {
  checks: { anchor: boolean; line_type: boolean; pattern: boolean; contact: boolean };
  judgement: 'none' | 'suspect' | 'fraud';
  reason_code: string;
}

/** POST /admin/samples/:id/items/:item/judgement. */
export function judgeItem(deps: ModuleDeps, tx: Db, sampleId: string, itemId: string, input: JudgeInput, actor: AdminActor): { item: SampleItemRow; flagId: string | null } {
  const item = tx.get<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE id = ? AND sample_id = ?', [itemId, sampleId]);
  if (!item) throw new DomainError('NOT_FOUND');
  if (!isValidSampleReason(input.judgement, input.reason_code)) throw new DomainError('REASON_REQUIRED', { reason: 'unknown_reason_code' });
  if (!mayJudgeSampleItem({ interestDeclaredBy: item.interest_declared_by, reassignedTo: item.reassigned_to }, actor)) throw new DomainError('FORBIDDEN', { reason: 'interest_declared' });
  const at = deps.platform.clock.now().toISOString();
  const checks = { ...parseJson<Record<string, unknown>>(item.checks, {}), ...input.checks };
  let flagId: string | null = item.flag_id;
  if (input.judgement !== 'none' && item.user_id && !flagId) {
    installWp6Services(deps);
    flagId = (deps.services.flags as SqlFlagService).raise(tx, {
      code: 'SAMPLE',
      subject: { type: 'account', id: item.user_id },
      sessionIds: [],
      evidence: { sample_id: sampleId, judgement: input.judgement, reason_code: input.reason_code },
      dedupKey: `SAMPLE:${itemId}`,
    });
  }
  tx.run('UPDATE fraud_sample_item SET checks = ?, judgement = ?, reason_code = ?, judged_by = ?, judged_at = ?, flag_id = ? WHERE id = ?', [
    JSON.stringify(checks),
    input.judgement,
    input.reason_code,
    actor,
    at,
    flagId,
    itemId,
  ]);
  deps.services.audit.audit(tx, { actor, action: 'sample_judged', objectType: 'fraud_sample_item', objectRef: itemId, reason: input.reason_code });
  const sample = tx.get<{ week_key: string; kind: string }>('SELECT week_key, kind FROM fraud_sample WHERE id = ?', [sampleId]);
  if (sample && /^\d{4}-\d{2}-\d{2}$/.test(sample.week_key))
    eventFor(deps, tx, item.user_id, 'sample_judged', { week: isoWeekKey(sample.week_key), stratum: item.stratum.slice(0, 32), oordeel: input.judgement });
  return { item: tx.get<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE id = ?', [itemId]) as SampleItemRow, flagId };
}

/**
 * "Ik heb een belang" (jurist should-fix 6): the item goes to another admin; whoever declared the
 * interest can no longer judge it. Without a second admin the item waits (NO_ELIGIBLE_REVIEWER).
 */
export function declareInterest(deps: ModuleDeps, tx: Db, itemId: string, actor: AdminActor, admins: readonly AdminActor[]): SampleItemRow {
  const item = tx.get<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE id = ?', [itemId]);
  if (!item) throw new DomainError('NOT_FOUND');
  if (item.judged_at) throw new DomainError('FORBIDDEN', { reason: 'already_judged' });
  const second = admins.find((a) => a !== actor);
  if (!second) throw new DomainError('NO_ELIGIBLE_REVIEWER');
  tx.run('UPDATE fraud_sample_item SET interest_declared_by = ?, reassigned_to = ? WHERE id = ?', [actor, second, itemId]);
  deps.services.audit.audit(tx, { actor, action: 'sample_interest_declared', objectType: 'fraud_sample_item', objectRef: itemId });
  return tx.get<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE id = ?', [itemId]) as SampleItemRow;
}

/** Ambassador sample: five counted accounts (or all) with the seed and the month (voorregistratie §7.4). */
export function drawAmbassadorSample(deps: ModuleDeps, tx: Db, ambassadorId: string, monthKey: string, counted: readonly string[]): string {
  const existing = tx.get<{ id: string }>("SELECT id FROM fraud_sample WHERE kind = 'ambassador' AND ambassador_id = ? AND month_key = ?", [ambassadorId, monthKey]);
  if (existing) return existing.id;
  const { seed, version } = sampleSeedOf(deps);
  const items = drawSimple(seed, 'ambassador', `${ambassadorId}:${monthKey}`, counted, sampleRules(CURRENT_PARAMS).ambassadorSize);
  const ids = idsOf(deps);
  const id = ids.ulid();
  const now = deps.platform.clock.now().toISOString();
  tx.run("INSERT INTO fraud_sample (id, kind, week_key, month_key, ambassador_id, seed_version, size, allocation, drawn_at) VALUES (?, 'ambassador', ?, ?, ?, ?, ?, ?, ?)", [
    id,
    `${monthKey}-01`,
    monthKey,
    ambassadorId,
    version,
    items.length,
    JSON.stringify([{ stratum: 'ambassador', actives: counted.length, size: items.length }]),
    now,
  ]);
  for (const it of items) tx.run("INSERT INTO fraud_sample_item (id, sample_id, user_id, stratum, score, checks) VALUES (?, ?, ?, 'ambassador', ?, '{}')", [ids.ulid(), id, it.userId, it.score]);
  return id;
}

/** Users the sample marked suspect or fraud (KPI variants without them, spec §7.2). */
export function suspectUserIds(db: Db): Set<string> {
  if (!hasTables(db, 'fraud_sample_item')) return new Set();
  return new Set(db.all<{ user_id: string }>("SELECT DISTINCT user_id FROM fraud_sample_item WHERE judgement IN ('suspect', 'fraud') AND user_id IS NOT NULL").map((r) => r.user_id));
}
