import { describe, expect, it } from 'vitest';
import { isConstraintError, openDb } from '../src/db/open.ts';
import type { DriverName } from '../src/db/types.ts';

const drivers: DriverName[] = ['better-sqlite3', 'node:sqlite'];

describe('driver selection', () => {
  it('auto picks better-sqlite3 when it loads', () => {
    const db = openDb({ path: ':memory:' });
    expect(db.driver).toBe('better-sqlite3');
    db.close();
  });

  it('auto falls back to node:sqlite when better-sqlite3 is missing', () => {
    const db = openDb({
      path: ':memory:',
      loadBetterSqlite3: () => {
        throw new Error("Cannot find module 'better-sqlite3'");
      },
    });
    expect(db.driver).toBe('node:sqlite');
    expect(db.get<{ v: number }>('SELECT 1 + 1 AS v')).toEqual({ v: 2 });
    db.close();
  });

  it('auto falls back when the native binding fails to load', () => {
    const broken = class {
      constructor() {
        throw new Error('Could not locate the bindings file');
      }
    };
    const db = openDb({ path: ':memory:', loadBetterSqlite3: () => broken });
    expect(db.driver).toBe('node:sqlite');
    db.close();
  });

  it('a forced better-sqlite3 driver does not silently fall back', () => {
    expect(() =>
      openDb({
        path: ':memory:',
        driver: 'better-sqlite3',
        loadBetterSqlite3: () => {
          throw new Error('missing');
        },
      }),
    ).toThrow('missing');
  });
});

describe.each(drivers)('Db on %s', (driver) => {
  const setup = () => {
    const db = openDb({ path: ':memory:', driver });
    db.exec('CREATE TABLE item (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, qty INTEGER NOT NULL DEFAULT 0) STRICT');
    return db;
  };

  it('reports its driver', () => {
    expect(setup().driver).toBe(driver);
  });

  it('runs, gets and lists with positional and named parameters', () => {
    const db = setup();
    const r = db.run('INSERT INTO item (name, qty) VALUES (?, ?)', ['pen', 2]);
    expect(r).toEqual({ changes: 1, lastInsertRowid: 1 });
    db.run('INSERT INTO item (name, qty) VALUES (:name, :qty)', { name: 'book', qty: 5 });
    expect(db.get('SELECT name, qty FROM item WHERE name = ?', ['book'])).toEqual({ name: 'book', qty: 5 });
    expect(db.all<{ name: string }>('SELECT name FROM item ORDER BY id').map((x) => x.name)).toEqual(['pen', 'book']);
    expect(db.get('SELECT * FROM item WHERE id = 99')).toBeUndefined();
  });

  it('rolls back a failed transaction', () => {
    const db = setup();
    expect(() =>
      db.transaction(() => {
        db.run('INSERT INTO item (name) VALUES (?)', ['a']);
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(db.get('SELECT count(*) AS n FROM item')).toEqual({ n: 0 });
  });

  it('turns nested transactions into savepoints', () => {
    const db = setup();
    db.transaction(() => {
      db.run('INSERT INTO item (name) VALUES (?)', ['outer']);
      expect(() =>
        db.transaction(() => {
          db.run('INSERT INTO item (name) VALUES (?)', ['inner']);
          throw new Error('inner fails');
        }),
      ).toThrow('inner fails');
    });
    expect(db.all<{ name: string }>('SELECT name FROM item').map((x) => x.name)).toEqual(['outer']);
  });

  it('recognises constraint violations the same way', () => {
    const db = setup();
    db.run('INSERT INTO item (name) VALUES (?)', ['dup']);
    let caught: unknown;
    try {
      db.run('INSERT INTO item (name) VALUES (?)', ['dup']);
    } catch (err) {
      caught = err;
    }
    expect(isConstraintError(caught, 'UNIQUE')).toBe(true);
    expect(isConstraintError(caught, 'NOTNULL')).toBe(false);
    expect(isConstraintError(new Error('other'))).toBe(false);
  });

  it('enforces foreign keys', () => {
    const db = setup();
    db.exec('CREATE TABLE child (id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL REFERENCES item(id)) STRICT');
    let caught: unknown;
    try {
      db.run('INSERT INTO child (item_id) VALUES (?)', [42]);
    } catch (err) {
      caught = err;
    }
    expect(isConstraintError(caught, 'FOREIGNKEY')).toBe(true);
  });
});
