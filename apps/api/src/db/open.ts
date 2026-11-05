import { createRequire } from 'node:module';
import type { Db, DriverName, RunResult, SqlParams } from './types.ts';

const require = createRequire(import.meta.url);

/** Minimal statement shape shared by better-sqlite3 and node:sqlite. */
interface RawStatement {
  run(...args: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
}

interface RawDatabase {
  exec(sql: string): unknown;
  prepare(sql: string): RawStatement;
  close(): unknown;
}

type RawDatabaseCtor = new (path: string) => RawDatabase;

export interface OpenDbOptions {
  /** File path or ':memory:'. */
  path: string;
  /** 'auto' (default) prefers better-sqlite3 and falls back to node:sqlite. */
  driver?: 'auto' | DriverName;
  /** Test seam: replaces `require('better-sqlite3')`. */
  loadBetterSqlite3?: () => unknown;
}

function loadBetterSqlite3(): RawDatabaseCtor {
  return require('better-sqlite3') as RawDatabaseCtor;
}

function loadNodeSqlite(): RawDatabaseCtor {
  const mod = require('node:sqlite') as { DatabaseSync: RawDatabaseCtor };
  return mod.DatabaseSync;
}

function pickDriver(opts: OpenDbOptions): { name: DriverName; ctor: RawDatabaseCtor } {
  const wanted = opts.driver ?? 'auto';
  if (wanted === 'node:sqlite') return { name: 'node:sqlite', ctor: loadNodeSqlite() };
  const loadBetter = opts.loadBetterSqlite3 ?? loadBetterSqlite3;
  try {
    const ctor = loadBetter() as RawDatabaseCtor;
    // Opening a database proves the native binding actually loads.
    new ctor(':memory:').close();
    return { name: 'better-sqlite3', ctor };
  } catch (err) {
    if (wanted === 'better-sqlite3') throw err;
    return { name: 'node:sqlite', ctor: loadNodeSqlite() };
  }
}

function bind(params: SqlParams | undefined): unknown[] {
  if (params === undefined) return [];
  return Array.isArray(params) ? [...params] : [params];
}

/** node:sqlite returns null-prototype rows; normalise so both drivers look the same. */
function plain<T>(row: unknown): T {
  return (row === undefined || row === null ? row : { ...(row as object) }) as T;
}

export function openDb(opts: OpenDbOptions): Db {
  const { name, ctor } = pickDriver(opts);
  const raw = new ctor(opts.path);
  const cache = new Map<string, RawStatement>();
  const stmt = (sql: string): RawStatement => {
    let s = cache.get(sql);
    if (!s) {
      s = raw.prepare(sql);
      cache.set(sql, s);
    }
    return s;
  };

  raw.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (opts.path !== ':memory:') raw.exec('PRAGMA journal_mode = WAL;');

  let depth = 0;

  const db: Db = {
    driver: name,
    exec(sql) {
      raw.exec(sql);
    },
    run(sql, params): RunResult {
      const r = stmt(sql).run(...bind(params));
      return { changes: Number(r.changes), lastInsertRowid: r.lastInsertRowid };
    },
    get(sql, params) {
      return plain(stmt(sql).get(...bind(params)));
    },
    all(sql, params) {
      return stmt(sql).all(...bind(params)).map((r) => plain(r));
    },
    transaction(fn) {
      const savepoint = `sp_${depth}`;
      raw.exec(depth === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${savepoint}`);
      depth++;
      try {
        const result = fn();
        if (result instanceof Promise) throw new Error('Db.transaction callback must be synchronous');
        depth--;
        raw.exec(depth === 0 ? 'COMMIT' : `RELEASE ${savepoint}`);
        return result;
      } catch (err) {
        depth--;
        raw.exec(depth === 0 ? 'ROLLBACK' : `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`);
        throw err;
      }
    },
    close() {
      cache.clear();
      raw.close();
    },
  };
  return db;
}

/**
 * Driver-neutral check for constraint violations. The drivers report them differently:
 * better-sqlite3 sets `code` to e.g. 'SQLITE_CONSTRAINT_UNIQUE'; node:sqlite sets `errstr`
 * and the extended result code in `errcode`.
 */
export function isConstraintError(err: unknown, kind?: 'UNIQUE' | 'FOREIGNKEY' | 'NOTNULL' | 'CHECK' | 'PRIMARYKEY'): boolean {
  if (!(err instanceof Error)) return false;
  const e = err as Error & { code?: string; errcode?: number };
  const extended: Record<number, string> = { 275: 'CHECK', 787: 'FOREIGNKEY', 1299: 'NOTNULL', 1555: 'PRIMARYKEY', 2067: 'UNIQUE' };
  const found =
    typeof e.code === 'string' && e.code.startsWith('SQLITE_CONSTRAINT')
      ? e.code.replace('SQLITE_CONSTRAINT_', '')
      : typeof e.errcode === 'number' && (e.errcode & 0xff) === 19
        ? (extended[e.errcode] ?? 'CONSTRAINT')
        : undefined;
  if (found === undefined) return false;
  return kind === undefined || found === kind;
}
