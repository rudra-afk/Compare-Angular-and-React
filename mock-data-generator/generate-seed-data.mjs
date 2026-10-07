// Canonical mock-data generator shared by both prototypes.
//
// Run with: node generate-seed-data.mjs
// It writes ./seed-data.json here, then this same file is copied verbatim into
// react-prototype/src/mock-data/seed-data.json and
// angular-prototype/src/app/mock-data/seed-data.json so both apps render from
// byte-identical data. Re-running this script is fully deterministic (fixed
// seed, fixed anchor date) — it will always produce the same output.
//
// No dependencies (no faker) so the generator can't introduce a package-count
// asymmetry between the two prototypes; it only ever runs at authoring time,
// never inside either app's bundle.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SEED = 20260722;
// Fixed reference point all relative offsets are generated from, so re-running
// this script never changes the output.
const ANCHOR = new Date('2026-07-22T00:00:00.000Z');

function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function seededUuid() {
  const hex = () => Math.floor(rng() * 16).toString(16);
  let d = '';
  for (let i = 0; i < 32; i++) d += hex();
  return [
    d.slice(0, 8),
    d.slice(8, 12),
    `4${d.slice(13, 16)}`,
    `a${d.slice(17, 20)}`,
    d.slice(20, 32),
  ].join('-');
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(date) {
  return date.toISOString();
}

const PROJECTS = [
  ['Atlas Platform Migration', 'Move the core platform services onto the new Atlas infrastructure with zero downtime.'],
  ['Nova Mobile Redesign', 'A ground-up visual and UX overhaul of the Nova mobile application.'],
  ['Helios Billing Revamp', 'Rebuild the billing and invoicing pipeline for multi-currency support.'],
  ['Northstar Analytics Suite', 'Internal analytics dashboards and reporting tools for product and growth teams.'],
  ['Orion Customer Portal', 'Self-service portal allowing customers to manage subscriptions and support tickets.'],
  ['Vertex API Gateway', 'A unified API gateway consolidating authentication, rate limiting, and routing.'],
  ['Zephyr Onboarding Flow', 'Streamlined signup and onboarding experience to reduce drop-off.'],
  ['Meridian Design System', 'Shared component library and design tokens used across all product surfaces.'],
  ['Quantum Search Upgrade', 'Faster, more relevant full-text search across the product catalog.'],
  ['Beacon Notifications Hub', 'Centralised email, push, and in-app notification delivery service.'],
];

const VERBS = [
  'Design', 'Implement', 'Refactor', 'Review', 'Fix', 'Test', 'Document',
  'Optimise', 'Investigate', 'Deploy', 'Update', 'Migrate', 'Configure',
  'Audit', 'Prototype', 'Debug', 'Automate', 'Stabilise', 'Simplify', 'Extend',
];

const SUBJECTS = [
  'login flow', 'dashboard charts', 'API rate limiting', 'database schema',
  'onboarding wizard', 'notification service', 'payment integration',
  'search indexing', 'user permissions', 'caching layer', 'CI pipeline',
  'mobile layout', 'accessibility issues', 'error logging', 'email templates',
  'billing module', 'analytics events', 'file upload flow', 'settings page',
  'navigation menu', 'dark mode support', 'session handling', 'data export',
  'webhook handler', 'component library', 'form validation',
  'performance bottleneck', 'security headers', 'third-party integration',
  'load balancer config', 'retry logic', 'pagination controls',
  'empty states', 'error boundaries', 'unit test coverage', 'route guards',
];

const DESCRIPTION_TEMPLATES = [
  (subject) => `Address reported issues with the ${subject} and verify the fix across supported browsers.`,
  (subject) => `Plan and implement improvements to the ${subject} ahead of the next release.`,
  (subject) => `Investigate recent regressions in the ${subject} and document the root cause.`,
  (subject) => `Coordinate with design and QA to finalise the ${subject} before rollout.`,
  (subject) => `Clean up technical debt around the ${subject} to improve maintainability.`,
  (subject) => '',
];

const STATUSES = [
  ['todo', 0.36],
  ['in-progress', 0.34],
  ['done', 0.3],
];

const PRIORITIES = [
  ['low', 0.34],
  ['medium', 0.34],
  ['high', 0.32],
];

const projects = PROJECTS.map(([name, description]) => ({
  id: seededUuid(),
  name,
  description,
  createdAt: isoDate(addDays(ANCHOR, -randInt(30, 300))),
}));

const TOTAL_TASKS = randInt(800, 1000);

const weights = projects.map(() => 0.5 + rng() * 1.5);
const weightSum = weights.reduce((a, b) => a + b, 0);
const perProjectCounts = weights.map((w) => Math.max(20, Math.round((w / weightSum) * TOTAL_TASKS)));

const tasks = [];
projects.forEach((project, projectIndex) => {
  const count = perProjectCounts[projectIndex];
  for (let i = 0; i < count; i++) {
    const verb = pick(VERBS);
    const subject = pick(SUBJECTS);
    const title = `${verb} ${subject}`;
    const description = pick(DESCRIPTION_TEMPLATES)(subject);
    const status = pickWeighted(STATUSES);
    const priority = pickWeighted(PRIORITIES);
    const dueDate = addDays(ANCHOR, randInt(-45, 120));
    const createdAt = addDays(ANCHOR, -randInt(1, 150));

    tasks.push({
      id: seededUuid(),
      projectId: project.id,
      title,
      description,
      status,
      priority,
      dueDate: isoDate(dueDate),
      createdAt: isoDate(createdAt),
    });
  }
});

const seedData = { projects, tasks };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, 'seed-data.json');
writeFileSync(outPath, JSON.stringify(seedData, null, 2));

console.log(`Generated ${projects.length} projects and ${tasks.length} tasks -> ${outPath}`);
