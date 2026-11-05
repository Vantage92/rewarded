// Daily goal with the overreach brake (spec §4.4, UX O7): 25 / 50 / 90 / 120, default 25. In the first
// 7 days, 90 or 120 asks for a confirmation ("Begin liever klein"); the rule is core's.
import type { GoalMinutes } from '@rewarded/contracts/common';
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { needsOverreachConfirm } from '@rewarded/core/goals';
import { useState } from 'react';
import { BottomSheet, Button, Segment } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';

export const GOAL_OPTIONS = CURRENT_PARAMS.goals.options_min as readonly GoalMinutes[];

export interface GoalPickerProps {
  /** Days since registration; 0 in the onboarding. */
  daysSinceRegistration?: number;
  initial?: GoalMinutes;
  busy?: boolean;
  onSubmit: (minutes: GoalMinutes, overreachConfirmed: boolean) => void;
}

export function GoalPicker({ daysSinceRegistration = 0, initial = CURRENT_PARAMS.goals.default_min as GoalMinutes, busy = false, onSubmit }: GoalPickerProps) {
  const { t } = useT();
  const [goal, setGoal] = useState<GoalMinutes>(initial);
  const [brake, setBrake] = useState(false);
  const needsConfirm = needsOverreachConfirm(CURRENT_PARAMS, goal, daysSinceRegistration);
  return (
    <div className="onb-actions">
      <Segment
        label={t('onboarding:goal.label')}
        options={GOAL_OPTIONS.map((m) => ({ value: m, label: t('focus:minutes_option', { count: m }) }))}
        value={goal}
        onChange={setGoal}
      />
      {needsConfirm ? <p className="onb-muted">{t('onboarding:goal.small')}</p> : null}
      <Button block disabled={busy} onClick={() => (needsConfirm ? setBrake(true) : onSubmit(goal, false))}>
        {t('onboarding:goal.next')}
      </Button>
      <BottomSheet open={brake} title={t('onboarding:goal.brake_title')} onClose={() => setBrake(false)}>
        <p>{t('onboarding:goal.brake_body')}</p>
        <div className="onb-actions">
          <Button
            block
            onClick={() => {
              setBrake(false);
              setGoal(25);
              onSubmit(25, false);
            }}
          >
            {t('onboarding:goal.brake_small')}
          </Button>
          <Button
            block
            variant="secondary"
            onClick={() => {
              setBrake(false);
              onSubmit(goal, true);
            }}
          >
            {t('onboarding:goal.brake_keep', { count: goal })}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
