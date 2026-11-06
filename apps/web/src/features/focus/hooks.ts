// Server data the focus screens read: /me, today's goal and the squad presence (polled every 30 s
// while visible, architecture §9.2; no websockets, spec §4.4).
import { useApiQuery } from '../../lib/api/index.ts';
import { useAccountLocale } from '../profile/kit.tsx';

export function useMe() {
  const q = useApiQuery('me.get', undefined, { retry: false, staleTime: 60_000 });
  useAccountLocale(q.data?.user?.locale);
  return q;
}

export function useToday(enabled: boolean) {
  return useApiQuery('me.today', undefined, { enabled, retry: false, staleTime: 15_000 });
}

export function usePresence(enabled: boolean) {
  return useApiQuery('squads.presence', undefined, { enabled, retry: false, refetchInterval: enabled ? 30_000 : false, refetchIntervalInBackground: false });
}
