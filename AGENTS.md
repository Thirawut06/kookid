# AGENTS: Quick instructions for AI coding agents

Purpose
- Short, actionable guidance to help AI coding agents start work in this repository without digging through everything.

Quick commands
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript checks (via `jsconfig.json`)

What to inspect first
- [src/components](src/components) — feature-based React components (feedback, quiz, results, ui)
- [src/pages](src/pages) — top-level routes and pages (Landing, Quiz, Results, Report)
- [src/lib](src/lib) — business logic and API clients (scoringEngine, matchingEngine, analyticsApi)
- [src/data](src/data) — static JSON datasets (careerClusters.json, majors.json)
- [supabase](supabase) — DB schema and setup instructions
- [package.json](package.json) — scripts and dependencies

Conventions & patterns
- Feature-folder layout: keep feature components grouped under `src/components/<feature>`.
- Shared UI primitives live in `src/components/ui` — follow existing Radix + Tailwind patterns.
- Business logic and API wrappers belong in `src/lib` (pure functions, no UI).
- Static data goes in `src/data` as JSON and is loaded via `src/lib/dataLoader.js`.

Environment notes
- The project uses Vite + React + Tailwind. Dev server runs on `npm run dev`.
- Supabase integration: check `supabase/schema.sql` and `src/utils/supabase.js`. Ensure required env vars (Supabase URL/key, Stripe keys) are set when running locally.

Agent behavior guidance
- Keep changes minimal and focused; follow existing component and naming patterns.
- Link to existing documentation or code instead of copying large sections.
- Run `npm run lint` and `npm run typecheck` when making code changes.

If unsure
- Ask for clarification and point to the specific files you intend to modify.
