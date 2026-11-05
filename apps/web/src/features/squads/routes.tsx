// Squad tab (UX §2.1 tab 2, §3.4; architecture §9.1 /squad, /squad/nieuw, /squad/vergelijken). Owner: WP-9.
import { Link, type RouteObject } from 'react-router';
import { useT } from '../../i18n/index.tsx';
import { Screen, useMe } from '../profile/kit.tsx';
import { CreateSquadScreen } from './CreateSquad.tsx';
import { Compare, SquadScreen } from './SquadScreen.tsx';

function CompareScreen() {
  const { t } = useT();
  const me = useMe();
  return (
    <Screen title={t('squads:compare.title')}>
      {me.data?.settings?.compare_opt_in ? <Compare /> : <p>{t('squads:compare.off')}</p>}
      <Link to="/squad">{t('actions.back')}</Link>
    </Screen>
  );
}

export const routes: RouteObject[] = [
  { path: 'squad', element: <SquadScreen /> },
  { path: 'squad/nieuw', element: <CreateSquadScreen /> },
  { path: 'squad/vergelijken', element: <CompareScreen /> },
];
