// Q2 Squad maken, followed directly by Q3 as a sheet (UX §4.4 steps 1–2; spec §3.5).
import type { InviteDto } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, TextField } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation } from '../../lib/api/index.ts';
import { Screen, idempotencyKey, isApiError, useMe } from '../profile/kit.tsx';
import { InviteSheet } from './SquadScreen.tsx';

export function CreateSquadScreen() {
  const { t, locale } = useT();
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [withClub, setWithClub] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [invite, setInvite] = useState<InviteDto | null>(null);
  const key = useRef(idempotencyKey());
  const club = me.data?.club?.status === 'linked' ? me.data.club : undefined;
  const create = useApiMutation('squads.create', {
    onSuccess: (r) => {
      setInvite(r.invite);
      void qc.invalidateQueries({ queryKey: apiKey('squads.mine') });
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
    onError: (e) => {
      key.current = idempotencyKey();
      setError(isApiError(e, 'NAME_REJECTED') ? t('squads:create.rejected') : errorText(locale, e));
    },
  });
  const trimmed = name.trim();
  return (
    <Screen title={t('squads:create.title')} intro={t('squads:create.intro')}>
      <form
        className="wp9-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed.length < 2) return setError(t('squads:create.name_hint'));
          setError(undefined);
          create.mutate({ body: { name: trimmed, ...(withClub && club ? { club_id: club.id } : {}) }, idempotencyKey: key.current });
        }}
      >
        <TextField label={t('squads:create.name')} hint={t('squads:create.name_hint')} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} error={error} required />
        {club ? (
          <label className="wp9-row">
            <input type="checkbox" checked={withClub} onChange={(e) => setWithClub(e.target.checked)} />
            {t('squads:create.club', { club: club.name })}
          </label>
        ) : null}
        <p className="wp9-small" data-testid="visibility-rule">
          {t('squads:visibility')}
        </p>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? t('squads:create.busy') : t('squads:create.submit')}
        </Button>
      </form>
      {invite ? <InviteSheet initial={invite} onClose={() => void navigate('/squad')} /> : null}
    </Screen>
  );
}
