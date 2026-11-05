import { ApiClientError } from '@rewarded/contracts/client';
import { translate, type Locale } from '../../i18n/index.tsx';

/** User-facing text for any thrown error: the module's message key, else the generic message. */
export function errorText(locale: Locale, error: unknown): string {
  if (error instanceof ApiClientError) return translate(locale, error.messageKey);
  return translate(locale, 'errors.internal');
}
