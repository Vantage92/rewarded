// Simulated focus client for the WP-4 integration tests: tracks nonce, seq and the monotonic clock.
import { call, idemKey, type Harness, type TestUser, CSRF_TOKEN } from './harness.ts';

export class FocusClient {
  sessionId = '';
  nonce = '';
  seq = 0;
  evSeq = 0;
  monoStart = 10_000;
  mono = 10_000;
  key = '';
  plannedMin = 25;
  outbox: unknown[] = [];
  last: { status: number; body: any } = { status: 0, body: undefined };
  constructor(readonly h: Harness, readonly user: TestUser, readonly deviceId: string) {}

  /** Moves server and device time forward together (the device clock stays in step). */
  advance(ms: number): void {
    this.h.clock.advance(ms);
    this.mono += ms;
  }

  async start(plannedMin: 1 | 25 | 50 | 90 = 25, opts: { key?: string; webdriver?: boolean; practice?: boolean } = {}) {
    this.plannedMin = plannedMin;
    this.key = opts.key ?? idemKey();
    this.last = await call(this.h, this.user, 'POST', '/sessions', {
      planned_min: plannedMin, device_id: this.deviceId, practice: opts.practice ?? plannedMin === 1, client_ts: this.h.clock.now().getTime(),
      mono_ms: this.mono, webdriver: opts.webdriver ?? false, standalone: false,
    }, { 'Idempotency-Key': this.key });
    if (this.last.status < 300) {
      this.sessionId = this.last.body.session_id;
      this.nonce = this.last.body.nonce;
      if (this.last.body.resumed) this.seq = 0;
      else this.monoStart = this.mono;
    }
    return this.last;
  }

  hidden(kind: 'hidden' | 'pagehide' = 'hidden') {
    this.evSeq += 1;
    return { type: 'visibility', ev_seq: this.evSeq, kind, mono_ms: this.mono, client_ts: this.h.clock.now().getTime() };
  }
  visibility(kind: string) {
    this.evSeq += 1;
    return { type: 'visibility', ev_seq: this.evSeq, kind, mono_ms: this.mono, client_ts: this.h.clock.now().getTime() };
  }
  /** A heartbeat written to the outbox while offline (architecture §4.2). */
  bufSeq = 1000;
  buffer() {
    this.bufSeq += 1;
    this.outbox.push({ type: 'heartbeat', seq: this.bufSeq, mono_ms: this.mono, client_ts: this.h.clock.now().getTime(), visibility: 'visible', wakelock: 'acquired', last_nonce: this.nonce });
  }

  async beat(opts: { events?: unknown[]; seq?: number; nonce?: string; clientSkewMs?: number; keepNonce?: boolean } = {}) {
    const seq = opts.seq ?? this.seq + 1;
    const events = [...this.outbox, ...(opts.events ?? [])];
    this.last = await call(this.h, this.user, 'POST', `/sessions/${this.sessionId}/heartbeats`, {
      nonce: opts.nonce ?? this.nonce, seq, mono_ms: this.mono, client_ts: this.h.clock.now().getTime() + (opts.clientSkewMs ?? 0),
      visibility: 'visible', wakelock: 'acquired', events,
    });
    if (this.last.status === 200 && !opts.keepNonce) {
      this.nonce = this.last.body.nonce;
      this.seq = seq;
      this.outbox = [];
    }
    return this.last;
  }

  /** Heartbeats every 30 s for `ms` milliseconds. */
  async run(ms: number, opts: { clientSkewMs?: number } = {}) {
    for (let t = 30_000; t <= ms; t += 30_000) {
      this.advance(30_000);
      const r = await this.beat(opts);
      if (r.status !== 200) return r;
    }
    const rest = ms % 30_000;
    if (rest) this.advance(rest);
    return this.last;
  }

  async end(opts: { nonce?: string; events?: unknown[] } = {}) {
    this.last = await call(this.h, this.user, 'POST', `/sessions/${this.sessionId}/end`, {
      nonce: opts.nonce ?? this.nonce, mono_ms: this.mono, client_ts: this.h.clock.now().getTime(), events: [...this.outbox, ...(opts.events ?? [])],
    });
    return this.last;
  }

  async stop(opts: { nonce?: string } = {}) {
    this.last = await call(this.h, this.user, 'POST', `/sessions/${this.sessionId}/stop`, { nonce: opts.nonce ?? this.nonce });
    return this.last;
  }

  async beacon(events: unknown[], csrf = CSRF_TOKEN) {
    this.last = await call(this.h, this.user, 'POST', `/sessions/${this.sessionId}/events`, { csrf, last_nonce: this.nonce, events }, { 'X-CSRF-Token': 'ignored-for-beacon-0000' });
    return this.last;
  }

  /** Full visible session: heartbeats every 30 s up to the planned end, then the end report. */
  async complete(plannedMin: 1 | 25 | 50 | 90 = 25, opts: { webdriver?: boolean } = {}) {
    await this.start(plannedMin, opts);
    await this.run(plannedMin * 60_000);
    return this.end();
  }
}
