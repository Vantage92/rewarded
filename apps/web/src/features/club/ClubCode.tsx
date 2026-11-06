// /c/:code, the link of the promo kit (QR, poster, story): with an account straight to V2 with the
// code, without one to O1 with the club noted, so the link follows after the onboarding.
import { Navigate, useParams, useSearchParams } from 'react-router';
import { ButtonLink } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { useApiQuery } from '../../lib/api/index.ts';
import { setPendingClubCode } from './pending.ts';

export function ClubCodeRoute() {
  const { t } = useT();
  const { code = '' } = useParams();
  const [params] = useSearchParams();
  const me = useApiQuery('me.get', undefined, { retry: false });
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const bron = params.get('bron');
  const target = `/vereniging/koppelen?code=${encodeURIComponent(clean)}${bron && /^[a-z0-9_-]{1,32}$/.test(bron) ? `&bron=${encodeURIComponent(bron)}` : ''}`;
  if (me.isPending) return <p className="focus-muted">{t('club:code.loading')}</p>;
  if (me.data?.user && me.data.onboarding_complete) return <Navigate to={target} replace />;
  setPendingClubCode({ code: clean, bron: bron && /^[a-z0-9_-]{1,32}$/.test(bron) ? bron : null });
  return (
    <div className="onb">
      <h1>{t('club:code.title')}</h1>
      <p className="onb-lead">{t('club:code.text')}</p>
      <div className="onb-actions">
        <ButtonLink to="/login" block>
          {t('club:code.login')}
        </ButtonLink>
        <ButtonLink to="/welkom" variant="secondary" block>
          {t('club:code.new')}
        </ButtonLink>
      </div>
    </div>
  );
}
