import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, KPI } from '@/types/dashboard';
import { useDashboardStore, type HierarchyKey } from '@store/dashboard';
import {
  KPICard,
  ChartContainer,
  DrillDownBreadcrumb,
  AgentSummaryPanel,
  ConversationalInsightsPanel,
} from '@components/dashboard';
import {
  ROOT_LABEL,
  HIERARCHY_OPTIONS,
  getNodeAtPath,
  getNodesAtPath,
  flattenLeafValues,
  applyCrossFilters,
  sumRootValues,
} from './drillDownUtils';
import { resolveAgentSummary } from '@/data/agentSummaryTemplates';
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';

const mockData = mockDataJson as DashboardMockData;

const PRODUCT_INSIGHTS = [
  'Production volume held at 214,500 tonnes with yield rate at 92.3% and capacity utilization at 88.1% — defect rate stayed contained at 2.4% even as the Value-Added Steel mix rose to 34.6% of total output.',
];

const PRODUCT_QUESTIONS = getQuestionsForTab('product');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const ProductTab = () => {
  const { kpis } = mockData.modules.product;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productionVolume = findKpi(kpis, 'production-volume');
  const yieldRate = findKpi(kpis, 'yield-rate');
  const defectRate = findKpi(kpis, 'defect-rate');
  const capacityUtilization = findKpi(kpis, 'capacity-utilization');
  const valueAddedSteelMix = findKpi(kpis, 'value-added-steel-mix');

  const cardKpis = [productionVolume, yieldRate, defectRate, capacityUtilization, valueAddedSteelMix];

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

  const productionVolumePath = matchingPathFor(productionVolume);
  const capacityUtilizationPath = matchingPathFor(capacityUtilization);
  const valueAddedSteelMixPath = matchingPathFor(valueAddedSteelMix);

  const productionVolumeByPlant = getNodesAtPath(filteredRoot(productionVolume), productionVolumePath).map(
    (node) => ({
      plant: node.label,
      value: node.value,
    }),
  );
  const capacityUtilizationByPlant = getNodesAtPath(
    filteredRoot(capacityUtilization),
    capacityUtilizationPath,
  ).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const valueAddedSteelMixOverTime = getNodesAtPath(
    filteredRoot(valueAddedSteelMix),
    valueAddedSteelMixPath,
  ).map((node) => ({
    period: node.label,
    value: node.value,
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = breadcrumbPath.join(' / ');
  const dynamicSummary = resolveAgentSummary('product', kpis, drill, crossFilters);
  const questionContext = resolveQuestionContext(drill, crossFilters);

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

        <Grid container spacing={3}>
          {cardKpis.map((kpi) => {
            const matchingPath = matchingPathFor(kpi);
            const root = filteredRoot(kpi);
            const node = matchingPath.length ? getNodeAtPath(root, matchingPath) : null;
            const isActiveHierarchy = kpi.drilldown.dimension === drill.hierarchy;
            return (
              <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  title={kpi.name}
                  value={node ? node.value : sumRootValues(root)}
                  unit={kpi.unit}
                  percentChange={kpi.percentChange}
                  trend={kpi.trend}
                  status={kpi.status}
                  sparklineData={flattenLeafValues(getNodesAtPath(root, matchingPath))}
                  onClick={
                    isActiveHierarchy ? undefined : () => drillToHierarchyRoot(kpi.drilldown.dimension)
                  }
                />
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="bar"
              title={`Production Volume by Plant${titleSuffix(productionVolumePath)}`}
              data={productionVolumeByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Production Volume (tonnes)' }]}
              onElementClick={handleChartClick(productionVolume, productionVolumePath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title={`Value-Added Steel Mix over Time${titleSuffix(valueAddedSteelMixPath)}`}
              data={valueAddedSteelMixOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Value-Added Steel Mix (%)' }]}
              onElementClick={handleChartClick(valueAddedSteelMix, valueAddedSteelMixPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="area"
              title={`Capacity Utilization by Plant${titleSuffix(capacityUtilizationPath)}`}
              data={capacityUtilizationByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Capacity Utilization (%)' }]}
              onElementClick={handleChartClick(capacityUtilization, capacityUtilizationPath)}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel
          insights={dynamicSummary ? [dynamicSummary] : PRODUCT_INSIGHTS}
          contextLabel={contextLabel}
        />
        <ConversationalInsightsPanel
          questionLibrary={PRODUCT_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default ProductTab;
