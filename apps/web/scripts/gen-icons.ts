// Writes placeholder PWA icons (a ring on primary green) to public/icons. TODO(WP-7): replace with the real icon.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function icon(size: number, ringScale: number): Buffer {
  const bg = [0x2b, 0x5a, 0x4e];
  const fg = [0xf7, 0xf6, 0xf2];
  const rows: Buffer[] = [];
  const c = size / 2;
  const outer = size * 0.3 * ringScale;
  const inner = outer * 0.72;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      const px = d <= outer && d >= inner ? fg : bg;
      row.set(px, 1 + x * 3);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = join(import.meta.dirname, '../public/icons');
writeFileSync(join(out, 'icon-192.png'), icon(192, 1));
writeFileSync(join(out, 'icon-512.png'), icon(512, 1));
// Maskable: keep the ring inside the 80% safe zone.
writeFileSync(join(out, 'icon-maskable-512.png'), icon(512, 0.8));
console.info('[gen-icons] wrote public/icons');
