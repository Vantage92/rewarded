// One API process per Playwright worker (architecture §11 "Parallelle workers"): its own port
// (4100 + worker index), its own SQLite file and its own dev clock, so time travel in one worker
// never moves another. The process is the real dev entry (server.dev.ts) with the dev module.
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../../apps/api/src/db/open.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { DEV_PEPPERS, DevClock } from '../../apps/api/src/platform/dev.ts';
import { HmacHasher } from '../../apps/api/src/platform/system.ts';
import { seedEmpty } from '../../tooling/seed/index.ts';
import { Actor, networkInbox, networkTransport, type InboxReader } from '../../tooling/seed/driver.ts';
import type { SimClock, World } from '../../tooling/seed/flows.ts';

export const REPO = fileURLToPath(new URL('../..', import.meta.url));
export const API_BASE_PORT = 4100;

export interface WorkerApi {
  port: number;
  /** http://localhost:<port>/api/v1 */
  base: string;
  dbPath: string;
  world: World;
  inbox: InboxReader;
  newActor(ip: string, userAgent?: string): Actor;
  /** Empties the database; `demo` runs the demo seed in the server (about 15 s). */
  reset(seed?: 'demo' | 'empty'): Promise<void>;
  /** Server time in ms. */
  now(): Promise<number>;
  setClock(ms: number): Promise<number>;
  runJob(job: 'day_close' | 'week_open' | 'week_close' | 'hourly' | 'reminders', runKey?: string): Promise<string>;
  /** Read-only SQL against the worker database (assertions on rows no route shows). */
  sql<T>(query: string, args?: unknown[]): T[];
  stop(): Promise<void>;
}

async function waitFor(url: string, ms: number): Promise<void> {
  const until = Date.now() + ms;
  for (;;) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > until) throw new Error(`API did not start: ${url}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export async function startWorkerApi(workerIndex: number): Promise<WorkerApi> {
  const port = API_BASE_PORT + workerIndex;
  const dir = join(REPO, 'e2e/.output/api', `worker-${workerIndex}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'secrets'), { recursive: true });
  const dbPath = join(dir, 'rewarded.sqlite');
  const child: ChildProcess = spawn(process.execPath, ['apps/api/src/server.dev.ts'], {
    cwd: REPO,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: dbPath,
      // An empty secrets dir: the server uses the fixed dev peppers, like the specs below.
      REWARDED_SECRETS_DIR: join(dir, 'secrets'),
      TRUST_PROXY: '1',
      APP_ORIGIN: 'http://localhost:5173',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => {
    stderr = (stderr + d.toString()).slice(-4000);
  });
  const base = `http://localhost:${port}/api/v1`;
  try {
    await waitFor(`${base}/health`, 30_000);
  } catch (e) {
    child.kill();
    throw new Error(`${(e as Error).message}\n${stderr}`);
  }
  const db: Db = openDb({ path: dbPath, driver: 'better-sqlite3' });
  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const r = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173', Cookie: 'rw_csrf=e2e-dev-token-000000', 'X-CSRF-Token': 'e2e-dev-token-000000' }, body: JSON.stringify(body) });
    const text = await r.text();
    if (!r.ok) throw new Error(`${path}: ${r.status} ${text}`);
    return JSON.parse(text) as T;
  };
  let now = 0;
  const clock: SimClock = {
    now: () => now,
    set: async (ms) => {
      now = Date.parse((await post<{ now: string }>('/dev/clock', { set: new Date(ms).toISOString() })).now);
    },
  };
  const transport = networkTransport(base);
  const inbox = networkInbox(base);
  let actors = 0;
  const api: WorkerApi = {
    port,
    base,
    dbPath,
    inbox,
    world: { transport, inbox, clock },
    newActor: (ip, userAgent) => new Actor(transport, { ip, label: `w${workerIndex}a${++actors}`, ...(userAgent ? { userAgent } : {}) }),
    async reset(seed = 'empty') {
      await post('/dev/reset', seed === 'demo' ? { seed: 'demo' } : {});
      if (seed === 'empty') {
        // The dev route resets without a seed; `empty` (only the admins) is written here, with
        // the server's dev peppers and TOTP key (tooling/seed/admins.ts).
        const c = new DevClock(new Date(await api.now()));
        seedEmpty({ db, clock: c, hasher: new HmacHasher(DEV_PEPPERS) });
      }
      now = await api.now();
    },
    async now() {
      const r = await post<{ now: string }>('/dev/clock', { advance_ms: 0 });
      now = Date.parse(r.now);
      return now;
    },
    async setClock(ms) {
      await clock.set(ms);
      return now;
    },
    async runJob(job, runKey) {
      return (await post<{ status: string }>(`/dev/jobs/${job}/run`, runKey ? { run_key: runKey } : {})).status;
    },
    sql: <T>(query: string, args: unknown[] = []) => db.all<T>(query, args as never),
    async stop() {
      db.close();
      child.kill();
      await new Promise((r) => child.once('exit', r));
    },
  };
  return api;
}
