# Steel IQ — Enterprise Analytics Dashboard

Frontend architecture for an enterprise analytics dashboard. This repository contains **only the
project scaffold** — routing, theming, layout, state, and API architecture. No business screens,
charts, KPIs, or mock data are implemented yet; those are built independently on feature branches.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** — build tooling
- **Material UI v7** — component library, enterprise light theme
- **React Router v7** — routing
- **TanStack Query** — server state
- **Zustand** — client state
- **Axios** — HTTP client
- **React Hook Form** + **Zod** — forms and validation
- **Recharts** — charting (installed, unused)
- **Framer Motion** — animation
- **Day.js** — date handling
- **ESLint** + **Prettier** — linting and formatting
- **Husky** + **lint-staged** — pre-commit checks

## Project Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

## Available Scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the Vite dev server                |
| `npm run build`        | Type-check and build for production      |
| `npm run preview`      | Preview the production build locally     |
| `npm run lint`         | Run ESLint                               |
| `npm run lint:fix`     | Run ESLint and auto-fix issues           |
| `npm run format`       | Format the codebase with Prettier        |
| `npm run format:check` | Check formatting without writing changes |
| `npm run typecheck`    | Run the TypeScript compiler with no emit |

## Folder Structure

```
src/
  assets/            static icons, images, fonts
  components/
    common/          reusable, presentational components (Button, Card, Modal, ...)
    layout/          shell components (Header, Sidebar, Footer, AppLayout)
  pages/             route-level screens, one folder per route
  routes/            route definitions and path constants
  services/
    api/             axios instance
    endpoints/       API endpoint path constants
    interceptors/    request/response interceptors
  hooks/             shared custom hooks
  store/             Zustand stores (auth, app, dashboard)
  context/           React context providers
  utils/
    constants/       app-wide constants (nav items, layout sizing, ...)
    helpers/         generic helper functions
    formatters/      value formatting utilities
    validators/       zod schemas / validation helpers
  theme/             MUI theme (palette, typography, shadows)
  types/             shared TypeScript types
  mock/              local mock data for feature development
  styles/            global CSS
  layouts/           route-level layout compositions
  config/            environment and app-level configuration
  App.tsx
  main.tsx
```

## Path Aliases

Absolute imports are configured in both `tsconfig.json` and `vite.config.ts`:

```
@/*            → src/*
@components/*  → src/components/*
@pages/*       → src/pages/*
@routes/*      → src/routes/*
@services/*    → src/services/*
@hooks/*       → src/hooks/*
@store/*       → src/store/*
@context/*     → src/context/*
@utils/*       → src/utils/*
@theme/*       → src/theme/*
@types/*       → src/types/*
@mock/*        → src/mock/*
@styles/*      → src/styles/*
@layouts/*     → src/layouts/*
@config/*      → src/config/*
```

## Coding Standards

- TypeScript strict mode is enabled — no implicit `any`, no unused locals/params, no unchecked
  indexed access.
- ESLint (`@typescript-eslint`, `react`, `react-hooks`) enforces code correctness; Prettier
  enforces formatting. `prettier/prettier` runs as an ESLint rule so `npm run lint` catches both.
- Husky runs `lint-staged` on every commit, which lints and formats staged files automatically.
- Feature code should live under the folder that matches its role (a new page goes in `pages/`,
  a new shared component in `components/common/`, a new store in `store/`, etc.) rather than
  introducing new top-level folders.
- Components are colocated with their own folder (`ComponentName/ComponentName.tsx` +
  `ComponentName/index.ts`) so imports stay stable if internals are split into multiple files.

## Git Branching

- `main` — always deployable.
- `feature/<short-description>` — one feature or screen per branch (e.g. `feature/analytics-page`,
  `feature/agent-summary-charts`).
- `fix/<short-description>` — bug fixes.
- Open a PR into `main` per feature branch; keep branches scoped to a single page or concern so
  multiple developers can work independently without colliding in `src/pages/` or `src/store/`.
