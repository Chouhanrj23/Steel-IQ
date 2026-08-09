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
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';
import { resolveAgentSummary } from '@/data/agentSummaryTemplates';

const mockData = mockDataJson as DashboardMockData;

const COST_ANALYTICS_INSIGHTS = [
  'Average inventory days held at 21.6 days while dispatch cost per tonne rose to ₹1,850 — GAGW trend climbed 5.7% to ₹2,860 Lakh, driven mainly by Procurement and Production cost elements, even as cost per tonne produced eased to ₹46,200.',
];

const COST_ANALYTICS_QUESTIONS = getQuestionsForTab('costAnalytics');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const CostAnalyticsTab = () => {
  const { kpis } = mockData.modules.costAnalytics;
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

  const inventoryDays = findKpi(kpis, 'inventory-days');
  const inventoryQuantity = findKpi(kpis, 'inventory-quantity');
  const dispatchCost = findKpi(kpis, 'dispatch-cost-per-tonne');
  const gagwTrend = findKpi(kpis, 'gagw-trend');
  const gagwByDepartment = findKpi(kpis, 'gagw-by-department');
  const costPerTonneProduced = findKpi(kpis, 'cost-per-tonne-produced');

  const cardKpis = [inventoryDays, dispatchCost, gagwTrend, costPerTonneProduced];

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

  const inventoryQuantityPath = matchingPathFor(inventoryQuantity);
  const gagwTrendPath = matchingPathFor(gagwTrend);
  // GAGW by Department is department-dimensioned; the hierarchy toggle only offers time/plant,
  // so drill.hierarchy can never equal 'department' and this is always []. Kept explicit (rather
  // than hardcoding the breakdown off the raw root) so the "always full aggregate" behavior is a
  // direct consequence of the same matching logic every other KPI uses.
  const gagwByDepartmentPath = matchingPathFor(gagwByDepartment);

  const inventoryQuantityByPlant = getNodesAtPath(filteredRoot(inventoryQuantity), inventoryQuantityPath).map(
    (node) => ({
      plant: node.label,
      value: node.value,
    }),
  );
  const gagwTrendOverTime = getNodesAtPath(filteredRoot(gagwTrend), gagwTrendPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const gagwByDepartmentBreakdown = getNodesAtPath(filteredRoot(gagwByDepartment), gagwByDepartmentPath).map(
    (node) => ({
      department: node.label,
      value: node.value,
    }),
  );

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = breadcrumbPath.join(' / ');
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const dynamicSummary = resolveAgentSummary('costAnalytics', kpis, drill, crossFilters);

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
              title={`Inventory Quantity by Plant${titleSuffix(inventoryQuantityPath)}`}
              data={inventoryQuantityByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Inventory Quantity (tonnes)' }]}
              onElementClick={handleChartClick(inventoryQuantity, inventoryQuantityPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title={`GAGW Trend over Time${titleSuffix(gagwTrendPath)}`}
              data={gagwTrendOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'GAGW Trend (₹ Lakh)' }]}
              onElementClick={handleChartClick(gagwTrend, gagwTrendPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="donut"
              title="GAGW by Department"
              data={gagwByDepartmentBreakdown}
              categoryKey="department"
              series={[{ key: 'value', label: 'GAGW (₹ Lakh)' }]}
              // No onElementClick: department isn't part of the Time/Plant toggle, so this
              // chart is intentionally non-interactive and always shows the full aggregate.
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel
          insights={dynamicSummary ? [dynamicSummary] : COST_ANALYTICS_INSIGHTS}
          contextLabel={contextLabel}
        />
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
