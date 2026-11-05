// O7 Dagdoel (UX §3.2): the self-chosen goal with the overreach brake, then POST /onboarding with
// everything collected (account_created, experiment_assigned and daily_goal_set on the server).
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useT } from '../../../i18n/index.tsx';
import { apiKey, useApi, useApiMutation } from '../../../lib/api/index.ts';
import { setSessionUser } from '../../focus/session/context.tsx';
import { clearDraft, getBirthDate, readDraft } from '../draft.ts';
import { GoalPicker } from '../GoalPicker.tsx';
import { LEGAL_VERSIONS } from '../legal.ts';
import { STEP } from '../paths.ts';
import { consentGiven } from './ConsentStep.tsx';

export function GoalStep() {
  const { t } = useT();
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const create = useApiMutation('me.onboarding', {
    onSuccess: async (res) => {
      setSessionUser(res.user.id);
      const token = readDraft().inviteToken;
      // A squad or duel link: join it now that the account exists (errors are shown in Squad).
      if (token) await api.call('invites.accept', { params: { token } }).catch(() => undefined);
      clearDraft();
      await queryClient.invalidateQueries({ queryKey: apiKey('me.get') });
      void navigate(STEP.dnd, { replace: true });
    },
    onError: (e) => {
      if (e.is('AGE_BELOW_MINIMUM')) void navigate(STEP.age, { replace: true });
      else if (e.is('TERMS_OUTDATED')) setError('onboarding:goal.terms_outdated');
      else setError('onboarding:goal.failed');
    },
  });
  const birth = getBirthDate();
  if (!birth) return <Navigate to={STEP.age} replace />;
  if (!consentGiven()) return <Navigate to={STEP.consent} replace />;
  const submit = (minutes: 25 | 50 | 90 | 120, confirmed: boolean) => {
    const d = readDraft();
    setError(null);
    create.mutate({
      body: {
        first_name: d.firstName,
        ...(d.lastName ? { last_name: d.lastName } : {}),
        birth_date: birth,
        terms_version: LEGAL_VERSIONS.terms,
        privacy_version: LEGAL_VERSIONS.privacy,
        research_info_version: LEGAL_VERSIONS.research_info,
        daily_goal_min: minutes,
        ...(confirmed ? { confirm_overreach: true } : {}),
        silent_mode: d.silentMode,
      },
    });
  };
  return (
    <div className="onb">
      <h1>{t('onboarding:goal.title')}</h1>
      <p className="onb-lead">{t('onboarding:goal.intro')}</p>
      <GoalPicker busy={create.isPending} onSubmit={submit} />
      {error ? <p role="alert">{t(error)}</p> : null}
    </div>
  );
}
