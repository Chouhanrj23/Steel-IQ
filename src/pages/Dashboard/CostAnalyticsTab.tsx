import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, KPI } from '@/types/dashboard';
import { useDashboardStore, type HierarchyKey } from '@store/dashboard';
import {
  ConnectedKpiCard,
  ChartContainer,
  DrillDownBreadcrumb,
  EarlyWarningStrip,
  ConfigurationPanel,
  AgentSummaryPanel,
  ConversationalInsightsPanel,
} from '@components/dashboard';
// Imported directly (not via the '@components/dashboard' barrel) so `echarts` only ends up in
// the chunk a user downloads when they actually open this tab — see EChartsContainer/index.ts.
import { LazyEChartsContainer, type WaterfallItem } from '@components/dashboard/EChartsContainer';
import {
  ROOT_LABEL,
  HIERARCHY_OPTIONS,
  getNodeAtPath,
  getNodesAtPath,
  applyCrossFilters,
  sumRootValues,
  buildContextLabel,
} from './drillDownUtils';
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';
import { resolveAgentSummary } from '@/data/agentSummaryTemplates';
import { describeOverriddenStatuses } from '@/data/earlyWarningRules';

const mockData = mockDataJson as DashboardMockData;

const COST_ANALYTICS_INSIGHTS = [
  'Inventory Days held at 21.6 days while Inventory Quantity rose to 92,400 tonnes on higher Raw Material stock — Dispatch Cost per Tonne edged up to ₹1,850, and GAGW Trend climbed to ₹2,860 Lakh, driven mainly by VP-Operations and the Material cost element.',
];

const COST_ANALYTICS_QUESTIONS = getQuestionsForTab('costAnalytics');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

// GAGW Trend's drilldown tree is time-only (Year/Quarter/Month) — there's no cost-element-level
// breakdown in the underlying data model, so the split below is illustrative apportionment of
// the KPI's own real period-over-period delta, not drilled data (no onElementClick wiring on
// the resulting waterfall, same convention as TSK's Competitor Comparison chart, which is also
// intentionally non-interactive since its axis isn't part of the Time/Plant toggle). Material
// leading the increase matches this tab's own insight text ("driven mainly by ... the Material
// cost element"). Weights sum to exactly 1 so the bridge always lands precisely on the KPI's
// real current value; splitDelta's remainder correction is a safety net if that ever changes.
// Short labels — this bridge renders in the same quarter-width card as every other chart on the
// tab, and a waterfall's category axis has to show every step's label at once (unlike a time
// axis, which can thin out ticks), so there's no room for the full "Utilities & Power" style
// names without crowding or rotating past readability.
const GAGW_COST_ELEMENT_WEIGHTS: [string, number][] = [
  ['Material', 0.6],
  ['Manpower', 0.25],
  ['Utilities', 0.16],
  ['Freight', -0.08],
  ['Other', 0.07],
];

const splitDelta = (total: number, weights: number[]): number[] => {
  const rounded = weights.map((w) => Math.round(total * w * 10) / 10);
  const drift = Math.round((total - rounded.reduce((a, b) => a + b, 0)) * 10) / 10;
  if (drift !== 0) {
    const largestIndex = rounded.reduce(
      (best, v, i) => (Math.abs(v) > Math.abs(rounded[best] ?? 0) ? i : best),
      0,
    );
    rounded[largestIndex] = Math.round(((rounded[largestIndex] ?? 0) + drift) * 10) / 10;
  }
  return rounded;
};

const buildGagwBridge = (previous: number, current: number): WaterfallItem[] => {
  const deltas = splitDelta(
    current - previous,
    GAGW_COST_ELEMENT_WEIGHTS.map(([, w]) => w),
  );
  return [
    { label: 'Previous', value: previous, isTotal: true },
    ...GAGW_COST_ELEMENT_WEIGHTS.map(([label], i) => ({ label, value: deltas[i] ?? 0 })),
    { label: 'Current', value: current, isTotal: true },
  ];
};

export const CostAnalyticsTab = () => {
  const { kpis } = mockData.modules.costAnalytics;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees. None of Cost Analytics' KPIs are plant-dimensioned, so the Plant hierarchy
  // starts (and stays) at full aggregate for every card — same convention as every other tab.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inventoryDays = findKpi(kpis, 'inventory-days');
  const inventoryQuantity = findKpi(kpis, 'inventory-quantity');
  const dispatchCost = findKpi(kpis, 'dispatch-cost-per-tonne');
  const gagwTrend = findKpi(kpis, 'gagw-trend');

  const cardKpis = [inventoryDays, inventoryQuantity, dispatchCost, gagwTrend];

  // Recomputed per KPI so Region/Business Unit/Product Category compose with the Time/Plant
  // drill instead of overriding it — same shape as kpi.drilldown.root, values filtered down.
  const filteredRoot = (kpi: KPI) => applyCrossFilters(kpi.drilldown.root, crossFilters);

  const matchingPathFor = (kpi: KPI): string[] =>
    drill.hierarchy === kpi.drilldown.dimension ? drill.path : [];

  const handleChartClick = (kpi: KPI, matchingPath: string[]) => (label: string) => {
    const nodes = getNodesAtPath(kpi.drilldown.root, matchingPath);
    const clicked = nodes.find((n) => n.label === label);
    if (clicked?.children) {
      drillInto(kpi.drilldown.dimension, label);
    }
  };

  const inventoryDaysPath = matchingPathFor(inventoryDays);
  const inventoryQuantityPath = matchingPathFor(inventoryQuantity);
  const dispatchCostPath = matchingPathFor(dispatchCost);

  const inventoryDaysOverTime = getNodesAtPath(filteredRoot(inventoryDays), inventoryDaysPath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const inventoryQuantityOverTime = getNodesAtPath(
    filteredRoot(inventoryQuantity),
    inventoryQuantityPath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const dispatchCostOverTime = getNodesAtPath(filteredRoot(dispatchCost), dispatchCostPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  // Waterfall/bridge instead of an "over Time" line — the interesting story for GAGW isn't the
  // trend line (that's still visible via its KPI card's own Trend lens), it's *why* the latest
  // period moved, which a bridge chart shows directly instead of making a viewer infer it.
  const gagwBridge = buildGagwBridge(gagwTrend.previous, gagwTrend.current);

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const dynamicSummary = resolveAgentSummary('costAnalytics', kpis, drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : COST_ANALYTICS_INSIGHTS;
  const insights = overrideNotes.length > 0 ? [...baseInsights, ...overrideNotes] : baseInsights;

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
          <DrillDownBreadcrumb
            path={breadcrumbPath}
            onSegmentClick={(index) => drillToSegment(index === 0 ? -1 : index - 1)}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={drill.hierarchy}
            onChange={(_event, value: HierarchyKey | null) => {
              if (value) drillToHierarchyRoot(value);
            }}
            aria-label="active drill-down hierarchy"
          >
            {HIERARCHY_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ px: 2 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <EarlyWarningStrip module="costAnalytics" kpis={kpis} />

        <Grid container spacing={3}>
          {cardKpis.map((kpi) => {
            const matchingPath = matchingPathFor(kpi);
            const root = filteredRoot(kpi);
            const node = matchingPath.length ? getNodeAtPath(root, matchingPath) : null;
            const isActiveHierarchy = kpi.drilldown.dimension === drill.hierarchy;
            return (
              <ConnectedKpiCard
                key={kpi.id}
                kpi={kpi}
                value={node ? node.value : sumRootValues(root)}
                onClick={isActiveHierarchy ? undefined : () => drillToHierarchyRoot(kpi.drilldown.dimension)}
              />
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Inventory Days over Time${titleSuffix(inventoryDaysPath)}`}
              data={inventoryDaysOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Inventory Days' }]}
              onElementClick={handleChartClick(inventoryDays, inventoryDaysPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Inventory Quantity over Time${titleSuffix(inventoryQuantityPath)}`}
              data={inventoryQuantityOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Inventory Quantity (tonnes)' }]}
              onElementClick={handleChartClick(inventoryQuantity, inventoryQuantityPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`Dispatch Cost per Tonne over Time${titleSuffix(dispatchCostPath)}`}
              data={dispatchCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Dispatch Cost (INR)' }]}
              onElementClick={handleChartClick(dispatchCost, dispatchCostPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <LazyEChartsContainer
              type="waterfall"
              title="GAGW Trend — Period Bridge"
              unit="₹ Lakh"
              data={gagwBridge}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="costAnalytics" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={COST_ANALYTICS_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default CostAnalyticsTab;
