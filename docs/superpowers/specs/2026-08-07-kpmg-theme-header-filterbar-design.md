# KPMG Theme, Header Logo, and Global Filter Bar — Design

Date: 2026-08-07

## Goal

Re-skin the app shell with a KPMG-style palette and add the two pieces of static
page chrome (Header logo, Global Filter bar) needed before real dashboard pages
are built. Visual only — no filter state, store wiring, or data fetching.

## Scope

- `src/theme/palette.ts` — swap the palette to KPMG blue / accent purple / white
  background.
- `src/components/layout/Header/Header.tsx` — add a logo placeholder next to the
  app title. Nav stays in the existing Sidebar; Header does not gain nav links.
- `src/components/layout/GlobalFilterBar/` (new) — static filter bar with 7
  dropdowns: Plant, Region, Business Unit, Product Category, Year, Quarter,
  Month. No `onChange` handlers, no store, no filtering logic — this is a visual
  shell only.
- `src/components/layout/AppLayout/AppLayout.tsx` — render `GlobalFilterBar`
  inline (not sticky/fixed) between the header spacer and `<Outlet />`, so it
  appears above page content on every route.

## Theme

`src/theme/palette.ts`:

```ts
primary: {
  main: '#00338D',
  light: '#335CA4',  // MUI lighten(main, 0.2)
  dark: '#002463',   // MUI darken(main, 0.3)
  contrastText: '#FFFFFF',
},
secondary: {
  main: '#6E2C8D',
  light: '#8B56A4',  // MUI lighten(main, 0.2)
  dark: '#4D1F63',   // MUI darken(main, 0.3)
  contrastText: '#FFFFFF',
},
background: {
  default: '#FFFFFF', // was #F6F8FB
  paper: '#FFFFFF',
},
```

Typography, shadows, shape, and component overrides are unchanged. Status
colors (success/warning/error/info) are unchanged since they aren't part of the
KPMG brand ask.

## Header

Extend the existing `Header` component (`src/components/layout/Header/Header.tsx`)
rather than rebuilding it:

- Insert a logo placeholder before the `APP_NAME` `Typography`: a 36×36 rounded
  `Box` with `bgcolor: 'primary.main'`, white border-radius per theme `shape`,
  containing a single bold white initial (e.g. "S") as a stand-in for a real
  logo asset.
- Existing mobile menu `IconButton`, title text, and right-aligned `Avatar` are
  unchanged in behavior; they'll pick up the new palette automatically via theme
  tokens (no hardcoded colors in the component today, so no color literals need
  to change there).

## GlobalFilterBar

New component at `src/components/layout/GlobalFilterBar/GlobalFilterBar.tsx`,
exported via `index.ts` and re-exported from `src/components/layout/index.ts`,
following the same colocation pattern as `Header`/`Sidebar`/`Footer`.

- Structure: a `Box` (white background, `borderBottom: 1`, `borderColor:
'divider'`, padding) containing a responsive `Stack`/flex row of 7 labeled
  `Select` fields (MUI `FormControl` + `InputLabel` + `Select`), wrapping on
  narrow widths.
- Each `Select` is uncontrolled with a `defaultValue` of `'all'` and a static,
  hardcoded `MenuItem` list (an `'All ___'` option plus a handful of realistic
  values) — no `useState`, no `onChange`, no external data source:
  - **Plant**: All Plants, Rourkela, Jamshedpur, Bhilai, Hazira, Bellary
    (reuses the plant names from the dashboard mock-data design for
    consistency)
  - **Region**: All Regions, East, West, South, Central
  - **Business Unit**: All Business Units, Manufacturing, Sales & Marketing,
    Procurement, Finance
  - **Product Category**: All Categories, Flat Products, Long Products, Tubes
    & Pipes, Wire Rods, Value-Added Steel
  - **Year**: All Years, 2024, 2025
  - **Quarter**: All Quarters, Q1, Q2, Q3, Q4
  - **Month**: All Months, Jan–Dec
- No props needed (fully static) — component takes no arguments.

## AppLayout wiring

In `AppLayout.tsx`, render `<GlobalFilterBar />` immediately after the header
`<Toolbar />` spacer and before `<Box sx={{ flexGrow: 1, p: 3 }}><Outlet />...`,
so it appears once per layout (not per page) and scrolls with content — no
`position: sticky`.

## Out of scope

- Wiring dropdown selections to any store, URL params, or data filtering.
- A real logo asset (placeholder box only).
- Changing Sidebar nav items or adding new routes/modules.
- Dark mode / theme mode toggle.
