// Memory usage via Puppeteer's page.metrics() (CDP Performance.getMetrics
// under the hood): JSHeapUsedSize before/after loading the 800+ task list,
// and before/after the sort+filter interactions.
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
  SELECTORS,
} from './utils/puppeteer-helpers.js';

function toMB(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

async function collectHeapBytes(page) {
  // Force a GC pass first (requires --js-flags=--expose-gc) so readings
  // reflect retained memory rather than not-yet-collected garbage.
  await page.evaluate(() => {
    if (typeof window.gc === 'function') window.gc();
  });
  const metrics = await page.metrics();
  return metrics.JSHeapUsedSize ?? 0;
}

async function measureMemoryOnce(baseUrl) {
  const { browser, page } = await launchPage(['--js-flags=--expose-gc']);
  try {
    await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle0' });
    await waitForContent(page, SELECTORS.projectCardLink);
    const beforeTaskList = await collectHeapBytes(page);

    await page.click(SELECTORS.projectCardLink);
    await waitForMeasureWithRetry(page, 'nav-to-detail-duration');
    await waitForContent(page, SELECTORS.taskEditLink);
    const afterTaskList = await collectHeapBytes(page);

    await page.select(SELECTORS.dueSortSelect, 'desc');
    await waitForMeasureWithRetry(page, 'sort-duration');
    await page.select(SELECTORS.statusFilterSelect, 'done');
    await waitForMeasureWithRetry(page, 'filter-duration');
    const afterInteractions = await collectHeapBytes(page);

    return {
      beforeTaskListMB: toMB(beforeTaskList),
      afterTaskListMB: toMB(afterTaskList),
      taskListDeltaMB: toMB(afterTaskList - beforeTaskList),
      afterInteractionsMB: toMB(afterInteractions),
      interactionsDeltaMB: toMB(afterInteractions - afterTaskList),
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

export async function runMemorySuite(existingUrls, closeServers) {
  console.log('\n=== Memory usage: JS heap before/after task list load and interactions ===');

  let urls = existingUrls;
  let close = closeServers;
  if (!urls) {
    const handle = await buildAndServeAll();
    urls = handle.urls;
    close = handle.close;
  }

  const rawByApp = Object.fromEntries(APPS.map((app) => [app.key, []]));

  for (let run = 1; run <= RUNS.memory; run++) {
    console.log(`\n  Run ${run}/${RUNS.memory}`);
    for (const app of APPS) {
      const result = await measureMemoryOnce(urls[app.key]);
      rawByApp[app.key].push({ run, ...result });
      console.log(
        `    ${app.label}: before ${result.beforeTaskListMB}MB -> after task list ${result.afterTaskListMB}MB ` +
          `(Δ${result.taskListDeltaMB}MB) -> after sort+filter ${result.afterInteractionsMB}MB ` +
          `(Δ${result.interactionsDeltaMB}MB)`,
      );
    }
  }

  if (!existingUrls) await close();

  const summary = {};
  for (const app of APPS) {
    const runs = rawByApp[app.key];
    summary[app.key] = {
      beforeTaskList: summarizeRuns(runs.map((r) => r.beforeTaskListMB)),
      afterTaskList: summarizeRuns(runs.map((r) => r.afterTaskListMB)),
      taskListDelta: summarizeRuns(runs.map((r) => r.taskListDeltaMB)),
      afterInteractions: summarizeRuns(runs.map((r) => r.afterInteractionsMB)),
      interactionsDelta: summarizeRuns(runs.map((r) => r.interactionsDeltaMB)),
    };
  }

  writeJson(join(RAW_DIR, 'memory-raw.json'), rawByApp);
  writeJson(join(RAW_DIR, 'memory-summary.json'), summary);
  writeCsv(
    join(RAW_DIR, 'memory-raw.csv'),
    APPS.flatMap((app) => rawByApp[app.key].map((r) => ({ app: app.key, ...r }))),
  );

  console.log('\n  Summary (mean ± stddev, MB):');
  for (const app of APPS) {
    const s = summary[app.key];
    const outlierCount = [s.beforeTaskList, s.afterTaskList, s.taskListDelta, s.afterInteractions, s.interactionsDelta].reduce(
      (n, metric) => n + metric.outliers.length,
      0,
    );
    console.log(
      `    ${app.label}: task-list Δ ${s.taskListDelta.mean}±${s.taskListDelta.stddev}  ` +
        `interactions Δ ${s.interactionsDelta.mean}±${s.interactionsDelta.stddev}  ` +
        `(peak after interactions: ${s.afterInteractions.mean}±${s.afterInteractions.stddev})` +
        (outlierCount > 0 ? `  [${outlierCount} outlier run(s) flagged]` : ''),
    );
  }

  return { rawByApp, summary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMemorySuite().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
