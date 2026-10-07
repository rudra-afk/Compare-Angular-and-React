// Combines every metric module's output into one summary table (CSV +
// Markdown) and a set of report-ready PNG charts.
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAW_DIR, RESULTS_DIR } from './config.js';
import { writeCsv } from './utils/csv.js';
import { renderBarChart, renderDiffChart } from './chart-renderer.js';

// Each chart gets its own distinct React/Angular color pair, rather than
// reusing one combination everywhere, so the charts read as visually
// distinct figures in a report rather than repeats of the same palette.
const PALETTE = {
  loadTime: { react: '#3b82f6', angular: '#f97316' }, // blue / orange
  lighthouseScore: { react: '#14b8a6', angular: '#e11d48' }, // teal / rose
  rendering: { react: '#6366f1', angular: '#f59e0b' }, // indigo / amber
  memory: { react: '#10b981', angular: '#ec4899' }, // emerald / pink
  bundleSize: { react: '#8b5cf6', angular: '#eab308' }, // violet / gold
  loc: { react: '#0891b2', angular: '#dc2626' }, // dark cyan / red
  complexity: { react: '#0ea5e9', angular: '#d946ef' }, // sky / fuchsia
};

// Overview chart colors are direction-based (Angular lower vs higher than
// React), not framework-based, so they're deliberately separate from PALETTE.
const DIFF_POSITIVE_COLOR = '#db2777'; // Angular higher than React
const DIFF_NEGATIVE_COLOR = '#0d9488'; // Angular lower than React

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'n/a';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildRow(metric, unit, reactMean, reactStd, angularMean, angularStd) {
  const diff = angularMean - reactMean;
  const pct = reactMean !== 0 ? (diff / reactMean) * 100 : null;
  return {
    metric,
    unit,
    react: reactStd !== undefined && reactStd !== null ? `${fmtNum(reactMean)} ± ${fmtNum(reactStd)}` : fmtNum(reactMean),
    angular:
      angularStd !== undefined && angularStd !== null
        ? `${fmtNum(angularMean)} ± ${fmtNum(angularStd)}`
        : fmtNum(angularMean),
    differenceAngularMinusReact: fmtNum(diff),
    percentDifference: pct === null ? 'n/a' : `${fmtNum(pct)}%`,
    // Raw numeric % difference (rounded, unformatted) for the overview chart.
    rawPercentDifference: pct === null ? null : Math.round(pct * 100) / 100,
  };
}

export async function aggregateResults() {
  console.log('\n=== Aggregating results: summary table + charts ===');

  const lighthouse = readJsonIfExists(join(RAW_DIR, 'lighthouse-summary.json'));
  const interaction = readJsonIfExists(join(RAW_DIR, 'interaction-timing-summary.json'));
  const memory = readJsonIfExists(join(RAW_DIR, 'memory-summary.json'));
  const bundle = readJsonIfExists(join(RAW_DIR, 'bundle-size.json'));
  const loc = readJsonIfExists(join(RAW_DIR, 'loc.json'));
  const complexity = readJsonIfExists(join(RAW_DIR, 'complexity.json'));

  const rows = [];

  if (lighthouse) {
    const { react: r, angular: a } = lighthouse;
    rows.push(buildRow('First Contentful Paint', 'ms', r.fcp.mean, r.fcp.stddev, a.fcp.mean, a.fcp.stddev));
    rows.push(buildRow('Largest Contentful Paint', 'ms', r.lcp.mean, r.lcp.stddev, a.lcp.mean, a.lcp.stddev));
    rows.push(buildRow('Time to Interactive', 'ms', r.tti.mean, r.tti.stddev, a.tti.mean, a.tti.stddev));
    rows.push(buildRow('Total Blocking Time', 'ms', r.tbt.mean, r.tbt.stddev, a.tbt.mean, a.tbt.stddev));
    rows.push(
      buildRow(
        'Lighthouse Performance Score',
        '/100',
        r.performanceScore.mean,
        r.performanceScore.stddev,
        a.performanceScore.mean,
        a.performanceScore.stddev,
      ),
    );
  }

  if (interaction) {
    const { react: r, angular: a } = interaction;
    rows.push(
      buildRow('Navigate: list -> detail', 'ms', r.navToDetail.mean, r.navToDetail.stddev, a.navToDetail.mean, a.navToDetail.stddev),
    );
    rows.push(buildRow('Sort by due date', 'ms', r.sort.mean, r.sort.stddev, a.sort.mean, a.sort.stddev));
    rows.push(buildRow('Filter by status', 'ms', r.filter.mean, r.filter.stddev, a.filter.mean, a.filter.stddev));
    rows.push(
      buildRow('Navigate: detail -> list', 'ms', r.navToList.mean, r.navToList.stddev, a.navToList.mean, a.navToList.stddev),
    );
  }

  if (memory) {
    const { react: r, angular: a } = memory;
    rows.push(
      buildRow(
        'Memory: task list load (Δ heap)',
        'MB',
        r.taskListDelta.mean,
        r.taskListDelta.stddev,
        a.taskListDelta.mean,
        a.taskListDelta.stddev,
      ),
    );
    rows.push(
      buildRow(
        'Memory: sort+filter (Δ heap)',
        'MB',
        r.interactionsDelta.mean,
        r.interactionsDelta.stddev,
        a.interactionsDelta.mean,
        a.interactionsDelta.stddev,
      ),
    );
    rows.push(
      buildRow(
        'Memory: peak heap after interactions',
        'MB',
        r.afterInteractions.mean,
        r.afterInteractions.stddev,
        a.afterInteractions.mean,
        a.afterInteractions.stddev,
      ),
    );
  }

  if (bundle) {
    const r = bundle.find((b) => b.app === 'react');
    const a = bundle.find((b) => b.app === 'angular');
    rows.push(buildRow('Bundle size: JS (raw)', 'KB', r.jsRawKB, null, a.jsRawKB, null));
    rows.push(buildRow('Bundle size: JS (gzip)', 'KB', r.jsGzipKB, null, a.jsGzipKB, null));
    rows.push(buildRow('Bundle size: total (raw)', 'KB', r.totalRawKB, null, a.totalRawKB, null));
    rows.push(buildRow('Bundle size: total (gzip)', 'KB', r.totalGzipKB, null, a.totalGzipKB, null));
  }

  if (loc) {
    const r = loc.find((l) => l.app === 'react');
    const a = loc.find((l) => l.app === 'angular');
    rows.push(buildRow('Lines of code', 'lines', r.totalCodeLines, null, a.totalCodeLines, null));
    rows.push(buildRow('File count', 'files', r.totalFiles, null, a.totalFiles, null));
    // Per-language breakdown (over every language cloc found in either app;
    // 0 where an app has no files of that language at all, e.g. React has
    // no separate template language).
    const languages = [...new Set([...Object.keys(r.byLanguage), ...Object.keys(a.byLanguage)])].sort();
    for (const lang of languages) {
      rows.push(
        buildRow(
          `Lines of code: ${lang}`,
          'lines',
          r.byLanguage[lang]?.code ?? 0,
          null,
          a.byLanguage[lang]?.code ?? 0,
          null,
        ),
      );
    }
  }

  if (complexity) {
    const r = complexity.find((c) => c.app === 'react');
    const a = complexity.find((c) => c.app === 'angular');
    rows.push(buildRow('Cyclomatic complexity (avg)', 'per function', r.avgComplexity, null, a.avgComplexity, null));
    rows.push(buildRow('Cyclomatic complexity (max)', 'per function', r.maxComplexity, null, a.maxComplexity, null));
  }

  writeCsv(
    join(RESULTS_DIR, 'summary.csv'),
    rows.map(({ rawPercentDifference, ...rest }) => rest),
  );

  const mdLines = [
    '# React vs Angular — Measurement Summary',
    '',
    `Generated ${new Date().toISOString()}`,
    '',
    '| Metric | Unit | React | Angular | Difference (Angular − React) | % Difference (vs React) |',
    '|---|---|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${r.metric} | ${r.unit} | ${r.react} | ${r.angular} | ${r.differenceAngularMinusReact} | ${r.percentDifference} |`,
    ),
    '',
    '**Notes:**',
    '- Values with `±` are mean ± standard deviation across repeated runs (5 for load time / rendering, 3 for memory). Static metrics (bundle size, LOC, complexity) are single-measurement and have no stddev.',
    '- See `results/raw/` for every individual run, not just the aggregated means.',
    '- See `results/charts/` for the corresponding PNG bar charts, including `summary-comparison.png`, an overview of every metric\'s % difference in one chart.',
    '- "Lower isn\'t always better": for Lighthouse Performance Score, higher is better (so a negative bar there is a genuine Angular disadvantage); for Lines of Code / File Count, neither direction is inherently "better" - they\'re descriptive, not qualitative.',
    '- The "static metrics" category is rendered as three separate charts (`bundle-size.png`, `loc.png`, `complexity.png`) rather than one combined chart, since KB / lines / complexity-score sit on incompatible scales and forcing them onto one shared axis would be misleading rather than clearer.',
  ];
  writeFileSync(join(RESULTS_DIR, 'summary.md'), mdLines.join('\n') + '\n', 'utf-8');
  console.log(`  Wrote ${rows.length} rows to summary.csv / summary.md`);

  await renderAllCharts({ lighthouse, interaction, memory, bundle, loc, complexity, rows });

  return rows;
}

async function renderAllCharts({ lighthouse, interaction, memory, bundle, loc, complexity, rows }) {
  console.log('  Rendering charts...');

  if (lighthouse) {
    const c = PALETTE.loadTime;
    await renderBarChart({
      title: 'Load Time (Lighthouse)',
      filename: 'load-time.png',
      yLabel: 'Time (ms)',
      labels: ['FCP', 'LCP', 'TTI', 'TBT'],
      series: [
        {
          label: 'React',
          color: c.react,
          values: [lighthouse.react.fcp.mean, lighthouse.react.lcp.mean, lighthouse.react.tti.mean, lighthouse.react.tbt.mean],
          stddevs: [lighthouse.react.fcp.stddev, lighthouse.react.lcp.stddev, lighthouse.react.tti.stddev, lighthouse.react.tbt.stddev],
        },
        {
          label: 'Angular',
          color: c.angular,
          values: [
            lighthouse.angular.fcp.mean,
            lighthouse.angular.lcp.mean,
            lighthouse.angular.tti.mean,
            lighthouse.angular.tbt.mean,
          ],
          stddevs: [
            lighthouse.angular.fcp.stddev,
            lighthouse.angular.lcp.stddev,
            lighthouse.angular.tti.stddev,
            lighthouse.angular.tbt.stddev,
          ],
        },
      ],
    });

    const s = PALETTE.lighthouseScore;
    await renderBarChart({
      title: 'Lighthouse Performance Score',
      filename: 'lighthouse-score.png',
      yLabel: 'Score (out of 100)',
      labels: ['Performance score'],
      series: [
        {
          label: 'React',
          color: s.react,
          values: [lighthouse.react.performanceScore.mean],
          stddevs: [lighthouse.react.performanceScore.stddev],
        },
        {
          label: 'Angular',
          color: s.angular,
          values: [lighthouse.angular.performanceScore.mean],
          stddevs: [lighthouse.angular.performanceScore.stddev],
        },
      ],
    });
  }

  if (interaction) {
    const c = PALETTE.rendering;
    await renderBarChart({
      title: 'Rendering Performance (Scripted Interactions)',
      filename: 'rendering-performance.png',
      yLabel: 'Duration (ms)',
      labels: ['Nav: list→detail', 'Sort by due date', 'Filter by status', 'Nav: detail→list'],
      series: [
        {
          label: 'React',
          color: c.react,
          values: [
            interaction.react.navToDetail.mean,
            interaction.react.sort.mean,
            interaction.react.filter.mean,
            interaction.react.navToList.mean,
          ],
          stddevs: [
            interaction.react.navToDetail.stddev,
            interaction.react.sort.stddev,
            interaction.react.filter.stddev,
            interaction.react.navToList.stddev,
          ],
        },
        {
          label: 'Angular',
          color: c.angular,
          values: [
            interaction.angular.navToDetail.mean,
            interaction.angular.sort.mean,
            interaction.angular.filter.mean,
            interaction.angular.navToList.mean,
          ],
          stddevs: [
            interaction.angular.navToDetail.stddev,
            interaction.angular.sort.stddev,
            interaction.angular.filter.stddev,
            interaction.angular.navToList.stddev,
          ],
        },
      ],
    });
  }

  if (memory) {
    const c = PALETTE.memory;
    await renderBarChart({
      title: 'Memory Usage (JS Heap)',
      filename: 'memory-usage.png',
      yLabel: 'Heap size (MB)',
      labels: ['Δ task list load', 'Δ sort+filter', 'Peak after interactions'],
      series: [
        {
          label: 'React',
          color: c.react,
          values: [memory.react.taskListDelta.mean, memory.react.interactionsDelta.mean, memory.react.afterInteractions.mean],
          stddevs: [
            memory.react.taskListDelta.stddev,
            memory.react.interactionsDelta.stddev,
            memory.react.afterInteractions.stddev,
          ],
        },
        {
          label: 'Angular',
          color: c.angular,
          values: [
            memory.angular.taskListDelta.mean,
            memory.angular.interactionsDelta.mean,
            memory.angular.afterInteractions.mean,
          ],
          stddevs: [
            memory.angular.taskListDelta.stddev,
            memory.angular.interactionsDelta.stddev,
            memory.angular.afterInteractions.stddev,
          ],
        },
      ],
    });
  }

  if (bundle) {
    const r = bundle.find((b) => b.app === 'react');
    const a = bundle.find((b) => b.app === 'angular');
    const c = PALETTE.bundleSize;
    await renderBarChart({
      title: 'Bundle Size',
      filename: 'bundle-size.png',
      yLabel: 'Size (KB)',
      labels: ['JS (raw)', 'JS (gzip)', 'Total (raw)', 'Total (gzip)'],
      series: [
        { label: 'React', color: c.react, values: [r.jsRawKB, r.jsGzipKB, r.totalRawKB, r.totalGzipKB] },
        { label: 'Angular', color: c.angular, values: [a.jsRawKB, a.jsGzipKB, a.totalRawKB, a.totalGzipKB] },
      ],
    });
  }

  if (loc) {
    const r = loc.find((l) => l.app === 'react');
    const a = loc.find((l) => l.app === 'angular');
    const c = PALETTE.loc;
    const languages = [...new Set([...Object.keys(r.byLanguage), ...Object.keys(a.byLanguage)])].sort();

    await renderBarChart({
      title: 'Lines of Code (Total + Per Language)',
      filename: 'loc.png',
      yLabel: 'Lines of code',
      labels: ['Total', ...languages],
      series: [
        {
          label: 'React',
          color: c.react,
          values: [r.totalCodeLines, ...languages.map((lang) => r.byLanguage[lang]?.code ?? 0)],
        },
        {
          label: 'Angular',
          color: c.angular,
          values: [a.totalCodeLines, ...languages.map((lang) => a.byLanguage[lang]?.code ?? 0)],
        },
      ],
    });
  }

  if (complexity) {
    const r = complexity.find((c) => c.app === 'react');
    const a = complexity.find((c) => c.app === 'angular');
    const c2 = PALETTE.complexity;
    await renderBarChart({
      title: 'Cyclomatic Complexity (ESLint)',
      filename: 'complexity.png',
      yLabel: 'Complexity (per function)',
      labels: ['Average', 'Max'],
      series: [
        { label: 'React', color: c2.react, values: [r.avgComplexity, r.maxComplexity] },
        { label: 'Angular', color: c2.angular, values: [a.avgComplexity, a.maxComplexity] },
      ],
    });
  }

  // Overview chart: every metric's % difference, in one place, on one shared
  // percentage axis - built directly from the same rows written to
  // summary.csv/summary.md.
  const diffRows = rows.filter((r) => r.rawPercentDifference !== null);
  await renderDiffChart({
    title: 'Overall Comparison: React vs Angular (% Difference per Metric)',
    filename: 'summary-comparison.png',
    xLabel: '% Difference (Angular vs React baseline)',
    labels: diffRows.map((r) => `${r.metric} (${r.unit})`),
    values: diffRows.map((r) => r.rawPercentDifference),
    positiveColor: '#db2777',
    negativeColor: '#0d9488',
  });

  console.log('  Charts written to results/charts/ (including summary-comparison.png)');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  aggregateResults().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
