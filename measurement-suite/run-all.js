// Single entry point: `npm run measure`.
// Builds both prototypes once, serves them once, then runs every metric
// module back-to-back against that same build + server pair, so React and
// Angular are always measured under identical machine conditions in one
// continuous execution window - never in separate invocations that could
// drift apart in background load.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR } from './src/config.js';
import { buildAndServeAll } from './src/build-and-serve.js';
import { runStaticMetrics } from './src/static-metrics.js';
import { runLighthouseSuite } from './src/lighthouse-runner.js';
import { runInteractionTiming } from './src/interaction-timing.js';
import { runMemorySuite } from './src/memory-runner.js';
import { aggregateResults } from './src/aggregate-results.js';

async function main() {
  const startedAt = Date.now();
  console.log('React vs Angular measurement suite — starting full run\n');

  const { urls, close } = await buildAndServeAll();

  await runStaticMetrics();
  await runLighthouseSuite(urls, close);
  await runInteractionTiming(urls, close);
  await runMemorySuite(urls, close);

  await close();

  await aggregateResults();

  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n=== Full run complete in ${elapsedMin} minutes ===`);
  console.log(`Results written to: ${RESULTS_DIR}\n`);
  console.log(readFileSync(join(RESULTS_DIR, 'summary.md'), 'utf-8'));
}

main().catch((error) => {
  console.error('\nMeasurement suite failed:', error);
  process.exit(1);
});
