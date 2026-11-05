// Stratified fraud estimate with a 95% interval (spec §6.7, §7.2; voorregistratie §7.1, §7.7).
// Weighted by the strata; the interval is a Wilson score interval on the effective sample size.
// The estimate is reported as a lower bound of the real fraud, and the upper bound of the interval
// is the go/no-go measure (< 5%).

export interface StratumObservation {
  stratum: string;
  /** Active accounts in the stratum (the population of the draw). */
  population: number;
  /** Judged items. */
  judged: number;
  /** Items with the judgement counted (fraud, or fraud + suspect for the second series). */
  positive: number;
}

export interface FraudEstimate {
  estimate: number;
  lower: number;
  upper: number;
  judged: number;
  /** Upper bound of the interval below the limit (one fraud limit, voorregistratie §7.7). */
  belowLimit: boolean;
  /** Always true: detection in a light check underestimates (spec §6.7). */
  isLowerBound: true;
}

const Z95 = 1.959964;

export function wilson(p: number, n: number, z = Z95): { lower: number; upper: number } {
  if (n <= 0) return { lower: 0, upper: 1 };
  const z2 = z * z;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return { lower: Math.max(0, centre - half), upper: Math.min(1, centre + half) };
}

export function stratifiedEstimate(strata: readonly StratumObservation[], limitPct: number): FraudEstimate {
  const used = strata.filter((s) => s.judged > 0 && s.population > 0);
  const N = used.reduce((a, s) => a + s.population, 0);
  const judged = used.reduce((a, s) => a + s.judged, 0);
  if (N === 0 || judged === 0) return { estimate: 0, lower: 0, upper: 1, judged: 0, belowLimit: false, isLowerBound: true };
  let p = 0;
  let variance = 0;
  for (const s of used) {
    const w = s.population / N;
    const ph = s.positive / s.judged;
    p += w * ph;
    const fpc = s.population > 1 ? Math.max(0, 1 - s.judged / s.population) : 0;
    variance += (w * w * fpc * ph * (1 - ph)) / Math.max(1, s.judged - 1);
  }
  const nEff = variance > 0 ? Math.min(judged, (p * (1 - p)) / variance) : judged;
  const ci = wilson(p, nEff);
  return { estimate: p, lower: ci.lower, upper: ci.upper, judged, belowLimit: ci.upper * 100 < limitPct, isLowerBound: true };
}
