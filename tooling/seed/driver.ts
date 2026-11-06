// A small HTTP driver shared by the demo seed (in-process, Hono app.request) and the end-to-end
// specs (a real API process per Playwright worker). One Actor = one browser profile: its own
// cookie jar, CSRF token, client IP and user agent. Requests go through the typed contracts client,
// so the seed and the specs validate every request and response against contracts-v1.
import { ApiClientError, createApiClient, type FetchLike } from '../../packages/contracts/src/client.ts';
import type { RouteInput, RouteOutput } from '../../packages/contracts/src/route.ts';
import { routes, type RouteId, type Routes } from '../../packages/contracts/src/routes.ts';

/** Raw response the driver needs from a transport. */
export interface WireResponse {
  status: number;
  headers: Headers;
  text(): Promise<string>;
}

/** Sends one request below `/api/v1`; `ip` is the simulated client address. */
export type Transport = (path: string, init: { method: string; headers: Record<string, string>; body?: string }, ip: string) => Promise<WireResponse>;

/** Message as GET /dev/inbox returns it (and as the in-process inbox holds it). */
export interface InboxMessage {
  channel: 'email' | 'sms';
  to: string;
  subject?: string;
  text: string;
}
export type InboxReader = (to: string) => Promise<InboxMessage[]>;

export const APP_ORIGIN = 'http://localhost:5173';
export const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
} as const;

let actorCount = 0;

/** RouteInput where a required Idempotency-Key may be left out: the Actor then generates one. */
type LooseInput<K extends RouteId> = Omit<RouteInput<Routes[K]>, 'idempotencyKey'> & { idempotencyKey?: string };
type LooseArgs<K extends RouteId> = object extends LooseInput<K> ? [input?: LooseInput<K>] : [input: LooseInput<K>];
export interface DriverApi {
  call<K extends RouteId>(id: K, ...args: LooseArgs<K>): Promise<RouteOutput<Routes[K]>>;
}

export interface ActorOptions {
  ip: string;
  /** Prefix of generated idempotency keys (default a1, a2, …). */
  label?: string;
  userAgent?: string;
  origin?: string;
}

/** One simulated browser profile against the API. */
export class Actor {
  readonly cookies = new Map<string, string>();
  readonly api: DriverApi;
  ip: string;
  private readonly label: string;
  private readonly transport: Transport;
  private readonly userAgent: string;
  private readonly origin: string;

  constructor(transport: Transport, opts: ActorOptions) {
    this.transport = transport;
    this.ip = opts.ip;
    this.userAgent = opts.userAgent ?? UA.android;
    this.origin = opts.origin ?? APP_ORIGIN;
    this.label = opts.label ?? `a${++actorCount}`;
    const fetchLike: FetchLike = async (url, init) => {
      const path = url.replace(/^\/api\/v1/, '');
      if (init.method !== 'GET' && !this.cookies.has('rw_csrf')) await this.send('GET', '/health');
      const csrf = this.cookies.get('rw_csrf');
      if (init.method !== 'GET' && csrf) init.headers['X-CSRF-Token'] = csrf;
      const res = await this.send(init.method, path, init.body, init.headers);
      return { status: res.status, ok: res.status >= 200 && res.status < 300, text: () => res.text() };
    };
    const inner = createApiClient({ fetch: fetchLike, baseUrl: '/api/v1' });
    // Routes that require an Idempotency-Key get a fresh one unless the caller passes its own
    // (a repeat of a request passes the same key on purpose, architecture §4.7).
    const call = (id: RouteId, input: { idempotencyKey?: string } = {}) => {
      if ((routes[id] as { idempotencyKey?: string }).idempotencyKey === 'required' && !input.idempotencyKey) input = { ...input, idempotencyKey: `idem-${this.name}-${String(++this.keySeq).padStart(6, '0')}` };
      return (inner.call as (i: RouteId, x: unknown) => Promise<unknown>)(id, input);
    };
    this.api = { call: call as DriverApi['call'] };
  }

  private keySeq = 0;
  /** Stable part of generated idempotency keys. */
  get name(): string {
    return this.label;
  }

  /** Low-level request with cookies, Origin and user agent; stores Set-Cookie. */
  async send(method: string, path: string, body?: string, headers: Record<string, string> = {}): Promise<WireResponse> {
    const h: Record<string, string> = { ...headers, 'User-Agent': this.userAgent };
    if (method !== 'GET') h.Origin = this.origin;
    if (this.cookies.size > 0) h.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers: h };
    if (body !== undefined) init.body = body;
    const res = await this.transport(path, init, this.ip);
    this.storeCookies(res.headers);
    return res;
  }

  private storeCookies(headers: Headers): void {
    for (const line of headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const eq = pair!.indexOf('=');
      if (eq < 0) continue;
      const name = pair!.slice(0, eq).trim();
      const value = pair!.slice(eq + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age\s*=\s*0\s*$/i.test(a)) || value === '';
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  /** The error code of a failing call, or 'OK' (for scenario assertions). */
  async codeOf(p: Promise<unknown>): Promise<string> {
    try {
      await p;
      return 'OK';
    } catch (e) {
      if (e instanceof ApiClientError) return e.code;
      throw e;
    }
  }
}

/** Transport for a running API (e2e): plain fetch, the client IP as X-Forwarded-For (TRUST_PROXY=1). */
export function networkTransport(baseUrl: string): Transport {
  return async (path, init, ip) => {
    const res = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...init.headers, 'X-Forwarded-For': ip } });
    return { status: res.status, headers: res.headers, text: () => res.text() };
  };
}

/** Inbox of a running dev API (GET /dev/inbox). */
export function networkInbox(baseUrl: string): InboxReader {
  return async (to) => {
    const res = await fetch(`${baseUrl}/dev/inbox?to=${encodeURIComponent(to.toLowerCase())}`);
    const body = (await res.json()) as { messages: InboxMessage[] };
    return body.messages;
  };
}

/** Last six-digit login code in the inbox of `to`. */
export async function lastCode(inbox: InboxReader, to: string, channel: 'email' | 'sms' = 'email'): Promise<string> {
  const msgs = (await inbox(to)).filter((m) => m.channel === channel);
  const text = msgs[msgs.length - 1]?.text ?? '';
  // The code follows a colon (mail) or "is" (SMS); a token in a link never does.
  const all = [...text.matchAll(/(?::|\bis)\s*(\d{6})\b/g)];
  const code = all[all.length - 1]?.[1];
  if (!code) throw new Error(`no code in the inbox of ${to}`);
  return code;
}

/** Token from the last mail of `to` that matches the pattern (invite link, login link). */
export async function lastToken(inbox: InboxReader, to: string, pattern: RegExp): Promise<string> {
  const msgs = (await inbox(to)).filter((m) => m.channel === 'email');
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = pattern.exec(msgs[i]!.text);
    if (m?.[1]) return m[1];
  }
  throw new Error(`no link matching ${pattern} for ${to}`);
}
