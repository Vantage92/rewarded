// Setup sections: clubs, challenges with prizes, partners and budget with coverage, catalog with CSV
// import and kind declaration (spec §4.3, §4.6, §4.7, §4.11; architecture §5.3, §8.2 Beheer).
import type { AdminChallenge, AdminChallengeCreate, AdminClub, AdminReward, AgeBand, Budget, BudgetKind, ChallengeType, ClubPool, MembersSourceKind, PartnerKind, RewardKind } from '@rewarded/contracts';
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Button, ButtonLink, Chip, TextField } from '../../../design/index.ts';
import { apiKey, useApiMutation, useApiQuery } from '../../../lib/api/index.ts';
import { AprilMembers, useClubCalendars } from './calendars.tsx';
import { Block, CheckboxField, ErrorNote, formatEuro, formatPct, isApiError, Loading, Notice, parseEuroToCents, Section, SelectField, Table, TextAreaField, upsertWorkset, useTa, useWorkset } from '../ui.tsx';

const LEVEL = CURRENT_PARAMS.levels['1'];
const CODE_CAP = CURRENT_PARAMS.challenges.code_cap_factor;
const SOURCE_KINDS: readonly MembersSourceKind[] = ['institution', 'board_grant', 'faculty', 'self'];
const POOLS: readonly ClubPool[] = ['lt150', '150_500', 'gt500'];
const AGE_BANDS: readonly AgeBand[] = ['16_17', '18_plus'];

// -------------------------------------------------------------------------------------------- Clubs

export function Clubs() {
  const clubId = useParams()['*'];
  return clubId ? <ClubDetail id={clubId} /> : <ClubList />;
}

function ClubList() {
  const { ta } = useTa();
  const clubs = useApiQuery('admin.clubs.list');
  return (
    <Section title={ta('clubs.title')} intro={ta('clubs.intro')}>
      {clubs.isPending ? <Loading /> : null}
      {clubs.isError ? <ErrorNote error={clubs.error} onRetry={() => void clubs.refetch()} /> : null}
      {clubs.data ? (
        <Table
          caption={ta('clubs.caption')}
          empty={ta('clubs.empty')}
          head={[ta('clubs.name'), ta('clubs.members'), ta('clubs.pool'), ta('clubs.code'), ta('clubs.status'), ta('clubs.prize'), '']}
          rows={clubs.data.items.map((c) => [
            `${c.name} (${c.city})`,
            ta('clubs.members_value', { n: c.declared_members, source: ta(`source.${c.members_source_kind}`) }),
            ta(`pool.${c.pool}`),
            c.join_code ? ta('clubs.code_value', { code: c.join_code, cap: c.code_cap }) : ta('clubs.no_code'),
            ta(`club_status.${c.status}`),
            c.prize_eligible ? ta('clubs.prize_yes') : ta('clubs.prize_no'),
            <Link key={c.id} to={`/beheer/verenigingen/${c.id}`}>
              {ta('clubs.open', { name: c.name })}
            </Link>,
          ])}
        />
      ) : null}
      <ClubCreate />
    </Section>
  );
}

function ClubCreate() {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', city: '', members: '', kind: 'institution' as MembersSourceKind, sourceRef: '', agreement: '', pool: '', helpLabel: '', helpUrl: '', boardEmails: '', calendar: '' });
  const calendars = useClubCalendars();
  const create = useApiMutation('admin.clubs.create', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.clubs.list') }) });
  const members = Number(f.members);
  const membersOk = Number.isInteger(members) && members >= 1;
  const valid = f.name.trim() && f.city.trim() && membersOk && f.sourceRef.trim();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const emails = f.boardEmails.split(/[\s,;]+/).filter(Boolean);
    create.mutate({
      body: {
        name: f.name.trim(),
        city: f.city.trim(),
        declared_members: members,
        members_source_kind: f.kind,
        members_source_ref: f.sourceRef.trim(),
        ...(f.agreement.trim() ? { agreement_ref: f.agreement.trim() } : {}),
        ...(f.calendar ? { exam_calendar_id: f.calendar } : {}),
        ...(f.pool ? { pool: f.pool as ClubPool } : {}),
        ...(f.helpLabel.trim() && f.helpUrl.trim() ? { help_resources: [{ label: f.helpLabel.trim(), url: f.helpUrl.trim() }] } : {}),
        ...(emails.length ? { board_member_emails: emails } : {}),
      },
    });
  };
  return (
    <Block title={ta('clubs.create')}>
      <form className="adm-form adm-grid" onSubmit={submit} aria-label={ta('clubs.create')}>
        <TextField label={ta('clubs.name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <TextField label={ta('clubs.city')} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} required />
        <TextField
          label={ta('clubs.declared')}
          inputMode="numeric"
          value={f.members}
          onChange={(e) => setF({ ...f, members: e.target.value })}
          hint={membersOk ? ta('clubs.cap_preview', { cap: Math.floor(members * CODE_CAP) }) : ta('clubs.cap_rule')}
          required
        />
        <SelectField
          label={ta('clubs.source_kind')}
          value={f.kind}
          onChange={(e) => setF({ ...f, kind: e.target.value as MembersSourceKind })}
          options={SOURCE_KINDS.map((k) => ({ value: k, label: ta(`source.${k}`) }))}
          hint={f.kind === 'self' ? ta('clubs.self_warning') : undefined}
        />
        <TextField label={ta('clubs.source_ref')} hint={ta('clubs.source_ref_hint')} value={f.sourceRef} onChange={(e) => setF({ ...f, sourceRef: e.target.value })} required />
        <TextField label={ta('clubs.agreement')} hint={ta('clubs.agreement_hint')} value={f.agreement} onChange={(e) => setF({ ...f, agreement: e.target.value })} optional />
        <SelectField
          label={ta('clubs.calendar')}
          hint={ta('clubs.calendar_hint')}
          value={f.calendar}
          onChange={(e) => setF({ ...f, calendar: e.target.value })}
          placeholder={ta('clubs.calendar_none')}
          options={calendars.map((c) => ({ value: c.id, label: `${c.institution}${c.faculty ? ` · ${c.faculty}` : ''} (T ${c.t_day})` }))}
        />
        <SelectField label={ta('clubs.pool')} value={f.pool} onChange={(e) => setF({ ...f, pool: e.target.value })} placeholder={ta('clubs.pool_auto')} options={POOLS.map((p) => ({ value: p, label: ta(`pool.${p}`) }))} />
        <TextField label={ta('clubs.help_label')} value={f.helpLabel} onChange={(e) => setF({ ...f, helpLabel: e.target.value })} optional />
        <TextField label={ta('clubs.help_url')} type="url" value={f.helpUrl} onChange={(e) => setF({ ...f, helpUrl: e.target.value })} optional />
        <TextField label={ta('clubs.board_emails')} hint={ta('clubs.board_emails_hint')} value={f.boardEmails} onChange={(e) => setF({ ...f, boardEmails: e.target.value })} optional />
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('clubs.create_submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
        {create.data ? <Notice>{ta('clubs.created', { name: create.data.club.name, code: create.data.club.join_code ?? ta('clubs.no_code') })}</Notice> : null}
      </form>
    </Block>
  );
}

function ClubDetail({ id }: { id: string }) {
  const { ta, locale } = useTa();
  const club = useApiQuery('admin.clubs.get', { params: { id } });
  const c = club.data?.club;
  return (
    <Section title={c ? c.name : ta('clubs.detail')} actions={<ButtonLink variant="link" to="/beheer/verenigingen">{ta('clubs.back')}</ButtonLink>}>
      {club.isPending ? <Loading /> : null}
      {club.isError ? <ErrorNote error={club.error} onRetry={() => void club.refetch()} /> : null}
      {c ? (
        <>
          <dl className="adm-dl">
            <div>
              <dt>{ta('clubs.members')}</dt>
              <dd>{ta('clubs.members_value', { n: c.declared_members, source: ta(`source.${c.members_source_kind}`) })}</dd>
            </div>
            <div>
              <dt>{ta('clubs.source_ref')}</dt>
              <dd>{c.members_source_ref}</dd>
            </div>
            <div>
              <dt>{ta('clubs.fixed')}</dt>
              <dd>{c.members_fixed_at ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(c.members_fixed_at)) : ta('clubs.not_fixed')}</dd>
            </div>
            <div>
              <dt>{ta('clubs.code')}</dt>
              <dd>{c.join_code ? ta('clubs.code_value', { code: c.join_code, cap: c.code_cap }) : ta('clubs.no_code_reason')}</dd>
            </div>
            <div>
              <dt>{ta('clubs.agreement')}</dt>
              <dd>{c.agreement_ref ?? ta('clubs.no_agreement')}</dd>
            </div>
            <div>
              <dt>{ta('clubs.calendar')}</dt>
              <dd>{c.exam_calendar_id ? <Link to="/beheer/tentamenkalenders">{ta('clubs.calendar_set')}</Link> : ta('clubs.calendar_none')}</dd>
            </div>
            <div>
              <dt>{ta('clubs.prize')}</dt>
              <dd>{c.prize_eligible ? ta('clubs.prize_yes') : ta('clubs.prize_no_reason')}</dd>
            </div>
            <div>
              <dt>{ta('clubs.board')}</dt>
              <dd>{c.board_member_refs.length ? c.board_member_refs.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>{ta('clubs.help')}</dt>
              <dd>{c.help_resources.length ? c.help_resources.map((h) => h.label).join(', ') : ta('clubs.help_none')}</dd>
            </div>
          </dl>
          <p>
            <Link to={`/bestuur/${c.id}`}>{ta('clubs.board_link')}</Link>
          </p>
          <ClubPatch club={c} />
          <AprilMembers clubId={c.id} current={c.april_members} />
          <PendingLinks clubId={c.id} />
        </>
      ) : null}
    </Section>
  );
}

function ClubPatch({ club }: { club: AdminClub }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [members, setMembers] = useState(String(club.declared_members));
  const [agreement, setAgreement] = useState('');
  const [calendar, setCalendar] = useState(club.exam_calendar_id ?? '');
  const calendars = useClubCalendars();
  const patch = useApiMutation('admin.clubs.patch', {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apiKey('admin.clubs.get') });
      void qc.invalidateQueries({ queryKey: apiKey('admin.clubs.list') });
    },
  });
  const n = Number(members);
  const fixed = club.members_fixed_at !== null;
  return (
    <Block title={ta('clubs.patch')}>
      <form
        className="adm-form"
        aria-label={ta('clubs.patch')}
        onSubmit={(e) => {
          e.preventDefault();
          const body: { declared_members?: number; agreement_ref?: string; exam_calendar_id?: string } = {};
          if (!fixed && Number.isInteger(n) && n >= 1 && n !== club.declared_members) body.declared_members = n;
          if (agreement.trim()) body.agreement_ref = agreement.trim();
          if (calendar && calendar !== club.exam_calendar_id) body.exam_calendar_id = calendar;
          if (Object.keys(body).length) patch.mutate({ params: { id: club.id }, body });
        }}
      >
        <TextField label={ta('clubs.declared')} inputMode="numeric" value={members} onChange={(e) => setMembers(e.target.value)} disabled={fixed} hint={fixed ? ta('clubs.members_fixed_hint') : ta('clubs.cap_rule')} />
        {!club.agreement_ref ? <TextField label={ta('clubs.agreement')} hint={ta('clubs.agreement_hint')} value={agreement} onChange={(e) => setAgreement(e.target.value)} /> : null}
        <SelectField
          label={ta('clubs.calendar')}
          hint={ta('clubs.calendar_hint')}
          value={calendar}
          onChange={(e) => setCalendar(e.target.value)}
          placeholder={ta('clubs.calendar_none')}
          options={calendars.map((k) => ({ value: k.id, label: `${k.institution}${k.faculty ? ` · ${k.faculty}` : ''} (T ${k.t_day})` }))}
        />
        <Button type="submit" variant="secondary" disabled={patch.isPending}>
          {ta('clubs.patch_submit')}
        </Button>
      </form>
      {!fixed ? (
        <Button variant="secondary" onClick={() => patch.mutate({ params: { id: club.id }, body: { fix_members: true } })} disabled={patch.isPending}>
          {ta('clubs.fix')}
        </Button>
      ) : null}
      {patch.isError ? <ErrorNote error={patch.error} /> : null}
      {patch.isSuccess ? <Notice>{ta('form.saved')}</Notice> : null}
    </Block>
  );
}

function PendingLinks({ clubId }: { clubId: string }) {
  const { ta, locale } = useTa();
  const qc = useQueryClient();
  const links = useApiQuery('admin.clubs.pendingLinks', { params: { id: clubId } });
  const decide = useApiMutation('admin.clubs.decideLink', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.clubs.pendingLinks') }) });
  return (
    <Block title={ta('clubs.pending')}>
      <p className="field-hint">{ta('clubs.pending_intro')}</p>
      {links.isError ? <ErrorNote error={links.error} /> : null}
      {links.data ? (
        <Table
          caption={ta('clubs.pending')}
          empty={ta('clubs.pending_empty')}
          head={[ta('first.user'), ta('clubs.linked_at'), ta('clubs.qr'), '']}
          rows={links.data.items.map((l) => [
            `${l.first_name} (${l.user_ref})`,
            new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(l.linked_at)),
            l.qr_source ?? '—',
            <span key={l.user_ref} className="adm-actions">
              <Button variant="secondary" onClick={() => decide.mutate({ params: { id: clubId }, body: { user_ref: l.user_ref, decision: 'approve' } })}>
                {ta('clubs.approve')}
              </Button>
              <Button variant="secondary" onClick={() => decide.mutate({ params: { id: clubId }, body: { user_ref: l.user_ref, decision: 'reject' } })}>
                {ta('clubs.reject')}
              </Button>
            </span>,
          ])}
        />
      ) : null}
    </Block>
  );
}

// ---------------------------------------------------------------------------------------- Challenges

const CHALLENGE_TYPES: readonly ChallengeType[] = ['club_warmup', 'club_prize', 'performance'];

export function Challenges() {
  const { ta } = useTa();
  const mine = useWorkset<AdminChallenge>('challenges');
  // Student list as a source of ids; an admin without a student profile just sees the workset.
  const listed = useApiQuery('challenges.list', undefined, { retry: false });
  const known = new Set(mine.map((c) => c.id));
  const others = (listed.data?.items ?? []).filter((c) => !known.has(c.id));
  return (
    <Section title={ta('challenges.title')} intro={ta('challenges.intro')}>
      <p className="field-hint">{ta('challenges.list_note')}</p>
      {mine.map((c) => (
        <ChallengeCard key={c.id} challenge={c} />
      ))}
      {others.map((c) => (
        <ChallengeCard key={c.id} challenge={{ id: c.id, title_nl: c.title, title_en: c.title, type: c.type, period_start_day: c.period.start_day, period_end_day: c.period.end_day }} />
      ))}
      {!mine.length && !others.length ? <p className="adm-empty">{ta('challenges.empty')}</p> : null}
      <ChallengeCreate />
    </Section>
  );
}

type ChallengeView = Pick<AdminChallenge, 'id' | 'title_nl' | 'title_en' | 'type' | 'period_start_day' | 'period_end_day'> & Partial<AdminChallenge>;

function ChallengeCard({ challenge: c }: { challenge: ChallengeView }) {
  const { ta, locale } = useTa();
  const onChallenge = { onSuccess: (r: { challenge: AdminChallenge }) => upsertWorkset('challenges', r.challenge) };
  const publish = useApiMutation('admin.challenges.publish', onChallenge);
  const propose = useApiMutation('admin.challenges.propose', onChallenge);
  const confirm = useApiMutation('admin.challenges.confirm', onChallenge);
  const [note, setNote] = useState('');
  const status = c.status;
  const error = publish.error ?? propose.error ?? confirm.error;
  return (
    <article className="adm-card" aria-labelledby={`ch-${c.id}`}>
      <h3 id={`ch-${c.id}`}>{locale === 'en' ? c.title_en : c.title_nl}</h3>
      <p className="adm-meta">
        {status ? <Chip tone={status === 'final' ? 'earned' : 'neutral'}>{ta(`challenge_status.${status}`)}</Chip> : <Chip>{ta('challenges.status_unknown')}</Chip>} {ta(`challenge_type.${c.type}`)} ·{' '}
        {ta('challenges.period', { from: c.period_start_day, to: c.period_end_day })}
      </p>
      {c.final_by_ref ? <p>{ta('challenges.proposed_by', { by: c.final_by_ref })}</p> : null}
      {c.final_confirmed_by_ref ? <p>{ta('challenges.confirmed_by', { by: c.final_confirmed_by_ref })}</p> : null}
      {c.prizes?.length ? (
        <Table
          caption={ta('challenges.prizes')}
          head={[ta('prize.kind'), ta('prize.description'), ta('prize.value'), ta('prize.age'), '']}
          rows={c.prizes.map((p) => [
            ta(`prize_kind.${p.kind}`) + (p.rank ? ` · ${ta('prize.rank', { rank: p.rank })}` : ''),
            locale === 'en' ? p.description_en : p.description_nl,
            formatEuro(locale, p.value_cents),
            ta(`age.${p.min_age_band}`),
            <PrizeActions key={p.prize_id} prizeId={p.prize_id} adult={p.min_age_band === '18_plus'} individual={p.kind === 'earned_individual'} />,
          ])}
        />
      ) : null}
      <div className="adm-actions">
        {status === 'draft' || !status ? (
          <Button variant="secondary" onClick={() => publish.mutate({ params: { id: c.id } })} disabled={publish.isPending}>
            {ta('challenges.publish')}
          </Button>
        ) : null}
        {status !== 'final' ? (
          <>
            <TextField label={ta('challenges.note')} value={note} onChange={(e) => setNote(e.target.value)} optional />
            <Button variant="secondary" onClick={() => propose.mutate({ params: { id: c.id }, body: { winners: [], ...(note.trim() ? { note: note.trim() } : {}) } })} disabled={propose.isPending}>
              {ta('challenges.propose')}
            </Button>
            <Button onClick={() => confirm.mutate({ params: { id: c.id }, body: note.trim() ? { note: note.trim() } : {} })} disabled={confirm.isPending}>
              {ta('challenges.confirm')}
            </Button>
          </>
        ) : null}
      </div>
      <p className="field-hint">{ta('challenges.four_eyes_hint')}</p>
      {error ? <ErrorNote error={error} /> : null}
      {isApiError(confirm.error, 'SAMPLE_REQUIRED') ? (
        <p>
          <Link to="/beheer/steekproef">{ta('challenges.to_sample')}</Link>
        </p>
      ) : null}
      {status === 'final' ? <Notice>{ta('challenges.final')}</Notice> : null}
    </article>
  );
}

function PrizeActions({ prizeId, adult, individual }: { prizeId: string; adult: boolean; individual: boolean }) {
  const { ta } = useTa();
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState({ sample_done: false, anchor: false, minutes: false });
  const [age, setAge] = useState<{ outcome: 'ok' | 'failed'; kind: 'passport' | 'id_card' | 'drivers_license' | 'student_card' }>({ outcome: 'ok', kind: 'id_card' });
  const [contact, setContact] = useState({ name: '', address: '' });
  const verify = useApiMutation('admin.prizes.verify');
  const ageCheck = useApiMutation('admin.prizes.ageCheck');
  const delivery = useApiMutation('admin.prizes.deliveryContact');
  if (!open)
    return (
      <Button variant="link" onClick={() => setOpen(true)}>
        {ta('prize.verify_open')}
      </Button>
    );
  const result = verify.data ?? ageCheck.data ?? delivery.data;
  const error = verify.error ?? ageCheck.error ?? delivery.error;
  return (
    <div className="adm-form">
      <fieldset className="adm-fieldset">
        <legend>{ta('prize.checks')}</legend>
        {(['sample_done', 'anchor', 'minutes'] as const).map((k) => (
          <CheckboxField key={k} label={ta(`prize.check_${k}`)} checked={checks[k]} onChange={(v) => setChecks({ ...checks, [k]: v })} />
        ))}
      </fieldset>
      <Button variant="secondary" onClick={() => verify.mutate({ params: { id: prizeId }, body: { checks } })}>
        {ta('prize.verify')}
      </Button>
      {adult ? (
        <fieldset className="adm-fieldset">
          <legend>{ta('prize.age_check')}</legend>
          <p className="field-hint">{ta('prize.age_hint')}</p>
          <SelectField label={ta('prize.age_outcome')} value={age.outcome} onChange={(e) => setAge({ ...age, outcome: e.target.value as 'ok' | 'failed' })} options={(['ok', 'failed'] as const).map((o) => ({ value: o, label: ta(`prize.age_${o}`) }))} />
          <SelectField
            label={ta('prize.document')}
            value={age.kind}
            onChange={(e) => setAge({ ...age, kind: e.target.value as typeof age.kind })}
            options={(['passport', 'id_card', 'drivers_license', 'student_card'] as const).map((d) => ({ value: d, label: ta(`document.${d}`) }))}
          />
          <Button variant="secondary" onClick={() => ageCheck.mutate({ params: { id: prizeId }, body: { outcome: age.outcome, document_kind: age.kind } })}>
            {ta('prize.age_submit')}
          </Button>
        </fieldset>
      ) : null}
      {individual ? (
        <fieldset className="adm-fieldset">
          <legend>{ta('prize.delivery')}</legend>
          <TextField label={ta('prize.full_name')} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <TextAreaField label={ta('prize.address')} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          <Button variant="secondary" disabled={contact.name.trim().length < 2 || contact.address.trim().length < 5} disabledReason={ta('form.fill_required')} onClick={() => delivery.mutate({ params: { id: prizeId }, body: { full_name: contact.name.trim(), address: contact.address.trim() } })}>
            {ta('prize.delivery_submit')}
          </Button>
        </fieldset>
      ) : null}
      {error ? <ErrorNote error={error} /> : null}
      {result ? <Notice>{ta('prize.status', { status: ta(`prize_status.${result.prize.status}`) })}</Notice> : null}
    </div>
  );
}

function ChallengeCreate() {
  const { ta, locale } = useTa();
  const partners = useApiQuery('admin.partners.list');
  const budgets = useWorkset<Budget>('budgets');
  const [f, setF] = useState({
    type: 'performance' as ChallengeType,
    titleNl: '',
    titleEn: '',
    start: '',
    end: '',
    pool: '',
    threshold: '25',
    dayMinutes: '120',
    days: '5',
    seats: '',
    prize: true,
    prizeKind: 'earned_individual' as 'earned_individual' | 'earned_collective',
    rewardKind: 'in_kind' as 'in_kind' | 'service',
    descNl: '',
    descEn: '',
    value: '',
    partner: '',
    budget: '',
    declaration: '',
    age: '16_17' as AgeBand,
    rank: '',
  });
  const create = useApiMutation('admin.challenges.create', { onSuccess: (r) => upsertWorkset('challenges', r.challenge) });
  const value = parseEuroToCents(f.value);
  const ceiling = f.prizeKind === 'earned_individual' ? LEVEL.individual_prize_max_cents : f.rank === '1' ? LEVEL.main_prize_max_cents : LEVEL.threshold_prize_max_cents;
  const overCeiling = f.prize && Number.isFinite(value) && value > ceiling;
  const prizeOk = !f.prize || (Number.isFinite(value) && value >= 1 && !overCeiling && f.descNl.trim() && f.descEn.trim() && f.partner && f.budget.trim() && f.declaration.trim());
  const valid = f.titleNl.trim() && f.titleEn.trim() && f.start && f.end && f.start <= f.end && prizeOk;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const rules: AdminChallengeCreate['rules'] = {};
    if (f.type === 'performance') {
      if (f.dayMinutes) rules.day_minutes = Number(f.dayMinutes);
      if (f.days) rules.required_days = Number(f.days);
      if (f.seats) rules.seats = Number(f.seats);
    } else if (f.threshold) rules.threshold_rate = Number(f.threshold) / 100;
    create.mutate({
      body: {
        type: f.type,
        title_nl: f.titleNl.trim(),
        title_en: f.titleEn.trim(),
        period_start_day: f.start,
        period_end_day: f.end,
        ...(f.pool ? { pool: f.pool as ClubPool } : {}),
        rules,
        prizes: f.prize
          ? [
              {
                kind: f.prizeKind,
                reward_kind: f.rewardKind,
                description_nl: f.descNl.trim(),
                description_en: f.descEn.trim(),
                value_cents: value,
                partner_id: f.partner,
                budget_id: f.budget.trim(),
                declaration_ref: f.declaration.trim(),
                min_age_band: f.age,
                ...(f.rank ? { rank: Number(f.rank) } : {}),
              },
            ]
          : [],
      },
    });
  };
  return (
    <Block title={ta('challenges.create')}>
      <form className="adm-form adm-grid" onSubmit={submit} aria-label={ta('challenges.create')}>
        <SelectField label={ta('challenges.type')} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ChallengeType })} options={CHALLENGE_TYPES.map((t) => ({ value: t, label: ta(`challenge_type.${t}`) }))} />
        <TextField label={ta('challenges.title_nl')} value={f.titleNl} onChange={(e) => setF({ ...f, titleNl: e.target.value })} required />
        <TextField label={ta('challenges.title_en')} value={f.titleEn} onChange={(e) => setF({ ...f, titleEn: e.target.value })} required />
        <TextField label={ta('challenges.start')} type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} required />
        <TextField label={ta('challenges.end')} type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} required />
        <SelectField label={ta('clubs.pool')} value={f.pool} onChange={(e) => setF({ ...f, pool: e.target.value })} placeholder={ta('challenges.pool_any')} options={POOLS.map((p) => ({ value: p, label: ta(`pool.${p}`) }))} />
        {f.type === 'performance' ? (
          <>
            <TextField label={ta('challenges.day_minutes')} inputMode="numeric" value={f.dayMinutes} onChange={(e) => setF({ ...f, dayMinutes: e.target.value })} />
            <TextField label={ta('challenges.required_days')} inputMode="numeric" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} />
            <TextField label={ta('challenges.seats')} hint={ta('challenges.seats_hint')} inputMode="numeric" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} />
          </>
        ) : (
          <TextField label={ta('challenges.threshold')} hint={ta('challenges.threshold_hint')} inputMode="numeric" value={f.threshold} onChange={(e) => setF({ ...f, threshold: e.target.value })} />
        )}
        <CheckboxField label={ta('challenges.with_prize')} checked={f.prize} onChange={(v) => setF({ ...f, prize: v })} hint={f.type === 'club_warmup' ? ta('challenges.warmup_hint') : undefined} />
        {f.prize ? (
          <>
            <SelectField label={ta('prize.kind')} value={f.prizeKind} onChange={(e) => setF({ ...f, prizeKind: e.target.value as typeof f.prizeKind })} options={(['earned_individual', 'earned_collective'] as const).map((k) => ({ value: k, label: ta(`prize_kind.${k}`) }))} />
            <SelectField label={ta('prize.reward_kind')} value={f.rewardKind} onChange={(e) => setF({ ...f, rewardKind: e.target.value as typeof f.rewardKind })} options={(['in_kind', 'service'] as const).map((k) => ({ value: k, label: ta(`reward_kind.${k}`) }))} />
            <TextField label={ta('prize.description_nl')} value={f.descNl} onChange={(e) => setF({ ...f, descNl: e.target.value })} required />
            <TextField label={ta('prize.description_en')} value={f.descEn} onChange={(e) => setF({ ...f, descEn: e.target.value })} required />
            {f.prizeKind === 'earned_collective' ? <TextField label={ta('prize.rank_label')} hint={ta('prize.rank_hint')} inputMode="numeric" value={f.rank} onChange={(e) => setF({ ...f, rank: e.target.value })} optional /> : null}
            <TextField
              label={ta('prize.value')}
              hint={ta('prize.ceiling', { max: formatEuro(locale, ceiling) })}
              error={overCeiling ? ta('prize.over_ceiling', { max: formatEuro(locale, ceiling) }) : undefined}
              inputMode="decimal"
              value={f.value}
              onChange={(e) => setF({ ...f, value: e.target.value })}
              required
            />
            <SelectField label={ta('budget.partner')} value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} placeholder={ta('form.choose')} options={(partners.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))} required />
            <BudgetPicker value={f.budget} onChange={(v) => setF({ ...f, budget: v })} budgets={budgets} />
            <TextField label={ta('catalog.declaration')} hint={ta('catalog.declaration_hint')} value={f.declaration} onChange={(e) => setF({ ...f, declaration: e.target.value })} required />
            <SelectField label={ta('prize.age')} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value as AgeBand })} options={AGE_BANDS.map((a) => ({ value: a, label: ta(`age.${a}`) }))} />
          </>
        ) : null}
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('challenges.create_submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
        {create.data ? <Notice>{ta('challenges.created')}</Notice> : null}
      </form>
    </Block>
  );
}

/** Budget from the workset, or an id typed in (budgets have no list route in contracts v1). */
function BudgetPicker({ value, onChange, budgets }: { value: string; onChange: (v: string) => void; budgets: readonly Budget[] }) {
  const { ta, locale } = useTa();
  if (budgets.length)
    return (
      <SelectField
        label={ta('budget.budget')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ta('form.choose')}
        required
        options={budgets.map((b) => ({ value: b.id, label: ta('budget.option', { doc: b.document_ref, free: formatEuro(locale, b.free_cents) }) }))}
      />
    );
  return <TextField label={ta('budget.budget_id')} hint={ta('budget.budget_id_hint')} value={value} onChange={(e) => onChange(e.target.value)} required />;
}

// -------------------------------------------------------------------------------- Partners and budget

const PARTNER_KINDS: readonly PartnerKind[] = ['vereniging', 'faculteit', 'sponsor', 'werkgever', 'rewarded'];
const BUDGET_KINDS: readonly BudgetKind[] = ['direct_reward', 'revenue', 'own_budget'];

export function BudgetSection() {
  const { ta } = useTa();
  return (
    <Section title={ta('budget.title')} intro={ta('budget.intro')}>
      <Coverage />
      <Partners />
      <BudgetCreate />
      <Budgets />
    </Section>
  );
}

function Coverage() {
  const { ta, locale } = useTa();
  const overview = useApiQuery('admin.budget.overview');
  const o = overview.data;
  const alarm = o !== undefined && o.coverage_ratio !== null && o.coverage_ratio < 1;
  return (
    <Block title={ta('budget.coverage')}>
      {overview.isPending ? <Loading /> : null}
      {overview.isError ? <ErrorNote error={overview.error} onRetry={() => void overview.refetch()} /> : null}
      {o ? (
        <>
          {alarm ? (
            <div role="alert" className="adm-alarm">
              {ta('budget.alarm', { ratio: formatPct(locale, o.coverage_ratio ?? 0) })}
            </div>
          ) : null}
          <dl className="adm-dl adm-kpis">
            <div>
              <dt>{ta('budget.booked')}</dt>
              <dd>{formatEuro(locale, o.booked_cents)}</dd>
            </div>
            <div>
              <dt>{ta('budget.allocated')}</dt>
              <dd>{formatEuro(locale, o.allocated_cents)}</dd>
            </div>
            <div>
              <dt>{ta('budget.free')}</dt>
              <dd>{formatEuro(locale, o.free_cents)}</dd>
            </div>
            <div>
              <dt>{ta('budget.outstanding_points')}</dt>
              <dd>{new Intl.NumberFormat(locale).format(o.outstanding_points)}</dd>
            </div>
            <div>
              <dt>{ta('budget.outstanding_value')}</dt>
              <dd>{formatEuro(locale, o.outstanding_value_cents)}</dd>
            </div>
            <div>
              <dt>{ta('budget.ratio')}</dt>
              <dd>{o.coverage_ratio === null ? ta('budget.ratio_none') : formatPct(locale, o.coverage_ratio)}</dd>
            </div>
          </dl>
          <p className="field-hint">{ta('budget.weekly_alarm_note')}</p>
        </>
      ) : null}
    </Block>
  );
}

function Partners() {
  const { ta } = useTa();
  const qc = useQueryClient();
  const partners = useApiQuery('admin.partners.list');
  const [f, setF] = useState({ name: '', kind: 'sponsor' as PartnerKind, contact: '' });
  const create = useApiMutation('admin.partners.create', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.partners.list') }) });
  return (
    <Block title={ta('budget.partners')}>
      {partners.isError ? <ErrorNote error={partners.error} /> : null}
      {partners.data ? (
        <Table
          caption={ta('budget.partners')}
          empty={ta('budget.partners_empty')}
          head={[ta('budget.partner_name'), ta('budget.partner_kind'), ta('budget.contact')]}
          rows={partners.data.items.map((p) => [p.name, ta(`partner_kind.${p.kind}`), p.contact_ref ?? '—'])}
        />
      ) : null}
      <form
        className="adm-form adm-grid"
        aria-label={ta('budget.partner_create')}
        onSubmit={(e) => {
          e.preventDefault();
          if (f.name.trim()) create.mutate({ body: { name: f.name.trim(), kind: f.kind, ...(f.contact.trim() ? { contact_ref: f.contact.trim() } : {}) } });
        }}
      >
        <TextField label={ta('budget.partner_name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <SelectField label={ta('budget.partner_kind')} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as PartnerKind })} options={PARTNER_KINDS.map((k) => ({ value: k, label: ta(`partner_kind.${k}`) }))} />
        <TextField label={ta('budget.contact')} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} optional />
        <Button type="submit" variant="secondary" disabled={!f.name.trim() || create.isPending} disabledReason={f.name.trim() ? undefined : ta('form.fill_required')}>
          {ta('budget.partner_create')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
      </form>
    </Block>
  );
}

function BudgetCreate() {
  const { ta } = useTa();
  const qc = useQueryClient();
  const partners = useApiQuery('admin.partners.list');
  const [f, setF] = useState({ partner: '', kind: 'direct_reward' as BudgetKind, amount: '', pct: '100', doc: '', at: '', pool: '' });
  const create = useApiMutation('admin.budgets.create', {
    onSuccess: (r) => {
      upsertWorkset('budgets', r.budget);
      void qc.invalidateQueries({ queryKey: apiKey('admin.budget.overview') });
    },
  });
  const cents = parseEuroToCents(f.amount);
  const valid = f.partner && Number.isFinite(cents) && cents >= 1 && f.doc.trim() && f.at;
  return (
    <Block title={ta('budget.create')}>
      <p className="field-hint">{ta('budget.booked_rule')}</p>
      <form
        className="adm-form adm-grid"
        aria-label={ta('budget.create')}
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          create.mutate({
            params: { id: f.partner },
            body: {
              kind: f.kind,
              booked_cents: cents,
              reward_pct: Number(f.pct) as 20 | 30 | 100,
              document_ref: f.doc.trim(),
              booked_at: f.at,
              ...(f.pool ? { pool: f.pool as 'pilot' | 'research' | 'expansion' } : {}),
            },
          });
        }}
      >
        <SelectField label={ta('budget.partner')} value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} placeholder={ta('form.choose')} required options={(partners.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))} />
        <SelectField label={ta('budget.kind')} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as BudgetKind, pct: e.target.value === 'revenue' ? '20' : '100' })} options={BUDGET_KINDS.map((k) => ({ value: k, label: ta(`budget_kind.${k}`) }))} />
        <TextField label={ta('budget.amount')} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        <SelectField label={ta('budget.pct')} hint={ta('budget.pct_hint')} value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} options={['20', '30', '100'].map((p) => ({ value: p, label: `${p}%` }))} />
        <TextField label={ta('budget.document')} hint={ta('budget.document_hint')} value={f.doc} onChange={(e) => setF({ ...f, doc: e.target.value })} required />
        <TextField label={ta('budget.booked_at')} type="date" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} required />
        {f.kind === 'own_budget' ? (
          <SelectField label={ta('budget.pool')} value={f.pool} onChange={(e) => setF({ ...f, pool: e.target.value })} placeholder={ta('budget.pool_default')} options={(['pilot', 'research', 'expansion'] as const).map((p) => ({ value: p, label: ta(`budget_pool.${p}`) }))} />
        ) : null}
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('budget.create_submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
        {create.data ? <Notice>{ta('budget.created')}</Notice> : null}
      </form>
    </Block>
  );
}

function Budgets() {
  const { ta, locale } = useTa();
  const budgets = useWorkset<Budget>('budgets');
  return (
    <Block title={ta('budget.list')}>
      <p className="field-hint">{ta('budget.list_note')}</p>
      <Table
        caption={ta('budget.list')}
        empty={ta('budget.list_empty')}
        head={[ta('budget.document'), ta('budget.kind'), ta('budget.booked'), ta('budget.allocated'), ta('budget.free'), ta('budget.status'), '']}
        rows={budgets.map((b) => [
          b.document_ref,
          ta(`budget_kind.${b.kind}`) + (b.pool ? ` · ${ta(`budget_pool.${b.pool}`)}` : ''),
          formatEuro(locale, b.booked_cents),
          formatEuro(locale, b.allocated_cents),
          formatEuro(locale, b.free_cents),
          ta(`budget_status.${b.status}`),
          <BudgetCancel key={b.id} budget={b} />,
        ])}
      />
    </Block>
  );
}

function BudgetCancel({ budget }: { budget: Budget }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const cancel = useApiMutation('admin.budgets.cancel', {
    onSuccess: (r) => {
      upsertWorkset('budgets', r.budget);
      void qc.invalidateQueries({ queryKey: apiKey('admin.budget.overview') });
    },
  });
  const cents = parseEuroToCents(amount);
  const reasonOk = /^[a-z][a-z0-9_]{1,47}$/.test(reason);
  if (!open)
    return (
      <Button variant="link" onClick={() => setOpen(true)}>
        {ta('budget.cancel')}
      </Button>
    );
  return (
    <form
      className="adm-form"
      aria-label={ta('budget.cancel')}
      onSubmit={(e) => {
        e.preventDefault();
        if (Number.isFinite(cents) && cents >= 1 && reasonOk) cancel.mutate({ params: { id: budget.id }, body: { cancel_cents: cents, reason_code: reason } });
      }}
    >
      <TextField label={ta('budget.cancel_amount')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <TextField label={ta('budget.cancel_reason')} hint={ta('budget.cancel_reason_hint')} value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button type="submit" variant="danger" disabled={!reasonOk || !Number.isFinite(cents) || cancel.isPending} disabledReason={ta('form.fill_required')}>
        {ta('budget.cancel_submit')}
      </Button>
      {cancel.isError ? <ErrorNote error={cancel.error} /> : null}
    </form>
  );
}

// ------------------------------------------------------------------------------------------- Catalog

const REWARD_KINDS: readonly RewardKind[] = ['in_kind', 'service', 'partner_discount'];

export function Catalog() {
  const { ta } = useTa();
  const rewards = useWorkset<AdminReward>('rewards');
  return (
    <Section title={ta('catalog.title')} intro={ta('catalog.intro')}>
      <p className="field-hint">{ta('catalog.list_note')}</p>
      {rewards.length ? rewards.map((r) => <RewardCard key={r.id} reward={r} />) : <p className="adm-empty">{ta('catalog.empty')}</p>}
      <RewardCreate />
    </Section>
  );
}

function RewardCreate() {
  const { ta, locale } = useTa();
  const partners = useApiQuery('admin.partners.list');
  const budgets = useWorkset<Budget>('budgets');
  const [f, setF] = useState({ partner: '', budget: '', kind: 'in_kind' as RewardKind, collective: false, titleNl: '', titleEn: '', termsNl: '', termsEn: '', cost: '', points: '', age: '16_17' as AgeBand, declaration: '', stock: '' });
  const create = useApiMutation('admin.rewards.create', { onSuccess: (r) => upsertWorkset('rewards', r.reward) });
  const cost = parseEuroToCents(f.cost);
  const points = Number(f.points);
  const stock = Number(f.stock);
  const maxCost = LEVEL.catalog_item_max_cents;
  const overCeiling = Number.isFinite(cost) && cost > maxCost;
  const pointsOk = Number.isInteger(points) && points >= 50 && points % CURRENT_PARAMS.catalog.points_price_rounding === 0;
  const valid =
    f.partner && f.budget.trim() && f.titleNl.trim() && f.titleEn.trim() && f.termsNl.trim() && f.termsEn.trim() && Number.isFinite(cost) && cost >= 1 && !overCeiling && pointsOk && f.declaration.trim() && Number.isInteger(stock) && stock >= 1;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.mutate({
      body: {
        partner_id: f.partner,
        kind: f.kind,
        title_nl: f.titleNl.trim(),
        title_en: f.titleEn.trim(),
        terms_nl: f.termsNl.trim(),
        terms_en: f.termsEn.trim(),
        cost_cents: cost,
        points_price: points,
        min_age_band: f.age,
        declaration_ref: f.declaration.trim(),
        collective: f.collective,
        budget_id: f.budget.trim(),
        stock,
      },
    });
  };
  return (
    <Block title={ta('catalog.create')}>
      <form className="adm-form adm-grid" onSubmit={submit} aria-label={ta('catalog.create')}>
        <SelectField label={ta('budget.partner')} value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} placeholder={ta('form.choose')} required options={(partners.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))} />
        <BudgetPicker value={f.budget} onChange={(v) => setF({ ...f, budget: v })} budgets={budgets} />
        <SelectField label={ta('catalog.kind')} hint={ta('catalog.kind_hint')} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as RewardKind })} options={REWARD_KINDS.map((k) => ({ value: k, label: ta(`reward_kind.${k}`) }))} />
        <CheckboxField label={ta('catalog.collective')} hint={ta('catalog.collective_hint')} checked={f.collective} onChange={(v) => setF({ ...f, collective: v })} />
        <TextField label={ta('catalog.title_nl')} value={f.titleNl} onChange={(e) => setF({ ...f, titleNl: e.target.value })} required />
        <TextField label={ta('catalog.title_en')} value={f.titleEn} onChange={(e) => setF({ ...f, titleEn: e.target.value })} required />
        <TextAreaField label={ta('catalog.terms_nl')} value={f.termsNl} onChange={(e) => setF({ ...f, termsNl: e.target.value })} required />
        <TextAreaField label={ta('catalog.terms_en')} value={f.termsEn} onChange={(e) => setF({ ...f, termsEn: e.target.value })} required />
        <TextField
          label={ta('catalog.cost')}
          hint={ta('catalog.cost_hint', { max: formatEuro(locale, maxCost) })}
          error={overCeiling ? ta('catalog.over_ceiling', { max: formatEuro(locale, maxCost) }) : undefined}
          inputMode="decimal"
          value={f.cost}
          onChange={(e) => setF({ ...f, cost: e.target.value })}
          required
        />
        <TextField label={ta('catalog.points')} hint={ta('catalog.points_hint')} inputMode="numeric" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} error={f.points && !pointsOk ? ta('catalog.points_invalid') : undefined} required />
        <SelectField label={ta('prize.age')} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value as AgeBand })} options={AGE_BANDS.map((a) => ({ value: a, label: ta(`age.${a}`) }))} />
        <TextField label={ta('catalog.declaration')} hint={ta('catalog.declaration_hint')} value={f.declaration} onChange={(e) => setF({ ...f, declaration: e.target.value })} required />
        <TextField label={ta('catalog.stock')} inputMode="numeric" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} required />
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('catalog.create_submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
        {create.data ? <Notice>{ta('catalog.created')}</Notice> : null}
      </form>
    </Block>
  );
}

function RewardCard({ reward: r }: { reward: AdminReward }) {
  const { ta, locale } = useTa();
  const onReward = { onSuccess: (x: { reward: AdminReward }) => upsertWorkset('rewards', x.reward) };
  const [csv, setCsv] = useState('');
  const [cashCheck, setCashCheck] = useState(false);
  const [week, setWeek] = useState('');
  const [perDay, setPerDay] = useState<string[]>(['', '', '', '', '', '', '']);
  const [anchorOnly, setAnchorOnly] = useState('');
  const vouchers = useApiMutation('admin.rewards.vouchers', onReward);
  const publish = useApiMutation('admin.rewards.publish', onReward);
  const releases = useApiMutation('admin.rewards.releases', onReward);
  const days = perDay.map((d) => Number(d || '0'));
  const releaseOk = /^\d{4}-W\d{2}$/.test(week) && days.every((d) => Number.isInteger(d) && d >= 0);
  return (
    <article className="adm-card" aria-labelledby={`rw-${r.id}`}>
      <h3 id={`rw-${r.id}`}>{locale === 'en' ? r.title_en : r.title_nl}</h3>
      <p className="adm-meta">
        <Chip tone={r.status === 'published' ? 'earned' : 'neutral'}>{ta(`reward_status.${r.status}`)}</Chip> {ta(`reward_kind.${r.kind}`)} · {formatEuro(locale, r.cost_cents)} ·{' '}
        {ta('catalog.points_value', { n: r.points_price })} · {ta('catalog.vouchers', { available: r.vouchers_available, total: r.vouchers_total })}
      </p>
      <p>{r.declaration_ref ? ta('catalog.declared', { ref: r.declaration_ref }) : ta('catalog.no_declaration')}</p>
      <Block title={ta('catalog.import')}>
        <form
          className="adm-form"
          aria-label={ta('catalog.import')}
          onSubmit={(e) => {
            e.preventDefault();
            if (csv.trim()) vouchers.mutate({ params: { id: r.id }, body: { csv } });
          }}
        >
          <p className="field-hint">{ta('catalog.import_hint')}</p>
          <label className="field-label" htmlFor={`csv-file-${r.id}`}>
            {ta('catalog.import_file')}
          </label>
          <input
            id={`csv-file-${r.id}`}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void file.text().then(setCsv);
            }}
          />
          <TextAreaField label={ta('catalog.import_text')} value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} />
          <Button type="submit" variant="secondary" disabled={!csv.trim() || vouchers.isPending} disabledReason={csv.trim() ? undefined : ta('catalog.import_empty')}>
            {ta('catalog.import_submit')}
          </Button>
          {vouchers.isError ? <ErrorNote error={vouchers.error} /> : null}
          {vouchers.data ? <Notice>{ta('catalog.imported', { imported: vouchers.data.imported, duplicates: vouchers.data.duplicates })}</Notice> : null}
        </form>
      </Block>
      {r.status !== 'published' ? (
        <Block title={ta('catalog.publish')}>
          <form
            className="adm-form"
            aria-label={ta('catalog.publish')}
            onSubmit={(e) => {
              e.preventDefault();
              if (cashCheck) publish.mutate({ params: { id: r.id }, body: { cash_check: true } });
            }}
          >
            <CheckboxField label={ta('catalog.cash_check')} hint={ta('catalog.cash_check_hint')} checked={cashCheck} onChange={setCashCheck} />
            <Button type="submit" disabled={!cashCheck || publish.isPending} disabledReason={cashCheck ? undefined : ta('catalog.cash_check_reason')}>
              {ta('catalog.publish_submit')}
            </Button>
            {publish.isError ? <ErrorNote error={publish.error} /> : null}
          </form>
        </Block>
      ) : (
        <Notice>{ta('catalog.published')}</Notice>
      )}
      <Block title={ta('catalog.releases')}>
        <form
          className="adm-form"
          aria-label={ta('catalog.releases')}
          onSubmit={(e) => {
            e.preventDefault();
            const anchor = Number(anchorOnly || '0');
            if (releaseOk) releases.mutate({ params: { id: r.id }, body: { week, per_day: days, ...(anchor > 0 ? { anchor_only: anchor } : {}) } });
          }}
        >
          <p className="field-hint">{ta('catalog.releases_hint')}</p>
          <TextField label={ta('catalog.week')} hint={ta('catalog.week_hint')} value={week} onChange={(e) => setWeek(e.target.value)} />
          <div className="adm-days">
            {perDay.map((d, i) => (
              <TextField key={i} label={ta(`weekday.${i}`)} inputMode="numeric" value={d} onChange={(e) => setPerDay(perDay.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
          </div>
          <TextField label={ta('catalog.anchor_only')} hint={ta('catalog.anchor_only_hint')} inputMode="numeric" value={anchorOnly} onChange={(e) => setAnchorOnly(e.target.value)} optional />
          <Button type="submit" variant="secondary" disabled={!releaseOk || releases.isPending} disabledReason={releaseOk ? undefined : ta('catalog.releases_invalid')}>
            {ta('catalog.releases_submit')}
          </Button>
          {releases.isError ? <ErrorNote error={releases.error} /> : null}
          {releases.isSuccess ? <Notice>{ta('form.saved')}</Notice> : null}
        </form>
      </Block>
    </article>
  );
}
