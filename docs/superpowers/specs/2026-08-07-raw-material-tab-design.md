# Raw Material Tab — Design

Date: 2026-08-07

## Goal

Implement the three prior specs (mock data & types, KPMG theme/Header/Global
Filter bar, dashboard widgets) and use them to build the first real module
screen: the Raw Material tab. Visual only — no cross-filtering logic (the
Global Filter bar and drill-down breadcrumb don't yet drive what data is
shown).

This spec assumes and does not repeat the full content of:

- `2026-08-07-dashboard-mock-data-design.md`
- `2026-08-07-kpmg-theme-header-filterbar-design.md`
- `2026-08-07-dashboard-widgets-design.md`

It implements them as written, with one revision (panel props, below).

## Revision to the dashboard-widgets spec: panel content props

`AgentSummaryPanel` and `ConversationalInsightsPanel` were spec'd with no
props (hardcoded generic placeholder content). This tab needs
module-specific content, so both gain props instead:

```ts
export interface AgentSummaryPanelProps {
  insights: string[];
}

export interface ConversationalInsightsPanelProps {
  qaPairs: { question: string; answer: string }[];
}
```

`AgentSummaryPanel` renders one placeholder-style card per string in
`insights` (same visual treatment as spec'd: title/body/severity chip, with
the string as the body). `ConversationalInsightsPanel` renders each
`qaPairs` entry as a question bubble (right-aligned, user style) followed by
an answer bubble (left-aligned, assistant style) — keeps the chat-bubble
visual from the original spec while satisfying "Q&A pairs" content. The
disabled input row at the bottom is unchanged.

The standalone `AgentSummary` and `ConversationalInsights` pages (wired per
the widgets spec) pass generic placeholder content through these same props,
so the components have exactly one implementation used two ways.

## New component: DrillDownBreadcrumb

`src/components/dashboard/DrillDownBreadcrumb/DrillDownBreadcrumb.tsx`

```ts
export interface DrillDownBreadcrumbProps {
  path: string[];
}
```

Renders an MUI `Breadcrumbs` with one segment per `path` entry (a small
location-style icon before the first segment), all segments plain static
text (no links, no click handlers — this is a data-hierarchy indicator, not
navigation, and stays inert until cross-filtering exists), the last segment
in `text.primary`/medium weight and earlier segments in `text.secondary`.
Kept separate from the existing router-driven `components/common/Breadcrumb`
since the two serve different purposes (page nav vs. data drill-down path).

## Page structure: Dashboard tabs

`src/pages/Dashboard/Dashboard.tsx` is rebuilt (route `/dashboard`, already
in nav — no new route added):

- `PageHeader title="Dashboard"`.
- MUI `Tabs` (controlled by a local `useState<number>` — ordinary UI state,
  not cross-filtering logic) with 6 tabs matching the module labels from
  `mockData.json`: Raw Material, Cost Analytics, Supply Chain, Procurement,
  Product, Marketing & Finance.
- Tab panel content: index 0 renders the new `RawMaterialTab` component
  (below); indices 1–5 render `EmptyState` with a "`<Module>` Coming Soon"
  message, matching the existing placeholder pattern used elsewhere in the
  app.

## RawMaterialTab

`src/pages/Dashboard/RawMaterialTab.tsx` (colocated with `Dashboard`, not a
shared component — it's a one-off composition specific to this route).

Reads `mockData.modules.rawMaterial` (imported from `@mock/mockData.json`,
typed as `DashboardMockData` from `@types/dashboard`) and lays out:

1. `DrillDownBreadcrumb` with `path={['All Plants', 'East', 'Rourkela Plant']}`.
2. A `Grid` row of 4 `KPICard`s, one each for: Iron Ore Inventory, Coking
   Coal Cost per Tonne, Raw Material Wastage Rate, Limestone Consumption —
   props mapped directly from each KPI's `current`/`unit`/`percentChange`/
   `trend`/`status`, `sparklineData` derived from that KPI's
   `drilldown.root` leaf values flattened to a flat number array.
3. A `Grid` row of 3 `ChartContainer`s:
   - Iron Ore Inventory by Plant — `type="bar"`, data built from the Iron
     Ore Inventory KPI's `drilldown.root` (top-level plant-dimension nodes)
     mapped to `{ plant: node.label, value: node.value }`.
   - Coking Coal Cost per Tonne over Time — `type="line"`, data from that
     KPI's `drilldown.root` (top-level time-dimension nodes, i.e. years)
     mapped to `{ period: node.label, value: node.value }`.
   - Raw Material Lead Time by Geography — `type="donut"`, data from the
     Lead Time KPI's `drilldown.root` (top-level geography-dimension nodes,
     i.e. zones) mapped to `{ zone: node.label, value: node.value }`. (Lead
     Time itself isn't a KPICard in this tab, per the earlier 4-of-5
     decision, but it is still visualized here.)
4. Right rail (`Stack`, ~360px wide on `lg`+, full-width stacked below main
   content on smaller screens):
   - `AgentSummaryPanel` with one hardcoded insight: _"Iron ore inventory at
     Rourkela has grown 6.1% quarter-over-quarter while coking coal costs
     rose per tonne — current stock levels cover roughly 38 days of blast
     furnace demand, above the 30-day safety threshold."_
   - `ConversationalInsightsPanel` with 5 hardcoded Q&A pairs:
     1. Q: "Which plant holds the highest raw material inventory?" / A:
        "Rourkela Plant currently holds the largest iron ore inventory
        among the five plants, followed by Jamshedpur."
     2. Q: "Why did coking coal costs increase this quarter?" / A: "Coking
        coal cost per tonne rose primarily due to higher import freight
        rates and global benchmark price increases."
     3. Q: "Is the raw material wastage rate within target?" / A: "The
        current wastage rate is slightly above target, driven by higher
        fines generation at two plants."
     4. Q: "How many days of limestone supply do we have on hand?" / A:
        "Current limestone consumption trends indicate roughly 25 days of
        on-hand supply at average draw rates."
     5. Q: "Which region contributes most to raw material lead time?" / A:
        "The South zone shows the longest average lead times, largely due
        to longer inbound freight distances."

All of the above is static: props and hardcoded arrays computed once from
the imported JSON, no fetching, no derived filtering from the Global Filter
bar or the drill-down breadcrumb (both remain visually present but inert).

## Out of scope

- Wiring the Global Filter bar or DrillDownBreadcrumb to actually filter
  displayed data.
- Building out the other 5 module tabs' content.
- Any loading/error states (data is a static local import, always present).
