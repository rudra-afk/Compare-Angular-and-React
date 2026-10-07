# Qualitative Artefact Analysis Checklist — Completed
### React vs Angular Prototype Comparison — ISO/IEC 25010 Aligned

**Reviewer:** Single reviewer (this session), applied to both codebases using the same method, same day, same evidence base — no split reviewers.

**Method note on how this was scored:** Each score below is grounded in a specific, checkable fact — a folder listing, a `grep` for import direction, a dependency count from `package.json`, or the per-file cyclomatic-complexity data already produced by `measurement-suite`'s `static-metrics.js` (see `measurement-suite/results/raw/complexity.json`). Where a score differs between frameworks, the Notes column names the concrete evidence, not a general impression. Per the checklist's own bias-avoidance instructions, borderline calls default to the lower score, and no score was raised or lowered after seeing the other framework's total.

---

## Criterion 1: Code Organisation

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 1.1 | Clear, consistent top-level folder structure? | 5 | 5 | Both: `components/`, `pages/`, `state/`, `models/`, `mock-data/`, `utils/` present in both; Angular additionally has `services/` (mock API + error handler), React has `api/` in the equivalent role. Verified via directory listing. |
| 1.2 | Related files co-located? | 5 | 4 | Both fully co-locate a component's parts in one folder. Angular's convention splits every component into 3 files (`.ts`/`.html`/`.css`); React's into 2 (`.tsx`/`.module.css`). Verified: 14 React component folders = 27 files (~1.9/component); 13 Angular component folders = 38 files (~2.9/component). More files to open to understand one component, even though each is well-organised. |
| 1.3 | Consistent naming across files? | 5 | 5 | React: PascalCase folders/files throughout (`ProjectCard.tsx`). Angular: kebab-case + Angular suffix convention throughout (`project-card.ts`, `*.service.ts`). Both internally 100% consistent, verified by listing every component/service/page file. |
| 1.4 | New dev locates a feature (e.g. task filtering) in under a minute? | 5 | 5 | Both: filtering logic lives directly in the page matching the route name (`pages/ProjectDetail` / `pages/project-detail`), immediately discoverable. |
| 1.5 | Clear separation of UI / state / routing at folder level? | 4 | 5 | Angular's route table is a standalone plain-data file (`app.routes.ts`), fully separated from any component logic. React's route tree is defined as JSX inside `App.tsx`, in the same file as the `StoreProvider`/`ErrorBoundary`/`BrowserRouter` bootstrap wiring — a minor blend of "app bootstrap" and "routing config" that Angular's file doesn't have. |
| **Section total (/25)** | **24** | **24** | |

---

## Criterion 2: Modularity

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 2.1 | Single-purpose components/services? | 4 | 5 | Angular: every store method (`loadProjects`, `loadProjectById`, ...) does exactly one thing; max cyclomatic complexity anywhere in the Angular codebase is **5** (`measurement-suite/results/raw/complexity.json`). React: `state/reducer.ts`'s `storeReducer` function routes every action type through one switch statement, measuring complexity **27** — the single highest complexity figure in either codebase. This is an accepted, idiomatic Redux pattern, not sloppy code, but it does concentrate many purposes into one function. |
| 2.2 | Business logic separated from presentation? | 4 | 4 | Both: validation is a pure function (`validateTaskDraft.ts` / `validate-task-draft.ts`) fully separate from the form component. Both: filtering/sorting logic lives inside the page component itself (`useMemo` / a getter) rather than a separate service — idiomatic for both frameworks, but in both cases it's still page-level logic mixed with orchestration, not extracted further. Scored identically. |
| 2.3 | Module modifiable without changes elsewhere? | 5 | 5 | Verified via `grep`: 0 files in either `components/` import from `pages/`, and 0 files in either `state/` import from `components/` — no backwards dependencies in either codebase. |
| 2.4 | Minimal duplication (validation defined once)? | 5 | 5 | Verified: exactly 2 files reference the validation function in each app — the utility itself and `TaskForm`/`task-form`. No copy-pasted validation logic anywhere. |
| 2.5 | State layer and UI layer cleanly decoupled? | 5 | 5 | React: all page/component access goes through the `useStore()` hook only; nothing outside `state/` imports `reducer.ts` or `types.ts` directly. Angular: all access goes through the injected `StoreService` public surface (signals + methods); nothing reaches into its internals. |
| **Section total (/25)** | **23** | **24** | |

---

## Criterion 3: Component Reuse

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 3.1 | Count of reusable components (listed)? | 5 | 5 | Both: `ProjectCard`, `TaskRow`, `StatusBadge`, `PriorityBadge`, `FormInput`, `FormSelect`, `FormTextarea`, `LoadingSpinner`, `ConfirmDialog`, `EmptyState`, `Skeleton`, `Sidebar`, `AppShell` = 13 shared-purpose components in both. React additionally has `ErrorBoundary` as a components-folder entry (14 total); Angular's equivalent (`GlobalErrorHandler` + `AppErrorService`) lives in `services/` rather than `components/`, since Angular has no direct component-level error-boundary primitive — a placement difference, not a missing capability. |
| 3.2 | Shared components actually reused across pages? | 5 | 5 | Both: `StatusBadge`/`PriorityBadge` used in `TaskRow` and everywhere tasks render; `FormSelect` reused across both the Project Detail filter toolbar (3 instances) and `TaskForm`'s status/priority fields — genuinely shared, not duplicated per page. |
| 3.3 | Generic, non-hardcoded props/inputs? | 5 | 5 | Both: `FormInput`/`FormSelect`/`FormTextarea` take `id`/`label`/`value`/`onChange` (or `valueChange`)/`error`/`required` as generic parameters, verified used with entirely different ids/labels/option sets in different contexts. |
| 3.4 | Consistent data-in / event-out pattern? | 5 | 5 | React: props down, callback prop up, throughout. Angular: `@Input()` down, `@Output() EventEmitter` up, throughout. Each internally 100% consistent. |
| 3.5 | New page could reuse an existing component with zero modification? | 5 | 5 | Both: e.g. a hypothetical "Archived Tasks" page could reuse `TaskRow`/`StatusBadge`/`PriorityBadge`/`EmptyState`/`ConfirmDialog` unmodified — none of them hardcode a route or import page-specific state. |
| **Section total (/25)** | **25** | **25** | |

---

## Criterion 4: Maintainability

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 4.1 | Readable without extensive comments (small functions)? | 4 | 5 | Same evidence as 2.1: Angular's functions are uniformly small (max complexity 5 anywhere); React's `storeReducer` is one large branching function (complexity 27) that a reader must take in as a whole to understand any single action's effect. |
| 4.2 | Types/interfaces used consistently? | 5 | 5 | Both: single shared `models/index.ts` (`Project`, `Task`, `TaskDraft`, status/priority unions) imported throughout; both TypeScript projects with no loosely-typed escape hatches in the app code. |
| 4.3 | Error/loading/edge cases handled consistently throughout? | 5 | 5 | Both verified in live browser testing earlier in this project: every page follows the same not-found → error → loading → empty conditional chain (React: sequential early-return `if`s; Angular: sequential `@if`/`@else if`), applied identically page to page within each app. |
| 4.4 | Files touched to add a new Task field (e.g. "assignee")? | 5 | 5 | Verified via `grep -rl "TaskDraft"`: exactly 5 files reference the draft type in each app (model, validation util, form page, mock API layer, store) — symmetric, and a genuinely small, well-contained blast radius in both. |
| 4.5 | Traceable pattern from UI action to state change? | 4 | 5 | React: click/change → action function (in `StoreContext.tsx`) → `dispatch` → matching `case` in `reducer.ts`'s switch → new state - tracing one action's full effect means reading two separate files. Angular: click/change → store method call → `signal.set()` inside that same method - the full effect of one action is visible in a single method, one file. |
| **Section total (/25)** | **23** | **25** | |

---

## Criterion 5: Scalability

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 5.1 | New route addable without restructuring? | 5 | 5 | Both: add one page folder + one route entry (`<Route>` in React's tree / one object in Angular's `routes` array) + one Sidebar link. Symmetric effort. |
| 5.2 | State approach scales to more entities without redesign? | 4 | 5 | Adding a new entity (e.g. "Users") in React most naturally means extending the existing `StoreState`/`StoreAction`/`storeReducer` — growing the one file that is already the codebase's single highest-complexity point. Angular's DI-based service pattern lets a new `UsersStoreService` be added as an entirely independent injectable, touching zero existing files - a structurally lower-friction path for this specific kind of growth. |
| 5.3 | Routing supports nested/future routes cleanly? | 5 | 5 | Both: nested route children under the shared `AppShell` layout route, in both React Router and Angular Router - structurally equivalent. |
| 5.4 | Folder structure would still make sense at 5× scale? | 5 | 5 | Both: one-folder-per-component/page pattern scales linearly; neither shows an emerging "dumping ground" folder. |
| 5.5 | Evidence of premature coupling? | 5 | 5 | Same evidence as 2.3: 0 components in either app reach into store internals directly; all access is via the public hook/service surface. |
| **Section total (/25)** | **23** | **25** | |

---

## Criterion 6: Dependency Management

| # | Sub-question | React | Angular | Notes |
|---|---|---|---|---|
| 6.1 | Dependencies counted/listed, justified? | 5 | 5 | React runtime deps: `react`, `react-dom`, `react-router-dom` (3 — routing added because React has no built-in router). Angular runtime deps: `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser`, `@angular/router`, `rxjs`, `tslib`, `zone.js` (8 — but this is Angular's *own core* distributed across more npm packages, not extra third-party additions; zero optional packages beyond the framework itself). Both fully justified. |
| 6.2 | Unused/redundant dependencies? | 5 | 5 | Angular's scaffold originally included `@angular/forms`, which was never imported anywhere in the source — found and removed earlier in this project (verified via `grep` returning zero matches before removal, and a clean rebuild after). Currently clean in both apps. |
| 6.3 | Dependency footprint symmetric per parity decisions? | 5 | 5 | The only asymmetries are framework-necessitated, not planning gaps: React needed `react-router-dom` (no Angular equivalent needed, built-in); Angular needs `zone.js`/`rxjs`/`tslib` as mandatory runtime deps (no React equivalent applicable). This was the explicitly planned, expected shape of asymmetry from the start of the build. |
| 6.4 | Internal dependencies shallow, no circular coupling? | 5 | 5 | Same evidence as 2.3/5.5: verified 0 backwards or circular imports in either codebase. |
| 6.5 | Clear boundary between framework-core and third-party additions? | 5 | 4 | React: the one non-core dependency (`react-router-dom`) is contained to explicit imports in ~8 files, all exclusively for navigation, not entangled with business logic - a well-contained boundary. Angular: `zone.js` is technically framework-core, but it works by monkey-patching global async APIs (`setTimeout`, `addEventListener`, `Promise`) framework-wide - a broader, less contained integration surface than any of React's dependencies, which don't alter global runtime behaviour. (This is a widely documented characteristic of Angular's architecture, not a flaw introduced in this build - and it's the reason Angular itself has been moving toward zoneless change detection in recent versions.) |
| **Section total (/25)** | **25** | **24** | |

---

## Overall Summary

| Criterion | React total (/25) | Angular total (/25) |
|---|---|---|
| 1. Code Organisation | 24 | 24 |
| 2. Modularity | 23 | 24 |
| 3. Component Reuse | 25 | 25 |
| 4. Maintainability | 23 | 25 |
| 5. Scalability | 23 | 25 |
| 6. Dependency Management | 25 | 24 |
| **Overall total (/150)** | **143** | **147** |

**Qualitative summary (2–3 sentences per framework):**

- **React:** Highly organised and consistently structured, with clean component reuse and a well-contained dependency footprint. Its main recurring weakness across sections 2, 4, and 5 traces to one specific, identifiable cause: the Redux-style single-reducer pattern concentrates all state-transition logic into one switch statement (`storeReducer`, cyclomatic complexity 27), which is idiomatic and arguably even a best practice for centralising "everything that can happen to state" — but it mechanically scores worse on function-size, traceability, and future-growth measures than a more distributed alternative would.
- **Angular:** Equally well organised, with the same clean reuse and dependency discipline, and a structural edge in three areas: its Signals-based store spreads logic into many small, individually simple methods (max complexity 5 anywhere in the codebase); its route table is a fully separated plain-data file; and its DI-based service pattern offers a lower-friction path for adding new state slices later. Its own notable trade-off is `zone.js` - a mandatory, globally-patching runtime dependency that both explains some of the measurement suite's earlier memory/rendering-performance findings (Section 4.1/5.2 of that report) and is a widely acknowledged reason Angular itself is moving toward a zoneless model.

**Key observed trade-offs (for the Discussion chapter):**

1. **Reducer-switch vs. Signals-methods is the single largest source of asymmetry in this checklist.** It affected four separate sub-questions (2.1, 4.1, 4.5, 5.2) because it's a genuinely multi-angle consequence of one architectural choice — not four independent weaknesses. Worth citing as a case where an idiomatic, textbook-recommended pattern in one framework (Redux-style reducers) scores measurably worse under plain cyclomatic-complexity analysis than the modern-Angular alternative, even though both implement equivalent behaviour. This is directly corroborated by the automated `measurement-suite` complexity data (avg 2.2 / max 27 for React vs avg 1.42 / max 10 for Angular), so the qualitative and quantitative findings agree rather than contradict.
2. **Angular's file-per-component convention (3 files) vs. React's (2 files)** is a genuine, measured difference (38 vs 27 files for the same 13–14 components) that cuts the other way: more files to navigate per unit of functionality, even though each is well-organised. This is why 1.2 favours React despite Angular winning most other sections.
3. **`zone.js` is Angular's own trade-off, not a flaw in this build.** It's mandatory in the Angular version used here, well documented in Angular's own architecture discussions, and plausibly connected to the earlier `measurement-suite` finding that Angular's baseline JS heap was ~1.3MB higher before any app data even loaded.
4. Every other criterion (component reuse in full, and most of code organisation/dependency management) came out effectively tied, which is the expected result of a build that was deliberately, carefully kept in lockstep between the two frameworks throughout this project — the differences that do appear are specific, explainable, and traceable to a concrete cause rather than diffuse impressions.

---

## Notes on how bias was avoided while scoring

- Both codebases were reviewed using the same session, same method, same evidence sources (folder listings, `grep`, and the measurement suite's own complexity data) rather than separate sittings that could drift in standard.
- No score was adjusted after seeing the other framework's total; the reducer-complexity finding was located and both frameworks' related sub-questions were scored against it in one pass, not revisited afterward.
- Where a score was borderline (1.2, 6.5), the lower score was applied and the specific reason recorded, per the checklist's own instruction.
- This project's own construction (both codebases deliberately built feature-for-feature, file-for-file in parallel by the same author for a fairness-focused dissertation comparison) is itself a limitation worth naming: it is not two independently-written, real-world codebases, so some structural symmetry here is by design rather than emergent - the asymmetries that *did* surface (reducer complexity, file-per-component count, zone.js) are more meaningful for that reason, since they persisted despite deliberate efforts to keep everything else equal.
