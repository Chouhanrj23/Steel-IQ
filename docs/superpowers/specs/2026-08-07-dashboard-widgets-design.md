# KPICard, ChartContainer, and Right-Panel Shells — Design

Date: 2026-08-07

## Goal

Build the reusable, static (props-only, no internal state beyond what
Recharts manages for hover/tooltip) UI building blocks needed before real
dashboard pages are assembled: a KPI stat card, a general-purpose chart
wrapper, and two right-hand panel shells.

## Scope

- `src/components/dashboard/` (new folder) — domain-specific analytics
  widgets, colocated the same way as `components/common/` (`Name/Name.tsx` +
  `index.ts`), re-exported from a new `src/components/dashboard/index.ts`.
  Kept separate from `components/common/` because these are dashboard-domain
  widgets, not generic UI primitives.
- `KPICard` — title, value, % change, trend arrow, status color, sparkline.
- `ChartContainer` — Recharts wrapper for bar / line / area / pie / donut /
  stacked-bar.
- `AgentSummaryPanel`, `ConversationalInsightsPanel` — static right-panel
  shells, wired into the existing `AgentSummary` and `ConversationalInsights`
  pages (replacing their current `EmptyState`).
- No store/hook wiring, no real data fetching. Recharts' own internal
  hover/tooltip state is fine (it isn't state we own), matching "static
  props" for our components.

## Color usage (per the `dataviz` skill)

Two distinct palettes, used for distinct jobs — never mixed:

- **Chrome / brand identity** (buttons, header, links, nav): the KPMG
  `primary`/`secondary` theme colors already in `src/theme/palette.ts`
  (`#00338D` / `#6E2C8D`).
- **Data identity** (chart series, KPI status): the dataviz skill's
  pre-validated, CVD-safe palettes — used as-is, not re-derived:
  - Categorical (chart series), fixed order, never cycled: blue `#2a78d6`,
    orange `#eb6834`, aqua `#1baf7a`, yellow `#eda100`, magenta `#e87ba4`,
    green `#008300`, violet `#4a3aa7`, red `#e34948`.
  - Status (KPICard `status`), fixed and reserved, always icon + label:
    good `#0ca30c`, warning `#fab219`, critical `#d03b3b`.
  - Chart chrome: gridline `#e1e0d9`, axis/baseline `#c3c2b7`, muted tick
    label `#898781` (light-mode only — this app has no dark mode).

These constants live as a small shared module,
`src/components/dashboard/chartPalette.ts`, exporting `CATEGORICAL_COLORS:
string[]` and `STATUS_COLORS: Record<'good' | 'warning' | 'critical',
string>`, consumed by both `KPICard` and `ChartContainer` so the two never
drift apart.

## KPICard

`src/components/dashboard/KPICard/KPICard.tsx`

```ts
export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  percentChange: number;
  trend: 'up' | 'down' | 'flat';
  status: 'good' | 'warning' | 'critical';
  sparklineData?: number[];
}
```

Layout (top to bottom):

1. Title (caption/overline text) with a status `Chip` at the right — icon
   (`CheckCircle`/`WarningAmber`/`ErrorOutline`) + capitalized status word,
   colored from `STATUS_COLORS`. Icon + label together, never color alone.
2. Big value (`Typography variant="h4"`) with `unit` as trailing muted text.
3. Trend row: arrow icon (`ArrowUpward`/`ArrowDownward`/`TrendingFlat` per
   `trend`) + `percentChange` formatted as `+/-X.X%`, both colored from
   `STATUS_COLORS[status]` (status, not raw trend direction, drives color —
   e.g. a rising defect rate is `critical` despite `trend: 'up'`).
4. Sparkline strip (only rendered when `sparklineData` is provided): a
   Recharts `ResponsiveContainer` + `LineChart` + single `Line` (`strokeWidth
2`, `dot={false}`), no `XAxis`/`YAxis`/`CartesianGrid`/`Tooltip` — this is
   a decorative mini-chart, not an interactive one, consistent with "static
   props, no state" for this pass. Stroke color = `STATUS_COLORS[status]`.

Card shell reuses the existing `components/common/Card` (`variant="outlined"`)
for consistent border/radius/shadow with the rest of the app.

## ChartContainer

`src/components/dashboard/ChartContainer/ChartContainer.tsx`

```ts
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'stackedBar';

export interface ChartSeriesConfig {
  key: string;
  label: string;
}

export interface ChartContainerProps {
  type: ChartType;
  data: Record<string, string | number>[];
  categoryKey: string; // x-axis field (bar/line/area/stackedBar) or slice-label field (pie/donut)
  series: ChartSeriesConfig[]; // value field(s); pie/donut typically use one entry
  title?: string;
  height?: number; // default 300
}
```

- A single internal `switch (type)` renders the matching Recharts chart
  inside one shared `ResponsiveContainer` + optional title (`Typography
variant="subtitle1"`) above it.
- Colors: series/slices are assigned `CATEGORICAL_COLORS[index]` in fixed
  order. A single series on `bar`/`line`/`area` uses slot-1 blue only and
  renders **no legend** (the title already names it, per the skill's nominal
  rule). 2+ series/slices render a Recharts `Legend`.
- `bar`/`line`/`area`/`stackedBar` get a `CartesianGrid` (hairline
  `#e1e0d9`, vertical lines off), `XAxis`/`YAxis` with muted tick color
  `#898781` and the baseline `#c3c2b7`, and Recharts' default `Tooltip`.
- `stackedBar`: `BarChart` with every series as a `Bar` sharing one
  `stackId`.
- `pie`/`donut`: `PieChart` with one `Pie`; `donut` sets `innerRadius`
  (~60%), `pie` leaves it at 0. Slices colored via `CATEGORICAL_COLORS` by
  data index, each with `Tooltip` + `Legend`.
- No axes/grid for `pie`/`donut` (not applicable).

## Right-panel shells

`src/components/dashboard/AgentSummaryPanel/AgentSummaryPanel.tsx`

- Header row (icon + "Agent Summary" title).
- 3–4 static placeholder insight cards, each: title, 2-line placeholder
  body text, small severity `Chip` (reusing `STATUS_COLORS`). Hardcoded
  placeholder copy — no props needed.

`src/components/dashboard/ConversationalInsightsPanel/ConversationalInsightsPanel.tsx`

- Header row (icon + "Conversational Insights" title).
- A handful of static chat-bubble rows (alternating left/right alignment,
  `Avatar` + `Typography` in a rounded `Box`), hardcoded placeholder text.
- A disabled-looking input row at the bottom (`TextField disabled` + a
  disabled send `IconButton`) — visual only, no handlers.

Both take no props (fully static) for this pass.

## Page wiring

`src/pages/AgentSummary/AgentSummary.tsx` and
`src/pages/ConversationalInsights/ConversationalInsights.tsx` change from a
single centered `EmptyState` to a two-column layout: a `Stack`
(`direction={{ xs: 'column', lg: 'row' }}`) with a left placeholder main-content
`EmptyState` (flexible width) and the new panel on the right at a fixed
~360px width (`lg` and up), stacking full-width below the main content on
smaller screens.

## Out of scope

- Wiring KPICard/ChartContainer to the mock data JSON or dashboard store.
- Chart interactivity beyond Recharts' built-in tooltip/legend (no custom
  crosshair, no click-to-filter).
- Any content in the panel shells beyond static placeholder copy.
- Dark mode.
