// Event taxonomy (spec §7.1) plus the events the UX design added (UX §4, §7 question 10).
// Event names exist only here; the EventWriter and POST /events accept nothing else (architecture §3.5).
// Properties keep the names of spec §7.1. No e-mail, name, IP or free text in properties.
import { z } from 'zod';
import {
  AbortReason,
  AgeBand,
  ArmBelofte,
  ArmBonus,
  ArmPrompt,
  ArmRest,
  BelofteReflectionAction,
  BelofteWitnesses,
  CardKind,
  ClubPool,
  DuelResult,
  Empty,
  ExperimentFactor,
  ExperimentUnit,
  FlagCode,
  FlagDecision,
  FocusDay,
  HarmCode,
  Instant,
  InviteSource,
  NonNegInt,
  PlannedMin,
  PosInt,
  ReasonCode,
  SampleJudgement,
  SquadStatus,
  StakeInterest,
  SupportLabel,
  SurveyMoment,
  UaClass,
  Ulid,
  WakelockState,
  WeekKey,
  ArmSwitchReason,
  AppealOutcome,
  PrizeKind,
} from './common.ts';
import { defineRoutes } from './route.ts';

/** Where an event is written: by the server in the domain transaction, or sent by the web app. */
export type EventSource = 'server' | 'client';

interface EventDef<P extends z.ZodType = z.ZodType, S extends EventSource = EventSource> {
  readonly source: S;
  readonly props: P;
  readonly spec: string;
  /** Kept in the taxonomy as a placeholder but never written (e.g. draws, product plan §0.3). */
  readonly retired?: true;
}

const server = <P extends z.ZodType>(props: P, spec = 'spec §7.1'): EventDef<P, 'server'> => ({ source: 'server', props, spec });
const client = <P extends z.ZodType>(props: P, spec = 'spec §7.1'): EventDef<P, 'client'> => ({ source: 'client', props, spec });
const o = z.strictObject;

const Pseudonym = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
const SessionRef = o({ session_id: Ulid });
const SquadRef = o({ squad_id: Ulid });
const ClubRef = o({ vereniging_id: Ulid });
const QrBron = z.string().regex(/^[a-z0-9_-]{1,32}$/);
const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Weekday = z.enum(['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']);
const ReminderKind = z.enum(['goal_at_risk', 'streak_at_risk']);
const Seconds = z.number().int().min(0);
const Euro = z.number().nonnegative();
const Duel = o({ duel_id: Ulid, invite_id: Ulid.nullable(), uitslag: DuelResult.optional() });
const SquadMembership = o({ squad_id: Ulid, invite_id: Ulid.nullable(), ledental_na: z.number().int().min(0).max(6) });
const Survey = o({ moment: SurveyMoment, items: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{0,15}$/)).max(40) });
const HarmProps = o({ code: HarmCode });
const Sample = o({ week: WeekKey, stratum: z.string().max(32), oordeel: SampleJudgement.optional() });
const Referral = o({ invite_id: Ulid, sessies: NonNegInt });
const Hold = o({ dagen: NonNegInt });
const GoalDay = o({ datum: FocusDay, minuten: NonNegInt, joker_gebruikt: z.boolean() });
const Card = o({ card_id: Ulid, aanleiding: CardKind, velden_aan: z.array(z.enum(['first_name', 'squad_name', 'streak', 'duration'])).max(4) });
const Toggle = o({ aan: z.boolean() });
const Pause = o({ squad_id: Ulid, dagen_inactief: NonNegInt });
const Appeal = o({ object_id: Ulid, uitkomst: AppealOutcome.optional() });
const Suggestion = o({ voorgesteld: PosInt, huidig: PosInt });

export const EVENT_TAXONOMY = {
  // Invitations and registration
  invite_created: server(o({ invite_id: Ulid, bron: InviteSource, maker: Pseudonym.nullable(), max_uses: PosInt, geldig_tot: Instant })),
  invite_share_opened: client(o({ invite_id: Ulid, kanaal: z.enum(['whatsapp', 'systeem', 'kopie']) })),
  invite_link_opened: server(o({ invite_id: Ulid, nieuwe_bezoeker: z.boolean() }), 'spec §7.1, arch §8.1 (without pseudonym)'),
  account_created: server(o({ bron: InviteSource, invite_id: Ulid.nullable(), vereniging_id: Ulid.nullable(), qr_bron: QrBron.nullable(), age_band: AgeBand })),
  experiment_assigned: server(
    o({ arm_bonus: ArmBonus, arm_belofte: ArmBelofte, arm_rest: ArmRest, arm_prompt: ArmPrompt, eenheid: ExperimentUnit, blok: z.string().max(64), age_band: AgeBand }),
  ),
  research_opt_out: server(o({ dag: FocusDay })),
  survey_answered: server(Survey),
  survey_skipped: server(Survey),
  squad_prompt_shown: client(o({ dag: z.number().int().min(1).max(3) })),
  squad_prompt_used: client(o({ dag: z.number().int().min(1).max(3) })),
  exam_day_set: server(o({ datum: FocusDay })),
  late_session_signal_shown: client(SessionRef),
  harm_signal_raised: server(HarmProps),
  harm_card_viewed: client(HarmProps),
  harm_help_opened: client(HarmProps),
  streak_recovered: server(o({ squad_id: Ulid, lengte: NonNegInt })),
  squad_regroup_offered: server(SquadRef),
  squad_merged: server(SquadRef),
  squad_name_reported: server(SquadRef),
  institution_email_verified: server(o({ domein: z.string().max(253) })),
  first_redemption_hold_started: server(Hold),
  first_redemption_hold_ended: server(Hold),
  sample_drawn: server(Sample),
  sample_judged: server(Sample),
  plus_interest: server(Empty),
  rest_period_notice_shown: client(o({ arm_rest: ArmRest })),
  arm_switched: server(o({ factor: ExperimentFactor, van: z.string().max(16), naar: z.string().max(16), reden: ArmSwitchReason })),
  practice_completed: server(Empty),
  daily_goal_set: server(o({ minuten: PosInt, bron: z.enum(['onboarding', 'voorstel', 'zelf']), overmoed_bevestigd: z.boolean() })),
  goal_suggestion_shown: client(Suggestion),
  goal_suggestion_accepted: server(Suggestion),

  // Focus engine
  session_started: server(o({ session_id: Ulid, duur_gepland: PlannedMin, device_class: UaClass, standalone: z.boolean(), wakelock_supported: z.boolean() })),
  wakelock_state: client(o({ session_id: Ulid, status: z.enum(['acquired', 'denied', 'released']) })),
  heartbeat_gap: server(o({ session_id: Ulid, gap_s: Seconds, log_geleverd: z.boolean(), log_geldig: z.boolean() })),
  visibility_hidden: server(o({ session_id: Ulid, verstreken_s: Seconds })),
  session_completed: server(
    o({
      session_id: Ulid,
      minuten: NonNegInt,
      punten: z.number().int(),
      flagged: z.boolean(),
      flag_codes: z.array(FlagCode).max(15),
      claim_delay_s: Seconds.nullable(),
      /** UX proposal: set when the client reported the end signal before the verdict. */
      signal_played: z.boolean().optional(),
    }),
  ),
  session_aborted: server(
    o({
      session_id: Ulid,
      reden: AbortReason,
      verstreken_s: Seconds,
      /** UX §7 question 10: device class and last Wake Lock state on aborts. */
      device_class: UaClass.optional(),
      wakelock_state: WakelockState.optional(),
    }),
  ),
  abort_recovery: client(o({ session_id: Ulid, actie: z.enum(['opnieuw', 'korter', 'weg']), seconden_tot_actie: Seconds })),
  return_after_abort: client(o({ session_id: Ulid, hidden_duur_s: Seconds })),
  /** `reden_gebruiker` records only whether text was given; the text stays in the flag (no free text in events). */
  abort_report_submitted: server(o({ session_id: Ulid, reden_gebruiker: z.enum(['met_tekst', 'zonder_tekst']) })),
  signal_played: client(o({ session_id: Ulid, gespeeld: z.boolean(), toon_aan: z.boolean(), trilling: z.boolean() }), 'UX §4 F3e, §7 question 3 and 10'),

  // Goals and squads
  daily_goal_met: server(GoalDay),
  daily_goal_missed: server(GoalDay),
  goal_bonus_booked: server(o({ arm: ArmBonus, mutatie: z.enum(['goal_bonus', 'goal_bonus_release', 'goal_bonus_reverse', 'goal_budget_grant', 'goal_budget_secure', 'goal_budget_lapse', 'goal_secure_reverse', 'goal_lapse_reverse']), week: WeekKey })),
  squad_created: server(SquadMembership),
  squad_joined: server(SquadMembership),
  squad_left: server(SquadMembership),
  squad_became_active: server(SquadRef),
  squad_day_evaluated: server(o({ squad_id: Ulid, datum: FocusDay, geslaagd: z.boolean(), actieve_leden: NonNegInt, jokers: NonNegInt, streak: NonNegInt })),
  member_paused: server(Pause),
  member_resumed: server(Pause),
  presence_viewed: client(o({ leden_live: z.number().int().min(0).max(6) })),
  compare_optin_changed: server(Toggle),
  duel_created: server(Duel),
  duel_accepted: server(Duel),
  duel_finished: server(Duel),

  // Clubs and challenges
  vereniging_joined: server(o({ vereniging_id: Ulid, qr_bron: QrBron.nullable() })),
  code_cap_reached: server(ClubRef),
  club_dashboard_viewed: server(o({ vereniging_id: Ulid, tab: z.enum(['stand', 'werving', 'prijs', 'kwaliteit']) })),
  promo_kit_downloaded: client(o({ vereniging_id: Ulid, asset: z.enum(['poster', 'story', 'qr', 'text']) })),
  leaderboard_viewed: client(o({ poule: ClubPool, periode: z.string().max(32) })),
  challenge_enrolled: server(o({ challenge_id: Ulid })),

  // Belofte
  belofte_offered: client(o({ trigger: z.enum(['vroeg', 'laat', 'buiten_experiment']), squadstatus: z.union([SquadStatus, z.literal('geen')]) })),
  belofte_made: server(o({ dagen_per_week: z.number().int().min(1).max(7), min_per_dag: PosInt, getuigen: BelofteWitnesses, verhouding_tot_historie: z.number().nonnegative().nullable() })),
  belofte_day_result: server(o({ gehaald: z.boolean() })),
  belofte_reflection: server(o({ actie: BelofteReflectionAction, stake_interest: StakeInterest.optional() })),
  belofte_stopped: server(o({ dag: FocusDay })),
  belofte_witness_viewed: client(o({ belofte_status: z.enum(['active', 'completed', 'stopped']) }), 'UX §4 Q7, §7 question 10'),

  // Points, catalog, review
  catalog_viewed: client(o({ items_zichtbaar: NonNegInt, saldo: z.number().int(), inverdiend: z.boolean() })),
  redemption_completed: server(o({ item_id: Ulid, punten: PosInt, kostprijs: NonNegInt, financier_id: Ulid })),
  redemption_blocked: server(
    o({ reden: z.enum(['inverdien', 'week', 'maand', 'voorraad', 'saldo', 'dekking', 'wachttijd', 'telefoon', 'referral_aandeel']) }),
    'spec §7.1 (reasons extended with the §8.2 error codes FIRST_REDEEM_HOLD, PHONE_NOT_VERIFIED, REFERRAL_SHARE_EXCEEDED)',
  ),
  coverage_alert: server(o({ tekort_eur: Euro, week: WeekKey })),
  flag_reviewed: server(o({ session_id: Ulid.nullable(), besluit: FlagDecision, redencode: ReasonCode, doorlooptijd_u: z.number().nonnegative() })),
  appeal_submitted: server(Appeal),
  appeal_decided: server(Appeal),
  prize_awarded: server(o({ prize_id: Ulid, type: PrizeKind, waarde_eur: Euro })),
  no_points_mode_changed: server(Toggle),
  card_created: server(Card),
  card_share_opened: client(Card),
  verify_page_viewed: server(Card),
  referral_pending_created: server(Referral),
  referral_vested: server(Referral),
  referral_lapsed: server(Referral),
  support_labeled: server(o({ label: SupportLabel })),

  // Reminders (UX §4 O10 and P5, §5 question 10)
  reminder_scheduled: client(o({ tijd: ClockTime }), 'UX §4 O10'),
  reminder_settings_changed: client(o({ aan: z.boolean(), tijd: ClockTime.optional(), dagen: z.array(Weekday).max(7).optional() }), 'UX §4 P5'),
  reminder_sent: server(o({ soort: ReminderKind, dag: FocusDay }), 'UX §5 (herinnering), arch §6.3'),
  reminder_opened: client(o({ soort: ReminderKind, dag: FocusDay }), 'UX §5 (herinnering)'),

  // Draws are not built (product plan §0.3); kept as a retired name so it can never be reused.
  draw_opt_out: { source: 'client' as const, props: o({ aan: z.boolean() }), spec: 'UX changelog (B5, P1); retired by product plan §0.3', retired: true as const },
} as const satisfies Record<string, EventDef>;

export type EventTaxonomy = typeof EVENT_TAXONOMY;
export type EventName = keyof EventTaxonomy;
export type EventProps<N extends EventName> = z.output<EventTaxonomy[N]['props']>;
type Active<N extends EventName> = EventTaxonomy[N] extends { retired: true } ? never : N;
export type ActiveEventName = { [N in EventName]: Active<N> }[EventName];
export type ClientEventName = { [N in ActiveEventName]: EventTaxonomy[N]['source'] extends 'client' ? N : never }[ActiveEventName];
export type ServerEventName = Exclude<ActiveEventName, ClientEventName>;

export const EVENT_NAMES = Object.keys(EVENT_TAXONOMY) as EventName[];
export const ACTIVE_EVENT_NAMES = EVENT_NAMES.filter((n) => !('retired' in EVENT_TAXONOMY[n])) as ActiveEventName[];
export const CLIENT_EVENT_NAMES = ACTIVE_EVENT_NAMES.filter((n) => EVENT_TAXONOMY[n].source === 'client') as ClientEventName[];
export const SERVER_EVENT_NAMES = ACTIVE_EVENT_NAMES.filter((n) => EVENT_TAXONOMY[n].source === 'server') as ServerEventName[];

export function isEventName(name: string): name is EventName {
  return Object.hasOwn(EVENT_TAXONOMY, name);
}
export function isClientEventName(name: string): name is ClientEventName {
  return isEventName(name) && (CLIENT_EVENT_NAMES as string[]).includes(name);
}

/** Validates the properties of any active event; throws on retired names. */
export function parseEventProps<N extends ActiveEventName>(name: N, props: unknown): EventProps<N> {
  const def: EventDef = EVENT_TAXONOMY[name];
  if (def.retired) throw new Error(`Event ${name} is retired`);
  return def.props.parse(props) as EventProps<N>;
}

export type ClientEvent = { [N in ClientEventName]: { name: N; props: z.input<EventTaxonomy[N]['props']> } }[ClientEventName];

/** Body of POST /events: only client events from the taxonomy (UNKNOWN_EVENT otherwise). */
export const ClientEventRequest = z.discriminatedUnion(
  'name',
  CLIENT_EVENT_NAMES.map((n) => z.strictObject({ name: z.literal(n), props: EVENT_TAXONOMY[n].props })) as unknown as [
    z.ZodObject<{ name: z.ZodLiteral<string>; props: z.ZodType }>,
    ...z.ZodObject<{ name: z.ZodLiteral<string>; props: z.ZodType }>[],
  ],
) as unknown as z.ZodType<ClientEvent>;

/** Envelope as stored in `event` (architecture §3.5); arms and channel are added by the EventWriter. */
export const StoredEvent = z.strictObject({
  id: Ulid,
  name: z.enum(EVENT_NAMES as [EventName, ...EventName[]]),
  pseudonym: Pseudonym.nullable(),
  server_at: Instant,
  props: z.record(z.string(), z.unknown()),
  release: z.string().max(32),
  arm_bonus: ArmBonus.nullable(),
  arm_belofte: ArmBelofte.nullable(),
  arm_rest: ArmRest.nullable(),
  arm_prompt: ArmPrompt.nullable(),
  channel: z.string().max(32).nullable(),
  squad_id: Ulid.nullable(),
});

export const eventRoutes = defineRoutes({
  'events.track': {
    module: 'events', method: 'POST', path: '/events', auth: ['student', 'pre'],
    body: ClientEventRequest, response: z.undefined(), responseKind: 'empty', status: [202],
    errors: ['UNKNOWN_EVENT'], spec: 'arch §8.2, §8.1 (pre users to event_pending)',
  },
  'me.plusInterest': {
    module: 'events', method: 'POST', path: '/me/plus-interest', auth: ['student'],
    response: z.undefined(), responseKind: 'empty', status: [204], errors: ['FEATURE_DISABLED'], spec: 'arch §8.2 (nepdeur Plus)',
  },
});

// Inferred types (output side) for every schema above.
export type StoredEvent = z.output<typeof StoredEvent>;
