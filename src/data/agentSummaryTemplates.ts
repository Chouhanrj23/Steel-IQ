import type { KPI, ModuleKey } from '@/types/dashboard';
import type { DrillSelection, CrossFilters } from '@store/dashboard';
import { applyCrossFilters, getNodeAtPath } from '@pages/Dashboard/drillDownUtils';
import { resolveQuestionContext } from './conversationalQuestions';

type DrillAxis = 'plant' | 'time';

export interface SummaryTemplate {
  tab: ModuleKey;
  axis: DrillAxis;
  /** The KPI this template narrates — the tab's designated "headline" metric for this axis
   * (the same one driving that axis's interactive chart), so there's never ambiguity about
   * which of a tab's several plant/time-dimensioned KPIs the sentence is about. */
  kpiId: string;
  /** May reference {plant}, {period}, {region}, {value}, {percentChange}, {trend}. */
  template: string;
}

// One template per (tab, axis) that currently has a real drillable KPI to narrate — Supply
// Chain has no time-dimensioned KPI and Marketing & Finance has no plant-dimensioned KPI, so
// those two axis slots are intentionally absent rather than templated against fabricated data.
export const SUMMARY_TEMPLATES: SummaryTemplate[] = [
  {
    tab: 'rawMaterial',
    axis: 'plant',
    kpiId: 'iron-ore-inventory',
    template:
      'At {plant} in {region}, Iron Ore Inventory {trend} {percentChange} versus the prior period to {value}, as procurement teams adjusted stocking levels ahead of the monsoon logistics window.',
  },
  {
    tab: 'rawMaterial',
    axis: 'time',
    kpiId: 'coking-coal-cost-per-tonne',
    template:
      'Coking Coal Cost per Tonne {trend} {percentChange} in {period} across {region} to {value}, tracking global benchmark price movements and import freight rates.',
  },
  {
    tab: 'costAnalytics',
    axis: 'plant',
    kpiId: 'inventory-days',
    template:
      'Inventory Days at {plant} now stand at {value}, a {percentChange} shift from the prior period, reflecting changes in dispatch pace and semi-finished goods build-up.',
  },
  {
    tab: 'costAnalytics',
    axis: 'time',
    kpiId: 'gagw-trend',
    template:
      'GAGW Trend in {period} across {region} reached {value} ({percentChange} versus the prior period), with Material and Labor cost elements accounting for the bulk of the movement.',
  },
  {
    tab: 'supplyChain',
    axis: 'plant',
    kpiId: 'inventory-turnover-ratio',
    template:
      'Inventory Turnover Ratio at {plant} in {region} came in at {value}, {trend} {percentChange} from the prior period as stock-holding discipline tightened across the plant network.',
  },
  {
    tab: 'procurement',
    axis: 'plant',
    kpiId: 'creditors-payment-terms',
    template:
      'At {plant}, Creditors Payment Terms now run {value}, {trend} {percentChange} versus the prior period following renegotiated vendor contracts.',
  },
  {
    tab: 'procurement',
    axis: 'time',
    kpiId: 'actual-spend',
    template:
      'Actual Spend in {period} across {region} totaled {value}, {trend} {percentChange} over the prior period — Capex continues to outpace Opex as the primary driver of the increase.',
  },
  {
    tab: 'product',
    axis: 'plant',
    kpiId: 'production-volume',
    template:
      '{plant} produced {value} this period, a {percentChange} change versus the prior period, driven by furnace utilization and rolling mill throughput.',
  },
  {
    tab: 'product',
    axis: 'time',
    kpiId: 'value-added-steel-mix',
    template:
      'The Value-Added Steel mix reached {value} of total output in {period} across {region}, {trend} {percentChange} as the product portfolio shifts toward higher-margin grades.',
  },
  {
    tab: 'marketingFinance',
    axis: 'time',
    kpiId: 'ebitda-margin',
    template:
      'EBITDA Margin for {period} across {region} landed at {value}, {trend} {percentChange} versus the prior period, reflecting the balance between revenue growth and input cost inflation.',
  },
];

const TREND_VERB: Record<KPI['trend'], string> = {
  up: 'rose',
  down: 'fell',
  flat: 'held steady',
};

const formatPercentChange = (percentChange: number): string =>
  `${percentChange > 0 ? '+' : ''}${percentChange}%`;

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Resolves the Agent Summary sentence for the given tab's current drill/filter state, or `null`
 * when there's no active drill to narrate (root/aggregate level) or no template exists for the
 * active axis on this tab — callers should fall back to their static top-level summary in either
 * case, exactly as the panel already did before this generator existed.
 */
export const resolveAgentSummary = (
  tab: ModuleKey,
  kpis: KPI[],
  drill: DrillSelection,
  crossFilters: CrossFilters,
): string | null => {
  if (drill.path.length === 0) return null;
  if (drill.hierarchy !== 'plant' && drill.hierarchy !== 'time') return null;

  const template = SUMMARY_TEMPLATES.find((t) => t.tab === tab && t.axis === drill.hierarchy);
  if (!template) return null;

  const kpi = kpis.find((k) => k.id === template.kpiId);
  if (!kpi) return null;

  const filteredRoot = applyCrossFilters(kpi.drilldown.root, crossFilters);
  const node = getNodeAtPath(filteredRoot, drill.path);
  if (!node) return null;

  const { plant, period, region } = resolveQuestionContext(drill, crossFilters);
  const context: Record<string, string> = {
    plant,
    period,
    region,
    value: `${node.value} ${kpi.unit}`,
    percentChange: formatPercentChange(kpi.percentChange),
    trend: TREND_VERB[kpi.trend],
  };

  return template.template.replace(PLACEHOLDER_PATTERN, (match, key: string) => context[key] ?? match);
};
