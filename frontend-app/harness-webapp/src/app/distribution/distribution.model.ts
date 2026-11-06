/** Pure helpers for the Distribution Test page (kept separate so they are easy to unit test). */

export type Tier = 'canary' | 'stable' | 'error';

export interface Sample {
  /** Epoch milliseconds when the response arrived. */
  t: number;
  tier: Tier;
  version?: string;
  pod?: string;
}

export interface Summary {
  total: number;
  canary: number;
  stable: number;
  errors: number;
  /** Share of successful responses served by canary, 0-100. */
  canaryPct: number;
  stablePct: number;
  /** Share of all requests that failed, 0-100. */
  errorPct: number;
}

export const SERIES_COLORS: { name: string; value: string }[] = [
  { name: 'Stable', value: '#006fcf' },
  { name: 'Canary', value: '#FFC72C' },
  { name: 'Errors', value: '#c8102e' },
];

/** Backend answers /deploy/create with name 'canary' or 'normal' (= stable). */
export function tierFromResponse(body: any): Tier {
  const name = (body?.deployment_type ?? body?.name ?? '').toString().toLowerCase();
  return name === 'canary' ? 'canary' : 'stable';
}

export function summarise(samples: Sample[]): Summary {
  let canary = 0, stable = 0, errors = 0;
  for (const s of samples) {
    if (s.tier === 'canary') canary++;
    else if (s.tier === 'stable') stable++;
    else errors++;
  }
  const ok = canary + stable;
  const total = ok + errors;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
  return {
    total, canary, stable, errors,
    canaryPct: pct(canary, ok),
    stablePct: ok ? Math.round((100 - pct(canary, ok)) * 10) / 10 : 0,
    errorPct: pct(errors, total),
  };
}

function label(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Group samples into fixed time buckets for a stacked bar chart
 * (ngx-charts multi-series format). Empty buckets inside the window are kept
 * so gaps in traffic are visible. Only the last `maxBuckets` are returned.
 * The bucket that is still filling (ends after `now`) is left out so the last
 * bar never looks like a traffic drop.
 */
export function bucketise(samples: Sample[], bucketMs = 5_000, maxBuckets = 12, now = Date.now()) {
  if (!samples.length) return [];
  const first = Math.floor(samples[0].t / bucketMs) * bucketMs;
  const lastSample = Math.floor(samples[samples.length - 1].t / bucketMs) * bucketMs;
  const lastComplete = Math.floor(now / bucketMs) * bucketMs - bucketMs;
  const last = Math.min(lastSample, lastComplete);
  if (last < first) return [];
  const start = Math.max(first, last - (maxBuckets - 1) * bucketMs);
  const buckets = new Map<number, { canary: number; stable: number; error: number }>();
  for (let b = start; b <= last; b += bucketMs) buckets.set(b, { canary: 0, stable: 0, error: 0 });
  for (const s of samples) {
    const b = Math.floor(s.t / bucketMs) * bucketMs;
    const slot = buckets.get(b);
    if (slot) slot[s.tier]++;
  }
  // Values are requests per second within each bucket.
  const perSec = (n: number) => Math.round((n / (bucketMs / 1000)) * 10) / 10;
  const withErrors = samples.some((s) => s.tier === 'error');
  return Array.from(buckets.entries()).map(([b, c]) => ({
    name: label(b),
    series: [
      { name: 'Stable', value: perSec(c.stable) },
      { name: 'Canary', value: perSec(c.canary) },
      ...(withErrors ? [{ name: 'Errors', value: perSec(c.error) }] : []),
    ],
  }));
}

/** Show a version as a build label: '43' -> 'build-43', 'build-43' / 'v1.2' unchanged. */
export function buildLabel(version?: string | null): string {
  const v = (version ?? '').toString().trim();
  if (!v) return 'build unknown';
  return /^\d+$/.test(v) ? `build-${v}` : v;
}

/** How far the observed canary share is from the expected one, in percentage points. */
export function splitVerdict(observedPct: number, expectedPct: number, okResponses: number):
  'waiting' | 'on-target' | 'off-target' {
  if (okResponses < 20) return 'waiting';
  return Math.abs(observedPct - expectedPct) <= 5 ? 'on-target' : 'off-target';
}
