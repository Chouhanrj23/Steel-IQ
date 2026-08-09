export type ModuleKey =
  'rawMaterial' | 'costAnalytics' | 'supplyChain' | 'procurement' | 'product' | 'marketingFinance';

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
