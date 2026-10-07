# Measurement Suite

Automated, reproducible measurement suite comparing `react-prototype` and
`angular-prototype` on load time, rendering performance, memory usage, bundle
size, lines of code, and code complexity — all six metrics, back-to-back, in
one execution window, so both apps are always measured under identical
machine conditions.

## Running it

```bash
npm install
npm run measure
```

This single command builds both prototypes' production bundles, serves them
locally, runs every metric module against both apps (interleaved — React run
1, Angular run 1, React run 2, ... — so no drift in machine state over the
course of the run favours either app), aggregates everything, and prints the
final summary table to the console. Takes roughly 3–4 minutes.

Individual stages can also be run on their own (each builds/serves the apps
itself if run standalone):

```bash
npm run measure:static      # bundle size, LOC, complexity
npm run measure:lighthouse  # FCP, LCP, TTI, TBT (5 runs/app)
npm run measure:interaction # sort/filter/navigate timing (5 runs/app)
npm run measure:memory      # JS heap before/after task list + interactions (3 runs/app)
npm run measure:aggregate   # rebuilds summary.csv/md + charts from whatever raw/ data exists
```

## Tool choices

- **Puppeteer** (not Playwright) for all browser automation — Lighthouse's
  own programmatic integration is documented and tested against Puppeteer,
  and Puppeteer bundles a pinned Chromium build, so every run uses the exact
  same browser binary regardless of what's installed on the host.
- **Chart rendering**: Chart.js run inside an offscreen Puppeteer page,
  screenshotted to PNG — reuses the Puppeteer dependency already required
  for everything else, stays fully local/offline (no quickchart.io network
  calls), and avoids `chartjs-node-canvas`'s native `canvas` binding (a
  common Windows install failure point).
- **Complexity**: ESLint's core `complexity` rule via `@typescript-eslint/parser`,
  set to warn at threshold 0 so every function's actual complexity number is
  parsed out of the lint messages. Chosen over `plato`/`typhonjs-escomplex`
  because those are both unmaintained and only understand plain JS (Angular's
  decorators would need a separate transpile step first). Trade-off: this
  approach reports per-function cyclomatic complexity but not a composite
  "Maintainability Index" — see the caveat below.
- **LOC**: `cloc` (the actual npm package ships the real Perl `cloc` tool,
  invoked directly via `perl` rather than its Windows `.cmd` shim - see
  "Windows notes" below). Falls back to a plain non-blank-line count per file
  extension if `cloc`/Perl isn't reachable, so the suite never hard-fails on
  this step.

## Output

```
results/
  raw/           per-run CSV + JSON for every metric, per app - the actual
                 repeated measurements, not just the averages
  summary.csv    one row per metric: React | Angular | difference | % diff
  summary.md     same table, Markdown-formatted, plus interpretive notes
  charts/        one PNG per metric category, ≥2304×1440px, React vs Angular
                 bars, axis units, legend, title, and (for repeated-run
                 metrics) a "± stddev" label above each bar - each category
                 has its own distinct color pair, plus summary-comparison.png,
                 a single chart overlaying every metric's % difference
```

`summary.csv`/`summary.md` include a per-metric row plus, for LOC specifically,
a breakdown row per language cloc detected (e.g. `Lines of code: TypeScript`,
`Lines of code: CSS`, `Lines of code: HTML`) - not just the combined total.
`loc.png` charts the same breakdown (total + per language, grouped bars).

The "static metrics" category (bundle size, LOC, complexity) is rendered as
three separate charts rather than one combined chart, since KB / lines /
complexity-score sit on incompatible scales - see the note in `summary.md`.

## Known methodological caveats (worth citing, not bugs)

- **Angular inlines critical CSS** into `index.html` by default (via its
  esbuild-based build's "Beasties" optimisation); Vite does not do this for
  React. This is each tool's own default production behaviour, not something
  this suite engineered - but it does mean the CSS-bundle-size comparison and
  the FCP/LCP comparison are partly comparing default build-tool behaviour,
  not framework runtime code alone.
- **Complexity is asymmetric by construction**: the ESLint-based approach
  only parses `.ts`/`.tsx`. React's conditional rendering logic lives inline
  in `.tsx` (and gets measured); Angular's equivalent `@if`/`@for` logic
  lives in `.html` templates (and is invisible to this tool). Angular's
  lower complexity numbers partly reflect "less logic is in a file type we
  can measure," not necessarily simpler logic overall.
- **The mock API's ~5% simulated failure rate** is left switched on during
  measurement (not disabled) to keep the suite testing the app as a real
  user would experience it. Both `interaction-timing.js` and
  `memory-runner.js` detect an error state appearing mid-script and click
  the app's own "Retry" button rather than letting a run hang or fail - so
  occasional retries are expected and are not measurement noise being hidden.

## Windows notes

- `node_modules/cloc`'s "binary" is the real Perl script, not a JS wrapper -
  `static-metrics.js` invokes it via `perl <script>` directly rather than
  its `.cmd` shim, both to avoid Windows requiring a shell for `.cmd`
  execution and to avoid shell re-parsing of a parent folder path containing
  an unescaped `&`.
- `build-and-serve.js` invokes `vite`/`ng` directly via `node <bin>.js`
  rather than `npm run build`, for the same `&`-in-path reason.
