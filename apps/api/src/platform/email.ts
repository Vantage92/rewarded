// Shared by auth and waitlist (both WP-3), so one person is one account and one waitlist entry.
// E-mail normalisation for the uniqueness check (spec §3.1 step 4, architecture §3.1):
// lower case, the plus part removed, and dots removed at providers that ignore them.
const DOTLESS_PROVIDERS = new Map([
  ['gmail.com', 'gmail.com'],
  ['googlemail.com', 'gmail.com'],
]);

export function normalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf('@');
  if (at <= 0) return lower;
  let local = lower.slice(0, at);
  let domain = lower.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);
  const canonical = DOTLESS_PROVIDERS.get(domain);
  if (canonical) {
    local = local.replaceAll('.', '');
    domain = canonical;
  }
  return `${local}@${domain}`;
}
