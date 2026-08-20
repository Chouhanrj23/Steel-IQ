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
import { LazyEChartsContainer, type TreemapNode } from '@components/dashboard/EChartsContainer';
import {
  ROOT_LABEL,
  HIERARCHY_OPTIONS,
  getNodeAtPath,
  getNodesAtPath,
  applyCrossFilters,
  sumRootValues,
  buildContextLabel,
} from './drillDownUtils';
import { resolveAgentSummary } from '@/data/agentSummaryTemplates';
import { describeOverriddenStatuses } from '@/data/earlyWarningRules';
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';

const mockData = mockDataJson as DashboardMockData;

const RAW_MATERIAL_INSIGHTS = [
  'Sale of Iron Ore reached 186,000 tonnes this period, up 6.3% on stronger external demand, while Clean Coal Production grew to 92,000 tonnes — Raw Material Wastage Rate and Limestone Consumption both stayed within expected ranges across the plant network.',
];

const RAW_MATERIAL_QUESTIONS = getQuestionsForTab('rawMaterial');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const RawMaterialTab = () => {
  const { kpis } = mockData.modules.rawMaterial;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const setPlant = useDashboardStore((state) => state.setPlant);
  const pendingPlantFilter = useDashboardStore((state) => state.pendingPlantFilter);
  const setPendingPlantFilter = useDashboardStore((state) => state.setPendingPlantFilter);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  // Reset the in-page drill to a clean default whenever this tab mounts (including switching
  // back into it), since it's shared across tabs and another tab's path won't match this tab's
  // trees. Separately, if something navigated here with a specific plant to pre-filter to (the
  // Overview health cards), apply that as the global Plant cross-filter, once — it composes
  // with the in-page drill rather than replacing it, now that the two are independent state.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    if (pendingPlantFilter) {
      setPlant(pendingPlantFilter);
      setPendingPlantFilter(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saleOfIronOre = findKpi(kpis, 'sale-of-iron-ore');
  const cleanCoalProduction = findKpi(kpis, 'clean-coal-production');
  const wastageRate = findKpi(kpis, 'raw-material-wastage-rate');
  const limestone = findKpi(kpis, 'limestone-consumption');

  const cardKpis = [saleOfIronOre, cleanCoalProduction, wastageRate, limestone];

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

  const saleOfIronOrePath = matchingPathFor(saleOfIronOre);
  const cleanCoalProductionPath = matchingPathFor(cleanCoalProduction);
  const wastageRatePath = matchingPathFor(wastageRate);
  const limestonePath = matchingPathFor(limestone);

  const saleOfIronOreOverTime = getNodesAtPath(filteredRoot(saleOfIronOre), saleOfIronOrePath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const cleanCoalProductionOverTime = getNodesAtPath(
    filteredRoot(cleanCoalProduction),
    cleanCoalProductionPath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const wastageRateByPlant = getNodesAtPath(filteredRoot(wastageRate), wastageRatePath).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  // Composition (how total Limestone Consumption splits across Plant, then Line within each
  // plant), not a flat by-plant comparison — a genuine part-of-whole story a bar chart can only
  // show one level of. Each node's own `.value` is already the pre-aggregated sum of everything
  // beneath it (the depth-extension invariant this app maintains throughout), so no re-summing
  // is needed — just reshape Plant → Line straight from the tree.
  const limestoneTreemap: TreemapNode[] = filteredRoot(limestone).map((plant) => ({
    name: plant.label,
    children: (plant.children ?? []).map((line) => ({ name: line.label, value: line.value })),
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const dynamicSummary = resolveAgentSummary('rawMaterial', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : RAW_MATERIAL_INSIGHTS;
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

        <EarlyWarningStrip module="rawMaterial" kpis={kpis} />

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
              type="area"
              title={`Sale of Iron Ore over Time${titleSuffix(saleOfIronOrePath)}`}
              data={saleOfIronOreOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Sale of Iron Ore (tonnes)' }]}
              onElementClick={handleChartClick(saleOfIronOre, saleOfIronOrePath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Clean Coal Production over Time${titleSuffix(cleanCoalProductionPath)}`}
              data={cleanCoalProductionOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Clean Coal Production (tonnes)' }]}
              onElementClick={handleChartClick(cleanCoalProduction, cleanCoalProductionPath)}
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            {/* A rate (%) per plant, not a continuous series between plants — 'bar' instead of
                the previous 'area', which visually implied an ordering/continuity across plants
                that isn't meaningful. */}
            <ChartContainer
              type="bar"
              title={`Raw Material Wastage Rate by Plant${titleSuffix(wastageRatePath)}`}
              data={wastageRateByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Wastage Rate (%)' }]}
              onElementClick={handleChartClick(wastageRate, wastageRatePath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <LazyEChartsContainer
              type="treemap"
              title={`Limestone Consumption by Plant & Line${titleSuffix(limestonePath)}`}
              unit="tonnes"
              data={limestoneTreemap}
              onElementClick={handleChartClick(limestone, limestonePath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="rawMaterial" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={RAW_MATERIAL_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default RawMaterialTab;
