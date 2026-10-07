// Builds both prototypes' production bundles and serves them locally on
// fixed ports, so every later measurement module hits the same static,
// already-built output rather than a dev server (which would report
// unrepresentative dev-mode timings).
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import serveHandler from 'serve-handler';
import { APPS } from './config.js';

function buildReact(app) {
  const viteBin = join(app.dir, 'node_modules', 'vite', 'bin', 'vite.js');
  // Invoked via `node <script>` directly (not `npm run build`) because npm's
  // Windows .cmd shims go through cmd.exe, which mis-parses the unescaped
  // `&` in this machine's parent folder name ("Diss Faizan & Co").
  execFileSync(process.execPath, [viteBin, 'build'], { cwd: app.dir, stdio: 'pipe' });
}

function buildAngular(app) {
  const ngBin = join(app.dir, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  execFileSync(process.execPath, [ngBin, 'build'], { cwd: app.dir, stdio: 'pipe' });
}

export function buildApp(app) {
  console.log(`  Building ${app.label}...`);
  try {
    if (app.key === 'react') buildReact(app);
    else buildAngular(app);
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).map(String).join('\n');
    throw new Error(`Build failed for ${app.label}:\n${output.slice(-4000)}`);
  }
  if (!existsSync(app.distDir)) {
    throw new Error(`Build for ${app.label} reported success but ${app.distDir} does not exist.`);
  }
  console.log(`  ${app.label} built -> ${app.distDir}`);
}

export function buildAllApps() {
  console.log('\n=== Building production bundles ===');
  for (const app of APPS) buildApp(app);
}

function startStaticServer(app) {
  const server = createServer((req, res) =>
    serveHandler(req, res, {
      public: app.distDir,
      cleanUrls: false,
      rewrites: [{ source: '**', destination: '/index.html' }],
    }),
  );
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(app.port, () => resolve(server));
  });
}

export async function serveAllApps() {
  console.log('\n=== Starting local static servers ===');
  const servers = [];
  for (const app of APPS) {
    const server = await startStaticServer(app);
    servers.push(server);
    console.log(`  ${app.label} serving at http://localhost:${app.port}`);
  }
  return {
    servers,
    urls: Object.fromEntries(APPS.map((app) => [app.key, `http://localhost:${app.port}`])),
    async close() {
      await Promise.all(
        servers.map(
          (server) =>
            new Promise((resolve) => {
              server.close(() => resolve());
            }),
        ),
      );
      console.log('  Static servers stopped.');
    },
  };
}

export async function buildAndServeAll() {
  buildAllApps();
  return serveAllApps();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const handle = await buildAndServeAll();
  console.log('\nServers running. Press Ctrl+C to stop.');
  process.on('SIGINT', async () => {
    await handle.close();
    process.exit(0);
  });
}
