// Renders report-ready PNG bar charts comparing React vs Angular per metric.
// Implementation: launch Chart.js inside an offscreen Puppeteer page and
// screenshot the canvas at 2x device scale. This reuses the same Puppeteer
// dependency already required for the rest of the suite instead of adding
// chartjs-node-canvas's native 'canvas' binding (a common Windows install
// failure point), and keeps everything fully local/offline (no quickchart.io
// network calls).
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { CHARTS_DIR, SUITE_ROOT } from './config.js';

const CHARTJS_SOURCE = readFileSync(join(SUITE_ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'), 'utf-8');

const DEFAULT_WIDTH = 1152;
const DEFAULT_HEIGHT = 720;

async function renderChart(filename, width, height, buildChart) {
  mkdirSync(CHARTS_DIR, { recursive: true });
  const outPath = join(CHARTS_DIR, filename);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#ffffff;">` +
        `<canvas id="chart" width="${width}" height="${height}"></canvas>` +
        `</body></html>`,
    );
    await page.addScriptTag({ content: CHARTJS_SOURCE });
    await buildChart(page);

    // Let Chart.js finish its (non-animated, but still async-scheduled) paint.
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await page.$('#chart');
    await canvas.screenshot({ path: outPath });
    await page.close();
    return outPath;
  } finally {
    await browser.close();
  }
}

/**
 * Grouped vertical bar chart - one group per metric, one bar per framework.
 *
 * @param {object} opts
 * @param {string} opts.title - chart title
 * @param {string} opts.filename - output filename, saved under results/charts/
 * @param {string} opts.yLabel - y-axis label, should include units
 * @param {string[]} opts.labels - x-axis category labels (one per metric)
 * @param {{ label: string, color: string, values: number[], stddevs?: (number|null)[] }[]} opts.series
 *   Exactly the React and Angular series. stddevs, if provided, are drawn as
 *   a "± n" text label above each bar (this project's stand-in for error
 *   bars, since it avoids an extra chart.js error-bar plugin dependency).
 */
export async function renderBarChart({ title, filename, yLabel, labels, series, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT }) {
  return renderChart(filename, width, height, (page) =>
    page.evaluate(
      (config) => {
        const ctx = document.getElementById('chart').getContext('2d');

        const errorLabelPlugin = {
          id: 'errorLabel',
          afterDatasetsDraw(chart) {
            const { ctx: c } = chart;
            chart.data.datasets.forEach((dataset, datasetIndex) => {
              const meta = chart.getDatasetMeta(datasetIndex);
              meta.data.forEach((bar, i) => {
                const sd = dataset.stddevs && dataset.stddevs[i];
                if (sd === undefined || sd === null) return;
                c.save();
                c.fillStyle = '#333333';
                c.font = '13px Arial, sans-serif';
                c.textAlign = 'center';
                c.fillText(`± ${sd}`, bar.x, bar.y - 8);
                c.restore();
              });
            });
          },
        };

        // eslint-disable-next-line no-undef
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: config.labels,
            datasets: config.series.map((s) => ({
              label: s.label,
              data: s.values,
              backgroundColor: s.color,
              stddevs: s.stddevs,
            })),
          },
          options: {
            responsive: false,
            animation: false,
            layout: { padding: { top: 30 } },
            plugins: {
              title: { display: true, text: config.title, font: { size: 22 }, padding: { bottom: 16 } },
              legend: { display: true, position: 'top', labels: { font: { size: 14 } } },
            },
            scales: {
              y: {
                title: { display: true, text: config.yLabel, font: { size: 14 } },
                beginAtZero: true,
                ticks: { font: { size: 12 } },
              },
              x: {
                ticks: { font: { size: 13 } },
              },
            },
          },
          plugins: [errorLabelPlugin],
        });
      },
      { title, labels, series },
    ),
  );
}

/**
 * Horizontal single-series bar chart - one bar per metric, value is a signed
 * % difference, coloured by sign rather than by framework (this is the
 * "overview across every metric" chart, not a per-framework comparison).
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.filename
 * @param {string} opts.xLabel
 * @param {string[]} opts.labels - one per metric, same order as values
 * @param {number[]} opts.values - signed % difference per metric
 * @param {string} opts.positiveColor - bar color where value > 0
 * @param {string} opts.negativeColor - bar color where value <= 0
 */
export async function renderDiffChart({ title, filename, xLabel, labels, values, positiveColor, negativeColor }) {
  const height = Math.max(600, labels.length * 42 + 160);
  return renderChart(filename, 1152, height, (page) =>
    page.evaluate(
      (config) => {
        const ctx = document.getElementById('chart').getContext('2d');

        const valueLabelPlugin = {
          id: 'valueLabel',
          afterDatasetsDraw(chart) {
            const { ctx: c } = chart;
            const meta = chart.getDatasetMeta(0);
            meta.data.forEach((bar, i) => {
              const v = chart.data.datasets[0].data[i];
              c.save();
              c.fillStyle = '#222222';
              c.font = '12px Arial, sans-serif';
              c.textAlign = v >= 0 ? 'left' : 'right';
              c.textBaseline = 'middle';
              const offset = v >= 0 ? 6 : -6;
              c.fillText(`${v > 0 ? '+' : ''}${v}%`, bar.x + offset, bar.y);
              c.restore();
            });
          },
        };

        // eslint-disable-next-line no-undef
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: config.labels,
            datasets: [
              {
                data: config.values,
                backgroundColor: config.values.map((v) => (v > 0 ? config.positiveColor : config.negativeColor)),
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: false,
            animation: false,
            layout: { padding: { right: 60, left: 10, top: 10, bottom: 10 } },
            plugins: {
              title: { display: true, text: config.title, font: { size: 22 }, padding: { bottom: 10 } },
              subtitle: {
                display: true,
                text: 'Negative = Angular lower than React. Positive = Angular higher than React. (Lower isn\'t always "better" - see summary.md notes.)',
                font: { size: 12, style: 'italic' },
                color: '#555555',
                padding: { bottom: 16 },
              },
              legend: { display: false },
            },
            scales: {
              x: {
                title: { display: true, text: config.xLabel, font: { size: 14 } },
                ticks: { font: { size: 12 } },
              },
              y: {
                ticks: { font: { size: 12 } },
              },
            },
          },
          plugins: [valueLabelPlugin],
        });
      },
      { title, labels, values, xLabel, positiveColor, negativeColor },
    ),
  );
}
