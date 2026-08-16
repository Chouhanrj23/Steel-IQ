import type { KPI, ModuleKey } from '@/types/dashboard';
import type { DrillSelection, CrossFilters } from '@store/dashboard';
import { applyCrossFilters, getNodeAtPath, sumRootValues } from '@pages/Dashboard/drillDownUtils';
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

// One template per (tab, axis) that currently has a real drillable KPI to narrate. Several tabs
// only have KPIs on one axis under the new 9-tab KPI Playbook (e.g. TSJ has no time-dimensioned
// KPI at all now, and Cost Analytics/E&P/TSK/TSPL/Marketing & Finance have no plant-dimensioned
// one) — those axis slots are intentionally absent rather than templated against fabricated
// data, same principle the original two absent slots (Supply Chain/time, Marketing & Finance/
// plant) already followed.
export const SUMMARY_TEMPLATES: SummaryTemplate[] = [
  {
    tab: 'rawMaterial',
    axis: 'time',
    kpiId: 'sale-of-iron-ore',
    template:
      'Sale of Iron Ore in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, tracking external demand alongside captive consumption needs.',
  },
  {
    tab: 'rawMaterial',
    axis: 'plant',
    kpiId: 'raw-material-wastage-rate',
    template:
      'At {plant} in {region}, Raw Material Wastage Rate {trend} {percentChange} versus the prior period to {value}, reflecting process discipline across the beneficiation and screening stages.',
  },
  {
    tab: 'costAnalytics',
    axis: 'time',
    kpiId: 'inventory-days',
    template:
      'Inventory Days in {period} across {region} stood at {value}, a {percentChange} shift from the prior period, reflecting changes in dispatch pace and semi-finished goods build-up.',
  },
  {
    tab: 'supplyChain',
    axis: 'time',
    kpiId: 'imported-coal-inventory-days',
    template:
      'Imported Coal Inventory (Days) in {period} across {region} came in at {value}, {trend} {percentChange} from the prior period as shipping schedules and customs clearance times shifted.',
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
    axis: 'time',
    kpiId: 'creditors-payment-terms',
    template:
      'Creditors Payment Terms in {period} across {region} now run {value}, {trend} {percentChange} versus the prior period following renegotiated vendor contracts.',
  },
  {
    tab: 'procurement',
    axis: 'plant',
    kpiId: 'vendor-on-time-delivery',
    template:
      'At {plant} in {region}, Vendor On-Time Delivery {trend} {percentChange} versus the prior period to {value}, as supplier scheduling discipline improved.',
  },
  {
    tab: 'ep',
    axis: 'time',
    kpiId: 'ep-spend-vs-plan',
    template:
      'Spend vs Plan in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, as scheme execution pace caught up toward the approved annual plan.',
  },
  {
    tab: 'tsk',
    axis: 'time',
    kpiId: 'tsk-other-receivables-recovery',
    template:
      'Other Receivables & Recovery Projections in {period} across {region} totaled {value}, {trend} {percentChange} versus the prior period, led by the Trade Receivables and Employee Advances categories.',
  },
  {
    tab: 'tsj',
    axis: 'plant',
    kpiId: 'yield-rate',
    template:
      'At {plant} in {region}, Yield Rate {trend} {percentChange} versus the prior period to {value}, driven by furnace utilization and rolling mill throughput.',
  },
  {
    tab: 'tspl',
    axis: 'time',
    kpiId: 'tspl-srm-expenses-contract-cost',
    template:
      'SRM Expenses/Contract Cost Trend in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, driven mainly by AMC and manpower services contracts.',
  },
  {
    tab: 'marketingFinance',
    axis: 'time',
    kpiId: 'mf-factoring-collection-trend',
    template:
      'Factoring & Collection Trend in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, reflecting the balance between sales growth and collection discipline.',
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

/** Appended to the templated sentence whenever Business Unit and/or Product Category are
 * actively filtered — {region} is already woven directly into every template's own wording
 * (defaulting to "All Regions" so the sentence reads fine unfiltered too), but retrofitting the
 * same inline treatment into all 11 hand-authored templates for two more fields risked reading
 * as clutter in the (default, far more common) unfiltered case. Surfacing them only when
 * they're actually narrowing the data keeps the common case clean while still satisfying "the
 * template should substitute in the active Region/BU/Category context where relevant." */
const activeFilterSuffix = (crossFilters: CrossFilters): string => {
  const parts: string[] = [];
  if (crossFilters.businessUnit) parts.push(`Business Unit: ${crossFilters.businessUnit}`);
  if (crossFilters.productCategory) parts.push(`Category: ${crossFilters.productCategory}`);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
};

/**
 * Resolves the Agent Summary sentence for the given tab's current drill/filter state, or `null`
 * when there's nothing to narrate (no drill *and* no cross-filter active) or no template exists
 * for this tab at all — callers should fall back to their static top-level summary in either
 * case, exactly as the panel already did before this generator existed. Reacts to Region/
 * Business Unit/Product Category/Plant on their own now, not just an active Time/Plant drill —
 * previously a cross-filter-only change (no drill) always fell through to the static summary,
 * even though the underlying KPI values had genuinely changed.
 */
export const resolveAgentSummary = (
  tab: ModuleKey,
  kpis: KPI[],
  drill: DrillSelection,
  crossFilters: CrossFilters,
): string | null => {
  const hasDrill = drill.path.length > 0 && (drill.hierarchy === 'plant' || drill.hierarchy === 'time');
  const hasCrossFilter = Boolean(
    crossFilters.region || crossFilters.businessUnit || crossFilters.productCategory || crossFilters.plant,
  );
  if (!hasDrill && !hasCrossFilter) return null;

  // Prefer the template matching the in-page drill's current axis; fall back to whichever axis
  // this tab actually has a template for, so a cross-filter-only change still produces dynamic
  // text even when the in-page toggle happens to be sitting on the tab's other (template-less)
  // axis, or on a tab with no drill at all yet.
  const preferredTemplate = hasDrill
    ? SUMMARY_TEMPLATES.find((t) => t.tab === tab && t.axis === drill.hierarchy)
    : undefined;
  const template = preferredTemplate ?? SUMMARY_TEMPLATES.find((t) => t.tab === tab);
  if (!template) return null;

  const kpi = kpis.find((k) => k.id === template.kpiId);
  if (!kpi) return null;

  const filteredRoot = applyCrossFilters(kpi.drilldown.root, crossFilters);
  // Only walk the drill path when this template's own axis actually matches the current drill
  // — otherwise (a cross-filter-only change, or the drill sitting on the tab's other axis)
  // there's no meaningful node to walk to, so narrate the filtered aggregate instead, same as
  // an undrilled KPI card already does via sumRootValues.
  const node = hasDrill && template.axis === drill.hierarchy ? getNodeAtPath(filteredRoot, drill.path) : null;
  const value = node ? node.value : sumRootValues(filteredRoot);

  const { plant, period, region, bu, category } = resolveQuestionContext(drill, crossFilters);
  const context: Record<string, string> = {
    plant,
    period,
    region,
    bu,
    category,
    value: `${value} ${kpi.unit}`,
    percentChange: formatPercentChange(kpi.percentChange),
    trend: TREND_VERB[kpi.trend],
  };

  const sentence = template.template.replace(
    PLACEHOLDER_PATTERN,
    (match, key: string) => context[key] ?? match,
  );
  return sentence + activeFilterSuffix(crossFilters);
};
