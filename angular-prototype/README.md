# TaskFlow — Angular Prototype

Task & Project Management Dashboard, built with Angular 20 + TypeScript, as one half of a
dissertation comparison between React and Angular (see the sibling `react-prototype/` project).
Mock data only — no backend, no authentication, no external network calls.

## Stack

- Angular 20.3 (standalone components, no NgModules), TypeScript ~5.9 (see `package.json` for
  exact installed versions)
- Plain CSS (Angular's default per-component `ViewEncapsulation.Emulated`) — no UI kit
- Routing: `@angular/router`
- State: an injectable `StoreService` built on Angular Signals (`src/app/state/store.service.ts`)

## Running it

```bash
npm install
npm start         # ng serve — dev server at http://localhost:4200
npm run build     # production build, output in dist/angular-prototype
```

## Where the mock data lives

- Canonical generator: `../mock-data-generator/generate-seed-data.mjs` (shared with the React
  project — run `node generate-seed-data.mjs` from that folder to regenerate). It's a deterministic,
  fixed-seed generator (no faker dependency), producing 10 projects and 800-1000 tasks.
- Consumed copy: `src/app/mock-data/seed-data.json` — a byte-identical copy of the generator's
  output, loaded by `src/app/services/mock-api.service.ts`.
- Mock "backend": `MockApiService` simulates network latency (default 300ms, configurable via
  `setDelayMs`) and can simulate request failures — either a random ~5% rate or a persistent
  "force failure" mode, toggleable live from the sidebar's "Simulate API failures" switch.

## Folder structure

```
src/app/
  components/   reusable UI components (project-card, task-row, status-badge, forms, dialogs, etc.)
  mock-data/    generated seed-data.json (see above)
  models/       TypeScript types/interfaces for Project, Task, and related enums
  pages/        route-level page components (dashboard, projects-list, project-detail, task-form, not-found)
  services/     mock API service + config, plus the global error handler
  state/        StoreService — the Signals-based global store
  utils/        framework-agnostic helpers (date formatting, task draft validation)
```

## Notes for the comparison

- `src/styles/tokens.css`/`src/styles/base.css` and `src/app/utils/*.ts` are maintained as
  identical copies between this project and `react-prototype/`, so visual design and validation
  rules are never a confound.
- Forms are hand-rolled (component Signals + the shared `validate-task-draft` function) rather
  than Angular's Reactive Forms module, to keep the comparison to a fairer, symmetric baseline
  with the React side (which has no equivalent built-in forms library).
- `GlobalErrorHandler` (`src/app/services/global-error-handler.ts`) plus `AppErrorService` are
  Angular's counterpart to React's error boundary: Angular has no built-in way to swap out a
  component subtree on a render error, so the root `App` component reads a shared "fatal error"
  flag and renders a fallback in its place.
