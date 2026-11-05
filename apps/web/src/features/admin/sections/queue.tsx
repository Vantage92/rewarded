// Review sections: fraud queue with decisions and reason codes, block confirmation (four eyes),
// session restore, appeals, the weekly and prize sample, first redemptions and outages
// (spec §4.11 Fraudewachtrij, Steekproef, Eerste verzilveringen; §6.4, §6.5, §6.7; architecture §10.8).
import type { AdminAppeal, AdminFlag, FlagDecision, RestoreReason, SampleItem, SampleJudgement } from '@rewarded/contracts';
import { FLAG_REASON_CODES, SAMPLE_REASON_CODES } from '@rewarded/core/fraud';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button, Chip, Segment, TextField } from '../../../design/index.ts';
import { apiKey, useApiMutation, useApiQuery } from '../../../lib/api/index.ts';
import { Block, CheckboxField, ErrorNote, formatDateTime, Loading, Notice, Section, SelectField, Table, TextAreaField, useTa } from '../ui.tsx';

const FLAG_STATUSES = ['open', 'blocked', 'released', 'rejected', 'closed'] as const;
const RESTORE_REASONS: readonly RestoreReason[] = ['outage', 'late_log', 'appeal_upheld'];

export function Queue() {
  const { ta } = useTa();
  const [status, setStatus] = useState<(typeof FLAG_STATUSES)[number]>('open');
  const flags = useApiQuery('admin.flags.list', { query: { status } });
  return (
    <Section title={ta('queue.title')} intro={ta('queue.intro')}>
      <SelectField
        label={ta('queue.filter')}
        value={status}
        onChange={(e) => setStatus(e.target.value as (typeof FLAG_STATUSES)[number])}
        options={FLAG_STATUSES.map((s) => ({ value: s, label: ta(`flag_status.${s}`) }))}
      />
      {flags.isPending ? <Loading /> : null}
      {flags.isError ? <ErrorNote error={flags.error} onRetry={() => void flags.refetch()} /> : null}
      {flags.data && !flags.data.items.length ? <p className="adm-empty">{ta('queue.empty')}</p> : null}
      {flags.data?.items.map((f) => <FlagCard key={f.id} flag={f} />)}
    </Section>
  );
}

function FlagCard({ flag }: { flag: AdminFlag }) {
  const { ta, locale } = useTa();
  const pendingBlock = flag.status === 'blocked' && !flag.block_confirmed_by_ref;
  return (
    <article className="adm-card" aria-labelledby={`flag-${flag.id}`}>
      <h3 id={`flag-${flag.id}`}>
        {ta('queue.flag_heading', { code: flag.code, subject: flag.subject_ref ?? ta('queue.no_subject') })}
      </h3>
      <p className="adm-meta">
        <Chip tone={flag.status === 'open' ? 'pause' : 'neutral'}>{ta(`flag_status.${flag.status}`)}</Chip> {ta(`flag_code.${flag.code}`)} ·{' '}
        {ta('queue.created', { at: formatDateTime(locale, flag.created_at) })}
        {flag.reason_code ? ` · ${ta('queue.reason', { reason: reasonLabel(ta, flag.reason_code) })}` : ''}
      </p>
      <Block title={ta('queue.evidence')}>
        <dl className="adm-dl">
          {Object.entries(flag.evidence).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(v)}</dd>
            </div>
          ))}
        </dl>
      </Block>
      {flag.sessions.length ? <FlagSessions flag={flag} /> : null}
      {flag.status === 'open' ? <DecisionForm flag={flag} /> : null}
      {pendingBlock ? <BlockConfirm flag={flag} /> : null}
    </article>
  );
}

type Ta = (key: string, vars?: Record<string, string | number>) => string;

/** Label of a reason code in plain language; unknown codes stay visible as they are. */
export function reasonLabel(ta: Ta, code: string): string {
  const label = ta(`reasons.${code}`);
  return label.startsWith('admin:') || label === `reasons.${code}` ? code : label;
}

function FlagSessions({ flag }: { flag: AdminFlag }) {
  const { ta, locale } = useTa();
  const [restoring, setRestoring] = useState<string | null>(null);
  return (
    <Block title={ta('queue.sessions')}>
      <Table
        caption={ta('queue.sessions_caption')}
        head={[ta('session.day'), ta('session.start'), ta('session.planned'), ta('session.status'), ta('session.review'), ta('session.net'), ta('session.action')]}
        rows={flag.sessions.map((s) => [
          s.focus_day,
          formatDateTime(locale, s.server_start_at),
          ta('session.minutes', { n: s.planned_min }),
          s.status === 'aborted' && s.abort_reason ? `${ta('session_status.aborted')} (${s.abort_reason})` : ta(`session_status.${s.status}`),
          ta(`review_status.${s.review_status}`),
          ta(`net.${s.net_class}`),
          s.status === 'aborted' ? (
            <Button key={s.session_id} variant="secondary" onClick={() => setRestoring(s.session_id)} aria-expanded={restoring === s.session_id}>
              {ta('restore.open')}
            </Button>
          ) : (
            '—'
          ),
        ])}
      />
      {restoring ? <RestoreForm sessionId={restoring} onDone={() => setRestoring(null)} /> : null}
    </Block>
  );
}

/** Restore an aborted session as completed, only with objective evidence (spec §6.4, architecture §4.8). */
export function RestoreForm({ sessionId, onDone }: { sessionId: string; onDone?: () => void }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [reason, setReason] = useState<RestoreReason>('outage');
  const [note, setNote] = useState('');
  const restore = useApiMutation('admin.sessions.restore', {
    onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.flags.list') }),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (note.trim()) restore.mutate({ params: { id: sessionId }, body: { reason_code: reason, note: note.trim() } });
  };
  return (
    <form className="adm-form" onSubmit={submit} aria-label={ta('restore.form_label')}>
      <p>{ta('restore.intro')}</p>
      <SelectField label={ta('restore.reason')} value={reason} onChange={(e) => setReason(e.target.value as RestoreReason)} options={RESTORE_REASONS.map((r) => ({ value: r, label: ta(`restore_reason.${r}`) }))} />
      <TextAreaField label={ta('restore.note')} hint={ta('restore.note_hint')} value={note} onChange={(e) => setNote(e.target.value)} required maxLength={1000} />
      <Button type="submit" disabled={!note.trim() || restore.isPending} disabledReason={note.trim() ? undefined : ta('form.note_required')}>
        {ta('restore.submit')}
      </Button>
      {restore.isError ? <ErrorNote error={restore.error} /> : null}
      {restore.data ? (
        <Notice>
          {ta('restore.done', { status: ta(`session_status.${restore.data.verdict.status}`), minutes: restore.data.verdict.verified_min })}{' '}
          {onDone ? (
            <Button variant="link" onClick={onDone}>
              {ta('actions.close')}
            </Button>
          ) : null}
        </Notice>
      ) : null}
    </form>
  );
}

function DecisionForm({ flag }: { flag: AdminFlag }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [decision, setDecision] = useState<FlagDecision>('release');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const decide = useApiMutation('admin.flags.decide', {
    onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.flags.list') }),
  });
  const codes = FLAG_REASON_CODES[decision];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (reason) decide.mutate({ params: { id: flag.id }, body: { decision, reason_code: reason, note: note.trim() } });
  };
  return (
    <form className="adm-form" onSubmit={submit} aria-label={ta('decision.form_label', { code: flag.code })}>
      <Segment
        label={ta('decision.label')}
        value={decision}
        onChange={(d) => {
          setDecision(d);
          setReason('');
        }}
        options={(['release', 'reject', 'block'] as const).map((d) => ({ value: d, label: ta(`decision.${d}`) }))}
      />
      {decision === 'block' ? <p className="field-hint">{ta('decision.block_hint')}</p> : null}
      <SelectField
        label={ta('decision.reason')}
        hint={ta('decision.reason_hint')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={ta('form.choose')}
        required
        options={codes.map((c) => ({ value: c, label: reasonLabel(ta, c) }))}
      />
      <TextAreaField label={ta('decision.note')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
      <Button type="submit" disabled={!reason || decide.isPending} disabledReason={reason ? undefined : ta('form.reason_required')}>
        {ta('decision.submit')}
      </Button>
      {decide.isError ? <ErrorNote error={decide.error} /> : null}
    </form>
  );
}

function BlockConfirm({ flag }: { flag: AdminFlag }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const confirm = useApiMutation('admin.blocks.confirm', {
    onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.flags.list') }),
  });
  return (
    <form
      className="adm-form"
      aria-label={ta('block.form_label')}
      onSubmit={(e) => {
        e.preventDefault();
        if (note.trim()) confirm.mutate({ params: { id: flag.id }, body: { note: note.trim() } });
      }}
    >
      <p>{ta('block.intro', { by: flag.decided_by_ref ?? '—' })}</p>
      <TextAreaField label={ta('block.note')} value={note} onChange={(e) => setNote(e.target.value)} required maxLength={2000} />
      <Button type="submit" variant="danger" disabled={!note.trim() || confirm.isPending} disabledReason={note.trim() ? undefined : ta('form.note_required')}>
        {ta('block.submit')}
      </Button>
      {confirm.isError ? <ErrorNote error={confirm.error} /> : null}
      {confirm.data ? <Notice>{ta('block.done')}</Notice> : null}
    </form>
  );
}

// ------------------------------------------------------------------------------------------ Appeals

export function Appeals() {
  const { ta } = useTa();
  const appeals = useApiQuery('admin.appeals.list');
  return (
    <Section title={ta('appeals.title')} intro={ta('appeals.intro')}>
      {appeals.isPending ? <Loading /> : null}
      {appeals.isError ? <ErrorNote error={appeals.error} onRetry={() => void appeals.refetch()} /> : null}
      {appeals.data && !appeals.data.items.length ? <p className="adm-empty">{ta('appeals.empty')}</p> : null}
      {appeals.data?.items.map((a) => <AppealCard key={a.id} appeal={a} />)}
    </Section>
  );
}

function AppealCard({ appeal }: { appeal: AdminAppeal }) {
  const { ta, locale } = useTa();
  const qc = useQueryClient();
  const [outcome, setOutcome] = useState<'upheld' | 'rejected'>('upheld');
  const [motivation, setMotivation] = useState('');
  const decide = useApiMutation('admin.appeals.decide', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.appeals.list') }) });
  return (
    <article className="adm-card" aria-labelledby={`appeal-${appeal.id}`}>
      <h3 id={`appeal-${appeal.id}`}>{ta('appeals.heading', { type: ta(`appeal_object.${appeal.object_type}`), user: appeal.user_ref ?? '—' })}</h3>
      <p className="adm-meta">
        {ta('appeals.submitted', { at: formatDateTime(locale, appeal.submitted_at), due: formatDateTime(locale, appeal.due_at) })}
        {appeal.waiting_for_third ? <Chip tone="pause">{ta('appeals.waiting_for_third')}</Chip> : null}
      </p>
      {appeal.text ? <blockquote className="adm-quote">{appeal.text}</blockquote> : null}
      {appeal.status === 'decided' ? (
        <p>{ta('appeals.decided', { outcome: ta(`appeal_outcome.${appeal.outcome ?? 'rejected'}`), motivation: appeal.motivation ?? '' })}</p>
      ) : (
        <form
          className="adm-form"
          aria-label={ta('appeals.form_label')}
          onSubmit={(e) => {
            e.preventDefault();
            if (motivation.trim()) decide.mutate({ params: { id: appeal.id }, body: { outcome, motivation: motivation.trim() } });
          }}
        >
          <p className="field-hint">{ta('appeals.other_reviewer')}</p>
          <Segment label={ta('appeals.outcome')} value={outcome} onChange={setOutcome} options={(['upheld', 'rejected'] as const).map((o) => ({ value: o, label: ta(`appeal_outcome.${o}`) }))} />
          <TextAreaField label={ta('appeals.motivation')} hint={ta('appeals.motivation_hint')} value={motivation} onChange={(e) => setMotivation(e.target.value)} required maxLength={4000} />
          <Button type="submit" disabled={!motivation.trim() || decide.isPending} disabledReason={motivation.trim() ? undefined : ta('form.motivation_required')}>
            {ta('appeals.submit')}
          </Button>
          {decide.isError ? <ErrorNote error={decide.error} /> : null}
        </form>
      )}
    </article>
  );
}

// ------------------------------------------------------------------------------------------- Sample

const JUDGEMENTS: readonly SampleJudgement[] = ['none', 'suspect', 'fraud'];

export function Sample() {
  const { ta, locale } = useTa();
  const sample = useApiQuery('admin.samples.current');
  const data = sample.data?.sample;
  const judged = data ? data.items.filter((i) => i.judged_at).length : 0;
  return (
    <Section title={ta('sample.title')} intro={ta('sample.intro')}>
      {sample.isPending ? <Loading /> : null}
      {sample.isError ? <ErrorNote error={sample.error} onRetry={() => void sample.refetch()} /> : null}
      {sample.data && !data ? <p className="adm-empty">{ta('sample.empty')}</p> : null}
      {data ? (
        <>
          <p className="adm-meta">
            {ta(`sample.kind_${data.kind}`)} · {ta('sample.week', { week: data.week_key })} · {ta('sample.drawn', { at: formatDateTime(locale, data.drawn_at), seed: data.seed_version })}
          </p>
          <p>{ta('sample.progress', { judged, total: data.items.length })}</p>
          <p className="field-hint">{ta('sample.interest_missing')}</p>
          {data.items.map((item) => (
            <SampleItemCard key={item.id} sampleId={data.id} item={item} />
          ))}
        </>
      ) : null}
    </Section>
  );
}

function SampleItemCard({ sampleId, item }: { sampleId: string; item: SampleItem }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [checks, setChecks] = useState({ anchor: false, line_type: false, pattern: false, contact: false });
  const [judgement, setJudgement] = useState<SampleJudgement>('none');
  const [reason, setReason] = useState('');
  const judge = useApiMutation('admin.samples.judge', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.samples.current') }) });
  return (
    <article className="adm-card" aria-labelledby={`item-${item.id}`}>
      <h3 id={`item-${item.id}`}>{ta('sample.item', { user: item.user_ref, stratum: item.stratum })}</h3>
      <dl className="adm-dl">
        {Object.entries(item.checks).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{String(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>
          </div>
        ))}
      </dl>
      {item.judged_at ? (
        <p>
          <Chip tone={item.judgement === 'none' ? 'earned' : 'pause'}>{ta(`judgement.${item.judgement}`)}</Chip> {reasonLabel(ta, item.reason_code ?? '')}
        </p>
      ) : (
        <form
          className="adm-form"
          aria-label={ta('sample.form_label', { user: item.user_ref })}
          onSubmit={(e) => {
            e.preventDefault();
            if (reason) judge.mutate({ params: { id: sampleId, item: item.id }, body: { checks, judgement, reason_code: reason } });
          }}
        >
          <fieldset className="adm-fieldset">
            <legend>{ta('sample.checks')}</legend>
            {(['anchor', 'line_type', 'pattern', 'contact'] as const).map((c) => (
              <CheckboxField key={c} label={ta(`sample.check_${c}`)} checked={checks[c]} onChange={(v) => setChecks({ ...checks, [c]: v })} />
            ))}
          </fieldset>
          <Segment
            label={ta('sample.judgement')}
            value={judgement}
            onChange={(j) => {
              setJudgement(j);
              setReason('');
            }}
            options={JUDGEMENTS.map((j) => ({ value: j, label: ta(`judgement.${j}`) }))}
          />
          <p className="field-hint">{ta(`sample.criteria_${judgement}`)}</p>
          <SelectField
            label={ta('sample.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={ta('form.choose')}
            required
            options={SAMPLE_REASON_CODES[judgement].map((c) => ({ value: c, label: reasonLabel(ta, c) }))}
          />
          <Button type="submit" disabled={!reason || judge.isPending} disabledReason={reason ? undefined : ta('form.reason_required')}>
            {ta('sample.submit')}
          </Button>
          {judge.isError ? <ErrorNote error={judge.error} /> : null}
        </form>
      )}
      {judge.data?.flag_id ? <Notice>{ta('sample.flag_opened')}</Notice> : null}
    </article>
  );
}

// ---------------------------------------------------------------------------------- First redemptions

export function FirstRedemptions() {
  const { ta, locale } = useTa();
  const list = useApiQuery('admin.firstRedemptions');
  return (
    <Section title={ta('first.title')} intro={ta('first.intro')}>
      {list.isPending ? <Loading /> : null}
      {list.isError ? <ErrorNote error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.data ? (
        <Table
          caption={ta('first.caption')}
          empty={ta('first.empty')}
          head={[ta('first.user'), ta('first.after'), ta('first.sessions'), ta('first.pattern'), ta('first.anchor'), ta('first.line'), ta('first.h11')]}
          rows={list.data.items.map((r) => [
            r.user_ref,
            formatDateTime(locale, r.first_redeem_after),
            r.sessions_7d,
            Object.entries(r.pattern)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', '),
            ta(`anchor.${r.anchor}`),
            ta(`line.${r.phone_line_type}`),
            r.h11 ? <Chip key="h11" tone="pause">{ta('first.h11_yes')}</Chip> : ta('first.h11_no'),
          ])}
        />
      ) : null}
      <p className="field-hint">{ta('first.open_flag_missing')}</p>
    </Section>
  );
}

// -------------------------------------------------------------------------------------------- Outages

export function Outages() {
  const { ta } = useTa();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const create = useApiMutation('admin.outages.create');
  const fromIso = toIso(from);
  const toIsoValue = toIso(to);
  const valid = fromIso !== null && toIsoValue !== null && fromIso < toIsoValue && note.trim().length > 0;
  return (
    <Section title={ta('outages.title')} intro={ta('outages.intro')}>
      <form
        className="adm-form"
        aria-label={ta('outages.form_label')}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate({ body: { from: fromIso!, to: toIsoValue!, note: note.trim() } });
        }}
      >
        <TextField label={ta('outages.from')} type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} required />
        <TextField label={ta('outages.to')} type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} required />
        <TextAreaField label={ta('outages.note')} value={note} onChange={(e) => setNote(e.target.value)} required maxLength={1000} />
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('outages.invalid')}>
          {ta('outages.submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
      </form>
      {create.data ? (
        <Block title={ta('outages.restorable')}>
          <Table
            caption={ta('outages.restorable')}
            empty={ta('outages.none_restorable')}
            head={[ta('session.day'), ta('first.user'), ta('session.abort'), ta('session.action')]}
            rows={create.data.restorable_sessions.map((s) => [
              s.focus_day,
              s.user_ref,
              s.abort_reason,
              <Button key={s.session_id} variant="secondary" onClick={() => setRestoring(s.session_id)}>
                {ta('restore.open')}
              </Button>,
            ])}
          />
          {restoring ? <RestoreForm sessionId={restoring} onDone={() => setRestoring(null)} /> : null}
        </Block>
      ) : null}
    </Section>
  );
}

/** datetime-local value (Europe/Amsterdam as entered by the admin's browser) → ISO instant in UTC. */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
