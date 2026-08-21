import type { KPI, ModuleKey, DrillDownNode } from '@/types/dashboard';
import type { DrillSelection, CrossFilters } from '@store/dashboard';
import {
  applyCrossFilters,
  getNodeAtPath,
  getNodesAtPath,
  sumRootValues,
} from '@pages/Dashboard/drillDownUtils';
import { resolveQuestionContext } from './conversationalQuestions';
import {
  evaluateKpiSignals,
  KPI_POLARITY,
  getDefaultThresholdBoundary,
  type EarlyWarningOverrides,
} from './earlyWarningRules';

type DrillAxis = 'plant' | 'time';

/** Which "current state" bucket a KPI's recommendation sentence is drawn from — mirrors the
 * Early Warning Signals engine's own vocabulary (Threshold/Trend/Variance) for the flagged cases,
 * plus three unflagged buckets so every KPI always has *some* forward-looking line, not just the
 * ones currently in trouble. See `resolveRecommendationState` for the selection logic. */
export type RecommendationState =
  'thresholdFlagged' | 'trendFlagged' | 'varianceFlagged' | 'favorable' | 'unfavorableNotFlagged' | 'stable';

export interface SummaryTemplate {
  tab: ModuleKey;
  axis: DrillAxis;
  /** The KPI this template narrates — the tab's designated "headline" metric for this axis
   * (the same one driving that axis's interactive chart), so there's never ambiguity about
   * which of a tab's several plant/time-dimensioned KPIs the sentence is about. */
  kpiId: string;
  /** May reference {plant}, {period}, {region}, {value}, {percentChange}, {trend}. */
  template: string;
  /** One forward-looking, rule-based recommendation sentence per `RecommendationState` — the
   * second sentence appended after `template`'s descriptive one. Grounded in this specific KPI
   * (never generic boilerplate) and may additionally reference {configThreshold}, the KPI's
   * live Configuration-panel boundary (its session override if one exists, else its own target).
   * Framed as "based on current trends" / factual observations, not "our AI predicts" — this is
   * rule-based template selection, not a generated recommendation, and should read that way. */
  recommendations: Record<RecommendationState, string>;
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
    recommendations: {
      thresholdFlagged:
        'Based on current trends, prioritize dispatch of Fines grade to capture demand before it normalizes, since output is below the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, monitor whether the pullback in {period} is temporary or the start of a sustained decline before adjusting the sales plan.',
      varianceFlagged:
        'Based on current trends, revisit the {period} sales forecast against actual demand signals to close the gap with the {configThreshold} plan.',
      favorable:
        'Current stock and production levels at {plant} support increasing dispatch commitments for {period} without added procurement risk.',
      unfavorableNotFlagged:
        'Based on current trends, keep an eye on external demand signals for {period} before committing to higher dispatch volumes.',
      stable:
        'Output is tracking close to plan for {period}; maintain current production and dispatch cadence.',
    },
  },
  {
    tab: 'rawMaterial',
    axis: 'plant',
    kpiId: 'raw-material-wastage-rate',
    template:
      'At {plant} in {region}, Raw Material Wastage Rate {trend} {percentChange} versus the prior period to {value}, reflecting process discipline across the beneficiation and screening stages.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, review beneficiation and screening process settings at {plant} to bring Wastage Rate back within the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, flag the recent rise at {plant} for a process review before it crosses into a threshold breach.',
      varianceFlagged:
        'Based on current trends, investigate the process step contributing most to the variance at {plant} against the {configThreshold} plan.',
      favorable:
        'Process discipline at {plant} is holding; maintain current screening and beneficiation practices.',
      unfavorableNotFlagged:
        "Based on current trends, monitor {plant}'s wastage trend closely — it's moving the wrong way but hasn't crossed a review threshold yet.",
      stable: 'Wastage Rate at {plant} is holding steady near target; no action needed for {period}.',
    },
  },
  {
    tab: 'costAnalytics',
    axis: 'time',
    kpiId: 'inventory-days',
    template:
      'Inventory Days in {period} across {region} stood at {value}, a {percentChange} shift from the prior period, reflecting changes in dispatch pace and semi-finished goods build-up.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, prioritize dispatch of aged stock to bring Inventory Days back within the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, review WIP build-up before the {period} increase compounds into a threshold breach.',
      varianceFlagged:
        'Based on current trends, reconcile the {period} dispatch schedule against the {configThreshold} plan to close the gap.',
      favorable:
        'Faster dispatch cycles in {period} free up working capital — a good window to review reorder quantities.',
      unfavorableNotFlagged:
        'Based on current trends, keep dispatch cycle times under watch for {period} before they compound into a longer-term build-up.',
      stable:
        'Inventory Days is tracking close to the {configThreshold} target for {period}; no action needed.',
    },
  },
  {
    tab: 'supplyChain',
    axis: 'time',
    kpiId: 'imported-coal-inventory-days',
    template:
      'Imported Coal Inventory (Days) in {period} across {region} came in at {value}, {trend} {percentChange} from the prior period as shipping schedules and customs clearance times shifted.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, expedite customs clearance on pending cargoes to bring Inventory Days back within the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, monitor shipping schedules for {period} before the build-up crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review cargo lot sizing against the {configThreshold} plan to close the {period} gap.',
      favorable:
        'Tighter shipping and customs cycles in {period} create room to negotiate more favorable cargo lot sizes.',
      unfavorableNotFlagged:
        "Based on current trends, watch shipping schedules for {period} — the trend is moving the wrong way but hasn't crossed a review threshold.",
      stable:
        'Imported Coal Inventory (Days) is holding steady near target for {period}; maintain current shipping cadence.',
    },
  },
  {
    tab: 'supplyChain',
    axis: 'plant',
    kpiId: 'inventory-turnover-ratio',
    template:
      'Inventory Turnover Ratio at {plant} in {region} came in at {value}, {trend} {percentChange} from the prior period as stock-holding discipline tightened across the plant network.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, review stock-holding norms at {plant} to bring Turnover Ratio back above the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, flag the slowdown at {plant} for review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, reconcile stock levels at {plant} against the {configThreshold} plan.',
      favorable:
        'Stock-holding discipline at {plant} is improving — a good window to trim safety stock further without added risk.',
      unfavorableNotFlagged:
        "Based on current trends, monitor turnover at {plant} closely — it's moving the wrong way but hasn't crossed a review threshold yet.",
      stable:
        'Inventory Turnover Ratio at {plant} is holding steady near target; no action needed for {period}.',
    },
  },
  {
    tab: 'procurement',
    axis: 'time',
    kpiId: 'creditors-payment-terms',
    template:
      'Creditors Payment Terms in {period} across {region} now run {value}, {trend} {percentChange} versus the prior period following renegotiated vendor contracts.',
    recommendations: {
      thresholdFlagged:
        'Consider renegotiating terms with high-volume vendors to bring this back within the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, flag the {period} shift in payment terms for review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review vendor contract terms against the {configThreshold} plan to close the {period} gap.',
      favorable:
        'Recently renegotiated vendor terms are paying off — a good window to extend similar terms to other vendor categories.',
      unfavorableNotFlagged:
        "Based on current trends, monitor payment terms for {period} — they're tightening but haven't crossed a review threshold yet.",
      stable:
        'Creditors Payment Terms is holding steady near the {configThreshold} target for {period}; no action needed.',
    },
  },
  {
    tab: 'procurement',
    axis: 'plant',
    kpiId: 'vendor-on-time-delivery',
    template:
      'At {plant} in {region}, Vendor On-Time Delivery {trend} {percentChange} versus the prior period to {value}, as supplier scheduling discipline improved.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, escalate delivery performance with underperforming vendors at {plant} to bring this back above the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, flag the decline at {plant} for vendor review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review vendor scheduling at {plant} against the {configThreshold} plan.',
      favorable:
        'Improved vendor coordination at {plant} is a good candidate to replicate across other plants.',
      unfavorableNotFlagged:
        "Based on current trends, monitor vendor delivery at {plant} — it's slipping but hasn't crossed a review threshold yet.",
      stable:
        'Vendor On-Time Delivery at {plant} is holding steady near target; no action needed for {period}.',
    },
  },
  {
    tab: 'ep',
    axis: 'time',
    kpiId: 'ep-spend-vs-plan',
    template:
      'Spend vs Plan in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, as scheme execution pace caught up toward the approved annual plan.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, prioritize execution on Delayed schemes to bring Spend vs Plan back within the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, review scheme execution pace for {period} before the gap widens into a threshold breach.',
      varianceFlagged:
        'Based on current trends, reconcile scheme phasing against the {configThreshold} plan to close the {period} gap.',
      favorable:
        'Execution pace on On Track schemes is a good candidate for replicating on the remaining Delayed schemes.',
      unfavorableNotFlagged:
        "Based on current trends, monitor scheme execution for {period} — pace is lagging but hasn't crossed a review threshold yet.",
      stable:
        'Spend vs Plan is tracking close to the {configThreshold} target for {period}; no action needed.',
    },
  },
  {
    tab: 'tsk',
    axis: 'time',
    kpiId: 'tsk-other-receivables-recovery',
    template:
      'Other Receivables & Recovery Projections in {period} across {region} totaled {value}, {trend} {percentChange} versus the prior period, led by the Trade Receivables and Employee Advances categories.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, prioritize recovery action on the 31+ Days bucket to bring this back within the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, flag the {period} rise in Trade Receivables for recovery-process review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review recovery-process bottlenecks against the {configThreshold} plan for {period}.',
      favorable:
        'Recovery efforts in {period} are gaining ground — a good window to extend the same process to older accounts.',
      unfavorableNotFlagged:
        "Based on current trends, monitor Trade Receivables ageing for {period} — it's rising but hasn't crossed a review threshold yet.",
      stable:
        'Other Receivables & Recovery Projections is holding steady near target for {period}; no action needed.',
    },
  },
  {
    tab: 'tsj',
    axis: 'plant',
    kpiId: 'yield-rate',
    template:
      'At {plant} in {region}, Yield Rate {trend} {percentChange} versus the prior period to {value}, driven by furnace utilization and rolling mill throughput.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, review melting and rolling process control at {plant} to bring Yield Rate back above the {configThreshold} target.',
      trendFlagged:
        'Based on current trends, flag the shift at {plant} for process review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review process control at {plant} against the {configThreshold} plan.',
      favorable:
        'Tighter process control at {plant} is a good candidate to document and replicate at other plants.',
      unfavorableNotFlagged:
        "Based on current trends, monitor Yield Rate at {plant} — it's moving the wrong way but hasn't crossed a review threshold yet.",
      stable:
        'Yield Rate at {plant} is holding close to the {configThreshold} target for {period}; maintain current process controls.',
    },
  },
  {
    tab: 'tspl',
    axis: 'time',
    kpiId: 'tspl-srm-expenses-contract-cost',
    template:
      'SRM Expenses/Contract Cost Trend in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, driven mainly by AMC and manpower services contracts.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, review AMC contract terms up for renewal to bring this back within the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, flag the {period} rise in AMC contract costs for review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review contract cost drivers against the {configThreshold} plan for {period}.',
      favorable:
        'Contract costs are trending down in {period} — a good window to lock in current AMC rates for renewal.',
      unfavorableNotFlagged:
        "Based on current trends, monitor AMC contract costs for {period} — they're rising but haven't crossed a review threshold yet.",
      stable:
        'SRM Expenses/Contract Cost Trend is holding steady near target for {period}; no action needed.',
    },
  },
  {
    tab: 'marketingFinance',
    axis: 'time',
    kpiId: 'mf-factoring-collection-trend',
    template:
      'Factoring & Collection Trend in {period} across {region} reached {value}, {trend} {percentChange} versus the prior period, reflecting the balance between sales growth and collection discipline.',
    recommendations: {
      thresholdFlagged:
        'Based on current trends, prioritize collection follow-up on Key Account Customers to bring this back above the {configThreshold} target for {period}.',
      trendFlagged:
        'Based on current trends, flag the {period} shift in collections for review before it crosses a threshold.',
      varianceFlagged:
        'Based on current trends, review collection cycle times against the {configThreshold} plan for {period}.',
      favorable:
        'Faster collections from Key Account Customers in {period} are a good candidate to extend to other customer segments.',
      unfavorableNotFlagged:
        "Based on current trends, monitor collections for {period} — the pace is slowing but hasn't crossed a review threshold yet.",
      stable: 'Factoring & Collection Trend is holding steady near target for {period}; no action needed.',
    },
  },
];

const TREND_VERB: Record<KPI['trend'], string> = {
  up: 'rose',
  down: 'fell',
  flat: 'held steady',
};

const formatPercentChange = (percentChange: number): string =>
  `${percentChange > 0 ? '+' : ''}${percentChange}%`;

/** `resolveQuestionContext`'s "All Plants"/"All Regions" placeholders read fine as standalone UI
 * labels (a filter dropdown, a "Showing: All Plants" caption) but not woven into a flowing
 * sentence — "in All Time across All Regions" reads like unfinished template text, not prose.
 * Lower-cases just those "All X" sentinels for narrative use (leaving an actual drilled-into
 * value, e.g. "Rourkela Plant", untouched) — every consumer other than this file still gets the
 * original capitalized form from `resolveQuestionContext` directly. */
const forNarrative = (value: string): string => (value.startsWith('All ') ? value.toLowerCase() : value);

/** "All Time" specifically doesn't read as English inside a sentence ("in all time") the way
 * "all regions"/"all plants" do — it needs a different phrase, not just a case change. */
const narrativePeriod = (period: string): string => (period === 'All Time' ? 'this period' : period);

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

// Below this magnitude of period-over-period movement, a KPI reads as "stable" regardless of
// which way it nudged — sits below TREND_THRESHOLD_PCT (5%, the Early Warning Trend rule's own
// cutoff) so the recommendation's "stable" bucket only ever claims KPIs the Trend signal itself
// would never flag, and "favorable"/"unfavorableNotFlagged" cover the 2-5% range where the
// movement is real but not yet signal-worthy.
const STABLE_CHANGE_THRESHOLD_PCT = 2;

/** Chooses which of a KPI's six recommendation sentences applies right now — reuses
 * `evaluateKpiSignals`, the exact same Early Warning Signals engine the Strip/Exceptions view
 * run, so "flagged" here always agrees with whether the KPI is actually flagged elsewhere, session
 * Configuration overrides included. Priority among simultaneous signals is Threshold, then
 * Variance, then Trend — Threshold is the most direct "this reading itself is out of range"
 * signal, Variance is a plan-deviation signal, Trend is directional-only and the least severe of
 * the three, so a KPI tripping more than one at once narrates on its most material issue. */
const resolveRecommendationState = (
  kpi: KPI,
  tab: ModuleKey,
  overrides?: EarlyWarningOverrides,
): RecommendationState => {
  const signalTypes = new Set(evaluateKpiSignals(kpi, tab, overrides).map((signal) => signal.type));
  if (signalTypes.has('Threshold')) return 'thresholdFlagged';
  if (signalTypes.has('Variance')) return 'varianceFlagged';
  if (signalTypes.has('Trend')) return 'trendFlagged';

  if (kpi.trend === 'flat' || Math.abs(kpi.percentChange) < STABLE_CHANGE_THRESHOLD_PCT) return 'stable';

  const polarity = KPI_POLARITY[kpi.id];
  if (!polarity) return 'stable';
  const favorable =
    (polarity === 'up-good' && kpi.trend === 'up') || (polarity === 'down-good' && kpi.trend === 'down');
  return favorable ? 'favorable' : 'unfavorableNotFlagged';
};

/** "%" reads fine directly after a number ("3.8%"); every other unit needs the space ("3.8
 * tonnes") — shared so every hand-formatted number+unit pairing in this file agrees. */
const formatUnit = (value: number, unit: string): string => `${value}${unit === '%' ? '%' : ` ${unit}`}`;

const formatConfigThreshold = (kpi: KPI, overrides?: EarlyWarningOverrides): string => {
  const boundary = overrides?.threshold?.[kpi.id] ?? getDefaultThresholdBoundary(kpi);
  return formatUnit(boundary, kpi.unit);
};

// Below this margin, a drilled node reads as "in line with" its peers rather than meaningfully
// above/below them — avoids reporting something like "6% above the average" as if it were a real
// standout when it's within normal noise.
const PEER_COMPARISON_THRESHOLD_PCT = 5;

/** `resolveRecommendationState` is computed from the KPI's own whole-aggregate fields (status/
 * trend/percentChange vs its single target) — those never change no matter which specific plant
 * or period a user drills into, so without this, every plant under the same KPI got the exact
 * same recommendation sentence back, differing only in which {plant} name got substituted in.
 * This grounds the recommendation in the specific drilled node's own real value instead: how it
 * compares to the average of its real siblings (the other plants, or the other periods at that
 * same level) — genuinely different numbers per node, computed from the same tree every chart on
 * the tab already reads, never fabricated. Returns `null` when there are too few siblings for
 * "average" to mean anything (a lone node, or an empty/zero-valued comparison group). */
const describePeerComparison = (
  node: DrillDownNode,
  siblings: DrillDownNode[],
  unit: string,
  axisNoun: string,
): string | null => {
  // Excludes the node itself from its own comparison group — "20% above the other 4 plants'
  // average" is the real, honest comparison; averaging it in with itself would quietly dampen
  // its own signal against the very group it's being measured against.
  const peers = siblings.filter((sibling) => sibling.label !== node.label);
  if (peers.length < 1) return null;
  const average = peers.reduce((sum, peer) => sum + peer.value, 0) / peers.length;
  if (average === 0) return null;

  const deltaPct = Math.round(((node.value - average) / average) * 100);
  const roundedAverage = formatUnit(Math.round(average * 10) / 10, unit);

  if (Math.abs(deltaPct) < PEER_COMPARISON_THRESHOLD_PCT) {
    return `${node.label} is running in line with the other ${peers.length} ${axisNoun}s, which average ${roundedAverage}`;
  }
  const direction = deltaPct > 0 ? 'above' : 'below';
  return `${node.label} is ${Math.abs(deltaPct)}% ${direction} the other ${peers.length} ${axisNoun}s' average of ${roundedAverage}`;
};

/** What `resolveAgentSummary` returns — kept as two distinct fields, not one concatenated
 * sentence, so a caller can render "Insight" and "Recommended Action" as clearly separate,
 * labeled pieces (matching the business-scenario cards' own Insight/Recommended Actions
 * treatment) instead of one flowing paragraph that buries the action inside descriptive text. */
export interface AgentSummaryResult {
  /** What happened — the descriptive sentence, plus the active Business Unit/Product Category
   * filter note when one is set. */
  insight: string;
  /** The forward-looking action to take, chosen by `resolveRecommendationState`. */
  recommendedAction: string;
}

/**
 * Resolves the Agent Summary content for the given tab, or `null` only when this tab genuinely
 * has no template/KPI to narrate — callers should fall back to their static top-level summary in
 * that case, same safety net the panel already had before this generator existed. Every one of
 * the 9 module tabs has at least one template today, so in practice this always returns a result
 * — including at rest, with no drill and no cross-filter active, narrating the KPI's full
 * aggregate (the same value its own KPI card already shows undrilled). Client feedback was that
 * the Agent Summary needs to suggest a recommended action from the data on screen, not just
 * describe it — this always resolves a recommendation (no drill/filter required to see one), and
 * returns it as its own field rather than folded into one paragraph, so the UI can label it
 * explicitly as "Recommended Action" instead of leaving it for the reader to notice.
 *
 * `insight` is the descriptive "what happened" sentence; `recommendedAction` is chosen by
 * `resolveRecommendationState` — the KPI's current Early Warning state (Threshold/Trend/Variance-
 * flagged, favorable, unfavorable-but-unflagged, or stable), factoring in `overrides` (the
 * Configuration panel's session thresholds) exactly as the Strip and Exceptions view already do.
 */
export const resolveAgentSummary = (
  tab: ModuleKey,
  kpis: KPI[],
  drill: DrillSelection,
  crossFilters: CrossFilters,
  overrides?: EarlyWarningOverrides,
): AgentSummaryResult | null => {
  const hasDrill = drill.path.length > 0 && (drill.hierarchy === 'plant' || drill.hierarchy === 'time');

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
    plant: forNarrative(plant),
    period: narrativePeriod(period),
    region: forNarrative(region),
    bu,
    category,
    value: `${value} ${kpi.unit}`,
    percentChange: formatPercentChange(kpi.percentChange),
    trend: TREND_VERB[kpi.trend],
    configThreshold: formatConfigThreshold(kpi, overrides),
  };

  const fill = (text: string) =>
    text.replace(PLACEHOLDER_PATTERN, (match, key: string) => context[key] ?? match);

  const state = resolveRecommendationState(kpi, tab, overrides);
  let recommendedAction = fill(template.recommendations[state]);

  // Grounds the recommendation in the specific drilled node's own real standing — without this,
  // every plant/period under this KPI gets the exact same sentence back (the state above is
  // fixed per-KPI, not per-node), differing only in which {plant} name got substituted in.
  if (node) {
    const siblings = getNodesAtPath(filteredRoot, drill.path.slice(0, -1));
    const axisNoun = template.axis === 'plant' ? 'plant' : 'period';
    const peerComparison = describePeerComparison(node, siblings, kpi.unit, axisNoun);
    if (peerComparison) recommendedAction = `${recommendedAction} ${peerComparison}.`;
  }

  return {
    insight: fill(template.template) + activeFilterSuffix(crossFilters),
    recommendedAction,
  };
};
