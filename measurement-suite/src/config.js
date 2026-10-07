import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SUITE_ROOT = join(__dirname, '..');
export const RESULTS_DIR = join(SUITE_ROOT, 'results');
export const RAW_DIR = join(RESULTS_DIR, 'raw');
export const CHARTS_DIR = join(RESULTS_DIR, 'charts');
export const PARENT_ROOT = join(SUITE_ROOT, '..');

export const APPS = [
  {
    key: 'react',
    label: 'React',
    dir: join(PARENT_ROOT, 'react-prototype'),
    distDir: join(PARENT_ROOT, 'react-prototype', 'dist'),
    srcDir: join(PARENT_ROOT, 'react-prototype', 'src'),
    port: 4501,
  },
  {
    key: 'angular',
    label: 'Angular',
    dir: join(PARENT_ROOT, 'angular-prototype'),
    distDir: join(PARENT_ROOT, 'angular-prototype', 'dist', 'angular-prototype', 'browser'),
    srcDir: join(PARENT_ROOT, 'angular-prototype', 'src'),
    port: 4502,
  },
];

// Repeat counts as specified in the measurement brief.
export const RUNS = {
  lighthouse: 5,
  interaction: 5,
  memory: 3,
};

// A run is flagged (not discarded) as an outlier if it exceeds this multiple
// of the median for its metric.
export const OUTLIER_FACTOR = 2;
