# TaskFlow — React Prototype

Task & Project Management Dashboard, built with React 19 + TypeScript + Vite, as one half of a
dissertation comparison between React and Angular (see the sibling `angular-prototype/` project).
Mock data only — no backend, no authentication, no external network calls.

## Stack

- React 19.2, TypeScript ~6.0, Vite 8 (see `package.json` for exact installed versions)
- Plain CSS (scoped via CSS Modules) — no UI kit
- Routing: `react-router-dom`
- State: React Context + `useReducer` (`src/state/`)

## Running it

```bash
npm install
npm run dev       # starts the Vite dev server (http://localhost:5173)
npm run build     # production build, output in dist/
npm run preview   # serve the production build locally
```

## Where the mock data lives

- Canonical generator: `../mock-data-generator/generate-seed-data.mjs` (shared with the Angular
  project — run `node generate-seed-data.mjs` from that folder to regenerate). It's a deterministic,
  fixed-seed generator (no faker dependency), producing 10 projects and 800-1000 tasks.
- Consumed copy: `src/mock-data/seed-data.json` — a byte-identical copy of the generator's output,
  imported by the mock API layer at `src/api/db.ts`.
- Mock "backend": `src/api/mockApi.ts` simulates network latency (default 300ms, configurable via
  `setDelayMs`) and can simulate request failures — either a random ~5% rate or a persistent
  "force failure" mode, toggleable live from the sidebar's "Simulate API failures" switch.

## Folder structure

```
src/
  api/          mock API layer (config, in-memory db, fetch/create/update/delete functions)
  components/   reusable UI components (ProjectCard, TaskRow, StatusBadge, forms, dialogs, etc.)
  mock-data/    generated seed-data.json (see above)
  models/       TypeScript types/interfaces for Project, Task, and related enums
  pages/        route-level page components (Dashboard, ProjectsList, ProjectDetail, TaskForm, NotFound)
  state/        Context + useReducer global store (reducer.ts, types.ts, StoreContext.tsx)
  styles/       shared design tokens (tokens.css) and global base styles (base.css)
  utils/        framework-agnostic helpers (date formatting, task draft validation)
```

## Notes for the comparison

- `src/styles/tokens.css` and `src/utils/*.ts` are maintained as identical copies between this
  project and `angular-prototype/`, so visual design and validation rules are never a confound.
- Forms are hand-rolled (local component state + the shared `validateTaskDraft` function) rather
  than using a library like Formik/React Hook Form, to keep the comparison to framework primitives.
- `src/components/ErrorBoundary/ErrorBoundary.tsx` is the only class component in the codebase —
  it has to be, since error boundaries have no hook equivalent.
