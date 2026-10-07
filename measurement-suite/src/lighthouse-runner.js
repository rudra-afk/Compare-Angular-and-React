// Load time metrics via Lighthouse: FCP, TTI, LCP, TBT.
// Runs against the "desktop" Lighthouse config (rather than the default
// mobile/slow-4G emulation) since this is a desktop dashboard app - both
// apps get the exact same config, so this choice doesn't affect fairness,
// only realism.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { APPS, RAW_DIR, RUNS } from './config.js';
import { writeJson, writeCsv } from './utils/csv.js';
import { summarizeRuns } from './utils/stats.js';
import { buildAndServeAll } from './build-and-serve.js';

const METRIC_KEYS = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  tti: 'interactive',
  tbt: 'total-blocking-time',
};

async function runLighthouseOnce(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const { port } = new URL(browser.wsEndpoint());
    const result = await lighthouse(
      url,
      { port: Number(port), output: 'json', logLevel: 'silent', onlyCategories: ['performance'] },
      desktopConfig.default,
    );
    const audits = result.lhr.audits;
    return {
      fcp: Math.round(audits[METRIC_KEYS.fcp].numericValue),
      lcp: Math.round(audits[METRIC_KEYS.lcp].numericValue),
      tti: Math.round(audits[METRIC_KEYS.tti].numericValue),
      tbt: Math.round(audits[METRIC_KEYS.tbt].numericValue),
      performanceScore: Math.round((result.lhr.categories.performance.score ?? 0) * 100),
    };
  } finally {
    await browser.close();
  }
}

export async function runLighthouseSuite(existingUrls, closeServers) {
  console.log('\n=== Lighthouse: load time metrics (FCP, LCP, TTI, TBT) ===');

  let urls = existingUrls;
  let close = closeServers;
  if (!urls) {
    const handle = await buildAndServeAll();
    urls = handle.urls;
    close = handle.close;
  }

  const rawByApp = Object.fromEntries(APPS.map((app) => [app.key, []]));

  // Runs are interleaved (React run 1, Angular run 1, React run 2, ...)
  // rather than blocked, so any drift in machine conditions over the course
  // of the whole suite affects both apps equally rather than favouring
  // whichever app happened to run first.
  for (let run = 1; run <= RUNS.lighthouse; run++) {
    console.log(`\n  Run ${run}/${RUNS.lighthouse}`);
    for (const app of APPS) {
      const result = await runLighthouseOnce(urls[app.key]);
      rawByApp[app.key].push({ run, ...result });
      console.log(
        `    ${app.label}: FCP ${result.fcp}ms  LCP ${result.lcp}ms  TTI ${result.tti}ms  ` +
          `TBT ${result.tbt}ms  (score ${result.performanceScore})`,
      );
    }
  }

  if (!existingUrls) await close();

  const summary = {};
  for (const app of APPS) {
    const runs = rawByApp[app.key];
    summary[app.key] = {
      fcp: summarizeRuns(runs.map((r) => r.fcp)),
      lcp: summarizeRuns(runs.map((r) => r.lcp)),
      tti: summarizeRuns(runs.map((r) => r.tti)),
      tbt: summarizeRuns(runs.map((r) => r.tbt)),
      performanceScore: summarizeRuns(runs.map((r) => r.performanceScore)),
    };
  }

  writeJson(join(RAW_DIR, 'lighthouse-raw.json'), rawByApp);
  writeJson(join(RAW_DIR, 'lighthouse-summary.json'), summary);
  writeCsv(
    join(RAW_DIR, 'lighthouse-raw.csv'),
    APPS.flatMap((app) => rawByApp[app.key].map((r) => ({ app: app.key, ...r }))),
  );

  console.log('\n  Summary (mean ± stddev, ms):');
  for (const app of APPS) {
    const s = summary[app.key];
    console.log(
      `    ${app.label}: FCP ${s.fcp.mean}±${s.fcp.stddev}  LCP ${s.lcp.mean}±${s.lcp.stddev}  ` +
        `TTI ${s.tti.mean}±${s.tti.stddev}  TBT ${s.tbt.mean}±${s.tbt.stddev}` +
        (s.fcp.outliers.length || s.lcp.outliers.length || s.tti.outliers.length || s.tbt.outliers.length
          ? '  [outlier run flagged]'
          : ''),
    );
  }

  return { rawByApp, summary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLighthouseSuite().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
