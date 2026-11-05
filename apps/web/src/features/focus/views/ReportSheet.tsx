// F7 "Klopt dit niet?" (UX §4.3 table, §6.2): copy depends on the abort code, because only a gap
// or a late end can be restored (spec §6.4). The report goes to the review queue.
import type { AbortReason } from '@rewarded/core/session';
import { useId, useState } from 'react';
import { BottomSheet, Button, FormField, useToast } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useApiMutation } from '../../../lib/api/index.ts';
import { REPORT_CHOICES, reportToastKey } from '../copy.ts';

export interface ReportSheetProps {
  open: boolean;
  code: AbortReason;
  sessionId: string;
  onClose: () => void;
}

export function ReportSheet({ open, code, sessionId, onClose }: ReportSheetProps) {
  const { t } = useT();
  const toast = useToast();
  const name = useId();
  const choices = REPORT_CHOICES[code];
  const [choice, setChoice] = useState<string>(choices[0] ?? 'other');
  const [text, setText] = useState('');
  const [state, setState] = useState<'form' | 'already' | 'failed'>('form');
  const report = useApiMutation('sessions.report', {
    onSuccess: () => {
      toast.show(t(reportToastKey(code)));
      onClose();
    },
    onError: (e) => setState(e.is('ALREADY_REPORTED') ? 'already' : 'failed'),
  });
  const send = () => {
    // The contract carries free text only; the choice travels as a fixed prefix the queue can read.
    const body = [`[${choice}]`, text.trim()].filter(Boolean).join(' ').slice(0, 1000);
    report.mutate({ params: { id: sessionId }, body: { text: body } });
  };
  return (
    <BottomSheet open={open} title={t('focus:report.title')} onClose={onClose}>
      <p>{t(`focus:report.${code}`)}</p>
      {state === 'already' ? (
        <p role="status">{t('focus:report.already')}</p>
      ) : (
        <form
          className="focus-stack"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <fieldset className="focus-stack">
            <legend>{t('focus:report.choice_label')}</legend>
            {choices.map((c) => (
              <label key={c} className="focus-row">
                <input type="radio" name={name} value={c} checked={choice === c} onChange={() => setChoice(c)} />
                <span>{t(`focus:report.choices.${c}`)}</span>
              </label>
            ))}
          </fieldset>
          <FormField label={t('focus:report.text')} optional>
            {(p) => <textarea {...p} className="input" rows={3} maxLength={900} value={text} onChange={(e) => setText(e.target.value)} />}
          </FormField>
          {state === 'failed' ? <p role="alert">{t('focus:report.failed')}</p> : null}
          <Button type="submit" block disabled={report.isPending}>
            {t('focus:report.send')}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
