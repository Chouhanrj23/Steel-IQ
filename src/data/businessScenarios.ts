import type { KPI, ModuleKey } from '@/types/dashboard';

/**
 * Business-scenario engine for the Agent Summary's "beyond WHAT happened" narrative.
 *
 * Client feedback (Tata Steel): a sentence like "Sales of iron ore reduced by 6%" only states
 * what happened. Every scenario matched here instead produces four parts — what happened, why it
 * may be happening, the business impact, and a recommended action — driven by where a pair of
 * related KPIs sit relative to their own plan/target, per the reference business-scenario sheets
 * (Inventory + Dispatch Cost; Sales + Iron Ore Production).
 *
 * Pure and framework-free by design (no React, no Zustand, no mockData import) — every function
 * here takes plain `KPI[]` and returns plain data, so it can just as easily run against live
 * backend/API data later; only the KPI shape (`current`/`target`/`unit`/`name`) is assumed.
 */

/** Which side of its own plan/target a KPI currently sits on — the raw comparison every scenario
 * condition below is built from. Deliberately independent of `KPI_POLARITY` in
 * earlyWarningRules.ts: these scenarios describe a KPI's raw "actual vs plan" position (e.g.
 * "Inventory > Plan"), not whether that position is favorable — the same raw position lands in a
 * different, differently-actioned quadrant depending on the *other* KPI's position too. */
export type PlanPosition = 'aboveTarget' | 'atOrBelowTarget';

/** Binary partition of current vs target. The reference sheets only ever specify a strict `>` for
 * the "High"/"exceeds plan" side of each pair and leave the exact-equality case unstated, so exact
 * equality is bucketed with "at or below" here — the same convention used consistently for every
 * scenario group below. */
export const classifyAgainstTarget = (kpi: KPI): PlanPosition =>
  kpi.current > kpi.target ? 'aboveTarget' : 'atOrBelowTarget';

export interface BusinessScenario {
  /** Stable id, unique within its group. */
  id: string;
  /** Short scenario name, e.g. "High Inventory + High Dispatch Cost". */
  name: string;
  conditions: { primary: PlanPosition; secondary: PlanPosition };
  /** Always present in the reference sheets — the one line every scenario has, used as the
   * connective "why this matters" framing even for the scenarios missing an explicit reasons or
   * impact list below. */
  interpretation: string;
  /** Concrete drivers, when the reference sheet lists them for this scenario (several don't). */
  potentialReasons: string[];
  /** Concrete impact bullets, when the reference sheet lists them separately from
   * `interpretation` (several don't — e.g. "Business concern" scenarios fold impact into one line,
   * captured there instead). */
  businessImpact: string[];
  /** Always present — every scenario in the reference sheets has a "Possible actions" list. */
  recommendedActions: string[];
}

export interface BusinessScenarioGroup {
  id: string;
  /** Human label for the pair, e.g. "Inventory + Dispatch Cost". */
  label: string;
  module: ModuleKey;
  /** KPI id supplying the group's first axis (e.g. Inventory, Sales). */
  primaryKpiId: string;
  /** KPI id supplying the group's second axis (e.g. Dispatch Cost/Ton, Iron Ore Production).
   * `null` means no genuine KPI for this axis exists in the data model yet — the group and its
   * scenarios stay fully defined, but `matchBusinessScenario` short-circuits to `null` rather than
   * matching against a substitute metric. This is the availability mechanism: flipping this from
   * `null` to a real KPI id is the only change needed to activate the group once that KPI exists —
   * never invent an id or point it at an unrelated metric to work around a `null` here. */
  secondaryKpiId: string | null;
  /** Exactly four scenarios — one per quadrant of (primary above/at-or-below) x (secondary
   * above/at-or-below). */
  scenarios: BusinessScenario[];
}

export interface ScenarioNarrative {
  /** Part 1 — what happened, stated from the live KPI values (data-driven, not reference text). */
  whatHappened: string;
  /** Part 2 — why it may be happening. `null` when the reference sheet listed no explicit
   * reasons for this quadrant (the "why" still lives in `whatHappened` + the scenario's own
   * interpretation, folded into `combined`). */
  whyItMayBeHappening: string | null;
  /** Part 3 — business impact. `null` when the reference sheet folded impact into the
   * interpretation line instead of listing it separately. */
  businessImpact: string | null;
  /** Part 4 — recommended action. Always present. */
  recommendedAction: string;
  /** All present parts joined into one paragraph, ready to hand to AgentSummaryPanel's
   * `insights` array as a single card. */
  combined: string;
}

export interface MatchedBusinessScenario {
  group: BusinessScenarioGroup;
  scenario: BusinessScenario;
  primaryKpi: KPI;
  secondaryKpi: KPI;
  narrative: ScenarioNarrative;
}

const formatKpiValue = (kpi: KPI): string => `${kpi.current} ${kpi.unit}`;

const describePosition = (kpi: KPI, position: PlanPosition): string => {
  const verb = position === 'aboveTarget' ? 'above' : 'at or below';
  return `${kpi.name} is at ${formatKpiValue(kpi)} against a plan of ${kpi.target} ${kpi.unit} (${verb} plan)`;
};

/**
 * KPI-id mapping discovered by inspecting `src/mock/mockData.json` directly (see the task report
 * for the full walkthrough) — the Cost Analytics module has a clean 1:1 match for both KPIs in
 * the Inventory + Dispatch Cost pair. Inventory Quantity (tonnes, a volume/working-capital
 * measure) is used as the "Inventory" axis rather than Inventory Days (a days-of-cover measure) —
 * the two currently disagree on direction (Quantity reads above plan, Days reads at/below plan),
 * and "working-capital blockage" in the reference sheet is a volume concept, so Quantity is the
 * more faithful single driver for this scenario pair.
 */
export const INVENTORY_DISPATCH_SCENARIOS: BusinessScenarioGroup = {
  id: 'inventory-dispatch-cost',
  label: 'Inventory + Dispatch Cost',
  module: 'costAnalytics',
  primaryKpiId: 'inventory-quantity',
  secondaryKpiId: 'dispatch-cost-per-tonne',
  scenarios: [
    {
      id: 'inventory-dispatch-high-high',
      name: 'High Inventory + High Dispatch Cost',
      conditions: { primary: 'aboveTarget', secondary: 'aboveTarget' },
      interpretation: 'Working-capital blockage combined with cost-to-serve pressure.',
      potentialReasons: [
        'Slow-moving or excess inventory',
        'Poor inventory location mix',
        'High freight/handling cost',
        'Inefficient dispatch',
      ],
      businessImpact: [
        'Working capital locked in stock',
        'Margin dilution from elevated dispatch cost',
        'Carrying/ageing cost on excess stock',
      ],
      recommendedActions: [
        'Prioritize movement of critical, slow-moving inventory',
        'Optimize route, mode, plant and customer allocation for dispatch',
        'Review the materials contributing most to excess inventory days',
        'Set liquidation or cost thresholds for excess stock',
      ],
    },
    {
      id: 'inventory-dispatch-high-low',
      name: 'High Inventory + Low Dispatch Cost',
      conditions: { primary: 'aboveTarget', secondary: 'atOrBelowTarget' },
      interpretation: 'A working-capital release opportunity, since dispatch remains cost-efficient.',
      potentialReasons: [],
      businessImpact: [],
      recommendedActions: [
        'Accelerate surplus inventory dispatch/liquidation',
        'Use the currently low-cost routes/modes while they remain favorable',
        'Prioritize aged or non-critical inventory first',
        'Track the resulting cash release',
      ],
    },
    {
      id: 'inventory-dispatch-low-high',
      name: 'Low Inventory + High Dispatch Cost',
      conditions: { primary: 'atOrBelowTarget', secondary: 'aboveTarget' },
      interpretation: 'Availability risk combined with cost pressure.',
      potentialReasons: ['Stock below safety level', 'Emergency logistics', 'Poor inventory positioning'],
      businessImpact: [],
      recommendedActions: [
        'Protect critical inventory',
        'Validate safety stock levels',
        'Reduce premium/emergency logistics spend',
        'Reposition inventory only where actually required',
        'Trigger replenishment or alternate sourcing',
      ],
    },
    {
      id: 'inventory-dispatch-low-low',
      name: 'Low Inventory + Low Dispatch Cost',
      conditions: { primary: 'atOrBelowTarget', secondary: 'atOrBelowTarget' },
      interpretation: 'A lean, efficient inventory position — worth monitoring for stockout risk.',
      potentialReasons: [],
      businessImpact: [],
      recommendedActions: [
        'Maintain normal dispatch cadence',
        'Monitor safety stock and replenishment lead time',
        'Protect critical materials/customers',
        'Replenish if the negative trend persists',
      ],
    },
  ],
};

/**
 * Sales × Iron Ore Production requires a genuine Iron Ore Production KPI. Do not substitute
 * another commodity's production KPI. No valid KPI currently exists anywhere in this repository,
 * so these scenarios remain inactive until the correct metric is provided.
 *
 * Re-verified across the whole repo (not just mockData.json) on the Tata Steel demo-readiness
 * pass — two "production" KPIs exist today, and neither qualifies:
 * - `clean-coal-production` (Raw Material module): a different material (coal, not iron ore).
 * - `tsk-production-volume` (TSK module — a different subsidiary/module entirely, generic
 *   "Production Volume" with Mining/Processing/Logistics business areas, not iron-ore-specific,
 *   and not even in the Raw Material module `sale-of-iron-ore` lives in).
 * Neither may ever be presented to the user as, or substituted for, Iron Ore Production — doing
 * so would put a factually wrong metric behind a client-facing "Iron Ore Production" label. Both
 * are therefore deliberately NOT wired in below.
 *
 * KPI-id mapping: Sales maps cleanly to `sale-of-iron-ore` (Raw Material module). The Raw
 * Material module itself has no dedicated "Iron Ore Production" KPI at all — only Sale of Iron
 * Ore, Clean Coal Production, Raw Material Wastage Rate and Limestone Consumption exist.
 *
 * `IRON_ORE_PRODUCTION_KPI_ID` is the single switch that activates this group — a safe
 * configuration placeholder, not fake runtime data: it never resolves to a value at runtime, it
 * only decides (via `matchBusinessScenario`'s `null` short-circuit) whether this group is even
 * attempted. Set it to the real KPI id once one is added to mockData.json (never invent one, and
 * never point it at an unrelated commodity/module's KPI to work around its absence) and all four
 * scenarios below start matching immediately, with no other change to this file.
 */
export const IRON_ORE_PRODUCTION_KPI_ID: string | null = null;

export const SALES_PRODUCTION_SCENARIOS: BusinessScenarioGroup = {
  id: 'sales-production',
  label: 'Sales + Iron Ore Production',
  module: 'rawMaterial',
  primaryKpiId: 'sale-of-iron-ore',
  secondaryKpiId: IRON_ORE_PRODUCTION_KPI_ID,
  scenarios: [
    {
      id: 'sales-production-low-low',
      name: 'Supply-led Underperformance',
      conditions: { primary: 'atOrBelowTarget', secondary: 'atOrBelowTarget' },
      interpretation: 'Sales weakness is primarily a supply/production issue.',
      potentialReasons: [],
      businessImpact: [],
      recommendedActions: [
        'Fix the production bottleneck',
        'Prioritize captive allocation',
        'Reforecast sales against realistic supply',
        'Defer external commitments if required',
        'Track production recovery',
      ],
    },
    {
      id: 'sales-production-low-high',
      name: 'Sales Conversion Leakage',
      conditions: { primary: 'atOrBelowTarget', secondary: 'aboveTarget' },
      interpretation: 'Production exists but is not converting into sales.',
      potentialReasons: [
        'Dispatch/logistics bottleneck',
        'Grade mismatch',
        'Demand/pricing issue',
        'Approval/contract delay',
      ],
      businessImpact: [],
      recommendedActions: [
        'Accelerate surplus-grade sales',
        'Resolve dispatch constraints',
        'Revisit pricing and the customer pipeline',
        'Analyze the gap by plant, grade and sale type',
        'Convert surplus production into sales',
      ],
    },
    {
      id: 'sales-production-high-low',
      name: 'Risky Over-Sale',
      conditions: { primary: 'aboveTarget', secondary: 'atOrBelowTarget' },
      interpretation:
        "Sales performance is positive but may be drawing down inventory/captive buffer while production is weak — today's revenue upside may create future raw-material/production risk.",
      potentialReasons: [],
      businessImpact: ["Today's revenue upside may create future raw-material/production risk"],
      recommendedActions: [
        'Validate stock cover',
        'Restrict external sales if captive cover is low',
        'Rebalance captive vs external allocation',
        'Verify next-period production recovery before approving additional sales',
      ],
    },
    {
      id: 'sales-production-high-high',
      name: 'Healthy Upside',
      conditions: { primary: 'aboveTarget', secondary: 'aboveTarget' },
      interpretation:
        'Genuine positive performance, provided margin, logistics and captive coverage remain healthy.',
      potentialReasons: [],
      businessImpact: [],
      recommendedActions: [
        'Continue incremental sales',
        'Prioritize high-margin customers/grades',
        'Lock in favorable pricing',
        'Monitor the production/operating plan',
        'Consider an upward plan revision after sustained performance',
      ],
    },
  ],
};

/** Every scenario group the engine currently knows about. Add further groups here as more
 * reference business-scenario sheets are provided — nothing else needs to change to pick them up,
 * since `matchAllBusinessScenarios` just iterates this list. */
export const BUSINESS_SCENARIO_GROUPS: BusinessScenarioGroup[] = [
  INVENTORY_DISPATCH_SCENARIOS,
  SALES_PRODUCTION_SCENARIOS,
];

const buildNarrative = (
  scenario: BusinessScenario,
  primaryKpi: KPI,
  secondaryKpi: KPI,
  primaryState: PlanPosition,
  secondaryState: PlanPosition,
): ScenarioNarrative => {
  const whatHappened = `${scenario.name}: ${describePosition(primaryKpi, primaryState)}, while ${describePosition(secondaryKpi, secondaryState)}.`;

  const whyItMayBeHappening =
    scenario.potentialReasons.length > 0
      ? `This may be happening because: ${scenario.potentialReasons.join('; ')}.`
      : null;

  const businessImpact =
    scenario.businessImpact.length > 0 ? `Business impact: ${scenario.businessImpact.join('; ')}.` : null;

  const recommendedAction = `Recommended action: ${scenario.recommendedActions.join('; ')}.`;

  const combined = [
    whatHappened,
    scenario.interpretation,
    whyItMayBeHappening,
    businessImpact,
    recommendedAction,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return { whatHappened, whyItMayBeHappening, businessImpact, recommendedAction, combined };
};

/**
 * Matches one scenario group against a module's live KPIs. Returns `null` when:
 * - the group's `secondaryKpiId` is `null` (no genuine KPI exists yet for that axis — see
 *   `IRON_ORE_PRODUCTION_KPI_ID` above for the concrete case this covers today), or
 * - either KPI id is missing from `kpis` (e.g. called against the wrong module's KPI list, or
 *   against a partial/future backend payload that hasn't populated that KPI yet).
 * Callers should treat `null` as "nothing to narrate for this group," same as `resolveAgentSummary`
 * already does for its own template lookups.
 */
export const matchBusinessScenario = (
  group: BusinessScenarioGroup,
  kpis: KPI[],
): MatchedBusinessScenario | null => {
  if (group.secondaryKpiId === null) return null;

  const primaryKpi = kpis.find((kpi) => kpi.id === group.primaryKpiId);
  const secondaryKpi = kpis.find((kpi) => kpi.id === group.secondaryKpiId);
  if (!primaryKpi || !secondaryKpi) return null;

  const primaryState = classifyAgainstTarget(primaryKpi);
  const secondaryState = classifyAgainstTarget(secondaryKpi);

  const scenario = group.scenarios.find(
    (candidate) =>
      candidate.conditions.primary === primaryState && candidate.conditions.secondary === secondaryState,
  );
  if (!scenario) return null;

  return {
    group,
    scenario,
    primaryKpi,
    secondaryKpi,
    narrative: buildNarrative(scenario, primaryKpi, secondaryKpi, primaryState, secondaryState),
  };
};

/** Matches every group scoped to `module` against `kpis` — the entry point tabs actually call.
 * Groups for other modules are skipped rather than erroring, so a tab can pass the full group
 * list without needing to filter it first. */
export const matchBusinessScenariosForModule = (
  module: ModuleKey,
  kpis: KPI[],
  groups: BusinessScenarioGroup[] = BUSINESS_SCENARIO_GROUPS,
): MatchedBusinessScenario[] =>
  groups
    .filter((group) => group.module === module)
    .reduce<MatchedBusinessScenario[]>((matches, group) => {
      const match = matchBusinessScenario(group, kpis);
      if (match) matches.push(match);
      return matches;
    }, []);

/** Finds, among an already-computed list of matched scenarios (typically from
 * `matchBusinessScenariosForModule`, evaluated once per module), the one — if any — whose primary
 * or secondary KPI is `kpiId`. Lets a per-signal surface (the Early Warning Strip, the Exceptions
 * view) ask "does this one triggered KPI have richer scenario content?" without recomputing the
 * module's scenario matches for every signal. Returns `null` when the KPI isn't part of any
 * currently-matched scenario — callers should fall back to that signal's own plain description,
 * exactly as before scenarios existed. */
export const findScenarioForKpi = (
  kpiId: string,
  matches: MatchedBusinessScenario[],
): MatchedBusinessScenario | null =>
  matches.find((match) => match.primaryKpi.id === kpiId || match.secondaryKpi.id === kpiId) ?? null;
