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
