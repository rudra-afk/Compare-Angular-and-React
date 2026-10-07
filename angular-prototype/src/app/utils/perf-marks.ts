// Shared performance.mark()/measure() names used by the measurement-suite's
// interaction-timing module. Identical copy lives in the Angular project.
// These do not affect app behaviour - they're inert instrumentation only.
export const PERF_MARKS = {
  sortStart: 'sort-start',
  sortEnd: 'sort-end',
  sortMeasure: 'sort-duration',

  filterStart: 'filter-start',
  filterEnd: 'filter-end',
  filterMeasure: 'filter-duration',

  navToDetailStart: 'nav-to-detail-start',
  navToDetailEnd: 'nav-to-detail-end',
  navToDetailMeasure: 'nav-to-detail-duration',

  navToListStart: 'nav-to-list-start',
  navToListEnd: 'nav-to-list-end',
  navToListMeasure: 'nav-to-list-duration',
} as const;

export function markSafe(name: string): void {
  if (typeof performance !== 'undefined') performance.mark(name);
}

export function measureSafe(measureName: string, startMark: string, endMark: string): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(measureName, startMark, endMark);
  } catch {
    // start mark missing (e.g. measured interaction fired before its
    // corresponding start mark was set) - safe to ignore.
  }
}
