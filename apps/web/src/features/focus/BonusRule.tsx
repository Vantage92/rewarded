// Bonusregel (UX §5.5, §6.2 "Bonusregel (F1, F5)"; spec §5): one component for both arms, same
// length, same place and the same link "Waarom zie ik dit?". Arm A frames a gain, arm B the weekly
// budget; that framing is the only difference (H-A). Not shown without a goal bonus or in the mode
// without points.
import type { TodayResponse } from '@rewarded/contracts/points';
import { Link } from 'react-router';
import { useShell } from '../../app/shell.tsx';
import { useT } from '../../i18n/index.tsx';
import { useApiQuery } from '../../lib/api/index.ts';

export interface BonusRuleProps {
  today: TodayResponse | undefined;
  /** F1 before the session, F5 after it. */
  place: 'home' | 'completed';
}

export function BonusRule({ today, place }: BonusRuleProps) {
  const { t } = useT();
  const { noPointsMode } = useShell();
  const me = useApiQuery('me.get', undefined, { retry: false, staleTime: 60_000 });
  if (!today || noPointsMode || me.data?.settings?.no_points_mode || today.bonus_rule === 'none') return null;
  const perDay = today.week_budget?.per_day ?? 20;
  let text: string;
  if (today.bonus_rule === 'A') {
    text = place === 'completed' && today.goal_met ? t('focus:bonus_rule.a_done', { points: perDay }) : t('focus:bonus_rule.a', { points: perDay });
  } else {
    const remaining = today.week_budget?.remaining ?? 0;
    if (place === 'completed' && today.goal_met) text = t('focus:bonus_rule.b_done', { points: perDay, remaining });
    else if (today.week_budget?.first_day_of_week && !today.goal_met) text = t('focus:bonus_rule.b_monday', { remaining, points: perDay });
    else text = t('focus:bonus_rule.b', { remaining, points: perDay });
  }
  return (
    <p className="bonus-rule" data-arm={today.bonus_rule}>
      {text}{' '}
      <Link to="/punten/bonusregel">{t('focus:bonus_rule.why')}</Link>
    </p>
  );
}
