# Dashboard Mock Data & Types — Design

Date: 2026-08-07

## Goal

Provide realistic synthetic data and shared TypeScript types for the six analytics
modules of the Steel IQ dashboard, so page/component work can proceed against a
stable, typed data shape before a real API exists.

## Scope

- `src/types/dashboard.ts` — shared TypeScript types for KPIs, drill-down nodes,
  modules, and the overall mock data shape.
- `src/mock/mockData.json` — static synthetic data conforming to those types.
  (Placed in `src/mock/` per the existing project convention and `@mock/*` alias,
  not `src/data/` as originally phrased in the request.)
- No components, hooks, or store wiring are built in this pass — purely data +
  types, matching the "scaffold only" state of the repo.

## Types (`src/types/dashboard.ts`)

```ts
export type ModuleKey =
  | 'rawMaterial'
  | 'costAnalytics'
  | 'supplyChain'
  | 'procurement'
  | 'product'
  | 'marketingFinance';

export type KPITrend = 'up' | 'down' | 'flat';
export type KPIStatus = 'good' | 'warning' | 'critical';
export type DrilldownDimension = 'time' | 'plant' | 'geography';

export interface DrillDownNode {
  label: string;
  value: number;
  children?: DrillDownNode[];
}

export interface KPIDrilldown {
  dimension: DrilldownDimension;
  root: DrillDownNode[];
}

export interface KPI {
  id: string;
  name: string;
  module: ModuleKey;
  unit: string;
  current: number;
  previous: number;
  percentChange: number;
  trend: KPITrend;
  status: KPIStatus;
  drilldown: KPIDrilldown;
}

export interface ModuleData {
  label: string;
  kpis: KPI[];
}

export interface DashboardHierarchies {
  time: DrillDownNode[];
  plant: DrillDownNode[];
  geography: DrillDownNode[];
}

export interface DashboardMockData {
  modules: Record<ModuleKey, ModuleData>;
  hierarchies: DashboardHierarchies;
}
```

`DrillDownNode` is recursive and used both for the standalone `hierarchies` trees
(for filter UIs) and for each KPI's own `drilldown.root` (its value broken down
across one dimension). Leaf nodes (3rd level) omit `children`.

## Hierarchies (shared, 3 levels each)

- **time** — Year (2024, 2025) → Quarter (Q1–Q4) → Month. Used for KPIs that read
  naturally as trends over time (e.g. cost, financial metrics).
- **plant** — Region (East, West, South, Central) → Plant (Rourkela, Jamshedpur,
  Bhilai, Hazira, Bellary) → Line (Blast Furnace Unit, Melt Shop Unit, Rolling
  Mill Unit). Represents manufacturing/operational sites.
- **geography** — Zone (North, South, East, West) → State → City. Represents
  customer/market geography (sales, procurement sourcing, distribution), kept
  distinct from the operational `plant` hierarchy.

Each KPI is tagged with exactly one of these three dimensions via
`drilldown.dimension`, and `drilldown.root` mirrors that hierarchy's shape with a
numeric `value` at every node. Leaf values sum to their parent's value, and
top-level node values sum to (approximately) the KPI's `current` value, so
drilling down is numerically consistent with the headline number.

## Modules & KPIs

Setting: fictional Indian steel manufacturer, values in INR / tonnes, ~5 KPIs per
module (30 total), each `{ name, unit, current, previous, trend, status,
drilldown dimension }`:

1. **Raw Material** — Iron Ore Inventory (plant), Coking Coal Cost per Tonne
   (time), Raw Material Wastage Rate (plant), Limestone Consumption (plant),
   Raw Material Lead Time (geography)
2. **Cost Analytics** — Cost per Tonne of Steel (time), Energy Cost Ratio
   (plant), Labor Cost Variance (time), Overhead Cost Ratio (time), Production
   Cost Savings (plant)
3. **Supply Chain** — On-Time Delivery Rate (geography), Order Fulfillment
   Cycle Time (geography), Freight Cost per Tonne (geography), Inventory
   Turnover Ratio (plant), Supplier Reliability Score (geography)
4. **Procurement** — Purchase Order Cycle Time (time), Supplier Price Variance
   (geography), Procurement Cost Savings (time), Contract Compliance Rate
   (geography), Vendor Rejection Rate (plant)
5. **Product** — Production Volume (plant), Yield Rate (plant), Defect Rate
   (plant), Capacity Utilization (plant), Value-Added Steel Mix (time)
6. **Marketing & Finance** — Revenue (geography), EBITDA Margin (time), Net
   Profit (time), Market Share (geography), Customer Acquisition Cost
   (geography), Order Book Value (geography)

`percentChange` is derived from `current`/`previous`; `trend` follows the sign;
`status` is assigned per KPI to a plausible mix of good/warning/critical (not
purely derived from `percentChange`, since higher-is-better vs lower-is-better
varies by KPI — e.g. rising defect rate is `critical` despite positive change).

## Generation approach

Hand-authoring ~30 KPIs × 3-level nested breakdowns with internally consistent
sums is impractical to do reliably by hand. A one-off Node/TS generator script
will be written under the scratch directory (not committed to the repo) to
produce the final `src/mock/mockData.json`, which will then be reviewed for
realism before being written to the repo.

## Out of scope

- Wiring this data into components, hooks, or the Zustand dashboard store.
- An actual data-fetching layer / API contract (this is static mock data only).
- Historical data beyond 2 years / validation schemas (e.g. Zod) for this shape.
