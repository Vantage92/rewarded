// Mock-mode handlers for the focus engine, login and onboarding (WP-7 mock client, ?api=mock).
// A small in-memory server: a session runs on the browser clock, heartbeats rotate the nonce and
// the end gives the planned minutes as points. Validated against contracts by the mock client.
// Integration wave: before this file the session routes in mock mode only returned static examples.
import { mockError, type MockHandlers } from '@rewarded/contracts';

const ulid = (n: number) => `01JF${String(n).padStart(22, '0')}`;
let seq = 100;
let nonceSeq = 0;
const nonce = () => `mocknonce${String(++nonceSeq).padStart(12, '0')}`;

interface MockSession {
  id: string;
  plannedMin: number;
  practice: boolean;
  startAt: number;
  nonce: string;
  status: 'active' | 'completed' | 'aborted';
}
const sessions = new Map<string, MockSession>();
let countedToday = 0;

const own = (id: unknown): MockSession => {
  const s = sessions.get(String(id));
  if (!s) throw mockError('NOT_FOUND');
  return s;
};

export const handlers: MockHandlers = {
  'devices.register': () => ({ device_id: ulid(1) }),
  'sessions.start': ({ body }) => {
    const b = body as { planned_min: number; practice: boolean };
    const running = [...sessions.values()].find((s) => s.status === 'active');
    if (running) {
      running.nonce = nonce();
      return { session_id: running.id, nonce: running.nonce, server_start_at: new Date(running.startAt).toISOString(), planned_end_at: new Date(running.startAt + running.plannedMin * 60_000).toISOString(), heartbeat_s: 30, resumed: true };
    }
    const s: MockSession = { id: ulid(++seq), plannedMin: b.planned_min, practice: b.practice, startAt: Date.now(), nonce: nonce(), status: 'active' };
    sessions.set(s.id, s);
    return { session_id: s.id, nonce: s.nonce, server_start_at: new Date(s.startAt).toISOString(), planned_end_at: new Date(s.startAt + s.plannedMin * 60_000).toISOString(), heartbeat_s: 30 };
  },
  'sessions.heartbeat': ({ params }) => {
    const s = own(params.id);
    if (s.status !== 'active') throw mockError('SESSION_CLOSED', { verdict: { status: s.status } });
    s.nonce = nonce();
    return { nonce: s.nonce, server_now: new Date().toISOString(), status: 'active' };
  },
  'sessions.events': ({ params }) => ({ status: own(params.id).status }),
  'sessions.end': ({ params }) => {
    const s = own(params.id);
    s.status = 'completed';
    const points = s.practice ? 0 : Math.min(s.plannedMin, 300 - countedToday);
    if (!s.practice) countedToday += s.plannedMin;
    return {
      status: 'completed', verified_min: s.practice ? 0 : s.plannedMin, counted_min: s.practice ? 0 : s.plannedMin, points,
      points_status: s.practice ? 'none' : 'available', flagged: false, goal_met: countedToday >= 25, streak: 4, earn_in_progress_min: Math.max(0, 300 - countedToday),
    };
  },
  'sessions.stop': ({ params }) => {
    const s = own(params.id);
    s.status = 'aborted';
    return { status: 'aborted', abort_reason: 'user_stop', elapsed_s: Math.round((Date.now() - s.startAt) / 1000) };
  },
  'sessions.active': () => ({}),
  'me.today': () => ({
    focus_day: new Date().toISOString().slice(0, 10), counted_min: countedToday, goal_min: 25, goal_met: countedToday >= 25, goal_days_this_week: 2,
    exam_day: false, joker_available: true, bonus_rule: 'A', earn_arm: 'earn', streak: 4,
  }),
};
