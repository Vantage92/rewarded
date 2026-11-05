// Card image as SVG (spec §4.8; architecture §8.2, §9.5, §10.3). The server renders the SVG and the
// browser rasterises it to PNG for sharing. Every text is escaped for XML; the image references
// nothing external (no fonts, links, scripts or images), so the strict CSP of the route holds.
export type CardFormat = '9x16' | '1x1';

export interface CardContent {
  /** Shown only when switched on; otherwise null. */
  firstName: string | null;
  squadName: string | null;
  /** Minutes of the session, or hours of a week. */
  durationLabel: string | null;
  streakLabel: string | null;
  headline: string;
  footer: string;
  verifyUrl: string;
}

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/** Escapes text for XML content and attribute values; strips control characters SVG cannot hold. */
export function escapeXml(text: string): string {
  // oxlint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g, '').replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]!);
}

/** Cuts a text to `max` characters (code points) with an ellipsis. */
function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : text;
}

export function renderCardSvg(c: CardContent, format: CardFormat): string {
  const w = 1080;
  const h = format === '9x16' ? 1920 : 1080;
  const top = format === '9x16' ? 520 : 260;
  const lines: string[] = [];
  const text = (y: number, size: number, value: string, weight = 400, fill = '#f5f7fa') =>
    lines.push(`<text x="96" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`);
  text(top, 56, clip(c.headline, 40), 700);
  let y = top + 140;
  if (c.firstName) {
    text(y, 120, clip(c.firstName, 18), 700);
    y += 150;
  }
  if (c.durationLabel) {
    text(y, 88, clip(c.durationLabel, 24), 600);
    y += 120;
  }
  if (c.streakLabel) {
    text(y, 64, clip(c.streakLabel, 30), 500);
    y += 100;
  }
  if (c.squadName) {
    text(y, 56, clip(c.squadName, 30), 400);
    y += 90;
  }
  text(h - 220, 40, clip(c.footer, 60), 400, '#a9b4c2');
  text(h - 150, 32, clip(c.verifyUrl, 70), 400, '#a9b4c2');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(clip(c.headline, 40))}">`,
    '<style>text{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}</style>',
    `<rect width="${w}" height="${h}" fill="#0f1720"/>`,
    `<rect x="64" y="64" width="${w - 128}" height="${h - 128}" rx="48" fill="none" stroke="#2f6fed" stroke-width="8"/>`,
    ...lines,
    '</svg>',
  ].join('');
}

/** Strict headers for the SVG route (architecture §10.3): no scripts, no external loads, no sniffing. */
export const SVG_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; script-src 'none'; frame-ancestors 'none'; sandbox",
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'private, no-store',
  'Content-Disposition': 'inline; filename="rewarded-kaart.svg"',
  'Cross-Origin-Resource-Policy': 'same-origin',
});
