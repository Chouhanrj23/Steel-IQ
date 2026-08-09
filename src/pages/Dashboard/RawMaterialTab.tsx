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

const RAW_MATERIAL_INSIGHTS = [
  'Iron ore inventory at Rourkela has grown 6.1% quarter-over-quarter while coking coal costs rose per tonne — current stock levels cover roughly 38 days of blast furnace demand, above the 30-day safety threshold.',
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

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inventory = findKpi(kpis, 'iron-ore-inventory');
  const coalCost = findKpi(kpis, 'coking-coal-cost-per-tonne');
  const wastageRate = findKpi(kpis, 'raw-material-wastage-rate');
  const limestone = findKpi(kpis, 'limestone-consumption');
  const leadTime = findKpi(kpis, 'raw-material-lead-time');

  const cardKpis = [inventory, coalCost, wastageRate, limestone];

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

  const inventoryPath = matchingPathFor(inventory);
  const coalCostPath = matchingPathFor(coalCost);
  // Lead Time is geography-dimensioned; the hierarchy toggle only offers time/plant, so
  // drill.hierarchy can never equal 'geography' and this is always []. Kept explicit (rather
  // than hardcoding leadTimeByGeography off the raw root) so the "always full aggregate"
  // behavior is a direct consequence of the same matching logic every other KPI uses.
  const leadTimePath = matchingPathFor(leadTime);

  const inventoryByPlant = getNodesAtPath(filteredRoot(inventory), inventoryPath).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const coalCostOverTime = getNodesAtPath(filteredRoot(coalCost), coalCostPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const leadTimeByGeography = getNodesAtPath(filteredRoot(leadTime), leadTimePath).map((node) => ({
    zone: node.label,
    value: node.value,
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = breadcrumbPath.join(' / ');
  const dynamicSummary = resolveAgentSummary('rawMaterial', kpis, drill, crossFilters);
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
            value={drill.hierarchy === 'geography' ? null : drill.hierarchy}
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
              title={`Iron Ore Inventory by Plant${titleSuffix(inventoryPath)}`}
              data={inventoryByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Inventory (tonnes)' }]}
              onElementClick={handleChartClick(inventory, inventoryPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title={`Coking Coal Cost per Tonne over Time${titleSuffix(coalCostPath)}`}
              data={coalCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost per Tonne (INR)' }]}
              onElementClick={handleChartClick(coalCost, coalCostPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="donut"
              title="Raw Material Lead Time by Geography"
              data={leadTimeByGeography}
              categoryKey="zone"
              series={[{ key: 'value', label: 'Lead Time (days)' }]}
              // No onElementClick: geography isn't part of the Time/Plant toggle, so this
              // chart is intentionally non-interactive and always shows the full aggregate.
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel
          insights={dynamicSummary ? [dynamicSummary] : RAW_MATERIAL_INSIGHTS}
          contextLabel={contextLabel}
        />
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
