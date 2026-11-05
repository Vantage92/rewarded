// Logger interface with a field allowlist (architecture §10.9). Fields outside the allowlist are
// dropped, not masked; bodies, query strings of auth routes, cookies and raw IPs never reach a line.
import type { NetClass } from '@rewarded/contracts';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** The only fields a log line may carry. */
export interface LogFields {
  route?: string;
  status?: number;
  duration_ms?: number;
  request_id?: string;
  error_code?: string;
  net_class?: NetClass;
  /** Short hash, never a raw user id. */
  user_ref?: string;
  /** Stack frames without the error arguments. */
  stack?: string;
}
export interface LogLine extends LogFields {
  ts: string;
  level: LogLevel;
  msg: string;
}

export interface Logger {
  log(level: LogLevel, msg: string, fields?: Record<string, unknown>): void;
}

const NET_CLASSES = new Set(['campus', 'mobile_cgnat', 'other']);
/** Route patterns only (`/sessions/:id`), never concrete paths with tokens or query strings. */
const ROUTE_PATTERN = /^[A-Z]{3,6} \/[A-Za-z0-9/:_-]*$|^\/[A-Za-z0-9/:_-]*$/;
const SAFE_TOKEN = /^[A-Za-z0-9_.:-]{1,64}$/;
/** Message keys are fixed identifiers; free text could carry personal data. */
const SAFE_MSG = /^[a-z][a-z0-9_.:-]{0,79}$/;

/** Keeps allowlisted fields with the right type and format; everything else is dropped. */
export function sanitizeLogFields(raw: Record<string, unknown> = {}): LogFields {
  const out: LogFields = {};
  if (typeof raw.route === 'string' && ROUTE_PATTERN.test(raw.route)) out.route = raw.route;
  if (typeof raw.status === 'number' && Number.isInteger(raw.status) && raw.status >= 100 && raw.status < 600) out.status = raw.status;
  if (typeof raw.duration_ms === 'number' && Number.isFinite(raw.duration_ms) && raw.duration_ms >= 0) out.duration_ms = Math.round(raw.duration_ms);
  if (typeof raw.request_id === 'string' && SAFE_TOKEN.test(raw.request_id)) out.request_id = raw.request_id;
  if (typeof raw.error_code === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(raw.error_code)) out.error_code = raw.error_code;
  if (typeof raw.net_class === 'string' && NET_CLASSES.has(raw.net_class)) out.net_class = raw.net_class as NetClass;
  if (typeof raw.user_ref === 'string' && /^[a-f0-9]{8,16}$/.test(raw.user_ref)) out.user_ref = raw.user_ref;
  if (typeof raw.stack === 'string') out.stack = stripStack(raw.stack);
  return out;
}

/** Keeps only `at fn (file:line:col)` frames; the first line (message with arguments) is removed. */
export function stripStack(stack: string): string {
  return stack
    .split('\n')
    .filter((l) => /^\s+at\s/.test(l))
    .map((l) => l.trim().slice(0, 200))
    .slice(0, 20)
    .join('\n');
}

export function buildLogLine(now: Date, level: LogLevel, msg: string, fields?: Record<string, unknown>): LogLine {
  return { ts: now.toISOString(), level, msg: SAFE_MSG.test(msg) ? msg : 'redacted_message', ...sanitizeLogFields(fields) };
}

/** JSON-lines logger over any sink (stdout in dev and production). */
export class JsonLineLogger implements Logger {
  private readonly write: (line: string) => void;
  private readonly now: () => Date;
  private readonly minLevel: LogLevel;
  constructor(write: (line: string) => void, now: () => Date = () => new Date(), minLevel: LogLevel = 'info') {
    this.write = write;
    this.now = now;
    this.minLevel = minLevel;
  }
  log(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (order.indexOf(level) < order.indexOf(this.minLevel)) return;
    this.write(JSON.stringify(buildLogLine(this.now(), level, msg, fields)));
  }
}

/** Captures lines in memory for tests (the log test of §10.9 inspects `lines`). */
export class MemoryLogger implements Logger {
  readonly lines: LogLine[] = [];
  private readonly now: () => Date;
  constructor(now: () => Date = () => new Date(0)) {
    this.now = now;
  }
  log(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    this.lines.push(buildLogLine(this.now(), level, msg, fields));
  }
  text(): string {
    return this.lines.map((l) => JSON.stringify(l)).join('\n');
  }
}
