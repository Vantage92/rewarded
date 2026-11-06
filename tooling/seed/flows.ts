// Flows through the real routes, shared by the demo seed and the e2e specs: registration via an
// invite (spec §3.1), login with the code, admin login with TOTP (architecture §10.8), devices and
// a session simulator that speaks the heartbeat protocol (architecture §4) on a controllable clock.
import type { OutboxItem } from '../../packages/contracts/src/sessions.ts';
import type { PlannedMin, UaClass } from '../../packages/contracts/src/common.ts';
import { ApiClientError } from '../../packages/contracts/src/client.ts';
import { adminTotp, type DemoAdmin } from './admins.ts';
import { lastCode, type Actor, type InboxReader, type Transport } from './driver.ts';
import type { Prng } from './prng.ts';

/** Server time the flows run on: a DevClock in-process, POST /dev/clock over the network. */
export interface SimClock {
  now(): number;
  set(ms: number): Promise<void>;
}

export interface World {
  transport: Transport;
  inbox: InboxReader;
  clock: SimClock;
}

export const LEGAL = { terms_version: '0.3', privacy_version: '0.3', research_info_version: '0.3' } as const;
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export interface Registration {
  email: string;
  firstName: string;
  lastName?: string;
  birthDate: string;
  goal: 25 | 50 | 90 | 120;
  invite?: string;
  locale?: 'nl' | 'en';
  silent?: boolean;
}

/** Magic link with the code from the inbox, then onboarding (spec §3.1). */
export async function register(w: World, a: Actor, r: Registration) {
  const locale = r.locale ?? 'nl';
  await a.api.call('auth.magicLink', { body: { email: r.email, locale, ...(r.invite ? { invite_token: r.invite } : {}) } });
  const code = await lastCode(w.inbox, r.email);
  await a.api.call('auth.code', { body: { email: r.email, code } });
  return a.api.call('me.onboarding', {
    body: {
      first_name: r.firstName,
      ...(r.lastName ? { last_name: r.lastName } : {}),
      birth_date: r.birthDate,
      ...LEGAL,
      daily_goal_min: r.goal,
      ...(r.goal >= 90 ? { confirm_overreach: true } : {}),
      ...(r.silent !== undefined ? { silent_mode: r.silent } : {}),
    },
  });
}

/** Login of an existing account with the six-digit code. */
export async function login(w: World, a: Actor, email: string): Promise<void> {
  await a.api.call('auth.magicLink', { body: { email, locale: 'nl' } });
  await a.api.call('auth.code', { body: { email, code: await lastCode(w.inbox, email) } });
}

/** Admin login with the second factor; moves the clock past the TOTP step afterwards. */
export async function adminLogin(w: World, a: Actor, admin: DemoAdmin): Promise<void> {
  await login(w, a, admin.email);
  await a.api.call('admin.mfa.verify', { body: { code: adminTotp(admin.key, new Date(w.clock.now())) } });
  // A code is valid once per 30 s step (architecture §10.8); the next admin login needs a new step.
  await w.clock.set(w.clock.now() + 31_000);
}

/** UUID v4 text from the PRNG (client_device_id). */
export function uuidFrom(rng: Prng): string {
  const b = Array.from({ length: 16 }, () => rng.int(256));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function registerDevice(a: Actor, rng: Prng, uaClass: UaClass = 'android_chrome'): Promise<string> {
  const r = await a.api.call('devices.register', { body: { client_device_id: uuidFrom(rng), ua_class: uaClass, standalone: false, wakelock_supported: true } });
  return r.device_id;
}

// ---------------------------------------------------------------------------------------------
// Agenda: a discrete-event loop. Every task says when it wants to run next; the loop moves the
// server clock to the earliest one and runs it. Sessions of many users interleave in time.

export interface Task {
  at: number;
  /** Runs at `at`; returns the next time, or null when finished. */
  run(): Promise<number | null>;
}

export async function runAgenda(clock: SimClock, tasks: Task[], until = Number.POSITIVE_INFINITY): Promise<void> {
  const queue = [...tasks];
  while (queue.length > 0) {
    let k = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i]!.at < queue[k]!.at) k = i;
    const t = queue[k]!;
    if (t.at > until) break;
    queue.splice(k, 1);
    if (t.at > clock.now()) await clock.set(t.at);
    const next = await t.run();
    if (next !== null) queue.push({ at: Math.max(next, clock.now()), run: t.run });
  }
}

// ---------------------------------------------------------------------------------------------
// Session simulator (architecture §4.2/§4.3): start with Idempotency-Key, heartbeats with the nonce
// chain, optional offline window with buffered heartbeats, and one of the spec §4.1 endings.

export type SessionOutcome =
  | { kind: 'complete' }
  | { kind: 'hidden'; atMin: number }
  | { kind: 'gap'; atMin: number }
  | { kind: 'stop'; atMin: number }
  | { kind: 'late_end' };

export interface SessionPlan {
  actor: Actor;
  deviceId: string;
  start: number;
  plannedMin: PlannedMin;
  outcome: SessionOutcome;
  /** Client IP for this session (campus NAT, CGNAT, hotspot). */
  ip?: string;
  webdriver?: boolean;
  /** Offline window with buffered heartbeats, in minutes after the start (H3 when > 10 %). */
  offline?: { fromMin: number; toMin: number };
  /** Client clock minus server clock (H4 above 5 minutes). */
  skewMs?: number;
  /** Minutes between the end signal and the first interaction (H9 above 15). */
  claimDelayMin?: number;
  /** Heartbeat interval in seconds (default 80, within the 90 s gap rule). */
  intervalS?: number;
  /** Scenario session: wins over generated sessions that overlap it. */
  fixed?: boolean;
  /** Called with the end or stop result. */
  done?: (r: { sessionId: string; status: string }) => void;
}

const idemKey = (rng: Prng) => uuidFrom(rng);

/** One session as an agenda task. */
export function sessionTask(plan: SessionPlan, rng: Prng, clock: SimClock): Task {
  const a = plan.actor;
  const interval = (plan.intervalS ?? 80) * 1000;
  const skew = plan.skewMs ?? 0;
  const monoStart = 4_000 + rng.int(60_000);
  const durationMs = plan.plannedMin * MIN;
  let sessionId = '';
  let nonce = '';
  let seq = 0;
  let bufferedSeq = 0;
  let evSeq = 0;
  let buffered: OutboxItem[] = [];
  let finished = false;
  const mono = (t: number) => monoStart + (t - plan.start);
  const offlineAt = (t: number) => plan.offline !== undefined && t >= plan.start + plan.offline.fromMin * MIN && t < plan.start + plan.offline.toMin * MIN;
  const stopAt = plan.outcome.kind === 'stop' || plan.outcome.kind === 'hidden' || plan.outcome.kind === 'gap' ? plan.start + plan.outcome.atMin * MIN : Infinity;
  const endAt = plan.start + durationMs + (plan.outcome.kind === 'late_end' ? 12 * MIN : 1_000);

  const closed = (e: unknown) => e instanceof ApiClientError && (e.code === 'SESSION_CLOSED' || e.code === 'NONCE_INVALID');
  const finish = (status: string) => {
    finished = true;
    plan.done?.({ sessionId, status });
    return null;
  };

  async function step(): Promise<number | null> {
    const t = clock.now();
    if (plan.ip) a.ip = plan.ip;
    if (!sessionId) {
      const r = await a.api.call('sessions.start', {
        body: { planned_min: plan.plannedMin, device_id: plan.deviceId, practice: plan.plannedMin === 1, client_ts: t + skew, mono_ms: mono(t), webdriver: plan.webdriver ?? false, standalone: false },
        idempotencyKey: idemKey(rng),
      });
      sessionId = r.session_id;
      nonce = r.nonce;
      return Math.min(t + interval, stopAt, endAt);
    }
    if (finished) return null;
    if (t >= stopAt) {
      const o = plan.outcome;
      if (o.kind === 'stop') {
        const r = await a.api.call('sessions.stop', { params: { id: sessionId }, body: { nonce } }).catch((e: unknown) => (closed(e) ? null : Promise.reject(e)));
        return finish(r?.status ?? 'aborted');
      }
      if (o.kind === 'hidden') {
        // The page went to the background: the heartbeat reports hidden plus the event (spec §4.1 hidden).
        evSeq += 1;
        const events: OutboxItem[] = [{ type: 'visibility', ev_seq: evSeq, kind: 'hidden', mono_ms: mono(t), client_ts: t + skew }];
        seq += 1;
        const r = await a.api
          .call('sessions.heartbeat', { params: { id: sessionId }, body: { nonce, seq, mono_ms: mono(t), client_ts: t + skew, visibility: 'hidden', wakelock: 'released', events } })
          .catch((e: unknown) => (closed(e) ? null : Promise.reject(e)));
        return finish(r?.status ?? 'aborted');
      }
      // Gap: the client goes silent; the app opens again after the grace and the sweep closes it.
      if (t < plan.start + durationMs + 11 * MIN) return plan.start + durationMs + 11 * MIN;
      await a.api.call('sessions.active');
      return finish('aborted');
    }
    if (t >= endAt) {
      const events: OutboxItem[] = [...buffered];
      buffered = [];
      const claim = plan.claimDelayMin ?? 0.3;
      evSeq += 1;
      events.push({ type: 'visibility', ev_seq: evSeq, kind: 'first_interaction_after_end', mono_ms: monoStart + durationMs + claim * MIN, client_ts: t + skew });
      try {
        const r = await a.api.call('sessions.end', { params: { id: sessionId }, body: { nonce, mono_ms: mono(t), client_ts: t + skew, events } });
        return finish(r.status);
      } catch (e) {
        if (closed(e)) return finish('aborted');
        throw e;
      }
    }
    // Heartbeat, online or into the outbox while offline. The online seq only counts online
    // heartbeats (the nonce chain wants lastSeq + 1); buffered ones have their own numbering.
    const hb = { mono_ms: mono(t), client_ts: t + skew, visibility: 'visible' as const, wakelock: 'acquired' as const };
    if (offlineAt(t)) {
      bufferedSeq += 1;
      buffered.push({ type: 'heartbeat', seq: bufferedSeq, ...hb, last_nonce: nonce });
    } else {
      seq += 1;
      const events = buffered;
      try {
        const r = await a.api.call('sessions.heartbeat', { params: { id: sessionId }, body: { nonce, seq, ...hb, events } });
        buffered = [];
        nonce = r.nonce;
        if (r.status !== 'active') return finish(r.status);
      } catch (e) {
        if (closed(e)) return finish('aborted');
        throw e;
      }
    }
    return Math.min(t + interval, stopAt, endAt);
  }
  return { at: plan.start, run: step };
}
