import type { DashboardMockData, KPIStatus, ModuleKey } from '@/types/dashboard';
import { evaluateAllSignals, type Signal } from './earlyWarningRules';
import { MODULE_TAB_ORDER, MODULE_LABELS } from '@pages/Dashboard/moduleTabs';

/** The five plants, matching the exact labels used throughout `mockData.json` and by
 * `GlobalFilterBar`'s Plant filter (so a health card's click-through can drive that same
 * filter, rather than inventing a second plant-filtering mechanism). */
export const PLANTS = [
  'Rourkela Plant',
  'Jamshedpur Plant',
  'Bhilai Plant',
  'Hazira Plant',
  'Bellary Plant',
] as const;

export interface HealthCard {
  id: string;
  label: string;
  status: KPIStatus;
  flaggedCount: number;
  totalCount: number;
  signals: Signal[];
}

const worstStatus = (signals: Signal[]): KPIStatus => {
  if (signals.length === 0) return 'good';
  return signals.some((s) => s.severity === 'critical') ? 'critical' : 'warning';
};

const distinctKpiCount = (signals: Signal[]): number => new Set(signals.map((s) => s.kpiId)).size;

/** Every KPI's `drilldown.dimension` already says whether it has a plant-level breakdown at
 * all — reused directly rather than a second "which KPIs relate to plants" list to maintain. */
const plantDimensionedKpiIds = (mockData: DashboardMockData): Set<string> => {
  const ids = new Set<string>();
  for (const mod of Object.values(mockData.modules)) {
    for (const kpi of mod.kpis) {
      if (kpi.drilldown.dimension === 'plant') ids.add(kpi.id);
    }
  }
  return ids;
};

/** One card per Function/vertical (the six module tabs) — a direct regrouping of the same
 * `evaluateAllSignals` output the Exceptions view and each tab's Early Warning Strip already
 * use, so a function's status/count here always agrees with those. */
export const computeFunctionHealth = (mockData: DashboardMockData): HealthCard[] => {
  const allSignals = evaluateAllSignals(mockData.modules);
  return MODULE_TAB_ORDER.map((moduleKey) => {
    const signals = allSignals.filter((s) => s.module === moduleKey);
    return {
      id: moduleKey,
      label: MODULE_LABELS[moduleKey],
      status: worstStatus(signals),
      flaggedCount: distinctKpiCount(signals),
      totalCount: mockData.modules[moduleKey].kpis.length,
      signals,
    };
  });
};

/**
 * One card per plant. Important limitation, surfaced here rather than hidden: signals are
 * evaluated at whole-KPI granularity (current/previous/target/trend/status are per-KPI fields,
 * not per-drilldown-node — the same convention `KPICard` and the drill system already use
 * throughout this app). A plant-dimensioned KPI's tree includes all five plants, so a signal on
 * that KPI can't be attributed to *one specific* plant without evaluating thresholds against
 * each plant's own drilled value — new aggregation logic this rollup deliberately does not add
 * (per the instruction to reuse `evaluateKpiSignals` rather than build new aggregation logic).
 * The practical effect: every plant card currently shows the same status/count, since they
 * share the same 13 plant-dimensioned KPIs and today's flagged ones apply to all of them
 * equally. Each card still lists its own `signals` so this is visible/auditable, not silently
 * flattened.
 */
export const computePlantHealth = (mockData: DashboardMockData): HealthCard[] => {
  const allSignals = evaluateAllSignals(mockData.modules);
  const plantKpiIds = plantDimensionedKpiIds(mockData);
  const signals = allSignals.filter((s) => plantKpiIds.has(s.kpiId));
  const card: Omit<HealthCard, 'id' | 'label'> = {
    status: worstStatus(signals),
    flaggedCount: distinctKpiCount(signals),
    totalCount: plantKpiIds.size,
    signals,
  };
  return PLANTS.map((plant) => ({ id: plant, label: plant, ...card }));
};

export type { ModuleKey };
