// Operations sections: overview, four eyes, waitlist batches, users, vacation pause, experiments and
// flags (locked assignment, arm B stop, rest-period off, draws placeholder), wellbeing, KPI, support,
// ambassadors and the audit log (spec §4.11, §6.6, §7.2; architecture §3.1, §8.2 Beheer, §10.8).
import type { AdminFlag, AdminUserDetail, FeatureFlagKey, SupportLabel } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button, Chip, TextField } from '../../../design/index.ts';
import { apiKey, useApiMutation, useApiQuery } from '../../../lib/api/index.ts';
import { Block, ErrorNote, formatDateTime, isApiError, Loading, Notice, Section, SelectField, Table, TextAreaField, useTa, useWorkset } from '../ui.tsx';
import type { AdminChallenge } from '@rewarded/contracts';

// ------------------------------------------------------------------------------------------ Overview

export function Overview() {
  const { ta } = useTa();
  const open = useApiQuery('admin.flags.list', { query: { status: 'open' } });
  const appeals = useApiQuery('admin.appeals.list');
  const overview = useApiQuery('admin.budget.overview');
  const waitlist = useApiQuery('admin.waitlist.overview');
  const ratio = overview.data?.coverage_ratio;
  return (
    <Section title={ta('overview.title')} intro={ta('overview.intro')}>
      <dl className="adm-dl adm-kpis">
        <div>
          <dt>
            <Link to="/beheer/wachtrij">{ta('overview.open_flags')}</Link>
          </dt>
          <dd>{open.data ? open.data.items.length : '—'}</dd>
        </div>
        <div>
          <dt>
            <Link to="/beheer/beroepen">{ta('overview.open_appeals')}</Link>
          </dt>
          <dd>{appeals.data ? appeals.data.items.filter((a) => a.status === 'open').length : '—'}</dd>
        </div>
        <div>
          <dt>
            <Link to="/beheer/budget">{ta('overview.coverage')}</Link>
          </dt>
          <dd>{ratio === undefined ? '—' : ratio === null ? ta('budget.ratio_none') : new Intl.NumberFormat(undefined, { style: 'percent' }).format(ratio)}</dd>
        </div>
        <div>
          <dt>
            <Link to="/beheer/wachtlijst">{ta('overview.waiting')}</Link>
          </dt>
          <dd>{waitlist.data ? waitlist.data.total_waiting : '—'}</dd>
        </div>
      </dl>
      {ratio !== undefined && ratio !== null && ratio < 1 ? (
        <div role="alert" className="adm-alarm">
          {ta('overview.coverage_alarm')}
        </div>
      ) : null}
      <p className="field-hint">{ta('overview.principle')}</p>
    </Section>
  );
}

export function SectionNotFound() {
  const { ta } = useTa();
  return (
    <Section title={ta('not_found.title')}>
      <p>
        <Link to="/beheer">{ta('not_found.back')}</Link>
      </p>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------- Four eyes

export function FourEyes() {
  const { ta } = useTa();
  const blocked = useApiQuery('admin.flags.list', { query: { status: 'blocked' } });
  const challenges = useWorkset<AdminChallenge>('challenges');
  const pendingBlocks = (blocked.data?.items ?? []).filter((f: AdminFlag) => !f.block_confirmed_by_ref);
  const pendingResults = challenges.filter((c) => c.final_by_ref && !c.final_confirmed_by_ref);
  return (
    <Section title={ta('four_eyes.title')} intro={ta('four_eyes.intro')}>
      <Block title={ta('four_eyes.blocks')}>
        {blocked.isPending ? <Loading /> : null}
        {blocked.isError ? <ErrorNote error={blocked.error} /> : null}
        <Table
          caption={ta('four_eyes.blocks')}
          empty={ta('four_eyes.none')}
          head={[ta('four_eyes.object'), ta('four_eyes.first'), '']}
          rows={pendingBlocks.map((f) => [`${f.code} · ${f.subject_ref ?? '—'}`, f.decided_by_ref ?? '—', <Link key={f.id} to="/beheer/wachtrij">{ta('four_eyes.to_queue')}</Link>])}
        />
      </Block>
      <Block title={ta('four_eyes.results')}>
        <Table
          caption={ta('four_eyes.results')}
          empty={ta('four_eyes.none')}
          head={[ta('four_eyes.object'), ta('four_eyes.first'), '']}
          rows={pendingResults.map((c) => [c.title_nl, c.final_by_ref ?? '—', <Link key={c.id} to="/beheer/challenges">{ta('four_eyes.to_challenges')}</Link>])}
        />
      </Block>
      <p className="field-hint">{ta('four_eyes.other')}</p>
    </Section>
  );
}

// ----------------------------------------------------------------------------------------- Waitlist

export function Waitlist() {
  const { ta, locale } = useTa();
  const qc = useQueryClient();
  const overview = useApiQuery('admin.waitlist.overview');
  const [count, setCount] = useState('20');
  const preview = useApiMutation('admin.waitlist.inviteBatch');
  const invite = useApiMutation('admin.waitlist.inviteBatch', {
    onSuccess: () => {
      preview.reset();
      void qc.invalidateQueries({ queryKey: apiKey('admin.waitlist.overview') });
    },
  });
  const n = Number(count);
  const valid = Number.isInteger(n) && n >= 1 && n <= 500;
  return (
    <Section title={ta('waitlist.title')} intro={ta('waitlist.intro')}>
      {overview.isPending ? <Loading /> : null}
      {overview.isError ? <ErrorNote error={overview.error} onRetry={() => void overview.refetch()} /> : null}
      {overview.data ? (
        <Table
          caption={ta('waitlist.caption', { total: overview.data.total_waiting })}
          head={[ta('waitlist.class'), ta('waitlist.waiting'), ta('waitlist.groups'), ta('waitlist.invited'), ta('waitlist.oldest')]}
          rows={overview.data.classes.map((c) => [ta(`priority.${c.priority_reason}`), c.waiting, c.groups, c.invited, c.oldest_at ? formatDateTime(locale, c.oldest_at) : '—'])}
        />
      ) : null}
      <form
        className="adm-form"
        aria-label={ta('waitlist.form_label')}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) preview.mutate({ body: { count: n, dry_run: true } });
        }}
      >
        <TextField label={ta('waitlist.count')} hint={ta('waitlist.count_hint')} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={!valid || preview.isPending} disabledReason={valid ? undefined : ta('waitlist.count_invalid')}>
          {ta('waitlist.preview')}
        </Button>
      </form>
      {preview.isError ? <ErrorNote error={preview.error} /> : null}
      {preview.data ? (
        <Block title={ta('waitlist.preview_title')}>
          <p>{ta('waitlist.preview_summary', { entries: preview.data.entries_invited, invites: preview.data.invites.length })}</p>
          <Table caption={ta('waitlist.preview_title')} head={[ta('waitlist.class'), ta('waitlist.group_size')]} rows={preview.data.invites.map((i) => [ta(`priority.${i.priority_reason}`), i.group_size])} />
          <Button onClick={() => invite.mutate({ body: { count: n } })} disabled={invite.isPending}>
            {ta('waitlist.invite', { n: preview.data.entries_invited })}
          </Button>
        </Block>
      ) : null}
      {invite.isError ? <ErrorNote error={invite.error} /> : null}
      {invite.data ? <Notice>{ta('waitlist.invited_done', { entries: invite.data.entries_invited, invites: invite.data.invites.length })}</Notice> : null}
    </Section>
  );
}

// -------------------------------------------------------------------------------------------- Users

export function Users() {
  const { ta } = useTa();
  const [q, setQ] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState<{ q: string; reason: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const result = useApiQuery('admin.users.search', { query: search ?? { q: '', reason: '' } }, { enabled: search !== null });
  const valid = q.trim().length >= 2 && reason.trim().length > 0;
  return (
    <Section title={ta('users.title')} intro={ta('users.intro')}>
      <form
        className="adm-form adm-grid"
        aria-label={ta('users.search')}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (valid) {
            setSelected(null);
            setSearch({ q: q.trim(), reason: reason.trim() });
          }
        }}
      >
        <TextField label={ta('users.query')} value={q} onChange={(e) => setQ(e.target.value)} required />
        <TextField label={ta('users.reason')} hint={ta('users.reason_hint')} value={reason} onChange={(e) => setReason(e.target.value)} required />
        <Button type="submit" disabled={!valid} disabledReason={valid ? undefined : ta('users.search_reason')}>
          {ta('users.search')}
        </Button>
      </form>
      {result.isError ? <ErrorNote error={result.error} /> : null}
      {result.data ? (
        <Table
          caption={ta('users.results')}
          empty={ta('users.empty')}
          head={[ta('users.name'), ta('users.email'), ta('users.age'), ta('users.status'), ta('users.team'), '']}
          rows={result.data.items.map((u) => [
            u.first_name,
            u.email,
            ta(`age.${u.age_band}`),
            ta(`user_status.${u.status}`),
            u.is_team ? ta('users.team_yes') : ta('users.team_no'),
            <Button key={u.id} variant="link" onClick={() => setSelected(u.id)}>
              {ta('users.open', { name: u.first_name })}
            </Button>,
          ])}
        />
      ) : null}
      {selected && search ? <UserDetail id={selected} reason={search.reason} /> : null}
    </Section>
  );
}

function UserDetail({ id, reason }: { id: string; reason: string }) {
  const { ta, locale } = useTa();
  const qc = useQueryClient();
  const detail = useApiQuery('admin.users.get', { params: { id }, query: { reason } });
  const team = useApiMutation('admin.users.teamFlag', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.users.get') }) });
  const del = useApiMutation('admin.users.delete');
  const d: AdminUserDetail | undefined = detail.data;
  return (
    <Block title={ta('users.detail')}>
      {detail.isPending ? <Loading /> : null}
      {detail.isError ? <ErrorNote error={detail.error} /> : null}
      {d ? (
        <>
          <p>
            {d.user.first_name} · {d.user.email} · {ta(`age.${d.user.age_band}`)} · {ta(`user_status.${d.user.status}`)} · {ta('users.open_flags', { n: d.open_flags })}
          </p>
          <Table
            caption={ta('users.sessions')}
            empty={ta('users.no_sessions')}
            head={[ta('session.day'), ta('session.start'), ta('session.planned'), ta('session.status'), ta('session.review')]}
            rows={d.sessions.map((s) => [s.focus_day, formatDateTime(locale, s.server_start_at), ta('session.minutes', { n: s.planned_min }), ta(`session_status.${s.status}`), ta(`review_status.${s.review_status}`)])}
          />
          <div className="adm-actions">
            {!d.user.is_team ? (
              <Button variant="secondary" onClick={() => team.mutate({ params: { id } })} disabled={team.isPending}>
                {ta('users.make_team')}
              </Button>
            ) : null}
            <Button variant="danger" onClick={() => del.mutate({ params: { id } })} disabled={del.isPending || d.user.status === 'deleted'}>
              {ta('users.delete')}
            </Button>
          </div>
          <p className="field-hint">{ta('users.delete_hint')}</p>
          {team.isError ? <ErrorNote error={team.error} /> : null}
          {del.isError && isApiError(del.error, 'FOUR_EYES_REQUIRED') ? <Notice>{ta('users.delete_pending')}</Notice> : del.isError ? <ErrorNote error={del.error} /> : null}
          {del.data ? <Notice>{ta('users.deleted')}</Notice> : null}
          <p className="field-hint">{ta('users.block_note')}</p>
        </>
      ) : null}
    </Block>
  );
}

// ----------------------------------------------------------------------------------- Vacation pause

export function VacationPause() {
  const { ta } = useTa();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const save = useApiMutation('admin.vacationPause');
  const valid = start && end && start <= end;
  return (
    <Section title={ta('vacation.title')} intro={ta('vacation.intro')}>
      <form
        className="adm-form adm-grid"
        aria-label={ta('vacation.title')}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) save.mutate({ body: { start_day: start, end_day: end } });
        }}
      >
        <TextField label={ta('vacation.start')} type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        <TextField label={ta('vacation.end')} type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
        <Button type="submit" disabled={!valid || save.isPending} disabledReason={valid ? undefined : ta('vacation.invalid')}>
          {ta('vacation.submit')}
        </Button>
        {save.isError ? <ErrorNote error={save.error} /> : null}
        {save.data ? <Notice>{ta('vacation.saved', { start: save.data.start_day, end: save.data.end_day })}</Notice> : null}
      </form>
    </Section>
  );
}

// ------------------------------------------------------------------------- Experiments and flags

const FLAG_KEYS: readonly FeatureFlagKey[] = ['referral', 'cards', 'duels', 'belofte', 'arm_b', 'rest_period', 'squad_prompt', 'no_points_mode', 'plus_door', 'reminders', 'draws'];

export function Experiments() {
  const { ta, locale } = useTa();
  const exp = useApiQuery('admin.experiments');
  return (
    <Section title={ta('experiments.title')} intro={ta('experiments.intro')}>
      <p className="adm-locked">
        <Chip tone="neutral">{ta('experiments.locked')}</Chip> {ta('experiments.locked_text')}
      </p>
      {exp.isPending ? <Loading /> : null}
      {exp.isError ? <ErrorNote error={exp.error} onRetry={() => void exp.refetch()} /> : null}
      {exp.data ? (
        <>
          <Table
            caption={ta('experiments.assignments')}
            empty={ta('experiments.none')}
            head={[ta('experiments.unit'), ta('experiments.factor'), ta('experiments.arm'), ta('experiments.stratum'), ta('experiments.block'), ta('experiments.at')]}
            rows={exp.data.assignments.map((a) => [`${ta(`unit.${a.unit_type}`)} ${a.unit_ref}`, ta(`factor.${a.factor}`), a.arm, a.stratum, a.block, formatDateTime(locale, a.assigned_at)])}
          />
          <Table
            caption={ta('experiments.switches')}
            empty={ta('experiments.none')}
            head={[ta('experiments.user'), ta('experiments.factor'), ta('experiments.from_to'), ta('experiments.reason'), ta('experiments.at')]}
            rows={exp.data.switches.map((s) => [s.user_ref, ta(`factor.${s.factor}`), `${s.from} → ${s.to}`, ta(`switch_reason.${s.reason}`), formatDateTime(locale, s.at)])}
          />
        </>
      ) : null}
      <ArmBStop />
      <Wellbeing />
      <FeatureFlagsBlock />
    </Section>
  );
}

function ArmBStop() {
  const { ta } = useTa();
  const [reason, setReason] = useState('');
  const stop = useApiMutation('admin.experiments.stopArmB');
  return (
    <Block title={ta('arm_b.title')}>
      <p>{ta('arm_b.intro')}</p>
      <form
        className="adm-form"
        aria-label={ta('arm_b.title')}
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim()) stop.mutate({ body: { reason: reason.trim() } });
        }}
      >
        <TextAreaField label={ta('arm_b.reason')} value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={1000} />
        <Button type="submit" variant="danger" disabled={!reason.trim() || stop.isPending} disabledReason={reason.trim() ? undefined : ta('form.reason_required')}>
          {ta('arm_b.submit')}
        </Button>
        {stop.isError ? <ErrorNote error={stop.error} /> : null}
        {stop.data ? <Notice>{stop.data.pending_confirmation ? ta('arm_b.pending', { day: stop.data.effective_from_day }) : ta('arm_b.done', { day: stop.data.effective_from_day })}</Notice> : null}
      </form>
    </Block>
  );
}

function Wellbeing() {
  const { ta } = useTa();
  const summary = useApiQuery('admin.wellbeing.summary');
  const data = summary.data;
  const arms = data ? [...new Set(data.signals.map((s) => s.arm))].sort() : [];
  const codes = ['S1', 'S2', 'S3', 'S4'] as const;
  return (
    <Block title={ta('wellbeing.title')}>
      <p className="field-hint">{ta('wellbeing.intro')}</p>
      {summary.isError ? <ErrorNote error={summary.error} /> : null}
      {data ? (
        <>
          <Table
            caption={ta('wellbeing.caption')}
            head={[ta('wellbeing.code'), ...arms.map((a) => ta('wellbeing.arm', { arm: a }))]}
            rows={codes.map((c) => [ta(`harm.${c}`), ...arms.map((a) => data.signals.find((s) => s.code === c && s.arm === a)?.count ?? 0)])}
          />
          <p>
            {data.stop_rule.triggered ? <Chip tone="pause">{ta('wellbeing.stop_triggered')}</Chip> : null}{' '}
            {ta('wellbeing.stop_rule', { count: data.stop_rule.count, threshold: data.stop_rule.threshold })}
          </p>
        </>
      ) : null}
    </Block>
  );
}

function FeatureFlagsBlock() {
  const { ta } = useTa();
  const [results, setResults] = useState<Partial<Record<FeatureFlagKey, string>>>({});
  const put = useApiMutation('admin.featureFlags.put', {
    onSuccess: (r) => setResults((x) => ({ ...x, [r.key]: r.pending_confirmation ? ta('flags.pending') : r.enabled ? ta('flags.now_on') : ta('flags.now_off') })),
  });
  return (
    <Block title={ta('flags.title')}>
      <p className="field-hint">{ta('flags.intro')}</p>
      <Table
        caption={ta('flags.title')}
        head={[ta('flags.key'), ta('flags.rule'), '']}
        rows={FLAG_KEYS.map((k) => [
          ta(`flag.${k}`),
          ta(`flags.rule_${k === 'draws' ? 'draws' : k === 'arm_b' || k === 'rest_period' ? 'four_eyes' : 'plain'}`),
          k === 'draws' ? (
            ta('flags.draws_locked')
          ) : (
            <span key={k} className="adm-actions">
              <Button variant="secondary" onClick={() => put.mutate({ params: { key: k }, body: { enabled: true } })} aria-label={ta('flags.on_label', { flag: ta(`flag.${k}`) })}>
                {ta('flags.on')}
              </Button>
              <Button variant="secondary" onClick={() => put.mutate({ params: { key: k }, body: { enabled: false } })} aria-label={ta('flags.off_label', { flag: ta(`flag.${k}`) })}>
                {k === 'rest_period' ? ta('flags.rest_off') : ta('flags.off')}
              </Button>
              {results[k] ? <span role="status">{results[k]}</span> : null}
            </span>
          ),
        ])}
      />
      {put.isError ? <ErrorNote error={put.error} /> : null}
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------- KPI

/** Stored queries of the KPI module (mirror of apps/api modules/kpi KPI_NAMES, spec §7.2). */
export const KPI_QUERIES = [
  'activation',
  'd7_go_no_go',
  'd30_post_season',
  'january_actives_cd',
  'fraud_estimate',
  'costs',
  'harm_threshold',
  'guard_rule_rest',
  'harm_per_arm',
  'squad_share',
  'squad_survival',
  'squad_reactivation',
  'club_participation',
  'exits_per_arm',
  'mixed_rest_squads',
  'eligible_without_redemption',
  'k_factor',
  'flag_queue_load',
  'rejected_after_review',
  'reward_hunters',
  'w3_retention',
  'belofte',
  'abort_recovery',
  'mode_and_plus',
] as const;

export function Kpi() {
  const { ta, locale } = useTa();
  const [name, setName] = useState<(typeof KPI_QUERIES)[number]>('activation');
  const [clean, setClean] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const query = clean ? `${name}_clean` : name;
  const kpi = useApiQuery('admin.kpi.query', { params: { query }, query: { ...(from ? { from } : {}), ...(to ? { to } : {}) } });
  return (
    <Section title={ta('kpi.title')} intro={ta('kpi.intro')}>
      <div className="adm-grid">
        <SelectField label={ta('kpi.query')} value={name} onChange={(e) => setName(e.target.value as typeof name)} options={KPI_QUERIES.map((q) => ({ value: q, label: ta(`kpi_name.${q}`) }))} />
        <SelectField
          label={ta('kpi.variant')}
          value={clean ? 'clean' : 'all'}
          onChange={(e) => setClean(e.target.value === 'clean')}
          options={[
            { value: 'all', label: ta('kpi.variant_all') },
            { value: 'clean', label: ta('kpi.variant_clean') },
          ]}
        />
        <TextField label={ta('kpi.from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} optional />
        <TextField label={ta('kpi.to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} optional />
      </div>
      <p className="field-hint">{ta('kpi.team_excluded')}</p>
      {kpi.isPending ? <Loading /> : null}
      {kpi.isError ? <ErrorNote error={kpi.error} onRetry={() => void kpi.refetch()} /> : null}
      {kpi.data ? (
        <>
          <Table caption={ta('kpi.caption', { name: ta(`kpi_name.${name}`) })} empty={ta('kpi.empty')} head={kpi.data.columns} rows={kpi.data.rows.map((r) => r.map((c) => (c === null ? '—' : typeof c === 'number' ? new Intl.NumberFormat(locale).format(c) : c)))} />
          <p className="field-hint">{ta('kpi.computed', { at: formatDateTime(locale, kpi.data.computed_at) })}</p>
        </>
      ) : null}
    </Section>
  );
}

// ------------------------------------------------------------------------------------------ Support

const LABELS: readonly SupportLabel[] = ['uitbetalen', 'focus', 'vrienden', 'techniek', 'welzijn'];

export function Support() {
  const { ta, locale } = useTa();
  const qc = useQueryClient();
  const list = useApiQuery('admin.support.list');
  const patch = useApiMutation('admin.support.patch', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.support.list') }) });
  const create = useApiMutation('admin.support.create', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.support.list') }) });
  const replace = useApiMutation('admin.redemptions.replace');
  const [ext, setExt] = useState({ label: 'focus' as SupportLabel, day: '' });
  return (
    <Section title={ta('support.title')} intro={ta('support.intro')}>
      {list.isError ? <ErrorNote error={list.error} /> : null}
      {list.data ? (
        <Table
          caption={ta('support.caption')}
          empty={ta('support.empty')}
          head={[ta('support.kind'), ta('support.text'), ta('support.label'), ta('support.status'), ta('support.at'), '']}
          rows={list.data.items.map((t) => [
            ta(`support_kind.${t.kind}`),
            t.text ?? '—',
            <SelectField
              key={`l-${t.id}`}
              label={ta('support.label')}
              value={t.label ?? ''}
              placeholder={ta('support.no_label')}
              onChange={(e) => e.target.value && patch.mutate({ params: { id: t.id }, body: { label: e.target.value as SupportLabel } })}
              options={LABELS.map((l) => ({ value: l, label: ta(`support_label.${l}`) }))}
            />,
            ta(`support_status.${t.status}`),
            formatDateTime(locale, t.created_at),
            <span key={t.id} className="adm-actions">
              {t.kind === 'redemption_broken' && t.ref_id ? (
                <Button variant="secondary" onClick={() => replace.mutate({ params: { id: t.ref_id! }, body: { note: ta('support.replace_note') } })}>
                  {ta('support.replace')}
                </Button>
              ) : null}
              {t.status === 'open' ? (
                <Button variant="secondary" onClick={() => patch.mutate({ params: { id: t.id }, body: { status: 'resolved' } })}>
                  {ta('support.resolve')}
                </Button>
              ) : null}
            </span>,
          ])}
        />
      ) : null}
      {replace.data ? <Notice>{ta('support.replaced', { code: replace.data.redemption.voucher_code })}</Notice> : null}
      {replace.isError || patch.isError ? <ErrorNote error={replace.error ?? patch.error} /> : null}
      <p className="field-hint">{ta('support.wellbeing_note')}</p>
      <Block title={ta('support.external')}>
        <form
          className="adm-form adm-grid"
          aria-label={ta('support.external')}
          onSubmit={(e) => {
            e.preventDefault();
            if (ext.day) create.mutate({ body: { label: ext.label, received_on: ext.day } });
          }}
        >
          <p className="field-hint">{ta('support.external_hint')}</p>
          <SelectField label={ta('support.label')} value={ext.label} onChange={(e) => setExt({ ...ext, label: e.target.value as SupportLabel })} options={LABELS.map((l) => ({ value: l, label: ta(`support_label.${l}`) }))} />
          <TextField label={ta('support.received_on')} type="date" value={ext.day} onChange={(e) => setExt({ ...ext, day: e.target.value })} required />
          <Button type="submit" variant="secondary" disabled={!ext.day || create.isPending} disabledReason={ext.day ? undefined : ta('form.fill_required')}>
            {ta('support.external_submit')}
          </Button>
          {create.isError ? <ErrorNote error={create.error} /> : null}
        </form>
      </Block>
    </Section>
  );
}

// -------------------------------------------------------------------------------------- Ambassadors

export function Ambassadors() {
  const { ta } = useTa();
  const qc = useQueryClient();
  const list = useApiQuery('admin.ambassadors.list');
  const clubs = useApiQuery('admin.clubs.list');
  const [f, setF] = useState({ name: '', board: '', cap: '50' });
  const create = useApiMutation('admin.ambassadors.create', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.ambassadors.list') }) });
  const cap = Number(f.cap);
  const valid = f.name.trim() && Number.isInteger(cap) && cap >= 1 && cap <= 1000;
  return (
    <Section title={ta('ambassadors.title')} intro={ta('ambassadors.intro')}>
      {list.isError ? <ErrorNote error={list.error} /> : null}
      {list.data ? (
        <Table caption={ta('ambassadors.caption')} empty={ta('ambassadors.empty')} head={[ta('ambassadors.name'), ta('ambassadors.registered'), ta('ambassadors.cap')]} rows={list.data.items.map((a) => [a.name_ref, a.registered, a.cap_users])} />
      ) : null}
      <p className="field-hint">{ta('ambassadors.payout_missing')}</p>
      <form
        className="adm-form adm-grid"
        aria-label={ta('ambassadors.create')}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate({ body: { name_ref: f.name.trim(), cap_users: cap, ...(f.board ? { is_board_member_of: f.board } : {}) } });
        }}
      >
        <TextField label={ta('ambassadors.name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <SelectField label={ta('ambassadors.board')} hint={ta('ambassadors.board_hint')} value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })} placeholder={ta('ambassadors.board_none')} options={(clubs.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <TextField label={ta('ambassadors.cap')} inputMode="numeric" value={f.cap} onChange={(e) => setF({ ...f, cap: e.target.value })} />
        <Button type="submit" variant="secondary" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('ambassadors.create')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
      </form>
    </Section>
  );
}

// --------------------------------------------------------------------------------------- Audit log

export function Audit() {
  const { ta, locale } = useTa();
  const [object, setObject] = useState('');
  const [actor, setActor] = useState('');
  const [filter, setFilter] = useState<{ object?: string; actor?: string }>({});
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const audit = useApiQuery('admin.audit', { query: { ...filter, ...(cursor ? { cursor } : {}) } });
  return (
    <Section title={ta('audit.title')} intro={ta('audit.intro')}>
      <form
        className="adm-form adm-grid"
        aria-label={ta('audit.filter')}
        onSubmit={(e) => {
          e.preventDefault();
          setCursor(undefined);
          setFilter({ ...(object.trim() ? { object: object.trim() } : {}), ...(actor.trim() ? { actor: actor.trim() } : {}) });
        }}
      >
        <TextField label={ta('audit.object')} value={object} onChange={(e) => setObject(e.target.value)} optional />
        <TextField label={ta('audit.actor')} value={actor} onChange={(e) => setActor(e.target.value)} optional />
        <Button type="submit" variant="secondary">
          {ta('audit.filter')}
        </Button>
      </form>
      {audit.isPending ? <Loading /> : null}
      {audit.isError ? <ErrorNote error={audit.error} onRetry={() => void audit.refetch()} /> : null}
      {audit.data ? (
        <>
          <Table
            caption={ta('audit.caption')}
            empty={ta('audit.empty')}
            head={[ta('audit.at'), ta('audit.actor'), ta('audit.action'), ta('audit.object'), ta('audit.reason')]}
            rows={audit.data.items.map((a) => [formatDateTime(locale, a.at), a.actor_ref, a.action, `${a.object_type} ${a.object_ref}`, a.reason ?? '—'])}
          />
          {audit.data.next_cursor ? (
            <Button variant="secondary" onClick={() => setCursor(audit.data.next_cursor ?? undefined)}>
              {ta('audit.more')}
            </Button>
          ) : null}
          <p className="field-hint">{ta('audit.immutable')}</p>
        </>
      ) : null}
    </Section>
  );
}
