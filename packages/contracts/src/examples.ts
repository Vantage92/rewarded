// Example requests and responses per route. The mock client answers with these by default and the
// contract tests check that each one passes its schema (architecture §11 "Contract").
import type { RouteInput, RouteOutput } from './route.ts';
import type { RouteId, Routes } from './routes.ts';

/** Deterministic example ULIDs. */
export const exampleId = (n: number): string => `01JC${String(n).padStart(22, '0')}`;
const T0 = '2026-12-02T09:00:00.000Z';
const T25 = '2026-12-02T09:25:00.000Z';
const NONCE = 'n0nce-AAAAAAAAAAAAAAAA';
const TOKEN = 'tok_AAAAAAAAAAAAAAAAAAAAAA';
const flags = {
  referral: false,
  cards: true,
  duels: true,
  belofte: false,
  arm_b: true,
  rest_period: false,
  squad_prompt: true,
  no_points_mode: false,
  plus_door: true,
  reminders: true,
  draws: false,
};
const settings = { compare_opt_in: false, silent_mode: false, squad_name_on_cards: true, no_points_mode: false, email_reminders: true, locale: 'nl' as const };
const user = {
  id: exampleId(1),
  first_name: 'Mila',
  last_name: null,
  email: 'mila@example.org',
  locale: 'nl' as const,
  is_team: false,
  is_admin: false,
  daily_goal_min: 50,
  phone_verified: false,
  institution_domain: null,
  research_opted_out: false,
  created_at: T0,
};
const invite = { id: exampleId(20), token: TOKEN, url: `/i/${TOKEN}`, source: 'squad' as const, max_uses: 5, uses: 1, expires_at: '2026-12-09T09:00:00.000Z' };
const squad = { id: exampleId(10), name: 'Bieb Brigade', name_status: 'ok' as const, club_id: null, status: 'active' as const, is_admin: true, created_at: T0 };
const session = {
  id: exampleId(30),
  planned_min: 25 as const,
  is_practice: false,
  status: 'completed' as const,
  focus_day: '2026-12-02',
  server_start_at: T0,
  planned_end_at: T25,
  server_end_at: T25,
  verified_min: 25,
  counted_min: 25,
  late_start: false,
  review_status: 'none' as const,
};

type ResponseExamples = { [K in RouteId]?: RouteOutput<Routes[K]> };
type RequestExamples = { [K in RouteId]?: Omit<RouteInput<Routes[K]>, 'signal'> };

export const responseExamples = {
  'auth.magicLink': {},
  'auth.confirm': { next: '/onboarding' },
  'auth.code': { next: '/' },
  'me.get': { user, age_band: '18_plus', settings, squad: { id: squad.id, name: squad.name, status: 'active' }, flags, onboarding_complete: true },
  'me.onboarding': {
    user,
    assignment: { unit: 'solo', arm_bonus: 'A', arm_belofte: 'early', arm_rest: 'continue', arm_prompt: 'standard', block: 'b-0001' },
  },
  'me.settings': { settings },
  'me.researchOptOut': { opted_out_at: T0, effective_from_day: '2026-12-03' },
  'me.today': {
    focus_day: '2026-12-02',
    counted_min: 25,
    goal_min: 50,
    goal_met: false,
    goal_days_this_week: 2,
    exam_day: false,
    joker_available: true,
    bonus_rule: 'A',
    earn_arm: 'earn',
    streak: 4,
  },
  'me.dailyGoal': { goal_min: 50, effective_from_day: '2026-12-03' },
  'me.examDays.put': { exam_days_this_week: ['2026-12-03'] },
  'points.balance': { available: 120, pending: 25, referral_unvested: 0, earn_in_min: 180, earn_in_required: 300 },
  'points.ledger': {
    items: [{ type: 'earn_session', amount: 25, status: 'available', ref: exampleId(30), created_at: T25 }],
    next_cursor: null,
  },
  'phone.start': { expires_at: '2026-12-02T09:10:00.000Z' },
  'phone.confirm': { verified: true },
  'devices.register': { device_id: exampleId(40) },
  'sessions.start': { session_id: exampleId(30), nonce: NONCE, server_start_at: T0, planned_end_at: T25, heartbeat_s: 30 },
  'sessions.heartbeat': { nonce: NONCE, server_now: '2026-12-02T09:00:30.000Z', status: 'active' },
  'sessions.events': { status: 'active' },
  'sessions.end': {
    status: 'completed',
    verified_min: 25,
    counted_min: 25,
    points: 25,
    points_status: 'available',
    flagged: false,
    goal_met: false,
    streak: 4,
    earn_in_progress_min: 205,
  },
  'sessions.stop': { status: 'aborted', abort_reason: 'user_stop', elapsed_s: 612 },
  'sessions.active': {},
  'sessions.get': { session, explanation_key: 'focus.result.completed', review_status: 'none' },
  'sessions.list': { items: [session], next_cursor: null },
  'sessions.report': { flag_id: exampleId(50) },
  'catalog.list': {
    items: [
      {
        id: exampleId(60),
        kind: 'in_kind',
        collective: true,
        title: 'Koffie voor je squad',
        partner: 'Studievereniging',
        points_price: 400,
        stock_today: 3,
        terms: 'Geldig tot en met 31 januari.',
      },
    ],
  },
  'redemptions.create': { redemption_id: exampleId(70), voucher_code: 'KOFFIE-1234', points: 400, points_from_referral: 0 },
  'redemptions.list': {
    items: [
      { id: exampleId(70), reward_id: exampleId(60), title: 'Koffie voor je squad', partner: 'Studievereniging', voucher_code: 'KOFFIE-1234', points: 400, status: 'delivered', created_at: T0 },
    ],
  },
  'redemptions.broken': { ticket_id: exampleId(80) },
  'invites.preview': { source: 'squad', inviter_first_name: 'Mila', squad_name: 'Bieb Brigade', valid: true },
  'invites.accept': { squad: { id: squad.id, name: squad.name } },
  'squads.create': { squad, invite },
  'squads.mine': {
    squad,
    members: [
      { first_name: 'Mila', paused: false, goal_met_today: true },
      { first_name: 'Sem', paused: false, goal_met_today: false },
      { first_name: 'Noor', paused: true, goal_met_today: false },
    ],
    streak: 4,
    status: 'active',
  },
  'squads.presence': { members: [{ member_ref: 'mref-0001', focusing: true, remaining_min: 12 }], polled_at: T0 },
  'squads.compare': { members: [{ first_name: 'Mila', minutes_today: 50, minutes_week: 240 }] },
  'squads.beloftes': { items: [] },
  'squads.invite': { invite },
  'duels.current': {
    duel: { id: exampleId(90), status: 'running', in_squad: true, start_day: '2026-12-07', end_day: '2026-12-13', opponent_first_name: 'Sem' },
    days: [{ day: '2026-12-07', me_met: true, opponent_met: false }],
    me_total: 1,
    opponent_total: 0,
  },
  'clubs.join': {
    club: { id: exampleId(100), name: 'SV Delta', city: 'Utrecht', declared_members: 420, members_source_kind: 'institution', prize_eligible: true, pool: '150_500' },
    status: 'linked',
  },
  'leaderboards.get': {
    pools: [
      {
        pool: '150_500',
        rows: [{ club_name: 'SV Delta', declared_members: 420, members_source_kind: 'institution', prize_eligible: true, participation_rate: 0.31, intensity_min: 42.5, rank: 1 }],
      },
    ],
    is_final: false,
    computed_at: T0,
  },
  'challenges.list': {
    items: [{ id: exampleId(110), type: 'club_warmup', title: 'Aanloopklassement', period: { start_day: '2026-12-02', end_day: '2026-12-20' }, prize: null }],
  },
  'belofte.offer': {},
  'cards.create': { card_id: exampleId(120), token: TOKEN, image_url: `/api/v1/cards/${exampleId(120)}/image` },
  'verify.get': {
    first_name: 'Mila',
    duration_min: 50,
    from: '2026-12-02',
    to: '2026-12-02',
    statement_key: 'cards.verify.statement',
    focus_ook_url: '/wachtlijst?source=card',
  },
  'referral.mine': { pending: [] },
  'surveys.due': {},
  'appeals.create': { appeal_id: exampleId(130) },
  'privacy.deleteMe': { deleted_at: T0 },
  'waitlist.join': {},
} satisfies ResponseExamples;

export const requestExamples = {
  'waitlist.join': { body: { email: 'mila@example.org', locale: 'nl', source: 'landing', consent_version: 'w1' }, idempotencyKey: 'k-1' },
  'auth.magicLink': { body: { email: 'mila@example.org', locale: 'nl' } },
  'auth.confirm': { body: { token: TOKEN } },
  'auth.code': { body: { email: 'mila@example.org', code: '123456' } },
  'me.onboarding': {
    body: { first_name: 'Mila', birth_date: '2006-05-01', terms_version: 't1', privacy_version: 'p1', research_info_version: 'r1', daily_goal_min: 50 },
  },
  'me.settings': { body: { compare_opt_in: true } },
  'me.researchOptOut': { body: { confirm: true } },
  'me.dailyGoal': { body: { minutes: 75, confirm_overreach: true } },
  'me.examDays.put': { params: { day: '2026-12-03' } },
  'phone.start': { body: { phone: '+31612345678' } },
  'phone.confirm': { body: { code: '123456' } },
  'devices.register': { body: { client_device_id: '7f3c2a8e-1b4d-4c6e-9a0f-2d5b8c1e3f47', ua_class: 'android_chrome', standalone: true, wakelock_supported: true } },
  'sessions.start': {
    body: { planned_min: 25, device_id: exampleId(40), practice: false, client_ts: 1764666000000, mono_ms: 1234.5, webdriver: false, standalone: true },
    idempotencyKey: 'start-1',
  },
  'sessions.heartbeat': {
    params: { id: exampleId(30) },
    body: {
      nonce: NONCE,
      seq: 1,
      mono_ms: 31234.5,
      client_ts: 1764666030000,
      visibility: 'visible',
      wakelock: 'acquired',
      events: [{ type: 'visibility', ev_seq: 1, kind: 'wakelock_acquired', mono_ms: 1300, client_ts: 1764666000100 }],
    },
  },
  'sessions.events': {
    params: { id: exampleId(30) },
    body: { csrf: 'csrf-token-AAAAAAAA', last_nonce: NONCE, events: [{ type: 'visibility', ev_seq: 2, kind: 'hidden', mono_ms: 600000, client_ts: 1764666600000 }] },
  },
  'sessions.end': { params: { id: exampleId(30) }, body: { nonce: NONCE, mono_ms: 1501234.5, client_ts: 1764667500000, events: [] } },
  'sessions.stop': { params: { id: exampleId(30) }, body: { nonce: NONCE } },
  'sessions.list': { query: { from: '2026-12-01', to: '2026-12-07' } },
  'sessions.report': { params: { id: exampleId(30) }, body: { text: 'Mijn wifi viel weg.' } },
  'redemptions.create': { body: { reward_id: exampleId(60) }, idempotencyKey: 'redeem-1' },
  'redemptions.broken': { params: { id: exampleId(70) }, body: {} },
  'invites.preview': { params: { token: TOKEN } },
  'squads.create': { body: { name: 'Bieb Brigade' }, idempotencyKey: 'squad-1' },
  'squads.patch': { body: { name: 'Bieb Brigade 2' } },
  'squads.nameReport': { params: { id: exampleId(10) }, body: { reason: 'offensive' } },
  'duels.create': { body: {} },
  'clubs.join': { body: { code: 'DELTA26', qr_source: 'poster_bieb' } },
  'board.dashboard': { params: { id: exampleId(100) }, query: { tab: 'stand' } },
  'challenges.enroll': { params: { id: exampleId(110) }, idempotencyKey: 'enroll-1' },
  'beloftes.create': { body: { days_per_week: 5, min_per_day: 50, witnesses: 'squad' } },
  'beloftes.reflection': { params: { id: exampleId(140) }, body: { action: 'extend', stake_interest: 'unsure' } },
  'cards.create': { body: { kind: 'session', ref_id: exampleId(30), fields: { first_name: true, duration: true } } },
  'events.track': { body: { name: 'catalog_viewed', props: { items_zichtbaar: 4, saldo: 120, inverdiend: false } } },
  'appeals.create': { body: { object_type: 'flag', object_id: exampleId(50), text: 'Ik zat echt te leren.' } },
  'institution.start': { body: { email: 'm.devries@students.uu.nl' } },
  'privacy.deleteMe': { body: { confirm: 'VERWIJDER' } },
  'admin.flags.decide': { params: { id: exampleId(50) }, body: { decision: 'release', reason_code: 'evidence_ok', note: '' } },
  'admin.sessions.restore': { params: { id: exampleId(30) }, body: { reason_code: 'outage', note: 'Storing 9:10-9:20' } },
  'admin.featureFlags.put': { params: { key: 'arm_b' }, body: { enabled: false } },
  'admin.rewards.publish': { params: { id: exampleId(60) }, body: { cash_check: true } },
  'dev.clock': { body: { advance_ms: 3600000 } },
  'surveys.answer': { params: { moment: 'intake' }, body: { items: [{ code: 'G1', answer: 'agree' }], skipped: false } },
} satisfies RequestExamples;
