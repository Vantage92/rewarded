/** Name of the non-HttpOnly double-submit cookie (architecture §8.1). */
export const CSRF_COOKIE = 'rw_csrf';

/** Reads rw_csrf for the X-CSRF-Token header; undefined outside a browser or before login. */
export function readCsrfCookie(cookie: string | undefined = typeof document === 'undefined' ? undefined : document.cookie): string | undefined {
  if (!cookie) return undefined;
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}
