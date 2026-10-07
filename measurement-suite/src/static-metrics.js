// Static metrics: bundle size, lines of code, cyclomatic complexity.
// None of these need a running browser or repeated runs - they're read
// directly from build output / source files.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { ESLint } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { APPS, RAW_DIR, SUITE_ROOT } from './config.js';
import { writeJson, writeCsv } from './utils/csv.js';
import { mean, round2 } from './utils/stats.js';

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

// --- 1. Bundle size -------------------------------------------------------

function measureBundleSize(app) {
  if (!existsSync(app.distDir)) {
    throw new Error(
      `No production build found for ${app.label} at ${app.distDir}. Run the build step first.`,
    );
  }
  const files = walkFiles(app.distDir);
  const totals = { jsRaw: 0, jsGzip: 0, cssRaw: 0, cssGzip: 0, totalRaw: 0, totalGzip: 0 };
  const perFile = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const buf = readFileSync(file);
    const raw = buf.length;
    const gzip = gzipSync(buf).length;
    totals.totalRaw += raw;
    totals.totalGzip += gzip;
    if (ext === '.js' || ext === '.mjs') {
      totals.jsRaw += raw;
      totals.jsGzip += gzip;
    } else if (ext === '.css') {
      totals.cssRaw += raw;
      totals.cssGzip += gzip;
    }
    perFile.push({
      file: relative(app.distDir, file),
      bytesRaw: raw,
      bytesGzip: gzip,
    });
  }

  const toKB = (bytes) => round2(bytes / 1024);
  return {
    app: app.key,
    jsRawKB: toKB(totals.jsRaw),
    jsGzipKB: toKB(totals.jsGzip),
    cssRawKB: toKB(totals.cssRaw),
    cssGzipKB: toKB(totals.cssGzip),
    totalRawKB: toKB(totals.totalRaw),
    totalGzipKB: toKB(totals.totalGzip),
    fileCount: files.length,
    files: perFile,
  };
}

// --- 2. Lines of code -------------------------------------------------------

function measureLocWithCloc(app) {
  // node_modules/cloc's "bin" is the raw Perl script itself (not a JS
  // wrapper) - invoking it via `perl <script>` directly avoids both the
  // Windows .cmd-shim-needs-a-shell issue and any shell re-parsing of the
  // parent folder path (which contains an unescaped `&`).
  const clocScript = join(SUITE_ROOT, 'node_modules', 'cloc', 'lib', 'cloc');
  const args = [
    clocScript,
    app.srcDir,
    '--json',
    '--not-match-f=seed-data\\.json', // generated data, not hand-written source, identical in both apps
  ];
  const output = existsSync(clocScript)
    ? execFileSync('perl', args, { encoding: 'utf-8' })
    : execFileSync('cloc', args.slice(1), { encoding: 'utf-8' });
  const parsed = JSON.parse(output);
  delete parsed.header;
  const byLanguage = {};
  let totalCode = 0;
  let totalFiles = 0;
  for (const [lang, stats] of Object.entries(parsed)) {
    if (lang === 'SUM') continue;
    byLanguage[lang] = { files: stats.nFiles, blank: stats.blank, comment: stats.comment, code: stats.code };
    totalCode += stats.code;
    totalFiles += stats.nFiles;
  }
  return { app: app.key, method: 'cloc', totalFiles, totalCodeLines: totalCode, byLanguage };
}

// Pure-JS fallback if the cloc CLI isn't reachable (e.g. Perl not on PATH
// from a Node child process) - counts non-blank lines per extension.
function measureLocFallback(app) {
  const extensions = ['.ts', '.tsx', '.html', '.css'];
  const byLanguage = {};
  let totalCode = 0;
  let totalFiles = 0;

  for (const file of walkFiles(app.srcDir)) {
    const ext = extname(file).toLowerCase();
    if (!extensions.includes(ext)) continue;
    if (file.endsWith('seed-data.json')) continue;
    const content = readFileSync(file, 'utf-8');
    const codeLines = content.split('\n').filter((line) => line.trim().length > 0).length;
    const key = ext.slice(1).toUpperCase();
    if (!byLanguage[key]) byLanguage[key] = { files: 0, blank: 0, comment: 0, code: 0 };
    byLanguage[key].files += 1;
    byLanguage[key].code += codeLines;
    totalCode += codeLines;
    totalFiles += 1;
  }
  return { app: app.key, method: 'fallback-line-count', totalFiles, totalCodeLines: totalCode, byLanguage };
}

function measureLoc(app) {
  try {
    return measureLocWithCloc(app);
  } catch (error) {
    console.warn(
      `  cloc unavailable for ${app.label} (${error.message.split('\n')[0]}); falling back to a plain line count.`,
    );
    return measureLocFallback(app);
  }
}

// --- 3. Cyclomatic complexity (ESLint `complexity` rule) -------------------
//
// The `complexity` rule is set to warn at threshold 0 so *every* function
// gets reported, and we parse the numeric complexity out of each message.
// This only covers .ts/.tsx logic - Angular's @if/@for template control
// flow lives in .html files and is not analysed by this approach, which is
// a known asymmetry (see measurement-suite/README.md).
async function measureComplexity(app) {
  const patterns =
    app.key === 'react' ? [`${app.srcDir}/**/*.ts`, `${app.srcDir}/**/*.tsx`] : [`${app.srcDir}/**/*.ts`];

  const eslint = new ESLint({
    cwd: app.srcDir,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            ecmaFeatures: { jsx: true },
          },
        },
        rules: {
          complexity: ['warn', 0],
        },
      },
    ],
  });

  const results = await eslint.lintFiles(patterns);
  const complexities = [];
  const perFile = [];

  for (const result of results) {
    const fileComplexities = [];
    for (const message of result.messages) {
      if (message.ruleId !== 'complexity') continue;
      const match = /complexity of (\d+)/.exec(message.message);
      if (match) {
        const value = Number(match[1]);
        complexities.push(value);
        fileComplexities.push(value);
      }
    }
    if (fileComplexities.length > 0) {
      perFile.push({
        file: relative(app.srcDir, result.filePath),
        functions: fileComplexities.length,
        avgComplexity: round2(mean(fileComplexities)),
        maxComplexity: Math.max(...fileComplexities),
      });
    }
  }

  return {
    app: app.key,
    functionCount: complexities.length,
    avgComplexity: round2(mean(complexities)),
    maxComplexity: complexities.length ? Math.max(...complexities) : 0,
    perFile,
  };
}

// --- orchestration -----------------------------------------------------

export async function runStaticMetrics() {
  console.log('\n=== Static metrics: bundle size, LOC, complexity ===');
  const bundleResults = [];
  const locResults = [];
  const complexityResults = [];

  for (const app of APPS) {
    console.log(`\n[${app.label}]`);

    const bundle = measureBundleSize(app);
    bundleResults.push(bundle);
    console.log(
      `  Bundle size: JS ${bundle.jsRawKB}KB raw / ${bundle.jsGzipKB}KB gzip, ` +
        `CSS ${bundle.cssRawKB}KB raw / ${bundle.cssGzipKB}KB gzip, ` +
        `total ${bundle.totalRawKB}KB raw / ${bundle.totalGzipKB}KB gzip (${bundle.fileCount} files)`,
    );

    const loc = measureLoc(app);
    locResults.push(loc);
    console.log(`  LOC (${loc.method}): ${loc.totalCodeLines} code lines across ${loc.totalFiles} files`);

    const complexity = await measureComplexity(app);
    complexityResults.push(complexity);
    console.log(
      `  Complexity: avg ${complexity.avgComplexity} / max ${complexity.maxComplexity} ` +
        `across ${complexity.functionCount} functions`,
    );
  }

  writeJson(join(RAW_DIR, 'bundle-size.json'), bundleResults);
  writeJson(join(RAW_DIR, 'loc.json'), locResults);
  writeJson(join(RAW_DIR, 'complexity.json'), complexityResults);

  writeCsv(
    join(RAW_DIR, 'bundle-size.csv'),
    bundleResults.map(({ files, ...rest }) => rest),
  );
  writeCsv(
    join(RAW_DIR, 'loc.csv'),
    locResults.map(({ byLanguage, ...rest }) => rest),
  );
  writeCsv(
    join(RAW_DIR, 'complexity.csv'),
    complexityResults.map(({ perFile, ...rest }) => rest),
  );

  return { bundleResults, locResults, complexityResults };
}

// Allow running this module directly: `node src/static-metrics.js`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runStaticMetrics().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
