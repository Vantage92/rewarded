// Deterministic PRNG for the demo plan (mulberry32, fixed seed). The same seed gives the same
// students, sessions and outcomes on every run (architecture §11 Seeddata).
export class Prng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick from an empty list');
    return items[this.int(items.length)]!;
  }
  /** Random API for the platform (ids, tokens): same stream shape as SeededRandom. */
  bytes(length: number): Uint8Array {
    return Uint8Array.from({ length }, () => this.int(256));
  }
}
