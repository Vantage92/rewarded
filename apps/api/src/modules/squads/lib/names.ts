// Squad name moderation (architecture §10.3: a word list; spec §4.4 Squadnaam, art. 16 DSA).
// A name with an e-mail address, a phone number, a link or a word from the list is refused with
// NAME_REJECTED; a report from a member later sets name_status = reported for the moderation queue.

const BLOCKED = [
  'kanker', 'tering', 'tyfus', 'hoer', 'neuk', 'nazi', 'hitler', 'flikker', 'mongool', 'nigger', 'neger',
  'fuck', 'shit', 'cunt', 'bitch', 'whore', 'slut', 'porn',
];

/** Lower case, digits read as letters (k4nker), separators removed. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z]/g, '');
}

export function nameAllowed(name: string): boolean {
  const trimmed = name.trim();
  if (/@|https?:|www\.|\.(nl|com|org|net)\b/i.test(trimmed)) return false;
  if (/(\d[\s-]?){6,}/.test(trimmed)) return false;
  if (/[<>]/.test(trimmed)) return false;
  const flat = normalise(trimmed);
  return !BLOCKED.some((w) => flat.includes(w));
}
