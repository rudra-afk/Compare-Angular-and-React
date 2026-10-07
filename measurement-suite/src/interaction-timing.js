// Rendering performance: scripted sort / filter / navigate interactions,
// timed via the performance.mark()/measure() calls added identically to
// both apps (see PERF_MARKS in each app's utils folder).
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { APPS, RAW_DIR, RUNS } from './config.js';
import { writeJson, writeCsv } from './utils/csv.js';
import { summarizeRuns } from './utils/stats.js';
import { buildAndServeAll } from './build-and-serve.js';
import {
  launchPage,
  waitForContent,
  waitForMeasureWithRetry,
  getMeasureDurations,
  SELECTORS,
} from './utils/puppeteer-helpers.js';

function round(n) {
  return n === null || n === undefined ? null : Math.round(n * 100) / 100;
}

async function measureInteractionsOnce(baseUrl) {
  const { browser, page } = await launchPage();
  try {
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle0' });
    await waitForContent(page, SELECTORS.projectCardLink);

    // 1. Navigate: Projects list -> Project detail
    await page.click(SELECTORS.projectCardLink);
    await waitForMeasureWithRetry(page, 'nav-to-detail-duration');
    // Wait for the task list itself (not just the filter toolbar) so the
    // sort/filter interactions below act on a fully-rendered, realistic list.
    await waitForContent(page, SELECTORS.taskEditLink);

    // 2. Sort the task list by due date
    await page.select(SELECTORS.dueSortSelect, 'desc');
    await waitForMeasureWithRetry(page, 'sort-duration');

    // 3. Filter the task list by status
    await page.select(SELECTORS.statusFilterSelect, 'done');
    await waitForMeasureWithRetry(page, 'filter-duration');

    // 4. Navigate: Project detail -> back to Projects list
    await page.click(SELECTORS.backToListLink);
    await waitForMeasureWithRetry(page, 'nav-to-list-duration');

    const durations = await getMeasureDurations(page);
    return {
      navToDetail: round(durations['nav-to-detail-duration']),
      sort: round(durations['sort-duration']),
      filter: round(durations['filter-duration']),
      navToList: round(durations['nav-to-list-duration']),
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

export async function runInteractionTiming(existingUrls, closeServers) {
  console.log('\n=== Interaction timing: sort, filter, navigation ===');

  let urls = existingUrls;
  let close = closeServers;
  if (!urls) {
    const handle = await buildAndServeAll();
    urls = handle.urls;
    close = handle.close;
  }

  const rawByApp = Object.fromEntries(APPS.map((app) => [app.key, []]));

  // Interleaved across apps per run, same rationale as the Lighthouse runner.
  for (let run = 1; run <= RUNS.interaction; run++) {
    console.log(`\n  Run ${run}/${RUNS.interaction}`);
    for (const app of APPS) {
      const result = await measureInteractionsOnce(urls[app.key]);
      rawByApp[app.key].push({ run, ...result });
      console.log(
        `    ${app.label}: nav→detail ${result.navToDetail}ms  sort ${result.sort}ms  ` +
          `filter ${result.filter}ms  nav→list ${result.navToList}ms`,
      );
    }
  }

  if (!existingUrls) await close();

  const summary = {};
  for (const app of APPS) {
    const runs = rawByApp[app.key];
    summary[app.key] = {
      navToDetail: summarizeRuns(runs.map((r) => r.navToDetail)),
      sort: summarizeRuns(runs.map((r) => r.sort)),
      filter: summarizeRuns(runs.map((r) => r.filter)),
      navToList: summarizeRuns(runs.map((r) => r.navToList)),
    };
  }

  writeJson(join(RAW_DIR, 'interaction-timing-raw.json'), rawByApp);
  writeJson(join(RAW_DIR, 'interaction-timing-summary.json'), summary);
  writeCsv(
    join(RAW_DIR, 'interaction-timing-raw.csv'),
    APPS.flatMap((app) => rawByApp[app.key].map((r) => ({ app: app.key, ...r }))),
  );

  console.log('\n  Summary (mean ± stddev, ms):');
  for (const app of APPS) {
    const s = summary[app.key];
    const outlierCount = [s.navToDetail, s.sort, s.filter, s.navToList].reduce(
      (n, metric) => n + metric.outliers.length,
      0,
    );
    console.log(
      `    ${app.label}: nav→detail ${s.navToDetail.mean}±${s.navToDetail.stddev}  ` +
        `sort ${s.sort.mean}±${s.sort.stddev}  filter ${s.filter.mean}±${s.filter.stddev}  ` +
        `nav→list ${s.navToList.mean}±${s.navToList.stddev}` +
        (outlierCount > 0 ? `  [${outlierCount} outlier run(s) flagged]` : ''),
    );
  }

  return { rawByApp, summary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runInteractionTiming().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
