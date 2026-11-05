// Rasterizer for share cards (architecture §9.5 rasterize.ts): draws the server SVG on a <canvas>
// and returns a PNG for the Web Share API. The SVG uses only embedded or system fonts, so the canvas
// is never tainted. Runs in the browser only; tests replace it.

export const CARD_SIZES = { '9x16': { width: 1080, height: 1920 }, '1x1': { width: 1080, height: 1080 } } as const;
export type CardFormatKey = keyof typeof CARD_SIZES;

/** SVG text as a data URL for an <img> (no blob URL to revoke, works in the CSP of §10.3). */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function rasterizeSvg(svg: string, format: CardFormatKey): Promise<Blob> {
  const { width, height } = CARD_SIZES[format];
  const img = new Image(width, height);
  img.decoding = 'async';
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('svg_load_failed'));
  });
  img.src = svgDataUrl(svg);
  await loaded;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png_failed'))), 'image/png'));
}

/** Offers a blob as a download ("Opslaan"). */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
