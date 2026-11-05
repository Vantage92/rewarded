// The only database surface the rest of the API sees (architecture §2.1).

export type SqlValue = null | number | bigint | string | Uint8Array;

/** Positional (`?`) or named (`:name`, `@name`, `$name`; keys without prefix) parameters. */
export type SqlParams = readonly SqlValue[] | Readonly<Record<string, SqlValue>>;

export type DriverName = 'better-sqlite3' | 'node:sqlite';

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Db {
  readonly driver: DriverName;
  exec(sql: string): void;
  run(sql: string, params?: SqlParams): RunResult;
  get<T = Record<string, unknown>>(sql: string, params?: SqlParams): T | undefined;
  all<T = Record<string, unknown>>(sql: string, params?: SqlParams): T[];
  /** Synchronous transaction; nested calls become savepoints. */
  transaction<T>(fn: () => T): T;
  close(): void;
}
