import type { KPI, KPIStatus, ModuleKey } from '@/types/dashboard';
import { sumByLabelSet } from '@pages/Dashboard/drillDownUtils';

export type SignalType = 'Threshold' | 'Trend' | 'Variance';
export type Severity = Extract<KPIStatus, 'warning' | 'critical'>;
export type LensType = 'Trend' | 'Variance' | 'Ageing';

export interface Signal {
  kpiId: string;
  kpiName: string;
  module: ModuleKey;
  type: SignalType;
  severity: Severity;
  /** Short one-line summary — what happened. Doubles as the first sentence of `description`. */
  message: string;
  /** 1-2 sentence expansion of `message` with roughly why it matters and what it affects —
   * the body of the Alert → Description → CTA row/card and the Exception Detail view. */
  description: string;
  /** The lens this signal is best explored in — used to pre-select a KPI card's lens when
   * jumping to it from the Early Warning Strip or the Exceptions view. */
  lens: LensType;
}

/** Session-only, per-KPI rule overrides set from the Configuration panel — `undefined`/missing
 * entries mean "use the default rule" (the KPI's authored `status`, and the module-wide
 * `VARIANCE_THRESHOLD_PCT`), so every existing call site keeps behaving exactly as before until a
 * user actually moves a control. Trend has no override slot: it stays fixed, per the brief. */
export interface EarlyWarningOverrides {
  /** kpiId -> the numeric boundary that now decides its Threshold signal, replacing the authored
   * `status` field for that KPI only. */
  threshold?: Record<string, number>;
  /** kpiId -> the Variance tolerance % that now replaces `VARIANCE_THRESHOLD_PCT` for that KPI only. */
  variance?: Record<string, number>;
}

type Polarity = 'up-good' | 'down-good';

/** Which direction is favorable for each KPI, derived once from the authored (trend, status)
 * pairing in mockData.json (e.g. defect-rate is trend=up + status=critical, so up is
 * unfavorable => 'down-good'). Hardcoded rather than computed at runtime so it stays stable
 * even if a KPI's live trend/status later crosses back to "good" — the rule that "higher
 * defect rate is bad" shouldn't flip just because defects temporarily improved. */
export const KPI_POLARITY: Record<string, Polarity> = {
  // Raw Material
  'sale-of-iron-ore': 'up-good',
  'clean-coal-production': 'up-good',
  'raw-material-wastage-rate': 'down-good',
  'limestone-consumption': 'down-good',
  // Cost Analytics
  'inventory-days': 'down-good',
  'inventory-quantity': 'down-good',
  'dispatch-cost-per-tonne': 'down-good',
  'gagw-trend': 'down-good',
  // Supply Chain
  'imported-coal-inventory-days': 'down-good',
  'imported-coal-inventory-quantity': 'down-good',
  'spc-cost-per-tonne': 'down-good',
  'inventory-turnover-ratio': 'up-good',
  // Procurement
  'creditors-payment-terms': 'up-good',
  'actual-spend': 'down-good',
  'vendor-on-time-delivery': 'up-good',
  'purchase-order-cycle-time': 'down-good',
  // E&P
  'ep-spend-vs-plan': 'up-good',
  'ep-scheme-closure': 'up-good',
  'ep-capex-utilization-rate': 'up-good',
  'ep-project-milestone-adherence': 'up-good',
  // TSK
  'tsk-other-receivables-recovery': 'down-good',
  'tsk-competitor-comparison': 'up-good',
  'tsk-production-volume': 'up-good',
  'tsk-cost-efficiency-index': 'up-good',
  // TSJ
  'product-wise-profitability': 'up-good',
  'operational-kpis-vs-plan': 'up-good',
  'yield-rate': 'up-good',
  'defect-rate': 'down-good',
  // TSPL
  'tspl-srm-expenses-contract-cost': 'down-good',
  'tspl-customer-rejections': 'down-good',
  'tspl-otif-delivery': 'up-good',
  'tspl-realization-per-ton': 'up-good',
  // Marketing & Finance
  'mf-factoring-collection-trend': 'up-good',
  'mf-interest-on-overdue': 'down-good',
  'mf-conversion-cost-trend': 'down-good',
  'net-profit': 'up-good',
};

/** KPIs whose drilldown tree carries an age-bucket level ('0-30 Days' / '31+ Days'), the only
 * KPIs the Ageing lens applies to. */
export const AGEING_ELIGIBLE_KPIS = new Set<string>([
  'inventory-days',
  'inventory-quantity',
  'tsk-other-receivables-recovery',
]);
export const AGEING_BUCKET_LABELS = ['0-30 Days', '31+ Days'] as const;

/** The KPI's own drilldown tree, grouped into its age buckets — `null` when the KPI isn't
 * ageing-eligible, so callers can tell "not applicable" apart from "zero in both buckets". */
export const getAgeingBreakdown = (kpi: KPI): Record<string, number> | null =>
  AGEING_ELIGIBLE_KPIS.has(kpi.id) ? sumByLabelSet(kpi.drilldown.root, AGEING_BUCKET_LABELS) : null;

export const TREND_THRESHOLD_PCT = 5;
export const VARIANCE_THRESHOLD_PCT = 8;

export const severityOf = (status: KPIStatus): Severity | null => (status === 'good' ? null : status);

/** The Configuration panel's starting value for a KPI's Threshold control — its own plan/target,
 * so the control opens on a real, explainable number rather than an arbitrary one. Purely a UI
 * default: nothing is actually overridden until a user moves the control (see
 * `EarlyWarningOverrides`), so this has no effect on evaluation by itself. */
export const getDefaultThresholdBoundary = (kpi: KPI): number => kpi.target;

/** Evaluates every rule for one KPI. Pure — no store/React dependency — so the Early Warning
 * Strip and the Exceptions view can both call it and never disagree on what's triggered.
 * `overrides` is optional and session-only (from the Configuration panel's Zustand slice); when
 * omitted, every KPI evaluates exactly as it always has. */
export const evaluateKpiSignals = (
  kpi: KPI,
  module: ModuleKey,
  overrides?: EarlyWarningOverrides,
): Signal[] => {
  const signals: Signal[] = [];
  const polarity = KPI_POLARITY[kpi.id];
  const severity = severityOf(kpi.status) ?? 'warning';
  const unitStr = kpi.unit === '%' ? '%' : ` ${kpi.unit}`;
  const thresholdOverride = overrides?.threshold?.[kpi.id];

  // Threshold: either the session-adjusted numeric boundary (if the Configuration panel has one
  // for this KPI), or — the default, unchanged path — the KPI's own authored status.
  if (thresholdOverride !== undefined && polarity !== undefined) {
    const breached =
      polarity === 'up-good' ? kpi.current < thresholdOverride : kpi.current > thresholdOverride;
    if (breached) {
      const direction = polarity === 'up-good' ? 'below' : 'above';
      const message = `${kpi.name} is ${direction} its session-adjusted threshold of ${thresholdOverride}${unitStr} (currently ${kpi.current}${unitStr}).`;
      signals.push({
        kpiId: kpi.id,
        kpiName: kpi.name,
        module,
        type: 'Threshold',
        severity,
        message,
        description: `${message} This uses a threshold adjusted in the Configuration panel for this session, rather than the KPI's default status.`,
        lens: 'Trend',
      });
    }
  } else if (kpi.status !== 'good') {
    const message = `${kpi.name} is in a ${kpi.status} state at ${kpi.current}${unitStr}.`;
    signals.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      module,
      type: 'Threshold',
      severity: kpi.status,
      message,
      description: `${message} It has crossed the defined ${kpi.status} threshold for this KPI, which typically signals an emerging operational issue that can cascade into related KPIs in this module if it isn't addressed.`,
      lens: 'Trend',
    });
  }

  // Trend: moving against its favorable direction by a meaningful margin. No override slot —
  // kept fixed, per the Configuration panel brief (no natural single-number knob for this one).
  const unfavorableTrend =
    (polarity === 'up-good' && kpi.trend === 'down') || (polarity === 'down-good' && kpi.trend === 'up');
  if (unfavorableTrend && Math.abs(kpi.percentChange) >= TREND_THRESHOLD_PCT) {
    const message = `${kpi.name} has moved ${kpi.trend} ${Math.abs(kpi.percentChange)}% versus the prior period — the wrong direction for this KPI.`;
    signals.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      module,
      type: 'Trend',
      severity,
      message,
      description: `${message} A sustained move in this direction can erode plan attainment for this module over the coming periods if the underlying driver isn't identified and corrected.`,
      lens: 'Trend',
    });
  }

  // Variance: actual has drifted from target/plan by a meaningful margin, in the bad direction —
  // margin is the session-adjusted tolerance for this KPI if the Configuration panel has one,
  // else the module-wide default.
  const variancePct =
    kpi.target === 0 ? 0 : (Math.abs(kpi.current - kpi.target) / Math.abs(kpi.target)) * 100;
  const worseThanTarget = polarity === 'up-good' ? kpi.current < kpi.target : kpi.current > kpi.target;
  const varianceTolerance = overrides?.variance?.[kpi.id] ?? VARIANCE_THRESHOLD_PCT;
  if (worseThanTarget && variancePct >= varianceTolerance) {
    const message = `${kpi.name} is off plan by ${variancePct.toFixed(1)}% (actual ${kpi.current} vs target ${kpi.target}).`;
    signals.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      module,
      type: 'Variance',
      severity,
      message,
      description: `${message} A gap of this size suggests execution is diverging from plan for the period, and is worth a closer look at the segments contributing most to the variance.`,
      lens: 'Variance',
    });
  }

  return signals;
};

export const evaluateAllSignals = (
  modules: Record<ModuleKey, { kpis: KPI[] }>,
  overrides?: EarlyWarningOverrides,
): Signal[] =>
  (Object.entries(modules) as [ModuleKey, { kpis: KPI[] }][]).flatMap(([moduleKey, mod]) =>
    mod.kpis.flatMap((kpi) => evaluateKpiSignals(kpi, moduleKey, overrides)),
  );

/** The KPI card's effective status — its authored `status`, unless a session Threshold override
 * for this KPI flips it (to 'good' when the override is no longer breached, or to its usual
 * warning/critical severity when it is). This is what makes the KPI card's chip/border/tint react
 * live to the Configuration panel, since `KPICard` itself just renders whatever status it's handed. */
export const getEffectiveStatus = (kpi: KPI, overrides?: EarlyWarningOverrides): KPIStatus => {
  const polarity = KPI_POLARITY[kpi.id];
  const thresholdOverride = overrides?.threshold?.[kpi.id];
  if (thresholdOverride === undefined || polarity === undefined) {
    return kpi.status;
  }
  const breached = polarity === 'up-good' ? kpi.current < thresholdOverride : kpi.current > thresholdOverride;
  return breached ? (severityOf(kpi.status) ?? 'warning') : 'good';
};

/** One short sentence per KPI whose effective status differs from its authored status because of
 * a session Configuration override — appended to a tab's Agent Summary insights so that surface
 * visibly reacts too, without teaching the template engine itself about thresholds. `[]` when
 * nothing on this tab is currently overridden. */
export const describeOverriddenStatuses = (kpis: KPI[], overrides: EarlyWarningOverrides): string[] =>
  kpis.reduce<string[]>((notes, kpi) => {
    const effective = getEffectiveStatus(kpi, overrides);
    if (effective !== kpi.status) {
      notes.push(
        `${kpi.name} now reads ${effective} under a session-adjusted threshold (was ${kpi.status} by default).`,
      );
    }
    return notes;
  }, []);
