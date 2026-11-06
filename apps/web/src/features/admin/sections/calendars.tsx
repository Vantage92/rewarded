// Exam calendars per club (spec §4.13, architecture §8.2 "/admin/exam-calendars"; integration wave).
// The calendar is the only source of T, N and A. After "Vastzetten" a change needs a reason and a
// second admin. The default calendar is for units without a club and can never be a club calendar.
import type { ExamCalendar } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button, TextField } from '../../../design/index.ts';
import { apiKey, useApiMutation, useApiQuery } from '../../../lib/api/index.ts';
import { Block, CheckboxField, ErrorNote, Loading, Notice, Section, Table, useTa } from '../ui.tsx';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const days = (text: string) => text.split(/[\s,;]+/).filter((d) => DAY.test(d));

export function Calendars() {
  const { ta } = useTa();
  const list = useApiQuery('admin.examCalendars.list');
  return (
    <Section title={ta('calendars.title')} intro={ta('calendars.intro')}>
      {list.isPending ? <Loading /> : null}
      {list.isError ? <ErrorNote error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.data ? (
        <Table
          caption={ta('calendars.caption')}
          empty={ta('calendars.empty')}
          head={[ta('calendars.institution'), ta('calendars.t_day'), ta('calendars.bonus_stop'), ta('calendars.early_offer'), ta('calendars.rest_period'), ta('calendars.a'), ta('calendars.clubs'), ta('calendars.status')]}
          rows={list.data.items.map((c) => [
            c.is_default ? ta('calendars.default_name', { name: c.institution }) : c.faculty ? `${c.institution} · ${c.faculty}` : c.institution,
            c.t_day,
            c.derived.bonus_stop_at.replace('T', ' '),
            c.derived.early_offer_day,
            `${c.derived.rest_period.first_day} – ${c.derived.rest_period.last_day}`,
            c.derived.a ? `${c.derived.a.first_day} – ${c.derived.a.last_day}` : ta('calendars.a_missing'),
            String(c.club_ids.length),
            c.pending_four_eyes ? ta('calendars.pending') : c.fixed_at ? ta('calendars.fixed') : ta('calendars.open'),
          ])}
        />
      ) : null}
      {list.data?.items.map((c) => <CalendarEdit key={c.id} calendar={c} />)}
      <CalendarCreate />
    </Section>
  );
}

function CalendarCreate() {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [f, setF] = useState({ institution: '', faculty: '', t: '', aStart: '', aEnd: '', resits: '', source: '', checked: '', confirmation: '', isDefault: false });
  const create = useApiMutation('admin.examCalendars.create', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.examCalendars.list') }) });
  const valid = f.institution.trim() && DAY.test(f.t) && DAY.test(f.checked) && f.source.trim();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.mutate({
      body: {
        institution: f.institution.trim(),
        ...(f.faculty.trim() ? { faculty: f.faculty.trim() } : {}),
        t_day: f.t,
        ...(DAY.test(f.aStart) && DAY.test(f.aEnd) ? { a_start_day: f.aStart, a_end_day: f.aEnd } : {}),
        a_resit_days: days(f.resits),
        source_ref: f.source.trim(),
        checked_at: f.checked,
        ...(f.confirmation.trim() ? { club_confirmation_ref: f.confirmation.trim() } : {}),
        ...(f.isDefault ? { is_default: true } : {}),
      },
    });
  };
  return (
    <Block title={ta('calendars.create')}>
      <form className="adm-form adm-grid" onSubmit={submit} aria-label={ta('calendars.create')}>
        <TextField label={ta('calendars.institution')} value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} required />
        <TextField label={ta('calendars.faculty')} value={f.faculty} onChange={(e) => setF({ ...f, faculty: e.target.value })} optional />
        <TextField label={ta('calendars.t_day')} hint={ta('calendars.t_hint')} type="date" value={f.t} onChange={(e) => setF({ ...f, t: e.target.value })} required />
        <TextField label={ta('calendars.a_start')} type="date" value={f.aStart} onChange={(e) => setF({ ...f, aStart: e.target.value })} optional />
        <TextField label={ta('calendars.a_end')} type="date" value={f.aEnd} onChange={(e) => setF({ ...f, aEnd: e.target.value })} optional />
        <TextField label={ta('calendars.resits')} hint={ta('calendars.resits_hint')} value={f.resits} onChange={(e) => setF({ ...f, resits: e.target.value })} optional />
        <TextField label={ta('calendars.source')} hint={ta('calendars.source_hint')} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} required />
        <TextField label={ta('calendars.checked_at')} type="date" value={f.checked} onChange={(e) => setF({ ...f, checked: e.target.value })} required />
        <TextField label={ta('calendars.confirmation')} value={f.confirmation} onChange={(e) => setF({ ...f, confirmation: e.target.value })} optional />
        <CheckboxField label={ta('calendars.is_default')} hint={ta('calendars.is_default_hint')} checked={f.isDefault} onChange={(v) => setF({ ...f, isDefault: v })} />
        <Button type="submit" disabled={!valid || create.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('calendars.create_submit')}
        </Button>
        {create.isError ? <ErrorNote error={create.error} /> : null}
        {create.data ? <Notice>{ta('calendars.created', { t: create.data.calendar.t_day })}</Notice> : null}
      </form>
    </Block>
  );
}

function CalendarEdit({ calendar }: { calendar: ExamCalendar }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [t, setT] = useState(calendar.t_day);
  const [reason, setReason] = useState('');
  const patch = useApiMutation('admin.examCalendars.patch', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.examCalendars.list') }) });
  const fixed = calendar.fixed_at !== null;
  const title = ta('calendars.edit', { name: calendar.faculty ? `${calendar.institution} · ${calendar.faculty}` : calendar.institution });
  return (
    <Block title={title}>
      <form
        className="adm-form"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          if (t === calendar.t_day && !(fixed && calendar.pending_four_eyes)) return;
          const body = calendar.pending_four_eyes && t === calendar.t_day ? { reason } : { t_day: t, ...(reason.trim() ? { reason: reason.trim() } : {}) };
          patch.mutate({ params: { id: calendar.id }, body });
        }}
      >
        <TextField label={ta('calendars.t_day')} type="date" value={t} onChange={(e) => setT(e.target.value)} />
        {fixed ? <TextField label={ta('calendars.reason')} hint={ta('calendars.reason_hint')} value={reason} onChange={(e) => setReason(e.target.value)} required /> : null}
        <Button type="submit" variant="secondary" disabled={patch.isPending || (fixed && reason.trim().length < 3)} disabledReason={fixed && reason.trim().length < 3 ? ta('calendars.reason_required') : undefined}>
          {calendar.pending_four_eyes ? ta('calendars.confirm_pending') : ta('calendars.save')}
        </Button>
      </form>
      {!fixed ? (
        <Button variant="secondary" onClick={() => patch.mutate({ params: { id: calendar.id }, body: { fix: true } })} disabled={patch.isPending}>
          {ta('calendars.fix')}
        </Button>
      ) : null}
      {patch.isError ? <ErrorNote error={patch.error} /> : null}
      {patch.data?.calendar.pending_four_eyes ? <Notice>{ta('calendars.pending_notice')}</Notice> : patch.isSuccess ? <Notice>{ta('form.saved')}</Notice> : null}
    </Block>
  );
}

/** Select of club calendars (never the default) for the club forms. */
export function useClubCalendars() {
  const list = useApiQuery('admin.examCalendars.list');
  return (list.data?.items ?? []).filter((c) => !c.is_default);
}

/** April member count for the April challenge (POST /admin/clubs/:id/april-members). */
export function AprilMembers({ clubId, current }: { clubId: string; current: number | null | undefined }) {
  const { ta } = useTa();
  const qc = useQueryClient();
  const [n, setN] = useState(current ? String(current) : '');
  const [source, setSource] = useState('');
  const save = useApiMutation('admin.clubs.aprilMembers', { onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('admin.clubs.get') }) });
  const num = Number(n);
  const valid = Number.isInteger(num) && num >= 1 && source.trim().length > 0;
  return (
    <Block title={ta('calendars.april_title')}>
      <form
        className="adm-form"
        aria-label={ta('calendars.april_title')}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) save.mutate({ params: { id: clubId }, body: { april_members: num, source_ref: source.trim() } });
        }}
      >
        <TextField label={ta('calendars.april_members')} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} required />
        <TextField label={ta('calendars.source')} hint={ta('calendars.april_source_hint')} value={source} onChange={(e) => setSource(e.target.value)} required />
        <Button type="submit" variant="secondary" disabled={!valid || save.isPending} disabledReason={valid ? undefined : ta('form.fill_required')}>
          {ta('calendars.save')}
        </Button>
      </form>
      {save.isError ? <ErrorNote error={save.error} /> : null}
      {save.isSuccess ? <Notice>{ta('form.saved')}</Notice> : null}
    </Block>
  );
}
