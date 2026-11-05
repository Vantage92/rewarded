import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR } from '../src/config.ts';
import { loadMigrations, migrate } from '../src/db/migrate.ts';
import { openDb } from '../src/db/open.ts';
import type { DriverName } from '../src/db/types.ts';
import { DevClock } from '../src/platform/dev.ts';

const dirs: string[] = [];
const tempDir = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'rw-mig-'));
  dirs.push(dir);
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(dir, name), sql);
  return dir;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const clock = new DevClock(new Date('2026-11-05T09:00:00Z'));

describe.each<DriverName>(['better-sqlite3', 'node:sqlite'])('migrate on %s', (driver) => {
  it('applies pending migrations once, in order', () => {
    const dir = tempDir({
      '0002_b.sql': 'CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id));',
      '0001_a.sql': 'CREATE TABLE a (id INTEGER PRIMARY KEY);',
      'README.md': 'ignored',
    });
    const db = openDb({ path: ':memory:', driver });
    expect(migrate(db, { dir, clock }).applied).toEqual(['0001_a', '0002_b']);
    expect(migrate(db, { dir, clock }).applied).toEqual([]);
    expect(db.get('SELECT applied_at FROM schema_migration WHERE version = ?', ['0001'])).toEqual({
      applied_at: '2026-11-05T09:00:00.000Z',
    });
  });

  it('rolls back a failing migration completely', () => {
    const dir = tempDir({ '0001_bad.sql': 'CREATE TABLE ok (id INTEGER); THIS IS NOT SQL;' });
    const db = openDb({ path: ':memory:', driver });
    expect(() => migrate(db, { dir, clock })).toThrow(/syntax error/);
    expect(db.get("SELECT count(*) AS n FROM sqlite_master WHERE name = 'ok'")).toEqual({ n: 0 });
    expect(db.get('SELECT count(*) AS n FROM schema_migration')).toEqual({ n: 0 });
  });

  it('refuses a migration that changed after it was applied', () => {
    const dir = tempDir({ '0001_a.sql': 'CREATE TABLE a (id INTEGER);' });
    const db = openDb({ path: ':memory:', driver });
    migrate(db, { dir, clock });
    writeFileSync(join(dir, '0001_a.sql'), 'CREATE TABLE a (id INTEGER, extra TEXT);');
    expect(() => migrate(db, { dir, clock })).toThrow(/changed after it was applied/);
  });
});

describe('loadMigrations', () => {
  it('rejects badly named files and duplicate versions', () => {
    expect(() => loadMigrations(tempDir({ '1_a.sql': '' }))).toThrow(/Invalid migration file name/);
    expect(() => loadMigrations(tempDir({ '0001_a.sql': '', '0001_b.sql': '' }))).toThrow(/Duplicate/);
  });

  it('reads the repository migrations folder', () => {
    expect(() => loadMigrations(MIGRATIONS_DIR)).not.toThrow();
  });
});
