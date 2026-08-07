# Raw Material Drill-Down Interaction — Design

Date: 2026-08-07

## Goal

Make the Raw Material tab's drill-down breadcrumb, KPI cards, and charts
interactive: clicking a KPI card or a chart element (bar, line point, donut
segment) drills one level into that KPI's own hierarchy, updates a shared
breadcrumb, and refreshes the tab's KPI cards, charts, and the two panels'
contextual header to reflect the current selection. Breadcrumb segments are
clickable to go back up. Client-side only, via the existing Zustand
`dashboard` store — no new state library, no new mock data. Raw Material tab
only; Cost Analytics and Supply Chain are untouched.

## The core constraint

Raw Material's 5 KPIs span all three drilldown dimensions (Iron Ore
Inventory / Wastage Rate / Limestone Consumption are `plant`-dimensioned,
Coking Coal Cost is `time`, Lead Time is `geography`), but each KPI's mock
data (`src/mock/mockData.json`) only carries **one** dimension's breakdown
tree — there is no cross-tabulated data (e.g. no "Coking Coal Cost by
Plant"). Every behavior below is designed around that constraint rather than
around inventing new mock data.

## Store: `src/store/dashboard/dashboardStore.ts`

Extends the existing (currently empty) `useDashboardStore`:

```ts
import { create } from 'zustand';
import type { DrilldownDimension } from '@/types/dashboard';

export interface DrillSelection {
  dimension: DrilldownDimension;
  path: string[];
}

export interface DashboardState {
  drill: DrillSelection;
  drillInto: (dimension: DrilldownDimension, label: string) => void;
  drillToDimensionRoot: (dimension: DrilldownDimension) => void;
  drillToSegment: (index: number) => void;
}

const INITIAL_DRILL: DrillSelection = { dimension: 'plant', path: [] };

export const useDashboardStore = create<DashboardState>((set) => ({
  drill: INITIAL_DRILL,
  drillInto: (dimension, label) =>
    set((state) => ({
      drill:
        state.drill.dimension === dimension
          ? { dimension, path: [...state.drill.path, label] }
          : { dimension, path: [label] },
    })),
  drillToDimensionRoot: (dimension) => set({ drill: { dimension, path: [] } }),
  drillToSegment: (index) =>
    set((state) => ({
      drill: index < 0 ? INITIAL_DRILL : { dimension: state.drill.dimension, path: state.drill.path.slice(0, index + 1) },
    })),
}));
```

One shared selection for the whole tab: `dimension` names which of the KPI's
three possible hierarchies is "active"; `path` is the drilled labels within
it. Switching dimension (via a KPI card or chart belonging to a different
dimension) resets `path`.

## Resolving drilled data per KPI

Two pure helpers, colocated in `RawMaterialTab.tsx` (not shared — specific to
walking a single KPI's `DrillDownNode[]` tree):

```ts
const getNodeAtPath = (root: DrillDownNode[], path: string[]): DrillDownNode | null => {
  let node: DrillDownNode | null = null;
  let level = root;
  for (const segment of path) {
    const match = level.find((n) => n.label === segment);
    if (!match) return node;
    node = match;
    level = match.children ?? [];
  }
  return node;
};

const getNodesAtPath = (root: DrillDownNode[], path: string[]): DrillDownNode[] => {
  const node = getNodeAtPath(root, path);
  if (!node) return root;
  return node.children ?? [node]; // leaf: render the single leaf as a one-bar/one-slice chart
};
```

For each KPI, `matchingPath = drill.dimension === kpi.drilldown.dimension ? drill.path : []`.

- **Card value**: `matchingPath.length ? getNodeAtPath(kpi.drilldown.root, matchingPath)!.value : kpi.current`.
- **Card `percentChange`/`trend`/`status`**: always the KPI's own overall
  values, unchanged by drilling — the mock data has no per-node
  previous-period comparison to draw a drilled delta from.
- **Card sparkline**: `flattenLeafValues` run over `getNodesAtPath(...)`
  instead of the whole root, so it reflects the current drilled scope.
- **Chart data**: `getNodesAtPath(kpi.drilldown.root, matchingPath)` mapped
  to the chart's `{ categoryKey, value }` shape (same mapping already used).
- **Chart title**: base title, plus `' — ' + matchingPath.join(' / ')` when
  `matchingPath` is non-empty, so the chart's current scope is visible.

KPIs whose dimension doesn't match `drill.dimension` are fully unaffected —
`matchingPath` is `[]`, so they render exactly as they do today.

## Interaction wiring

- **`KPICard`** gains `onClick?: () => void`. The card's outer element gets
  a pointer cursor and a subtle hover shadow when `onClick` is set (wrapped
  in a `Box`, not a change to the shared `common/Card`). In
  `RawMaterialTab`, each card's `onClick` calls
  `drillToDimensionRoot(kpi.drilldown.dimension)` — switches the tab's
  active dimension to this KPI's and resets to that dimension's top level
  (a card shows one aggregate number, so it can't indicate which specific
  child to descend into).
- **`ChartContainer`** gains `onElementClick?: (categoryLabel: string) => void`,
  wired through Recharts' chart-level `onClick` (reading `activeLabel`) for
  `bar`/`stackedBar`/`line`/`area`, and `<Pie onClick>` for `pie`/`donut`.
  `RawMaterialTab` resolves the clicked label back to its `DrillDownNode`
  within the currently-displayed array; if it has `children`, calls
  `drillInto(kpi.drilldown.dimension, label)`. Leaf clicks (no `children`)
  are a no-op — nothing left to descend into.
- **`DrillDownBreadcrumb`** gains `onSegmentClick?: (index: number) => void`.
  All segments except the last become clickable (`Link component="button"`,
  matching the styling pattern already used by `components/common/Breadcrumb`);
  the last segment (current position) stays plain text. `RawMaterialTab`
  builds `path = [ROOT_LABEL[drill.dimension], ...drill.path]` (root labels:
  "All Plants" / "All Time" / "All Locations") and translates the
  component's segment index back to the store: index `0` (root) →
  `drillToSegment(-1)`, index `i > 0` → `drillToSegment(i - 1)`.
- **`AgentSummaryPanel`** / **`ConversationalInsightsPanel`** gain an
  optional `contextLabel?: string`, rendered as a small caption above the
  existing content: `"Showing: All Plants / East / Rourkela Plant"`. The
  underlying hardcoded insight/Q&A text is unchanged — authoring real
  content for every possible drill path (dozens of combinations across 3
  hierarchies) is out of scope. `RawMaterialTab` passes the same joined
  breadcrumb path used above.

All four component prop additions are optional, so `CostAnalyticsTab`,
`SupplyChainTab`, and the standalone `AgentSummary`/`ConversationalInsights`
pages (which don't pass these new props) render exactly as before.

## Out of scope

- Cost Analytics, Supply Chain, or any other tab.
- New or cross-tabulated mock data.
- Per-node previous-period deltas, or per-drill-path Agent Summary/Q&A
  content.
- Persisting drill state across tab switches or page reloads (resets to
  `{ dimension: 'plant', path: [] }` on remount, since the store isn't
  persisted).
