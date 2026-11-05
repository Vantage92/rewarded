// Session store (architecture §9.2): a small store around the core state machine
// (core/session/machine.ts). The reducer decides the transitions; this store executes the effects
// with the platform adapters (heartbeats, Wake Lock, outbox, beacon) and the typed API client.
// React reads it with useSyncExternalStore. It never decides points or outcomes: the server's
// verdict is shown, and a local guess (after `hidden` or 5 minutes offline) is marked unconfirmed.
import { ApiClientError, type RewardedApi } from '@rewarded/contracts/client';
import type { ClientEvent } from '@rewarded/contracts/events';
import type { EndSessionResponse, HeartbeatResponse, OutboxItem, SessionDetailResponse, SessionVerdictDto, StartSessionResponse } from '@rewarded/contracts/sessions';
import { CURRENT_PARAMS } from '@rewarded/core/params';
import {
  INITIAL_CONTEXT,
  reduce,
  remainingMs,
  type AbortReason,
  type MachineContext,
  type MachineEffect,
  type MachineEvent,
  type PlannedMin,
} from '@rewarded/core/session';
import { mergeItems, Outbox } from '../../../platform/outbox.ts';
import { newIdempotencyKey, retry, RetryCancelled, uuid, type RetryHandle } from '../../../platform/transport.ts';
import type { Platform } from '../../../platform/index.ts';
import type { PageSignal } from '../../../platform/visibility.ts';
import type { WakeLockStatus } from '../../../platform/wakelock.ts';

const P = CURRENT_PARAMS.session;
export const HEARTBEAT_MS = P.heartbeat_interval_s * 1000;
/** Offline limit: 5 minutes since the last confirmed heartbeat (GAP_LIMIT, architecture §4.1). */
export const GAP_LIMIT_MS = P.gap_covered_max_s * 1000;
/** After 90 s without contact the running screen shows the offline line (UX §3.1). */
export const OFFLINE_NOTICE_MS = P.gap_ok_s * 1000;
/** The screen stays on after the end for 10 minutes (UX F3e, working hypothesis). */
export const END_WAKELOCK_MS = 10 * 60_000;

const ACTIVE_KEY = 'current';
const PAGEHIDE_MARK = 'rw_pagehide';

export type Phase =
  | 'loading'
  | 'idle'
  | 'other_tab'
  | 'starting'
  | 'running'
  | 'offline'
  | 'stopping'
  | 'ending'
  | 'aborted_local'
  | 'completed'
  | 'aborted';

/** What the result screens show (F5, F6). Filled from the server; `confirmed` false is a local guess. */
export interface SessionResult {
  sessionId: string;
  status: 'completed' | 'aborted';
  abortReason?: AbortReason;
  practice: boolean;
  plannedMin: PlannedMin;
  serverStartAt: string | null;
  /** When the session stopped (ISO), for "Je sessie stopte om 14:32". */
  stoppedAt: string | null;
  /** Seconds held, for "Je hield 18 minuten vol". */
  elapsedS: number;
  end?: EndSessionResponse;
  confirmed: boolean;
}

export interface SessionSnapshot {
  phase: Phase;
  ctx: MachineContext;
  practice: boolean;
  plannedMin: PlannedMin | null;
  serverStartAt: string | null;
  wakeLock: WakeLockStatus;
  /** Monotonic time of the last confirmed contact; null without a session. */
  lastAckMono: number | null;
  /** The end signal (F3e) is on screen until the first touch or return to visible. */
  endSignal: boolean;
  /** Stop was confirmed while offline; it is sent when the connection returns. */
  stopQueued: boolean;
  result: SessionResult | null;
  startError: string | null;
}

/** Persisted head of the running session (IndexedDB store `active_session`, §9.3). */
interface Persisted {
  sessionId: string | null;
  idempotencyKey: string;
  plannedMin: PlannedMin;
  practice: boolean;
  nonce: string | null;
  serverStartAt: string | null;
  plannedEndAt: string | null;
  state: MachineContext['state'];
  lastSeq: number;
  evSeq: number;
  bufSeq: number;
  /** Last monotonic reading of the page that ran the session (its own time origin). */
  lastMono: number;
  monoStart: number | null;
  abortCause: AbortCause | null;
  endBody?: { mono_ms: number; client_ts: number };
}

type AbortCause = 'hidden' | 'pagehide' | 'gap';

interface PendingHeartbeat {
  seq: number;
  nonce: string;
  carried: OutboxItem[];
  sentMono: number;
  handle: RetryHandle<Awaited<ReturnType<typeof heartbeatCall>>>;
}

function heartbeatCall(api: RewardedApi, id: string, body: Parameters<typeof buildHeartbeatBody>[0]) {
  return api.call('sessions.heartbeat', { params: { id }, body: buildHeartbeatBody(body) });
}
function buildHeartbeatBody(b: {
  nonce: string;
  seq: number;
  mono: number;
  wall: number;
  rtt: number | null;
  visibility: 'visible' | 'hidden';
  wakelock: 'acquired' | 'denied' | 'released' | 'unsupported';
  events: OutboxItem[];
}) {
  return {
    nonce: b.nonce,
    seq: b.seq,
    mono_ms: b.mono,
    client_ts: Math.round(b.wall),
    ...(b.rtt !== null ? { rtt_ms: Math.max(0, Math.min(120_000, Math.round(b.rtt))) } : {}),
    visibility: b.visibility,
    wakelock: b.wakelock,
    events: b.events,
  };
}

function wakeLockWire(s: WakeLockStatus): 'acquired' | 'denied' | 'released' | 'unsupported' {
  return s === 'idle' ? 'released' : s;
}

function verdictOf(e: unknown): SessionVerdictDto | null {
  if (!(e instanceof ApiClientError) || !e.is('SESSION_CLOSED')) return null;
  const v = (e.details as { verdict?: SessionVerdictDto } | undefined)?.verdict;
  return v && (v.status === 'completed' || v.status === 'aborted') ? v : null;
}

export interface SessionStoreOptions {
  api: RewardedApi;
  platform: Platform;
  /** Key for the cached server device_id (the user id once known). */
  userKey?: () => string | null;
}

export interface StartOptions {
  practice?: boolean;
  /** End tone on (F2 switch). */
  tone?: boolean;
}

export class SessionStore {
  private readonly api: RewardedApi;
  private readonly pf: Platform;
  private readonly userKey: () => string | null;
  private listeners = new Set<() => void>();
  private ctx: MachineContext = INITIAL_CONTEXT;
  private snap: SessionSnapshot;
  private persisted: Persisted | null = null;
  private outbox: Outbox | null = null;
  private pending: PendingHeartbeat | null = null;
  private closing: RetryHandle<unknown> | null = null;
  private resolving: RetryHandle<unknown> | null = null;
  private tickTimer: unknown = null;
  private durationTimer: unknown = null;
  private gapTimer: unknown = null;
  private endLockTimer: unknown = null;
  private unsubs: (() => void)[] = [];
  private result: SessionResult | null = null;
  private endSignal = false;
  private stopQueued = false;
  private tone = true;
  private practice = false;
  private serverStartAt: string | null = null;
  private startError: string | null = null;
  private otherTab = false;
  private loading = true;
  private initialized: Promise<void> | null = null;
  private lastRtt: number | null = null;
  private hiddenAtMono: number | null = null;
  private signalResult: { played: boolean; vibrated: boolean } | null = null;
  private disposed = false;
  /** ev_seq counter kept after the stored copy is cleared (claim-delay event after the end). */
  private lastEvSeq = 0;

  constructor({ api, platform, userKey }: SessionStoreOptions) {
    this.api = api;
    this.pf = platform;
    this.userKey = userKey ?? (() => null);
    this.snap = this.buildSnapshot();
    this.unsubs.push(platform.visibility.subscribe((s) => this.onPageSignal(s)));
    this.unsubs.push(platform.network.subscribe((online) => this.onNetwork(online)));
    this.unsubs.push(platform.wakeLock.subscribe((s) => this.onWakeLock(s)));
    this.unsubs.push(
      platform.tabLock.subscribe((m) => {
        if (m.type === 'owner' && !platform.tabLock.owned() && this.isIdleLike()) this.setOtherTab(true);
        if (m.type === 'released' && this.otherTab) void this.reinit();
      }),
    );
    if (typeof document !== 'undefined') {
      const touch = () => this.onFirstInteraction();
      document.addEventListener('pointerdown', touch, true);
      document.addEventListener('keydown', touch, true);
      this.unsubs.push(() => {
        document.removeEventListener('pointerdown', touch, true);
        document.removeEventListener('keydown', touch, true);
      });
    }
  }

  // ---- React binding ----------------------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): SessionSnapshot => this.snap;

  /** Remaining ms from the monotonic clock (architecture §4.2); never from Date.now(). */
  remaining(): number {
    return remainingMs(this.ctx, this.pf.clock.monoNow());
  }

  /** Monotonic ms since the last confirmed contact (offline notice after 90 s). */
  sinceLastAck(): number {
    return this.ctx.lastAckMono === null ? 0 : this.pf.clock.monoNow() - this.ctx.lastAckMono;
  }

  private emit(): void {
    this.snap = this.buildSnapshot();
    for (const l of [...this.listeners]) l();
  }

  private phase(): Phase {
    if (this.loading) return 'loading';
    const s = this.ctx.state;
    if (s === 'idle') return this.otherTab ? 'other_tab' : 'idle';
    if (s === 'running_offline') return this.stopQueued ? 'stopping' : 'offline';
    if (s === 'running' && this.stopQueued) return 'stopping';
    return s;
  }

  private buildSnapshot(): SessionSnapshot {
    return {
      phase: this.phase(),
      ctx: this.ctx,
      practice: this.practice,
      plannedMin: this.ctx.plannedMin,
      serverStartAt: this.serverStartAt,
      wakeLock: this.pf.wakeLock.status(),
      lastAckMono: this.ctx.lastAckMono,
      endSignal: this.endSignal,
      stopQueued: this.stopQueued,
      result: this.result,
      startError: this.startError,
    };
  }

  private isIdleLike(): boolean {
    return this.ctx.state === 'idle';
  }

  private setOtherTab(on: boolean): void {
    if (this.otherTab === on) return;
    this.otherTab = on;
    this.emit();
  }

  // ---- Start-up and recovery (§4.4 Herladen, §9.3) -------------------------------------------

  /** Reads a session left in IndexedDB (reload, crash) and checks for an owner tab. Idempotent. */
  init(): Promise<void> {
    this.initialized ??= this.doInit().finally(() => {
      this.loading = false;
      this.emit();
    });
    return this.initialized;
  }

  private async reinit(): Promise<void> {
    if (!this.isIdleLike()) return;
    this.otherTab = await this.pf.tabLock.heldElsewhere();
    if (!this.otherTab) await this.recover();
    this.emit();
  }

  private async doInit(): Promise<void> {
    try {
      if (await this.pf.tabLock.heldElsewhere()) {
        this.otherTab = true;
        return;
      }
      await this.recover();
    } catch {
      // Storage unavailable: start clean.
    }
  }

  private async recover(): Promise<void> {
    const saved = await this.pf.kv.get<Persisted>('active_session', ACTIVE_KEY);
    if (!saved) return;
    if (!saved.sessionId || saved.state === 'starting' || saved.state === 'idle' || saved.state === 'completed' || saved.state === 'aborted') {
      // A reload during `starting`: the key is lost on purpose; a new start on this device resumes (§4.7).
      await this.clearPersisted(saved.sessionId);
      return;
    }
    this.persisted = saved;
    this.practice = saved.practice;
    this.serverStartAt = saved.serverStartAt;
    this.outbox = await Outbox.load(this.pf.kv, saved.sessionId);
    const base: MachineContext = {
      ...INITIAL_CONTEXT,
      plannedMin: saved.plannedMin,
      sessionId: saved.sessionId,
      nonce: saved.nonce,
      idempotencyKey: saved.idempotencyKey,
    };
    if (saved.state === 'ending' && saved.endBody) {
      // The end was reported before the reload; repeat it unchanged and wait for the verdict.
      this.ctx = { ...base, state: 'ending' };
      this.endSignal = false;
      this.sendEnd(saved.endBody);
      return;
    }
    if (saved.state === 'stopping') {
      this.ctx = { ...base, state: 'stopping' };
      this.sendStop();
      return;
    }
    // Running when the page went away: a reload fires pagehide, which spec §4.1 counts as an abort.
    const cause: AbortCause = saved.abortCause ?? 'pagehide';
    const hasAbortEvent = this.outbox.pending().some((i) => i.type === 'visibility' && (i.kind === 'hidden' || i.kind === 'pagehide'));
    if (!hasAbortEvent && cause !== 'gap') {
      const mark = this.readPagehideMark(saved.sessionId);
      this.outbox.append(
        mark ?? {
          type: 'visibility',
          ev_seq: ++saved.evSeq,
          kind: 'pagehide',
          mono_ms: Math.max(0, saved.lastMono),
          client_ts: Math.round(this.pf.clock.wallNow()),
          nav_type: this.pf.navigationType(),
        },
      );
      if (mark) saved.evSeq = Math.max(saved.evSeq, mark.ev_seq);
    }
    this.clearPagehideMark();
    this.ctx = { ...base, state: 'aborted_local' };
    saved.state = 'aborted_local';
    saved.abortCause = cause;
    const elapsedS = saved.monoStart === null ? 0 : Math.max(0, Math.floor((saved.lastMono - saved.monoStart) / 1000));
    this.result = this.localResult(cause === 'gap' ? 'heartbeat_gap' : 'hidden', elapsedS);
    await this.persist();
    this.resolveAborted();
  }

  // ---- Commands ----------------------------------------------------------------------------------

  /** Starts a session: tab lock, device, POST /sessions with an Idempotency-Key (§4.2, §4.7). */
  async start(plannedMin: PlannedMin, opts: StartOptions = {}): Promise<void> {
    await this.init();
    if (this.ctx.state !== 'idle' || this.disposed) return;
    this.startError = null;
    if (!(await this.pf.tabLock.acquire())) {
      this.setOtherTab(true);
      return;
    }
    this.otherTab = false;
    this.practice = opts.practice ?? plannedMin === 1;
    this.tone = opts.tone ?? true;
    this.result = null;
    this.endSignal = false;
    this.stopQueued = false;
    this.signalResult = null;
    this.hiddenAtMono = null;
    this.dispatch({ type: 'START_REQUESTED', plannedMin, idempotencyKey: newIdempotencyKey(), mono: this.pf.clock.monoNow() });
  }

  /** F4 confirmed: stop the running session (user_stop). */
  confirmStop(): void {
    if (this.ctx.state === 'running') this.dispatch({ type: 'USER_STOP' });
    else if (this.ctx.state === 'running_offline') {
      // The machine sends a stop only online; it goes out when the connection returns.
      this.stopQueued = true;
      this.emit();
    }
  }

  /** After a result: back to idle (Opnieuw beginnen, Klaar, Kortere sessie). */
  reset(): void {
    if (this.ctx.state === 'completed' || this.ctx.state === 'aborted') this.dispatch({ type: 'RESET' });
    else if (this.ctx.state === 'aborted_local') {
      // Not confirmed yet (still offline): let go locally; the stored copy resolves on the next load.
      this.resolving?.cancel();
      this.resolving = null;
      this.pending?.handle.cancel();
      this.pending = null;
      this.ctx = INITIAL_CONTEXT;
      this.pf.tabLock.release();
      this.pf.guardUnload(false);
    } else return;
    this.result = null;
    this.endSignal = false;
    this.stopQueued = false;
    this.hiddenAtMono = null;
    this.emit();
  }

  /** "Tik om aan te houden": ask for the Wake Lock again (spec §4.1). */
  keepAwake(): void {
    void this.pf.wakeLock.request();
  }

  /** Inside the [Begin] tap: browsers play the end tone only after a user gesture (UX §4.2). */
  unlockSignal(): void {
    this.pf.signal.unlock();
  }

  isDesktop(): boolean {
    return this.pf.device().uaClass === 'desktop';
  }

  wakeLockSupported(): boolean {
    return this.pf.wakeLock.supported;
  }

  /** Small per-device preferences in the IndexedDB `cache` store (checklist seen, last length). */
  async cacheGet<T>(key: string): Promise<T | undefined> {
    try {
      return await this.pf.kv.get<T>('cache', key);
    } catch {
      return undefined;
    }
  }

  cacheSet(key: string, value: unknown): void {
    void this.pf.kv.put('cache', key, value).catch(() => undefined);
  }

  /** abort_recovery (UX §4.3 step 3): which way back the student chose. */
  recordRecovery(action: 'opnieuw' | 'korter' | 'weg', secondsToAction: number): void {
    const id = this.result?.sessionId;
    if (!id) return;
    this.track({ name: 'abort_recovery', props: { session_id: id, actie: action, seconden_tot_actie: Math.max(0, Math.round(secondsToAction)) } });
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimers();
    this.pending?.handle.cancel();
    this.closing?.cancel();
    this.resolving?.cancel();
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.listeners.clear();
  }

  // ---- Machine and effects -----------------------------------------------------------------------

  private dispatch(ev: MachineEvent): void {
    const prev = this.ctx;
    const [next, effects] = reduce(prev, ev);
    if (next === prev && effects.length === 0) return;
    this.ctx = next;
    if (ev.type === 'RESULT' || ev.type === 'SERVER_ABORT') this.applyResultState(ev);
    for (const effect of effects) this.run(effect, ev);
    this.syncPersisted();
    this.emit();
  }

  private run(effect: MachineEffect, ev: MachineEvent): void {
    switch (effect.type) {
      case 'request_start':
        void this.requestStart(effect.plannedMin, effect.idempotencyKey);
        return;
      case 'request_wakelock':
        void this.pf.wakeLock.request();
        return;
      case 'start_heartbeats':
        this.pf.guardUnload(true);
        this.scheduleTick();
        this.scheduleDuration();
        return;
      case 'stop_heartbeats':
        this.clearTimer('tick');
        this.clearTimer('duration');
        this.clearTimer('gap');
        // After GAP_LIMIT the open heartbeat stays: its answer is how the server's verdict arrives.
        if (!(ev.type === 'GAP_LIMIT')) {
          this.pending?.handle.cancel();
          this.pending = null;
        }
        return;
      case 'retry_pending_heartbeat':
        this.pending?.handle.kick();
        return;
      case 'flush_outbox':
        this.sendHeartbeat();
        return;
      case 'buffer_to_outbox':
        this.scheduleGapCheck();
        return;
      case 'send_beacon_hidden':
        this.beaconHidden();
        return;
      case 'send_end': {
        const body = { mono_ms: this.pf.clock.monoNow(), client_ts: Math.round(this.pf.clock.wallNow()) };
        if (this.persisted) this.persisted.endBody = body;
        this.beginEndSignal();
        this.sendEnd(body);
        return;
      }
      case 'send_stop':
        this.sendStop();
        return;
      case 'show_result':
        this.onResultShown(ev);
        return;
    }
  }

  private async requestStart(plannedMin: PlannedMin, idempotencyKey: string): Promise<void> {
    const practice = this.practice;
    const facts = this.pf.device();
    let deviceId: string;
    try {
      deviceId = await this.ensureDevice();
    } catch (e) {
      this.failStart(e);
      return;
    }
    const startMono = this.pf.clock.monoNow();
    const body = {
      planned_min: plannedMin,
      device_id: deviceId,
      practice,
      client_ts: Math.round(this.pf.clock.wallNow()),
      mono_ms: startMono,
      webdriver: facts.webdriver,
      standalone: facts.standalone,
    };
    // Persist the key first, so the start can be told apart from a lost-key restart (§4.7).
    const p: Persisted = {
      sessionId: null,
      idempotencyKey,
      plannedMin,
      practice,
      nonce: null,
      serverStartAt: null,
      plannedEndAt: null,
      state: 'starting',
      lastSeq: 0,
      evSeq: 0,
      bufSeq: 0,
      lastMono: startMono,
      monoStart: null,
      abortCause: null,
    };
    this.persisted = p;
    await this.persist();
    const handle = retry(() => this.api.call('sessions.start', { body, idempotencyKey }), this.pf.timers);
    this.closing = handle;
    let res: StartSessionResponse;
    try {
      res = await handle.promise;
    } catch (e) {
      if (e instanceof RetryCancelled) return;
      if (e instanceof ApiClientError && e.is('VALIDATION_FAILED') && (e.details as { field?: string } | undefined)?.field === 'device_id') {
        // The server forgot this device (another user, reset): register again once.
        await this.pf.kv.delete('device', this.deviceKey());
      }
      this.failStart(e);
      return;
    } finally {
      if (this.closing === handle) this.closing = null;
    }
    if (this.ctx.state !== 'starting') return;
    this.serverStartAt = res.server_start_at;
    this.outbox = await Outbox.load(this.pf.kv, res.session_id);
    p.sessionId = res.session_id;
    p.nonce = res.nonce;
    p.serverStartAt = res.server_start_at;
    p.plannedEndAt = res.planned_end_at;
    p.lastSeq = 0;
    const mono = this.pf.clock.monoNow();
    if (res.resumed) {
      this.dispatch({ type: 'RESUMED', sessionId: res.session_id, nonce: res.nonce, mono });
      // A resumed session started earlier (another page load): show the server's remaining time.
      const elapsed = Math.max(0, Math.min(plannedMin * 60_000, this.pf.clock.wallNow() - Date.parse(res.server_start_at)));
      this.ctx = { ...this.ctx, monoStart: mono - elapsed };
    } else {
      this.dispatch({ type: 'STARTED', sessionId: res.session_id, nonce: res.nonce, mono: startMono });
    }
    p.monoStart = this.ctx.monoStart;
    await this.persist();
    this.emit();
  }

  private failStart(e: unknown): void {
    this.startError = e instanceof ApiClientError ? e.code : 'NETWORK';
    this.pf.tabLock.release();
    void this.clearPersisted(null);
    this.dispatch({ type: 'START_FAILED', error: this.startError });
    this.emit();
  }

  private deviceKey(): string {
    return `server:${this.userKey() ?? 'current'}`;
  }

  /** client_device_id per browser profile, device_id per (profile, user) from POST /devices (§4.2). */
  private async ensureDevice(): Promise<string> {
    const cached = await this.pf.kv.get<string>('device', this.deviceKey());
    if (cached) return cached;
    let client = await this.pf.kv.get<string>('device', 'client');
    if (!client) {
      client = uuid();
      await this.pf.kv.put('device', 'client', client);
    }
    const facts = this.pf.device();
    const res = await retry(
      () =>
        this.api.call('devices.register', {
          body: { client_device_id: client, ua_class: facts.uaClass, standalone: facts.standalone, wakelock_supported: this.pf.wakeLock.supported },
        }),
      this.pf.timers,
    ).promise;
    await this.pf.kv.put('device', this.deviceKey(), res.device_id);
    return res.device_id;
  }

  // ---- Heartbeats (§4.2, §4.7) -----------------------------------------------------------------

  private scheduleTick(): void {
    this.clearTimer('tick');
    this.tickTimer = this.pf.timers.setTimeout(() => {
      this.tickTimer = null;
      this.onTick();
    }, HEARTBEAT_MS);
  }

  private onTick(): void {
    const s = this.ctx.state;
    if (s !== 'running' && s !== 'running_offline') return;
    const mono = this.pf.clock.monoNow();
    if (this.persisted) this.persisted.lastMono = mono;
    if (this.checkGapLimit()) return;
    if (this.pending) {
      // No new seq before an answer (§4.7): the observation goes to the outbox as a buffered heartbeat.
      this.bufferHeartbeat(mono);
    } else {
      this.sendHeartbeat();
    }
    this.syncPersisted();
    this.scheduleTick();
  }

  private bufferHeartbeat(mono: number): void {
    if (!this.outbox || !this.persisted || !this.ctx.nonce) return;
    this.outbox.append({
      type: 'heartbeat',
      seq: ++this.persisted.bufSeq,
      mono_ms: mono,
      client_ts: Math.round(this.pf.clock.wallNow()),
      visibility: this.pf.visibility.current(),
      wakelock: wakeLockWire(this.pf.wakeLock.status()),
      last_nonce: this.ctx.nonce,
    });
  }

  /**
   * Sends heartbeat seq + 1 with the outbox. The repeat keeps nonce, seq and the items it already
   * carried; its clock fields are refreshed per attempt, because the server compares the monotonic
   * reading with the receive time of that contact (§4.3 step 3). A repeat that the server already
   * processed is recognised on (nonce, seq) alone and answered from the cache (§4.7).
   */
  private sendHeartbeat(replay: readonly OutboxItem[] = []): void {
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (this.pending || !id || !nonce || !this.outbox || !this.persisted) return;
    const seq = this.persisted.lastSeq + 1;
    const hb: Omit<PendingHeartbeat, 'handle'> = { seq, nonce, carried: mergeItems(replay, this.outbox.pending()), sentMono: 0 };
    const outbox = this.outbox;
    const handle = retry(
      async () => {
        const mono = this.pf.clock.monoNow();
        hb.carried = mergeItems(hb.carried, outbox.pending());
        hb.sentMono = mono;
        const res = await heartbeatCall(this.api, id, {
          nonce,
          seq,
          mono,
          wall: this.pf.clock.wallNow(),
          rtt: this.lastRtt,
          visibility: this.pf.visibility.current(),
          wakelock: wakeLockWire(this.pf.wakeLock.status()),
          events: hb.carried,
        });
        this.lastRtt = this.pf.clock.monoNow() - mono;
        return res;
      },
      this.pf.timers,
      { onOffline: () => this.dispatch({ type: 'NET_LOST' }) },
    );
    const pending: PendingHeartbeat = { ...hb, handle };
    this.pending = pending;
    handle.promise.then(
      (res) => this.onHeartbeatOk(pending, res),
      (err) => this.onHeartbeatError(pending, err),
    );
  }

  private onHeartbeatOk(hb: PendingHeartbeat, res: HeartbeatResponse): void {
    if (this.pending === hb) this.pending = null;
    if (this.persisted) {
      this.persisted.lastSeq = hb.seq;
      this.persisted.nonce = res.nonce;
    }
    this.outbox?.ack(hb.carried);
    const state = this.ctx.state;
    if (state === 'aborted_local') {
      if (res.status === 'aborted') this.dispatch({ type: 'RESULT', status: 'aborted', ...(res.abort_reason ? { abortReason: res.abort_reason } : {}) });
      else this.resolveAborted();
      return;
    }
    if (state !== 'running' && state !== 'running_offline') return;
    const wasOffline = state === 'running_offline';
    this.dispatch({ type: 'HEARTBEAT_ACK', nonce: res.nonce, mono: hb.sentMono });
    if (wasOffline) {
      this.dispatch({ type: 'NET_BACK' });
      // A repeat may have been answered from the cache without reading its items: send them again.
      if (!this.pending) this.sendHeartbeat(hb.carried);
      if (this.stopQueued && this.ctx.state === 'running') {
        this.stopQueued = false;
        this.dispatch({ type: 'USER_STOP' });
      }
    }
    if (res.status === 'aborted' && (this.ctx.state === 'running' || this.ctx.state === 'running_offline')) {
      if (this.ctx.state === 'running_offline') this.dispatch({ type: 'NET_BACK' });
      this.dispatch({ type: 'SERVER_ABORT', reason: res.abort_reason ?? 'heartbeat_gap' });
    }
    this.syncPersisted();
  }

  private onHeartbeatError(hb: PendingHeartbeat, err: unknown): void {
    if (this.pending === hb) this.pending = null;
    if (err instanceof RetryCancelled) return;
    const verdict = verdictOf(err);
    if (verdict) {
      this.applyVerdict(verdict);
      return;
    }
    if (err instanceof ApiClientError && err.is('NONCE_INVALID')) void this.resync();
  }

  /** Our nonce is no longer valid (another tab or page resumed): resume on this device (§4.7). */
  private async resync(): Promise<void> {
    const id = this.ctx.sessionId;
    if (!id || !this.persisted) return;
    try {
      const detail = await this.api.call('sessions.get', { params: { id } });
      if (detail.session.status !== 'active') {
        this.applyVerdict({
          status: detail.session.status === 'completed' ? 'completed' : 'aborted',
          ...(detail.abort_reason ? { abort_reason: detail.abort_reason } : {}),
          verified_min: detail.session.verified_min,
          elapsed_s: this.elapsedFromDto(detail.session.server_start_at, detail.session.server_end_at),
          flagged: detail.review_status === 'pending',
        });
        return;
      }
      const deviceId = await this.ensureDevice();
      const facts = this.pf.device();
      const res = await this.api.call('sessions.start', {
        body: {
          planned_min: this.persisted.plannedMin,
          device_id: deviceId,
          practice: this.persisted.practice,
          client_ts: Math.round(this.pf.clock.wallNow()),
          mono_ms: this.pf.clock.monoNow(),
          webdriver: facts.webdriver,
          standalone: facts.standalone,
        },
        idempotencyKey: newIdempotencyKey(),
      });
      if (res.session_id !== id) return;
      this.persisted.lastSeq = 0;
      this.persisted.nonce = res.nonce;
      this.dispatch({ type: 'HEARTBEAT_ACK', nonce: res.nonce, mono: this.pf.clock.monoNow() });
    } catch {
      // Next tick tries again.
    }
  }

  private checkGapLimit(): boolean {
    if (this.ctx.state !== 'running_offline' || this.ctx.lastAckMono === null) return false;
    if (this.pf.clock.monoNow() - this.ctx.lastAckMono <= GAP_LIMIT_MS) return false;
    if (this.persisted) this.persisted.abortCause = 'gap';
    const elapsedS = this.ctx.monoStart === null ? 0 : Math.floor((this.ctx.lastAckMono - this.ctx.monoStart) / 1000);
    this.result = this.localResult('heartbeat_gap', elapsedS);
    this.dispatch({ type: 'GAP_LIMIT' });
    return true;
  }

  private scheduleGapCheck(): void {
    this.clearTimer('gap');
    if (this.ctx.lastAckMono === null) return;
    const wait = Math.max(0, this.ctx.lastAckMono + GAP_LIMIT_MS + 1 - this.pf.clock.monoNow());
    this.gapTimer = this.pf.timers.setTimeout(() => {
      this.gapTimer = null;
      if (!this.checkGapLimit() && this.ctx.state === 'running_offline') this.scheduleGapCheck();
    }, wait);
  }

  private scheduleDuration(): void {
    this.clearTimer('duration');
    const left = this.remaining();
    this.durationTimer = this.pf.timers.setTimeout(
      () => {
        this.durationTimer = null;
        const s = this.ctx.state;
        if (s !== 'running' && s !== 'running_offline') return;
        if (this.remaining() <= 0) this.dispatch({ type: 'DURATION_REACHED', mono: this.pf.clock.monoNow() });
        else this.scheduleDuration();
      },
      Math.max(0, Math.min(left, 60_000)) + 1,
    );
  }

  // ---- Page signals -------------------------------------------------------------------------------

  private onPageSignal(signal: PageSignal): void {
    const s = this.ctx.state;
    const running = s === 'running' || s === 'running_offline';
    if (running) {
      if (signal.kind === 'hidden' || signal.kind === 'pagehide') {
        const item = this.appendEvent(signal.kind, signal.mono, signal.wall, signal.persisted);
        if (item) this.writePagehideMark(item);
        this.hiddenAtMono = signal.mono;
        if (this.persisted) {
          this.persisted.abortCause = signal.kind;
          this.persisted.lastMono = signal.mono;
        }
        const elapsedS = this.ctx.monoStart === null ? 0 : Math.floor((signal.mono - this.ctx.monoStart) / 1000);
        this.result = this.localResult('hidden', elapsedS);
        this.dispatch({ type: 'HIDDEN', mono: signal.mono });
        return;
      }
      if ((signal.kind === 'blur' || signal.kind === 'focus') && this.pf.device().uaClass !== 'desktop') return;
      this.appendEvent(signal.kind, signal.mono, signal.wall, signal.persisted);
      if (signal.kind === 'visible') void this.pf.wakeLock.request();
      return;
    }
    if ((s === 'aborted_local' || s === 'aborted') && (signal.kind === 'visible' || signal.kind === 'pageshow')) {
      // Back after an abort: log how long the page was hidden (return_after_abort, §4.1).
      if (this.hiddenAtMono !== null && this.ctx.sessionId) {
        const hiddenS = Math.max(0, Math.round((signal.mono - this.hiddenAtMono) / 1000));
        this.track({ name: 'return_after_abort', props: { session_id: this.ctx.sessionId, hidden_duur_s: hiddenS } });
        this.hiddenAtMono = null;
      }
      this.resolving?.kick();
      return;
    }
    if (this.endSignal && signal.kind === 'visible') this.onFirstInteraction();
  }

  private onNetwork(online: boolean): void {
    const s = this.ctx.state;
    if (s === 'running' || s === 'running_offline') this.appendEvent(online ? 'online' : 'offline', this.pf.clock.monoNow(), this.pf.clock.wallNow());
    if (!online) {
      if (s === 'running') this.dispatch({ type: 'NET_LOST' });
      return;
    }
    this.pending?.handle.kick();
    this.closing?.kick();
    this.resolving?.kick();
    if (s === 'running_offline' && !this.pending) this.sendHeartbeat();
  }

  private onWakeLock(status: WakeLockStatus): void {
    const s = this.ctx.state;
    const id = this.ctx.sessionId;
    if ((s === 'running' || s === 'running_offline') && id && status !== 'idle') {
      const kind = status === 'acquired' ? 'wakelock_acquired' : status === 'released' ? 'wakelock_released' : 'wakelock_denied';
      this.appendEvent(kind, this.pf.clock.monoNow(), this.pf.clock.wallNow());
      if (status !== 'unsupported') this.track({ name: 'wakelock_state', props: { session_id: id, status } });
    }
    this.emit();
  }

  private appendEvent(
    kind: Extract<OutboxItem, { type: 'visibility' }>['kind'],
    mono: number,
    wall: number,
    persisted?: boolean,
  ): Extract<OutboxItem, { type: 'visibility' }> | null {
    if (!this.outbox || !this.persisted) return null;
    const item: Extract<OutboxItem, { type: 'visibility' }> = {
      type: 'visibility',
      ev_seq: ++this.persisted.evSeq,
      kind,
      mono_ms: Math.max(0, mono),
      client_ts: Math.round(wall),
      ...(persisted === undefined ? {} : { persisted }),
    };
    this.outbox.append(item);
    this.syncPersisted();
    return item;
  }

  private beaconHidden(): void {
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (!id || !nonce || !this.outbox) return;
    const body = { last_nonce: nonce, events: this.outbox.pending() };
    const sent = this.pf.beacon?.(id, body) ?? false;
    // Either way the batch stays in the outbox until an answer confirms it.
    this.resolveAborted(sent ? 1000 : 0);
  }

  // ---- End, stop and the verdict -----------------------------------------------------------------

  private beginEndSignal(): void {
    this.endSignal = true;
    void this.pf.signal.play(this.tone).then((r) => {
      this.signalResult = r;
      this.reportSignal();
    });
    // Keep the screen on a little after the end so the white end screen is seen (UX F3e).
    this.clearTimer('endLock');
    this.endLockTimer = this.pf.timers.setTimeout(() => {
      this.endLockTimer = null;
      void this.pf.wakeLock.release();
    }, END_WAKELOCK_MS);
  }

  private reportSignal(): void {
    const id = this.ctx.sessionId;
    if (!id || !this.signalResult) return;
    this.track({ name: 'signal_played', props: { session_id: id, gespeeld: this.signalResult.played, toon_aan: this.tone, trilling: this.signalResult.vibrated } });
  }

  /** First touch or return to visible after the end (claim delay, H9; spec §4.1). */
  private onFirstInteraction(): void {
    if (!this.endSignal) return;
    this.endSignal = false;
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (id && nonce) {
      const evSeq = Math.max(this.persisted?.evSeq ?? 0, this.lastEvSeq) + 1;
      this.lastEvSeq = evSeq;
      if (this.persisted) this.persisted.evSeq = evSeq;
      const item: OutboxItem = {
        type: 'visibility',
        ev_seq: evSeq,
        kind: 'first_interaction_after_end',
        mono_ms: this.pf.clock.monoNow(),
        client_ts: Math.round(this.pf.clock.wallNow()),
      };
      const handle = retry(() => this.api.call('sessions.events', { params: { id }, body: { last_nonce: nonce, events: [item] } }), this.pf.timers);
      handle.promise.catch(() => undefined);
    }
    this.clearTimer('endLock');
    void this.pf.wakeLock.release();
    this.emit();
  }

  private sendEnd(body: { mono_ms: number; client_ts: number }): void {
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (!id || !nonce || !this.outbox) return;
    const outbox = this.outbox;
    let carried: OutboxItem[] = [];
    let first = true;
    const handle = retry(async () => {
      carried = mergeItems(carried, outbox.pending());
      // The first attempt is the end report itself; a repeat after a lost connection reports when
      // it is actually sent, so the clocks match its receive time (§4.3 step 4, offline at the end).
      const clocks = first ? body : { mono_ms: Math.max(body.mono_ms, this.pf.clock.monoNow()), client_ts: Math.round(this.pf.clock.wallNow()) };
      first = false;
      return this.api.call('sessions.end', { params: { id }, body: { nonce, ...clocks, events: carried } });
    }, this.pf.timers);
    this.closing = handle;
    handle.promise.then(
      (res) => {
        if (this.closing === handle) this.closing = null;
        outbox.ack(carried);
        this.applyEnd(res);
      },
      (err) => {
        if (this.closing === handle) this.closing = null;
        if (err instanceof RetryCancelled) return;
        const verdict = verdictOf(err);
        if (verdict) this.applyVerdict(verdict);
        else void this.fetchVerdict();
      },
    );
  }

  private sendStop(): void {
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (!id || !nonce) return;
    const handle = retry(() => this.api.call('sessions.stop', { params: { id }, body: { nonce } }), this.pf.timers);
    this.closing = handle;
    handle.promise.then(
      (res) => {
        if (this.closing === handle) this.closing = null;
        this.result = this.serverResult('aborted', 'user_stop', res.elapsed_s);
        this.dispatch({ type: 'RESULT', status: 'aborted', abortReason: 'user_stop' });
      },
      (err) => {
        if (this.closing === handle) this.closing = null;
        if (err instanceof RetryCancelled) return;
        const verdict = verdictOf(err);
        if (verdict) this.applyVerdict(verdict);
        else void this.fetchVerdict();
      },
    );
  }

  /** After `hidden` or a reload: deliver the outbox and ask the server for its verdict. */
  private resolveAborted(delayMs = 0): void {
    const id = this.ctx.sessionId;
    const nonce = this.ctx.nonce;
    if (!id || !nonce || !this.outbox || this.resolving) return;
    if (this.persisted?.abortCause === 'gap' && this.pending) return;
    const outbox = this.outbox;
    const attempt = async () => {
      const carried = outbox.pending();
      const res = await this.api.call('sessions.events', { params: { id }, body: { last_nonce: nonce, events: carried } });
      outbox.ack(carried);
      if (res.status === 'active') {
        // Not settled yet (the server waits for a contact): a heartbeat makes it decide.
        return null;
      }
      return this.api.call('sessions.get', { params: { id } });
    };
    const startResolve = () => {
      const handle = retry(attempt, this.pf.timers);
      this.resolving = handle;
      handle.promise.then(
        (detail) => {
          if (this.resolving === handle) this.resolving = null;
          if (!detail) {
            if (this.ctx.state === 'aborted_local' && !this.pending) this.sendHeartbeatForVerdict();
            return;
          }
          this.applyDetail(detail);
        },
        (err) => {
          if (this.resolving === handle) this.resolving = null;
          if (err instanceof RetryCancelled) return;
          // VALIDATION_FAILED on last_nonce or similar: fall back to the session detail.
          void this.fetchVerdict();
        },
      );
    };
    if (delayMs > 0) this.pf.timers.setTimeout(startResolve, delayMs);
    else startResolve();
  }

  /** In aborted_local the heartbeat path is the one that settles a session on the server. */
  private sendHeartbeatForVerdict(): void {
    const id = this.ctx.sessionId;
    const nonce = this.persisted?.nonce ?? this.ctx.nonce;
    if (!id || !nonce || !this.outbox || !this.persisted || this.pending) return;
    this.ctx = { ...this.ctx, nonce };
    const seq = this.persisted.lastSeq + 1;
    const hb: Omit<PendingHeartbeat, 'handle'> = { seq, nonce, carried: this.outbox.pending(), sentMono: 0 };
    const handle = retry(async () => {
      hb.sentMono = this.pf.clock.monoNow();
      return heartbeatCall(this.api, id, {
        nonce,
        seq,
        mono: hb.sentMono,
        wall: this.pf.clock.wallNow(),
        rtt: null,
        visibility: this.pf.visibility.current(),
        wakelock: wakeLockWire(this.pf.wakeLock.status()),
        events: hb.carried,
      });
    }, this.pf.timers);
    const pending: PendingHeartbeat = { ...hb, handle };
    this.pending = pending;
    handle.promise.then(
      (res) => this.onHeartbeatOk(pending, res),
      (err) => {
        this.onHeartbeatError(pending, err);
        if (!verdictOf(err) && !(err instanceof RetryCancelled)) void this.fetchVerdict();
      },
    );
  }

  private async fetchVerdict(): Promise<void> {
    const id = this.ctx.sessionId;
    if (!id) return;
    try {
      const detail = await retry(() => this.api.call('sessions.get', { params: { id } }), this.pf.timers).promise;
      this.applyDetail(detail);
    } catch {
      // Keep the local explanation.
    }
  }

  private applyDetail(detail: SessionDetailResponse): void {
    if (detail.session.status === 'active') return;
    this.applyVerdict({
      status: detail.session.status === 'completed' ? 'completed' : 'aborted',
      ...(detail.abort_reason ? { abort_reason: detail.abort_reason } : {}),
      verified_min: detail.session.verified_min,
      elapsed_s: this.elapsedFromDto(detail.session.server_start_at, detail.session.server_end_at),
      flagged: detail.review_status === 'pending',
    });
  }

  private elapsedFromDto(start: string, end: string | null): number {
    if (!end) return 0;
    return Math.max(0, Math.floor((Date.parse(end) - Date.parse(start)) / 1000));
  }

  private applyEnd(res: EndSessionResponse): void {
    if (res.status === 'completed') {
      this.result = { ...this.serverResult('completed', undefined, (this.ctx.plannedMin ?? 0) * 60), end: res };
      this.dispatch({ type: 'RESULT', status: 'completed' });
      return;
    }
    if (res.status === 'aborted') {
      void this.fetchVerdict();
      return;
    }
    // Still active: the end came too early for the server; the verdict follows from the detail.
    void this.fetchVerdict();
  }

  private applyVerdict(v: SessionVerdictDto): void {
    const s = this.ctx.state;
    const end =
      v.status === 'completed'
        ? ({
            status: 'completed',
            verified_min: v.verified_min,
            counted_min: v.verified_min,
            points: 0,
            points_status: v.flagged ? 'pending' : 'available',
            flagged: v.flagged,
            goal_met: false,
            streak: null,
            earn_in_progress_min: 0,
          } satisfies EndSessionResponse)
        : undefined;
    const prevEnd = this.result?.end;
    const keepEnd = prevEnd ?? end;
    this.result = { ...this.serverResult(v.status, v.abort_reason, v.elapsed_s), ...(keepEnd ? { end: keepEnd } : {}) };
    if (s === 'running' || s === 'running_offline') {
      if (v.status === 'aborted') {
        if (s === 'running_offline') this.dispatch({ type: 'NET_BACK' });
        this.dispatch({ type: 'SERVER_ABORT', reason: v.abort_reason ?? 'heartbeat_gap' });
      }
      return;
    }
    if (s === 'ending' || s === 'stopping' || s === 'aborted_local') {
      this.dispatch({ type: 'RESULT', status: v.status, ...(v.abort_reason ? { abortReason: v.abort_reason } : {}) });
      return;
    }
    // Already showing a result: only refresh the details.
    this.emit();
  }

  private localResult(reason: AbortReason, elapsedS: number): SessionResult {
    const start = this.serverStartAt;
    return {
      sessionId: this.ctx.sessionId ?? '',
      status: 'aborted',
      abortReason: reason,
      practice: this.practice,
      plannedMin: (this.ctx.plannedMin ?? 25) as PlannedMin,
      serverStartAt: start,
      stoppedAt: start ? new Date(Date.parse(start) + elapsedS * 1000).toISOString() : null,
      elapsedS,
      confirmed: false,
    };
  }

  private serverResult(status: 'completed' | 'aborted', reason: AbortReason | undefined, elapsedS: number): SessionResult {
    const start = this.serverStartAt;
    const plannedMin = (this.ctx.plannedMin ?? this.persisted?.plannedMin ?? 25) as PlannedMin;
    return {
      sessionId: this.ctx.sessionId ?? this.persisted?.sessionId ?? '',
      status,
      ...(reason ? { abortReason: reason } : {}),
      practice: this.practice,
      plannedMin,
      serverStartAt: start,
      stoppedAt: start ? new Date(Date.parse(start) + elapsedS * 1000).toISOString() : null,
      elapsedS,
      confirmed: true,
    };
  }

  private applyResultState(ev: MachineEvent): void {
    // Keep a result for every terminal state, even when it came straight from the machine.
    if (ev.type === 'SERVER_ABORT' && (!this.result || this.result.abortReason !== ev.reason)) {
      const elapsedS = this.ctx.monoStart === null ? 0 : Math.floor((this.pf.clock.monoNow() - this.ctx.monoStart) / 1000);
      this.result = this.result?.confirmed ? { ...this.result, abortReason: ev.reason } : { ...this.serverResult('aborted', ev.reason, elapsedS) };
    }
    if (ev.type === 'RESULT') {
      const reason = this.ctx.result?.abortReason;
      if (!this.result) {
        this.result = this.serverResult(ev.status === 'completed' && this.ctx.state === 'completed' ? 'completed' : 'aborted', reason, 0);
      } else {
        this.result = { ...this.result, status: this.ctx.state === 'completed' ? 'completed' : 'aborted', ...(reason ? { abortReason: reason } : {}), confirmed: true };
      }
    }
  }

  private onResultShown(ev: MachineEvent): void {
    const s = this.ctx.state;
    if (s === 'aborted_local') {
      // Local guess (5 minutes offline): the stored copy stays until the server confirms.
      this.pf.guardUnload(false);
      if (ev.type === 'GAP_LIMIT') void this.pf.wakeLock.release();
      return;
    }
    this.pf.guardUnload(false);
    this.pf.tabLock.release();
    this.clearTimers(s === 'completed');
    this.pending?.handle.cancel();
    this.pending = null;
    this.resolving?.cancel();
    this.resolving = null;
    if (s !== 'completed') void this.pf.wakeLock.release();
    if (s === 'completed' && !this.practice) void import('../../../platform/storage.ts').then((m) => m.requestPersistence());
    const id = this.ctx.sessionId;
    this.lastEvSeq = this.persisted?.evSeq ?? this.lastEvSeq;
    void this.clearPersisted(id);
  }

  // ---- Persistence --------------------------------------------------------------------------------

  private syncPersisted(): void {
    const p = this.persisted;
    if (!p) return;
    p.state = this.ctx.state;
    if (this.ctx.nonce) p.nonce = this.ctx.nonce;
    if (this.ctx.monoStart !== null) p.monoStart = this.ctx.monoStart;
    if (this.ctx.state === 'idle' || this.ctx.state === 'completed' || this.ctx.state === 'aborted') return;
    void this.persist();
  }

  private persist(): Promise<void> {
    const p = this.persisted;
    if (!p) return Promise.resolve();
    return this.pf.kv.put('active_session', ACTIVE_KEY, p).catch(() => undefined);
  }

  private async clearPersisted(sessionId: string | null): Promise<void> {
    this.persisted = null;
    this.outbox?.clear();
    this.outbox = null;
    try {
      await this.pf.kv.delete('active_session', ACTIVE_KEY);
      if (sessionId) {
        for (const { key } of await this.pf.kv.list('outbox', `${sessionId}:`)) await this.pf.kv.delete('outbox', key);
      }
    } catch {
      // ignore
    }
  }

  /** pagehide may not finish an IndexedDB write; sessionStorage is synchronous and survives a reload. */
  private writePagehideMark(item: OutboxItem): void {
    try {
      sessionStorage.setItem(PAGEHIDE_MARK, JSON.stringify({ sessionId: this.ctx.sessionId, item }));
    } catch {
      // ignore
    }
  }

  private readPagehideMark(sessionId: string): Extract<OutboxItem, { type: 'visibility' }> | null {
    try {
      const raw = sessionStorage.getItem(PAGEHIDE_MARK);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { sessionId?: string; item?: OutboxItem };
      if (parsed.sessionId !== sessionId || parsed.item?.type !== 'visibility') return null;
      return { ...parsed.item, nav_type: this.pf.navigationType() };
    } catch {
      return null;
    }
  }

  private clearPagehideMark(): void {
    try {
      sessionStorage.removeItem(PAGEHIDE_MARK);
    } catch {
      // ignore
    }
  }

  // ---- Helpers --------------------------------------------------------------------------------------

  private track(event: ClientEvent): void {
    this.api.call('events.track', { body: event }).catch(() => undefined);
  }

  private clearTimer(which: 'tick' | 'duration' | 'gap' | 'endLock'): void {
    const key = `${which}Timer` as 'tickTimer' | 'durationTimer' | 'gapTimer' | 'endLockTimer';
    if (this[key] !== null) this.pf.timers.clearTimeout(this[key]);
    this[key] = null;
  }

  private clearTimers(keepEndLock = false): void {
    this.clearTimer('tick');
    this.clearTimer('duration');
    this.clearTimer('gap');
    if (!keepEndLock) this.clearTimer('endLock');
  }
}
