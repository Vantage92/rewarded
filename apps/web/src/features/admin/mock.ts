// Mock handlers for the admin environment (mock mode, component tests). Stateful and in memory:
// decisions change the queue, four eyes is enforced per acting admin (switchable in mock mode),
// a result is final only after the prize sample. Responses are validated by the contracts mock.
import type {
  AdminAppeal,
  AdminChallenge,
  AdminClub,
  AdminFlag,
  AdminReward,
  AdminUserSummary,
  Ambassador,
  AuditEntryDto,
  Budget,
  FeatureFlagKey,
  MockHandlers,
  Partner,
  SampleItem,
  SessionDto,
  SupportTicket,
  WaitlistPriority,
} from '@rewarded/contracts';
import { mockError } from '@rewarded/contracts/mock';

/** Valid ULID made of digits (Crockford base32 allows them). */
export const mockId = (n: number) => `01JD${String(n).padStart(22, '0')}`;

export const MOCK_ADMINS = ['admin_anna_01', 'admin_bram_02', 'admin_cato_03'] as const;

export interface MockFlagFeatureState {
  enabled: boolean;
  pending: boolean;
  requestedBy: string | null;
}

export interface AdminMockState {
  actor: string;
  mfaVerified: boolean;
  mfaEnrolled: boolean;
  seq: number;
  flags: AdminFlag[];
  appeals: AdminAppeal[];
  sessions: Map<string, MockSession>;
  clubs: AdminClub[];
  pendingLinks: Map<string, { user_ref: string; first_name: string; linked_at: string; qr_source: string | null }[]>;
  partners: Partner[];
  budgets: Budget[];
  rewards: AdminReward[];
  vouchers: Map<string, Set<string>>;
  challenges: Map<string, AdminChallenge>;
  sample: { id: string; week_key: string; kind: 'weekly' | 'prize'; items: SampleItem[] };
  waitlist: { priority_reason: WaitlistPriority; waiting: number; groups: number; invited: number; oldest_at: string | null }[];
  audit: AuditEntryDto[];
  users: AdminUserSummary[];
  featureFlags: Record<FeatureFlagKey, MockFlagFeatureState>;
  armBStop: { requestedBy: string | null; confirmed: boolean };
  pendingDeletes: Map<string, string>;
  vacation: { start_day: string; end_day: string } | null;
  support: SupportTicket[];
  ambassadors: Ambassador[];
  outlay: { booked: number; allocated: number; outstanding_points: number; value_per_point_milli: number };
}

const now = () => new Date().toISOString();

type AbortCode = 'hidden' | 'heartbeat_gap' | 'user_stop' | 'second_session' | 'late_end';
export type MockSession = SessionDto & { abort_reason: AbortCode | null; user_ref: string };

function session(n: number, o: Partial<SessionDto> & { abort_reason?: AbortCode; user_ref: string }): MockSession {
  const start = o.server_start_at ?? '2026-11-03T13:00:00.000Z';
  return {
    id: mockId(n),
    planned_min: o.planned_min ?? 50,
    is_practice: false,
    status: o.status ?? 'completed',
    focus_day: o.focus_day ?? '2026-11-03',
    server_start_at: start,
    planned_end_at: o.planned_end_at ?? '2026-11-03T13:50:00.000Z',
    server_end_at: o.server_end_at ?? '2026-11-03T13:50:00.000Z',
    verified_min: o.verified_min ?? 50,
    counted_min: o.counted_min ?? 50,
    late_start: false,
    review_status: o.review_status ?? 'pending',
    abort_reason: o.abort_reason ?? null,
    user_ref: o.user_ref,
  };
}

function initialState(o: Partial<Pick<AdminMockState, 'mfaVerified' | 'mfaEnrolled'>> = {}): AdminMockState {
  const sessions = new Map<string, MockSession>();
  const s1 = session(301, { user_ref: 'user_mila_0001', review_status: 'pending' });
  const s2 = session(302, { user_ref: 'user_daan_0002', status: 'aborted', abort_reason: 'heartbeat_gap', verified_min: 31, counted_min: 0, review_status: 'none', server_end_at: '2026-11-03T13:31:00.000Z' });
  const s3 = session(303, { user_ref: 'user_sem_00003', review_status: 'pending', focus_day: '2026-11-04', server_start_at: '2026-11-04T02:10:00.000Z', planned_end_at: '2026-11-04T03:40:00.000Z', server_end_at: '2026-11-04T03:40:00.000Z', planned_min: 90, verified_min: 90, counted_min: 90 });
  for (const s of [s1, s2, s3]) sessions.set(s.id, s);
  const evidence = (s: MockSession) => ({
    session_id: s.id,
    user_ref: s.user_ref,
    focus_day: s.focus_day,
    planned_min: s.planned_min,
    status: s.status,
    abort_reason: s.abort_reason,
    review_status: s.review_status,
    net_class: 'other' as const,
    server_start_at: s.server_start_at,
  });
  const flag = (n: number, code: AdminFlag['code'], s: MockSession, ev: Record<string, unknown>, created: string): AdminFlag => ({
    id: mockId(n),
    code,
    subject_type: 'session',
    subject_ref: s.user_ref,
    status: 'open',
    evidence: ev,
    sessions: [evidence(s)],
    created_at: created,
    decided_by_ref: null,
    decided_at: null,
    block_confirmed_by_ref: null,
    reason_code: null,
  });
  const prizeSpec = (n: number, kind: 'earned_collective' | 'earned_individual', rank: number | undefined, value: number) => ({
    prize_id: mockId(n),
    kind,
    reward_kind: 'in_kind' as const,
    description_nl: kind === 'earned_collective' ? 'Borrel voor de vereniging' : 'Workshop plannen',
    description_en: kind === 'earned_collective' ? 'Drinks for the association' : 'Planning workshop',
    value_cents: value,
    partner_id: mockId(401),
    budget_id: mockId(501),
    declaration_ref: 'verklaring-2026-11-borrel',
    min_age_band: '16_17' as const,
    ...(rank !== undefined ? { rank } : {}),
  });
  const challenge: AdminChallenge = {
    id: mockId(110),
    type: 'club_prize',
    title_nl: 'Blokchallenge januari',
    title_en: 'Exam challenge January',
    period_start_day: '2027-01-04',
    period_end_day: '2027-01-17',
    pool: '150_500',
    rules: { threshold_rate: 0.25 },
    status: 'review',
    prizes: [prizeSpec(601, 'earned_collective', 1, 15000), prizeSpec(602, 'earned_collective', undefined, 7500)],
    proposed_by_ref: null,
    final_by_ref: null,
    final_confirmed_by_ref: null,
  };
  const club = (n: number, name: string, members: number, kind: AdminClub['members_source_kind'], pool: AdminClub['pool'], agreement: string | null): AdminClub => ({
    id: mockId(n),
    name,
    city: 'Demostad',
    declared_members: members,
    members_source_kind: kind,
    prize_eligible: kind !== 'self',
    pool,
    members_source_ref: kind === 'self' ? 'eigen opgave' : `erkenning-${n}`,
    members_fixed_at: null,
    agreement_ref: agreement,
    join_code: agreement ? `DEMO${n}` : null,
    code_cap: Math.floor(members * 1.1),
    status: agreement ? 'active' : 'draft',
    help_resources: [{ label: 'Studentendecaan', url: 'https://example.org/decaan' }],
    board_member_refs: ['board_lotte_0001'],
  });
  const item = (n: number, ref: string, stratum: string): SampleItem => ({ id: mockId(n), user_ref: ref, stratum, checks: { anchor: 'institution', line_type: 'mobile', h12: false }, judgement: 'none', reason_code: null, judged_at: null });
  return {
    actor: MOCK_ADMINS[0],
    mfaVerified: o.mfaVerified ?? false,
    mfaEnrolled: o.mfaEnrolled ?? true,
    seq: 1000,
    flags: [
      flag(50, 'H1', s1, { webdriver: true }, '2026-11-03T14:00:00.000Z'),
      flag(51, 'USER_REPORT', s2, { report: 'met_tekst', abort_reason: 'heartbeat_gap' }, '2026-11-03T14:05:00.000Z'),
      flag(52, 'H6', s3, { night_window: '01:00-06:00' }, '2026-11-04T05:00:00.000Z'),
    ],
    appeals: [
      {
        id: mockId(80),
        object_type: 'flag',
        object_id: mockId(49),
        user_ref: 'user_noor_0004',
        text: 'Ik zat echt in de UB, mijn wifi viel weg.',
        status: 'open',
        submitted_at: '2026-11-02T10:00:00.000Z',
        due_at: '2026-11-09T10:00:00.000Z',
        waiting_for_third: false,
        outcome: null,
        motivation: null,
      },
    ],
    sessions,
    clubs: [club(100, 'Studievereniging Delta', 240, 'institution', '150_500', 'overeenkomst-delta-2026'), club(101, 'Vereniging Epsilon', 90, 'self', 'lt150', null)],
    pendingLinks: new Map([[mockId(100), [{ user_ref: 'user_ruby_0005', first_name: 'Ruby', linked_at: '2026-11-04T09:00:00.000Z', qr_source: 'poster_bieb' }]]]),
    partners: [{ id: mockId(401), name: 'Boekhandel Demostad', kind: 'sponsor', contact_ref: 'contract-2026-11' }],
    budgets: [],
    rewards: [],
    vouchers: new Map(),
    challenges: new Map([[challenge.id, challenge]]),
    sample: { id: mockId(700), week_key: '2027-W03', kind: 'prize', items: [item(701, 'user_mila_0001', mockId(100)), item(702, 'user_sem_00003', mockId(100)), item(703, 'user_ruby_0005', mockId(100))] },
    waitlist: [
      { priority_reason: 'group', waiting: 12, groups: 4, invited: 6, oldest_at: '2026-11-01T08:00:00.000Z' },
      { priority_reason: 'club', waiting: 5, groups: 0, invited: 0, oldest_at: '2026-11-02T08:00:00.000Z' },
      { priority_reason: 'card', waiting: 2, groups: 0, invited: 0, oldest_at: '2026-11-03T08:00:00.000Z' },
      { priority_reason: 'none', waiting: 7, groups: 0, invited: 0, oldest_at: '2026-11-03T12:00:00.000Z' },
    ],
    audit: [
      { id: mockId(900), actor_ref: MOCK_ADMINS[1], action: 'flag_view', object_type: 'fraud_flag', object_ref: mockId(50), reason: null, at: '2026-11-04T08:00:00.000Z', net_class: 'other' },
    ],
    users: [
      { id: mockId(1), first_name: 'Mila', email: 'mila@example.org', age_band: '18_plus', status: 'active', is_team: false, created_at: '2026-11-01T10:00:00.000Z' },
      { id: mockId(2), first_name: 'Daan', email: 'daan@example.org', age_band: '16_17', status: 'active', is_team: false, created_at: '2026-11-01T11:00:00.000Z' },
    ],
    featureFlags: Object.fromEntries(
      (['referral', 'cards', 'duels', 'belofte', 'arm_b', 'rest_period', 'squad_prompt', 'no_points_mode', 'plus_door', 'reminders', 'draws'] as const).map((k) => [
        k,
        { enabled: ['cards', 'duels', 'belofte', 'arm_b', 'squad_prompt'].includes(k), pending: false, requestedBy: null },
      ]),
    ) as Record<FeatureFlagKey, MockFlagFeatureState>,
    armBStop: { requestedBy: null, confirmed: false },
    pendingDeletes: new Map(),
    vacation: { start_day: '2026-12-21', end_day: '2027-01-03' },
    support: [
      { id: mockId(810), user_ref: 'user_mila_0001', kind: 'redemption_broken', ref_id: mockId(70), text: 'De code werkt niet bij de kassa.', label: 'uitbetalen', status: 'open', created_at: '2026-11-04T12:00:00.000Z' },
    ],
    ambassadors: [{ id: mockId(820), code_invite_id: mockId(821), name_ref: 'Ambassadeur Noord', is_board_member_of: null, cap_users: 50, registered: 12 }],
    outlay: { booked: 150000, allocated: 0, outstanding_points: 42000, value_per_point_milli: 25 },
  };
}

function audit(state: AdminMockState, action: string, objectType: string, objectRef: string, reason: string | null) {
  state.audit.unshift({ id: mockId(++state.seq), actor_ref: state.actor, action, object_type: objectType, object_ref: objectRef, reason, at: now(), net_class: 'other' });
}

const FLAG_RELEASE_CODES = new Set(['no_evidence', 'pattern_explained', 'shared_network', 'outage_confirmed', 'late_log_valid', 'false_positive']);
const FLAG_REJECT_CODES = new Set(['automation', 'multiple_accounts', 'shared_device', 'unattended_device', 'implausible_pattern', 'clock_manipulation', 'incomplete_evidence']);
const FLAG_BLOCK_CODES = new Set(['fraud_confirmed', 'repeat_offence', 'blocked_phone_reuse']);

function body<T>(input: { body: unknown }): T {
  return input.body as T;
}
function param(input: { params: Record<string, unknown> }, key = 'id'): string {
  return String(input.params[key]);
}

export function createAdminMock(options: Partial<Pick<AdminMockState, 'mfaVerified' | 'mfaEnrolled'>> = {}) {
  let state = initialState(options);
  const guard = () => {
    if (!state.mfaVerified) throw mockError('MFA_REQUIRED');
  };
  const findFlag = (id: string) => {
    const f = state.flags.find((x) => x.id === id);
    if (!f) throw mockError('NOT_FOUND');
    return f;
  };
  const budgetValueOutstanding = () => Math.round((state.outlay.outstanding_points * state.outlay.value_per_point_milli) / 10);
  const freeCents = () => state.budgets.reduce((s, b) => s + b.free_cents, 0);
  const challengeById = (id: string): AdminChallenge => {
    const c = state.challenges.get(id);
    if (c) return c;
    // Unknown id (e.g. from GET /challenges): start it as a published challenge without prizes.
    const fresh: AdminChallenge = {
      id,
      type: 'performance',
      title_nl: 'Challenge',
      title_en: 'Challenge',
      period_start_day: '2027-01-11',
      period_end_day: '2027-01-17',
      pool: null,
      rules: {},
      status: 'review',
      prizes: [],
      proposed_by_ref: null,
      final_by_ref: null,
      final_confirmed_by_ref: null,
    };
    state.challenges.set(id, fresh);
    return fresh;
  };
  const sampleDone = () => state.sample.items.every((i) => i.judged_at !== null);

  const handlers: MockHandlers = {
    'admin.mfa.enroll': () => {
      if (state.mfaEnrolled) throw mockError('FORBIDDEN', { reason: 'already_enrolled' });
      return { otpauth_uri: 'otpauth://totp/Rewarded:beheer?secret=JBSWY3DPEHPK3PXPJBSWY3DP&issuer=Rewarded', secret_base32: 'JBSWY3DPEHPK3PXPJBSWY3DP' };
    },
    'admin.mfa.verify': (input) => {
      const { code } = body<{ code: string }>(input);
      if (code === '000000') throw mockError('MFA_INVALID');
      state.mfaVerified = true;
      state.mfaEnrolled = true;
      return { mfa_at: now() };
    },

    // Queue, decisions, blocks, restore (spec §4.11 Fraudewachtrij, §6.4).
    'admin.flags.list': (input) => {
      guard();
      const status = input.query.status as AdminFlag['status'] | undefined;
      audit(state, 'flag_queue_view', 'fraud_flag', 'queue', null);
      return { items: state.flags.filter((f) => !status || f.status === status), next_cursor: null };
    },
    'admin.flags.decide': (input) => {
      guard();
      const f = findFlag(param(input));
      const b = body<{ decision: 'release' | 'reject' | 'block'; reason_code: string; note: string }>(input);
      const allowed = b.decision === 'release' ? FLAG_RELEASE_CODES : b.decision === 'reject' ? FLAG_REJECT_CODES : FLAG_BLOCK_CODES;
      if (!allowed.has(b.reason_code)) throw mockError('REASON_REQUIRED');
      f.status = b.decision === 'release' ? 'released' : b.decision === 'reject' ? 'rejected' : 'blocked';
      f.decided_by_ref = state.actor;
      f.decided_at = now();
      f.reason_code = b.reason_code;
      f.sessions = f.sessions.map((s) => ({ ...s, review_status: b.decision === 'release' ? 'released' : 'rejected' }));
      audit(state, `flag_${b.decision}`, 'fraud_flag', f.id, b.reason_code);
      const postings =
        b.decision === 'release'
          ? f.sessions.map((s) => ({ type: 'release_flag', amount: 50, idempotency_key: `release:${s.session_id}` }))
          : b.decision === 'reject'
            ? f.sessions.map((s) => ({ type: 'reverse', amount: -50, idempotency_key: `reverse:${s.session_id}` }))
            : [];
      return { flag: f, postings, block_pending_confirmation: b.decision === 'block' };
    },
    'admin.blocks.confirm': (input) => {
      guard();
      const f = findFlag(param(input));
      if (f.decided_by_ref === state.actor) throw mockError('SAME_REVIEWER');
      f.block_confirmed_by_ref = state.actor;
      audit(state, 'block_confirm', 'fraud_flag', f.id, body<{ note: string }>(input).note);
      return { flag: f, phone_hash_blocked: true };
    },
    'admin.sessions.restore': (input) => {
      guard();
      const s = state.sessions.get(param(input));
      if (!s) throw mockError('NOT_FOUND');
      if (s.status !== 'aborted' || s.abort_reason === 'hidden') throw mockError('SESSION_NOT_RESTORABLE');
      const b = body<{ reason_code: string; note: string }>(input);
      const restored = { ...s, status: 'completed' as const, verified_min: s.planned_min, counted_min: s.planned_min, review_status: 'none' as const, abort_reason: null };
      state.sessions.set(s.id, restored);
      for (const f of state.flags) {
        if (f.sessions.some((x) => x.session_id === s.id) && f.status === 'open') {
          f.status = 'closed';
          f.decided_by_ref = state.actor;
          f.decided_at = now();
          f.reason_code = b.reason_code === 'outage' ? 'outage_confirmed' : 'late_log_valid';
          f.sessions = f.sessions.map((x) => (x.session_id === s.id ? { ...x, status: 'completed', abort_reason: null, review_status: 'none' } : x));
        }
      }
      audit(state, 'session_restore', 'focus_session', s.id, b.reason_code);
      const { abort_reason: _a, user_ref: _u, ...dto } = restored;
      void _a;
      void _u;
      return { session: dto, verdict: { status: 'completed', verified_min: restored.verified_min, elapsed_s: restored.planned_min * 60, flagged: false }, flag_codes: [] };
    },
    'admin.outages.create': (input) => {
      guard();
      const b = body<{ from: string; to: string; note: string }>(input);
      const outage = { id: mockId(++state.seq), from: b.from, to: b.to, note: b.note, created_at: now() };
      audit(state, 'outage_create', 'outage', outage.id, b.note);
      const restorable = [...state.sessions.values()]
        .filter((s) => s.status === 'aborted' && s.abort_reason !== 'hidden' && s.abort_reason !== null)
        .map((s) => ({ session_id: s.id, user_ref: s.user_ref, focus_day: s.focus_day, abort_reason: s.abort_reason! }));
      return { outage, restorable_sessions: restorable };
    },
    'admin.appeals.list': () => {
      guard();
      return { items: state.appeals };
    },
    'admin.appeals.decide': (input) => {
      guard();
      const a = state.appeals.find((x) => x.id === param(input));
      if (!a) throw mockError('NOT_FOUND');
      if (state.actor === MOCK_ADMINS[1]) throw mockError('SAME_REVIEWER');
      const b = body<{ outcome: 'upheld' | 'rejected'; motivation: string }>(input);
      a.status = 'decided';
      a.outcome = b.outcome;
      a.motivation = b.motivation;
      audit(state, 'appeal_decide', 'appeal', a.id, b.outcome);
      return { appeal: a };
    },
    'admin.firstRedemptions': () => {
      guard();
      return {
        items: [
          { user_ref: 'user_mila_0001', first_redeem_after: '2026-11-10T03:00:00.000Z', sessions_7d: 9, pattern: { median_start_hour: 14, days: 5 }, anchor: 'both', phone_line_type: 'mobile', h11: false },
          { user_ref: 'user_ties_0006', first_redeem_after: '2026-11-11T03:00:00.000Z', sessions_7d: 7, pattern: { median_start_hour: 2, days: 7 }, anchor: 'phone', phone_line_type: 'mobile', h11: true },
        ],
      };
    },
    'admin.samples.current': () => {
      guard();
      return { sample: { ...state.sample, seed_version: 'v1', drawn_at: '2027-01-18T05:00:00.000Z' } };
    },
    'admin.samples.judge': (input) => {
      guard();
      const item = state.sample.items.find((i) => i.id === param(input, 'item'));
      if (!item) throw mockError('NOT_FOUND');
      const b = body<{ checks: Record<string, boolean>; judgement: SampleItem['judgement']; reason_code: string }>(input);
      item.checks = { ...item.checks, ...b.checks };
      item.judgement = b.judgement;
      item.reason_code = b.reason_code;
      item.judged_at = now();
      let flagId: string | null = null;
      if (b.judgement !== 'none') {
        flagId = mockId(++state.seq);
        state.flags.push({ id: flagId, code: 'SAMPLE', subject_type: 'account', subject_ref: item.user_ref, status: 'open', evidence: { judgement: b.judgement }, sessions: [], created_at: now(), decided_by_ref: null, decided_at: null, block_confirmed_by_ref: null, reason_code: null });
      }
      audit(state, 'sample_judge', 'fraud_sample_item', item.id, b.reason_code);
      return { item, flag_id: flagId };
    },

    // Clubs (spec §4.11 Verenigingen).
    'admin.clubs.list': () => {
      guard();
      return { items: state.clubs };
    },
    'admin.clubs.get': (input) => {
      guard();
      const c = state.clubs.find((x) => x.id === param(input));
      if (!c) throw mockError('NOT_FOUND');
      return { club: c };
    },
    'admin.clubs.create': (input) => {
      guard();
      const b = body<{ name: string; city: string; declared_members: number; members_source_kind: AdminClub['members_source_kind']; members_source_ref: string; agreement_ref?: string; pool?: AdminClub['pool']; help_resources?: AdminClub['help_resources']; board_member_emails?: string[] }>(input);
      const id = mockId(++state.seq);
      const pool = b.pool ?? (b.declared_members < 150 ? 'lt150' : b.declared_members <= 500 ? '150_500' : 'gt500');
      const club: AdminClub = {
        id,
        name: b.name,
        city: b.city,
        declared_members: b.declared_members,
        members_source_kind: b.members_source_kind,
        prize_eligible: b.members_source_kind !== 'self',
        pool,
        members_source_ref: b.members_source_ref,
        members_fixed_at: null,
        agreement_ref: b.agreement_ref ?? null,
        join_code: b.agreement_ref ? `C${String(state.seq).slice(-5)}` : null,
        code_cap: Math.floor(b.declared_members * 1.1),
        status: b.agreement_ref ? 'active' : 'draft',
        help_resources: b.help_resources ?? [],
        board_member_refs: (b.board_member_emails ?? []).map((_, i) => `board_${state.seq}_${i}`.padEnd(8, '0')),
      };
      state.clubs.push(club);
      audit(state, 'club_create', 'club', id, null);
      return { club };
    },
    'admin.clubs.patch': (input) => {
      guard();
      const c = state.clubs.find((x) => x.id === param(input));
      if (!c) throw mockError('NOT_FOUND');
      const b = body<Partial<AdminClub> & { fix_members?: true; agreement_ref?: string }>(input);
      if (c.members_fixed_at && b.declared_members !== undefined) throw mockError('MEMBERS_FIXED');
      if (b.declared_members !== undefined) {
        c.declared_members = b.declared_members;
        c.code_cap = Math.floor(b.declared_members * 1.1);
      }
      if (b.members_source_kind) {
        c.members_source_kind = b.members_source_kind;
        c.prize_eligible = b.members_source_kind !== 'self';
      }
      if (b.members_source_ref) c.members_source_ref = b.members_source_ref;
      if (b.agreement_ref) {
        c.agreement_ref = b.agreement_ref;
        c.join_code ??= `C${String(++state.seq).slice(-5)}`;
        c.status = 'active';
      }
      if (b.fix_members) c.members_fixed_at = now();
      audit(state, 'club_patch', 'club', c.id, null);
      return { club: c };
    },
    'admin.clubs.pendingLinks': (input) => {
      guard();
      return { items: state.pendingLinks.get(param(input)) ?? [] };
    },
    'admin.clubs.decideLink': (input) => {
      guard();
      const b = body<{ user_ref: string; decision: 'approve' | 'reject' }>(input);
      const list = state.pendingLinks.get(param(input)) ?? [];
      state.pendingLinks.set(param(input), list.filter((l) => l.user_ref !== b.user_ref));
      audit(state, `club_link_${b.decision}`, 'club', param(input), null);
      return { user_ref: b.user_ref, status: b.decision === 'approve' ? 'linked' : 'rejected' };
    },

    // Partners, budget and coverage (spec §4.3).
    'admin.partners.list': () => {
      guard();
      return { items: state.partners };
    },
    'admin.partners.create': (input) => {
      guard();
      const b = body<{ name: string; kind: Partner['kind']; contact_ref?: string }>(input);
      const partner: Partner = { id: mockId(++state.seq), name: b.name, kind: b.kind, contact_ref: b.contact_ref ?? null };
      state.partners.push(partner);
      audit(state, 'partner_create', 'partner', partner.id, null);
      return { partner };
    },
    'admin.budgets.create': (input) => {
      guard();
      const b = body<{ kind: Budget['kind']; booked_cents: number; reward_pct: number; document_ref: string; booked_at: string; pool?: Budget['pool'] }>(input);
      const reward = Math.floor((b.booked_cents * b.reward_pct) / 100);
      const budget: Budget = {
        id: mockId(++state.seq),
        partner_id: param(input),
        kind: b.kind,
        booked_cents: b.booked_cents,
        cancelled_cents: 0,
        reward_pct: b.reward_pct,
        document_ref: b.document_ref,
        booked_at: b.booked_at,
        status: 'booked',
        allocated_cents: 0,
        free_cents: reward,
        ...(b.pool ? { pool: b.pool } : {}),
      };
      state.budgets.push(budget);
      state.outlay.booked += b.booked_cents;
      audit(state, 'budget_create', 'budget', budget.id, b.document_ref);
      return { budget };
    },
    'admin.budgets.cancel': (input) => {
      guard();
      const budget = state.budgets.find((x) => x.id === param(input));
      if (!budget) throw mockError('NOT_FOUND');
      const b = body<{ cancel_cents: number; reason_code: string }>(input);
      if (b.cancel_cents > budget.free_cents) throw mockError('COVERAGE_INSUFFICIENT');
      budget.cancelled_cents += b.cancel_cents;
      budget.free_cents -= b.cancel_cents;
      if (budget.free_cents === 0 && budget.allocated_cents === 0) budget.status = 'cancelled';
      audit(state, 'budget_cancel', 'budget', budget.id, b.reason_code);
      return { budget };
    },
    'admin.budget.overview': () => {
      guard();
      const outstandingValue = budgetValueOutstanding();
      return {
        booked_cents: state.outlay.booked,
        allocated_cents: state.outlay.allocated,
        free_cents: freeCents(),
        outstanding_points: state.outlay.outstanding_points,
        outstanding_value_cents: outstandingValue,
        coverage_ratio: outstandingValue > 0 ? state.outlay.allocated / outstandingValue : null,
      };
    },

    // Catalog (spec §4.3, §4.11 Catalogus).
    'admin.rewards.create': (input) => {
      guard();
      const b = body<{ partner_id: string; kind: AdminReward['kind']; title_nl: string; title_en: string; cost_cents: number; points_price: number; min_age_band: AdminReward['min_age_band']; declaration_ref: string; collective: boolean; budget_id: string; stock: number }>(input);
      if (b.cost_cents > 500) throw mockError('CEILING_EXCEEDED');
      const reward: AdminReward = {
        id: mockId(++state.seq),
        partner_id: b.partner_id,
        kind: b.kind,
        title_nl: b.title_nl,
        title_en: b.title_en,
        cost_cents: b.cost_cents,
        points_price: b.points_price,
        min_age_band: b.min_age_band,
        declaration_ref: b.declaration_ref,
        collective: b.collective,
        status: 'draft',
        published_at: null,
        allocation_cents: b.cost_cents * b.stock,
        vouchers_total: 0,
        vouchers_available: 0,
      };
      const budget = state.budgets.find((x) => x.id === b.budget_id);
      if (budget && budget.free_cents < reward.allocation_cents) throw mockError('COVERAGE_INSUFFICIENT');
      state.rewards.push(reward);
      audit(state, 'reward_create', 'reward', reward.id, b.declaration_ref);
      return { reward };
    },
    'admin.rewards.vouchers': (input) => {
      guard();
      const reward = state.rewards.find((x) => x.id === param(input));
      if (!reward) throw mockError('NOT_FOUND');
      const codes = body<{ csv: string }>(input)
        .csv.split(/\r?\n/)
        .map((l) => l.split(',')[0]!.trim())
        .filter((c) => c && c.toLowerCase() !== 'code');
      if (!codes.length) throw mockError('VALIDATION_FAILED');
      const set = state.vouchers.get(reward.id) ?? new Set<string>();
      let imported = 0;
      let duplicates = 0;
      for (const c of codes) {
        if (set.has(c)) duplicates++;
        else {
          set.add(c);
          imported++;
        }
      }
      state.vouchers.set(reward.id, set);
      reward.vouchers_total = set.size;
      reward.vouchers_available = set.size;
      audit(state, 'voucher_import', 'reward', reward.id, null);
      return { imported, duplicates, reward };
    },
    'admin.rewards.publish': (input) => {
      guard();
      const reward = state.rewards.find((x) => x.id === param(input));
      if (!reward) throw mockError('NOT_FOUND');
      if (!reward.declaration_ref) throw mockError('DECLARATION_REQUIRED');
      if (reward.status === 'published') throw mockError('PRICE_IMMUTABLE');
      if (reward.vouchers_total === 0) throw mockError('COVERAGE_INSUFFICIENT');
      reward.status = 'published';
      reward.published_at = now();
      state.outlay.allocated += reward.allocation_cents;
      audit(state, 'reward_publish', 'reward', reward.id, 'cash_check');
      return { reward };
    },
    'admin.rewards.releases': (input) => {
      guard();
      const reward = state.rewards.find((x) => x.id === param(input));
      if (!reward) throw mockError('NOT_FOUND');
      const b = body<{ per_day: number[] }>(input);
      if (b.per_day.reduce((s, n) => s + n, 0) > reward.vouchers_available) throw mockError('OUT_OF_STOCK');
      audit(state, 'reward_release', 'reward', reward.id, null);
      return { reward };
    },
    'admin.redemptions.replace': (input) => {
      guard();
      audit(state, 'redemption_replace', 'redemption', param(input), null);
      const b = body<{ voucher_code?: string }>(input);
      return { redemption: { id: param(input), reward_id: mockId(60), title: 'Workshop plannen', partner: 'Boekhandel Demostad', voucher_code: b.voucher_code ?? 'NIEUW-4821', points: 500, status: 'replaced', created_at: now() } };
    },

    // Challenges and prizes (spec §4.6, §4.7).
    'admin.challenges.create': (input) => {
      guard();
      const b = body<Omit<AdminChallenge, 'id' | 'status' | 'prizes' | 'proposed_by_ref' | 'final_by_ref' | 'final_confirmed_by_ref' | 'pool'> & { pool?: AdminChallenge['pool']; prizes: Omit<AdminChallenge['prizes'][number], 'prize_id'>[] }>(input);
      for (const p of b.prizes) {
        if (p.kind === 'earned_individual' && p.value_cents > 1000) throw mockError('CEILING_EXCEEDED');
        if (p.value_cents > 15000) throw mockError('CEILING_EXCEEDED');
      }
      const c: AdminChallenge = {
        id: mockId(++state.seq),
        type: b.type,
        title_nl: b.title_nl,
        title_en: b.title_en,
        period_start_day: b.period_start_day,
        period_end_day: b.period_end_day,
        pool: b.pool ?? null,
        rules: b.rules,
        status: 'draft',
        prizes: b.prizes.map((p) => ({ ...p, prize_id: mockId(++state.seq) })),
        proposed_by_ref: null,
        final_by_ref: null,
        final_confirmed_by_ref: null,
      };
      state.challenges.set(c.id, c);
      audit(state, 'challenge_create', 'challenge', c.id, null);
      return { challenge: c };
    },
    'admin.challenges.publish': (input) => {
      guard();
      const c = challengeById(param(input));
      c.status = 'published';
      audit(state, 'challenge_publish', 'challenge', c.id, null);
      return { challenge: c };
    },
    'admin.challenges.propose': (input) => {
      guard();
      const c = challengeById(param(input));
      c.status = 'review';
      c.proposed_by_ref = state.actor;
      c.final_by_ref = state.actor;
      c.final_confirmed_by_ref = null;
      audit(state, 'result_propose', 'challenge', c.id, body<{ note?: string }>(input).note ?? null);
      return { challenge: c };
    },
    'admin.challenges.confirm': (input) => {
      guard();
      const c = challengeById(param(input));
      if (!c.final_by_ref || c.final_by_ref === state.actor) throw mockError('FOUR_EYES_REQUIRED');
      if (!sampleDone()) throw mockError('SAMPLE_REQUIRED');
      c.status = 'final';
      c.final_confirmed_by_ref = state.actor;
      audit(state, 'result_confirm', 'challenge', c.id, body<{ note?: string }>(input).note ?? null);
      return { challenge: c };
    },
    'admin.prizes.verify': (input) => {
      guard();
      const b = body<{ checks: { sample_done: boolean; anchor: boolean; minutes: boolean } }>(input);
      if (!b.checks.sample_done || !sampleDone()) throw mockError('SAMPLE_REQUIRED');
      audit(state, 'prize_verify', 'prize', param(input), null);
      return { prize: mockPrize(param(input), 'verified', state.actor) };
    },
    'admin.prizes.ageCheck': (input) => {
      guard();
      const b = body<{ outcome: 'ok' | 'failed' }>(input);
      audit(state, 'prize_age_check', 'prize', param(input), b.outcome);
      return { prize: { ...mockPrize(param(input), 'candidate', null), age_check_outcome: b.outcome } };
    },
    'admin.prizes.deliveryContact': (input) => {
      guard();
      audit(state, 'prize_delivery_contact', 'prize', param(input), null);
      return { prize: { ...mockPrize(param(input), 'verified', MOCK_ADMINS[1]), deliver_after: '2027-02-01T00:00:00.000Z' } };
    },

    // Waitlist batches (architecture §3.1 toegangspoort).
    'admin.waitlist.overview': () => {
      guard();
      return { classes: state.waitlist, total_waiting: state.waitlist.reduce((s, c) => s + c.waiting, 0) };
    },
    'admin.waitlist.inviteBatch': (input) => {
      guard();
      const b = body<{ count: number; dry_run?: boolean }>(input);
      const invites: { invite_id: string | null; priority_reason: WaitlistPriority; group_size: number }[] = [];
      let left = b.count;
      let entries = 0;
      for (const cls of state.waitlist) {
        let waiting = cls.waiting;
        while (left > 0 && waiting > 0) {
          const size = cls.priority_reason === 'group' ? Math.min(3, waiting) : 1;
          if (size > left && invites.length) break;
          invites.push({ invite_id: b.dry_run ? null : mockId(++state.seq), priority_reason: cls.priority_reason, group_size: size });
          waiting -= size;
          left -= size;
          entries += size;
        }
        if (!b.dry_run) {
          cls.invited += cls.waiting - waiting;
          cls.waiting = waiting;
        }
      }
      if (!b.dry_run) audit(state, 'waitlist_invite_batch', 'waitlist', `batch_${state.seq}`, String(entries));
      return { dry_run: b.dry_run ?? false, invites, entries_invited: entries };
    },

    // Users (spec §4.11 Gebruikers): every lookup needs a reason.
    'admin.users.search': (input) => {
      guard();
      const q = String(input.query.q).toLowerCase();
      audit(state, 'user_search', 'user', 'search', String(input.query.reason));
      return { items: state.users.filter((u) => u.first_name.toLowerCase().includes(q) || u.email.includes(q)) };
    },
    'admin.users.get': (input) => {
      guard();
      const u = state.users.find((x) => x.id === param(input));
      if (!u) throw mockError('NOT_FOUND');
      audit(state, 'user_view', 'user', u.id, String(input.query.reason));
      const sessions = [...state.sessions.values()].slice(0, 2).map(({ abort_reason: _a, user_ref: _u, ...s }) => {
        void _a;
        void _u;
        return s;
      });
      return { user: u, sessions, open_flags: state.flags.filter((f) => f.status === 'open').length };
    },
    'admin.users.teamFlag': (input) => {
      guard();
      const u = state.users.find((x) => x.id === param(input));
      if (!u) throw mockError('NOT_FOUND');
      u.is_team = true;
      audit(state, 'user_team_flag', 'user', u.id, null);
      return { user_id: u.id, is_team: true };
    },
    'admin.users.delete': (input) => {
      guard();
      const id = param(input);
      const by = state.pendingDeletes.get(id);
      if (!by || by === state.actor) {
        state.pendingDeletes.set(id, state.actor);
        throw mockError('FOUR_EYES_REQUIRED');
      }
      state.pendingDeletes.delete(id);
      const u = state.users.find((x) => x.id === id);
      if (u) u.status = 'deleted';
      audit(state, 'user_delete', 'user', id, null);
      return { deleted_at: now() };
    },

    // Experiments, flags, wellbeing (spec §4.11 Experimenten, Schadesignalen; §6.6).
    'admin.experiments': () => {
      guard();
      return {
        assignments: [
          { unit_type: 'squad', unit_ref: 'squad_bieb_0001', factor: 'bonus', arm: 'A', stratum: 'delta', block: 'b-0001', assigned_at: '2026-11-02T10:00:00.000Z' },
          { unit_type: 'squad', unit_ref: 'squad_bieb_0001', factor: 'belofte', arm: 'early', stratum: 'delta', block: 'b-0001', assigned_at: '2026-11-02T10:00:00.000Z' },
          { unit_type: 'solo', unit_ref: 'user_ties_0006', factor: 'prompt', arm: 'strong', stratum: 'none', block: 'b-0002', assigned_at: '2026-11-03T10:00:00.000Z' },
        ],
        switches: [{ user_ref: 'user_daan_0002', factor: 'bonus', from: 'B', to: 'A', reason: 'minor', at: '2026-11-03T10:00:00.000Z' }],
      };
    },
    'admin.featureFlags.put': (input) => {
      guard();
      const key = input.params.key as FeatureFlagKey;
      const { enabled } = body<{ enabled: boolean }>(input);
      if (key === 'draws' && enabled) throw mockError('FEATURE_DISABLED');
      const f = state.featureFlags[key];
      const fourEyes = (key === 'arm_b' || (key === 'rest_period' && enabled)) && f.enabled !== enabled;
      if (fourEyes) {
        if (!f.pending || f.requestedBy === state.actor) {
          f.pending = true;
          f.requestedBy = state.actor;
          audit(state, 'flag_change_requested', 'feature_flag', key, String(enabled));
          return { key, enabled: f.enabled, pending_confirmation: true };
        }
      }
      f.enabled = enabled;
      f.pending = false;
      f.requestedBy = null;
      audit(state, 'flag_change', 'feature_flag', key, String(enabled));
      return { key, enabled, pending_confirmation: false };
    },
    'admin.wellbeing.summary': () => {
      guard();
      return {
        signals: [
          { code: 'S1', arm: 'A', count: 2 },
          { code: 'S1', arm: 'B', count: 3 },
          { code: 'S2', arm: 'A', count: 0 },
          { code: 'S2', arm: 'B', count: 1 },
          { code: 'S3', arm: 'A', count: 1 },
          { code: 'S3', arm: 'B', count: 0 },
          { code: 'S4', arm: 'A', count: 0 },
          { code: 'S4', arm: 'B', count: 1 },
        ],
        stop_rule: { count: 1, threshold: 3, triggered: false },
      };
    },
    'admin.experiments.stopArmB': (input) => {
      guard();
      const reason = body<{ reason: string }>(input).reason;
      if (!state.armBStop.requestedBy || state.armBStop.requestedBy === state.actor) {
        state.armBStop.requestedBy = state.actor;
        audit(state, 'arm_b_stop_requested', 'experiment', 'arm_b', reason);
        return { effective_from_day: '2026-11-09', pending_confirmation: true };
      }
      state.armBStop.confirmed = true;
      state.featureFlags.arm_b.enabled = false;
      audit(state, 'arm_b_stop_confirmed', 'experiment', 'arm_b', reason);
      return { effective_from_day: '2026-11-09', pending_confirmation: false };
    },
    'admin.vacationPause': (input) => {
      guard();
      const b = body<{ start_day: string; end_day: string }>(input);
      if (b.start_day < '2026-11-05') throw mockError('PERIOD_LOCKED');
      state.vacation = b;
      audit(state, 'vacation_pause_set', 'vacation_pause', `${b.start_day}_${b.end_day}`, null);
      return { ...b, updated_at: now() };
    },
    'admin.audit': (input) => {
      guard();
      const { object, actor } = input.query as { object?: string; actor?: string };
      return { items: state.audit.filter((a) => (!object || a.object_type === object || a.object_ref === object) && (!actor || a.actor_ref === actor)), next_cursor: null };
    },
    'admin.kpi.query': (input) => {
      guard();
      const query = param(input, 'query');
      const clean = query.endsWith('_clean');
      const rows: (string | number | null)[][] = [
        ['2026-W45', 'landing', clean ? 0.61 : 0.63],
        ['2026-W45', 'club_qr', clean ? 0.7 : 0.71],
      ];
      return { query, from: (input.query.from as string | undefined) ?? null, to: (input.query.to as string | undefined) ?? null, columns: ['week', 'channel', 'value'], rows, computed_at: now() };
    },

    // Support and ambassadors.
    'admin.support.list': () => {
      guard();
      return { items: state.support };
    },
    'admin.support.create': (input) => {
      guard();
      const b = body<{ label: SupportTicket['label']; received_on: string }>(input);
      const ticket: SupportTicket = { id: mockId(++state.seq), user_ref: null, kind: 'external', ref_id: null, text: null, label: b.label, status: 'open', created_at: `${b.received_on}T09:00:00.000Z` };
      state.support.unshift(ticket);
      return { ticket };
    },
    'admin.support.patch': (input) => {
      guard();
      const t = state.support.find((x) => x.id === param(input));
      if (!t) throw mockError('NOT_FOUND');
      const b = body<{ label?: SupportTicket['label']; status?: SupportTicket['status'] }>(input);
      if (b.label) t.label = b.label;
      if (b.status) t.status = b.status;
      return { ticket: t };
    },
    'admin.ambassadors.list': () => {
      guard();
      return { items: state.ambassadors };
    },
    'admin.ambassadors.create': (input) => {
      guard();
      const b = body<{ name_ref: string; is_board_member_of?: string; cap_users: number }>(input);
      if (b.is_board_member_of) throw mockError('BOARD_MEMBER_CONFLICT');
      const a: Ambassador = { id: mockId(++state.seq), code_invite_id: mockId(++state.seq), name_ref: b.name_ref, is_board_member_of: null, cap_users: b.cap_users, registered: 0 };
      state.ambassadors.push(a);
      return { ambassador: a };
    },
  };

  return {
    handlers,
    get state() {
      return state;
    },
    /** Resets the data; tests start from a known state. */
    reset(o: Partial<Pick<AdminMockState, 'mfaVerified' | 'mfaEnrolled'>> = {}) {
      state = initialState(o);
    },
    setActor(actor: string) {
      state.actor = actor;
    },
  };
}

function mockPrize(id: string, status: 'candidate' | 'verified', verifiedBy: string | null) {
  return {
    id,
    kind: 'earned_collective' as const,
    challenge_id: mockId(110),
    value_cents: 15000,
    min_age_band: '16_17' as const,
    winner_ref: null,
    winner_club_id: mockId(100),
    status,
    verified_by_ref: verifiedBy,
    age_check_outcome: null,
    deliver_after: null,
  };
}


/** The mock used in mock mode; the demo switch in the admin layout changes its acting admin. */
export const adminMock = createAdminMock();
export const handlers: MockHandlers = adminMock.handlers;
