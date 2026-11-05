// Mock-mode card image: a tiny SVG with the default fields (never points or rewards).
import type { MockHandlers } from '@rewarded/contracts';

export const handlers: MockHandlers = {
  'cards.image': ({ query }) => {
    const square = query['format'] === '1x1';
    const h = square ? 1080 : 1920;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${h}" viewBox="0 0 1080 ${h}"><rect width="1080" height="${h}" fill="#F4F1EA"/><text x="80" y="300" font-family="system-ui" font-size="96">Mila</text><text x="80" y="460" font-family="system-ui" font-size="140">50 min</text></svg>`;
  },
};
