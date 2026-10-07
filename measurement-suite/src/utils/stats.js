import { OUTLIER_FACTOR } from '../config.js';

export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Flags (does not discard) any run whose value exceeds OUTLIER_FACTOR times
// the median for that same run set, per the measurement brief.
export function findOutliers(values, factor = OUTLIER_FACTOR) {
  const med = median(values);
  if (med <= 0) return [];
  return values.filter((v) => v > med * factor);
}

export function summarizeRuns(values) {
  return {
    runs: values,
    n: values.length,
    mean: round2(mean(values)),
    stddev: round2(stddev(values)),
    median: round2(median(values)),
    min: round2(Math.min(...values)),
    max: round2(Math.max(...values)),
    outliers: findOutliers(values),
  };
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}
