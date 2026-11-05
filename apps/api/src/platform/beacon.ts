// Beacon: external public randomness round (architecture v1.1 draws design). Draws are not built
// (product plan §0.3, architecture §7); the interface stays so a later draw or a publicly verifiable
// sample seed can plug in without a platform change. Nothing in the MVP calls it.
import { createHash } from 'node:crypto';

export interface BeaconRound {
  round: number;
  /** Hex-encoded randomness of the round. */
  value: string;
  source: string;
}

export interface Beacon {
  /** First round published at or after `at`. */
  roundAt(at: Date): Promise<BeaconRound>;
}

/** Deterministic dev beacon: one round per minute, value = SHA-256(seed:round). */
export class DevBeacon implements Beacon {
  private readonly seed: string;
  constructor(seed = 'dev-beacon') {
    this.seed = seed;
  }
  async roundAt(at: Date): Promise<BeaconRound> {
    const round = Math.ceil(at.getTime() / 60_000);
    return { round, value: createHash('sha256').update(`${this.seed}:${round}`).digest('hex'), source: 'dev' };
  }
}

/** Production placeholder: fails loudly, like UnconfiguredMailer. */
export class UnconfiguredBeacon implements Beacon {
  async roundAt(): Promise<BeaconRound> {
    throw new Error('No beacon configured (draws are not built)');
  }
}
