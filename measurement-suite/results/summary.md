# React vs Angular — Measurement Summary

Generated 2026-09-12T22:03:14.282Z

| Metric | Unit | React | Angular | Difference (Angular − React) | % Difference (vs React) |
|---|---|---|---|---|---|
| First Contentful Paint | ms | 3,606.4 ± 80.99 | 3,750.4 ± 0.49 | 144 | 3.99% |
| Largest Contentful Paint | ms | 3,756.4 ± 80.99 | 4,050.4 ± 0.49 | 294 | 7.83% |
| Time to Interactive | ms | 3,756.4 ± 80.99 | 4,101.6 ± 2.87 | 345.2 | 9.19% |
| Total Blocking Time | ms | 0 ± 0 | 21.6 ± 2.87 | 21.6 | n/a |
| Lighthouse Performance Score | /100 | 80.8 ± 1.17 | 78 ± 0 | -2.8 | -3.47% |
| Navigate: list -> detail | ms | 333.64 ± 12.72 | 364.84 ± 24.8 | 31.2 | 9.35% |
| Sort by due date | ms | 12.62 ± 0.23 | 13.28 ± 0.81 | 0.66 | 5.23% |
| Filter by status | ms | 4.44 ± 0.83 | 5.76 ± 0.86 | 1.32 | 29.73% |
| Navigate: detail -> list | ms | 12.36 ± 0.12 | 11.92 ± 0.47 | -0.44 | -3.56% |
| Memory: task list load (Δ heap) | MB | 0.82 ± 0.01 | 0.95 ± 0 | 0.13 | 15.85% |
| Memory: sort+filter (Δ heap) | MB | 0.04 ± 0 | -0.12 ± 0 | -0.16 | -400% |
| Memory: peak heap after interactions | MB | 2.92 ± 0.01 | 4.19 ± 0 | 1.27 | 43.49% |
| Bundle size: JS (raw) | KB | 517.12 | 570.41 | 53.29 | 10.31% |
| Bundle size: JS (gzip) | KB | 116.77 | 129.47 | 12.7 | 10.88% |
| Bundle size: total (raw) | KB | 553.86 | 594.3 | 40.44 | 7.3% |
| Bundle size: total (gzip) | KB | 125.1 | 136.92 | 11.82 | 9.45% |
| Lines of code | lines | 3,126 | 3,062 | -64 | -2.05% |
| File count | files | 52 | 74 | 22 | 42.31% |
| Lines of code: CSS | lines | 1,123 | 1,127 | 4 | 0.36% |
| Lines of code: HTML | lines | 0 | 641 | 641 | n/a |
| Lines of code: TS | lines | 503 | 1,294 | 791 | 157.26% |
| Lines of code: TSX | lines | 1,500 | 0 | -1,500 | -100% |
| Cyclomatic complexity (avg) | per function | 2.17 | 1.43 | -0.74 | -34.1% |
| Cyclomatic complexity (max) | per function | 27 | 10 | -17 | -62.96% |

**Notes:**
- Values with `±` are mean ± standard deviation across repeated runs (5 for load time / rendering, 3 for memory). Static metrics (bundle size, LOC, complexity) are single-measurement and have no stddev.
- See `results/raw/` for every individual run, not just the aggregated means.
- See `results/charts/` for the corresponding PNG bar charts, including `summary-comparison.png`, an overview of every metric's % difference in one chart.
- "Lower isn't always better": for Lighthouse Performance Score, higher is better (so a negative bar there is a genuine Angular disadvantage); for Lines of Code / File Count, neither direction is inherently "better" - they're descriptive, not qualitative.
- The "static metrics" category is rendered as three separate charts (`bundle-size.png`, `loc.png`, `complexity.png`) rather than one combined chart, since KB / lines / complexity-score sit on incompatible scales and forcing them onto one shared axis would be misleading rather than clearer.
