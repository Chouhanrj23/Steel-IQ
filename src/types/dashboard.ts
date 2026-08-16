export type ModuleKey =
  | 'rawMaterial'
  | 'costAnalytics'
  | 'supplyChain'
  | 'procurement'
  | 'ep'
  | 'tsk'
  | 'tsj'
  | 'tspl'
  | 'marketingFinance';

export type KPITrend = 'up' | 'down' | 'flat';
export type KPIStatus = 'good' | 'warning' | 'critical';
// 'department' and 'category' mirror 'geography': each is a real tree shape a KPI can be
// dimensioned on, but the Time/Plant toggle never offers them, so KPIs using them always
// render as a static aggregate.
export type DrilldownDimension = 'time' | 'plant' | 'geography' | 'department' | 'category';

export interface RecordTags {
  region: string;
  businessUnit: string;
  productCategory: string;
  /** Which physical plant this record belongs to — present on every leaf regardless of the
   * KPI's own `drilldown.dimension`, same as region/businessUnit/productCategory, so the global
   * Plant filter can cross-filter any KPI (not just plant-dimensioned ones) the same way region
   * already does. Independent of the Time/Plant drill-down toggle, which walks the tree
   * structurally rather than filtering by a leaf tag. */
  plant: string;
}

export interface DrillDownNode {
  label: string;
  value: number;
  children?: DrillDownNode[];
  /** Present on leaf nodes only — the dimension tags backing cross-filter recomputation. */
  tags?: RecordTags;
}

export interface KPIDrilldown {
  dimension: DrilldownDimension;
  root: DrillDownNode[];
}

/** One point in a KPI's trailing history, used by the Trend lens. `period` is a relative label
 * (e.g. "T-5" … "Now") rather than a calendar label, since KPIs are dimensioned differently
 * (some by time, some by plant/geography with no calendar meaning of their own). */
export interface KPIHistoryPoint {
  period: string;
  value: number;
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
  /** Plan/budget value the KPI is judged against by the Variance lens and Early Warning Signals. */
  target: number;
  /** Trailing series backing the Trend lens — distinct from a drilldown breakdown. */
  history: KPIHistoryPoint[];
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
