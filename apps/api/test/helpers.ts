import { createApp } from '../src/app.ts';
import { openDb } from '../src/db/open.ts';
import type { DriverName } from '../src/db/types.ts';
import type { ApiModule } from '../src/module.ts';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../src/platform/dev.ts';
import { HmacHasher } from '../src/platform/system.ts';
import { createServices } from '../src/services/index.ts';

/** App with an in-memory database and the dev platform. */
export function testApp(modules: readonly ApiModule[], driver: DriverName = 'better-sqlite3') {
  const clock = new DevClock(new Date('2026-11-05T09:00:00Z'));
  const inbox = new DevInbox(clock);
  const db = openDb({ path: ':memory:', driver });
  const app = createApp({
    modules,
    deps: {
      db,
      platform: {
        clock,
        random: new SeededRandom(1),
        mailer: new DevMailer(inbox, false),
        sms: new DevSmsSender(inbox, false),
        hasher: new HmacHasher(DEV_PEPPERS),
      },
      services: createServices(),
    },
  });
  return { app, db, clock, inbox };
}
