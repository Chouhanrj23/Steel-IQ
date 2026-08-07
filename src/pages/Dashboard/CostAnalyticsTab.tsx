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
import { ROOT_LABEL, HIERARCHY_OPTIONS, getNodeAtPath, getNodesAtPath, flattenLeafValues } from './drillDownUtils';

const mockData = mockDataJson as DashboardMockData;

const COST_ANALYTICS_INSIGHTS = [
  'Cost per tonne of steel declined to ₹46,200 this period even as energy cost ratio edged up to 18.6% — overall production cost savings of ₹312 Lakh partially offset the increase, keeping blended margins stable.',
];

const COST_ANALYTICS_QA_PAIRS = [
  {
    question: 'What is driving the change in cost per tonne this quarter?',
    answer:
      'Cost per tonne of steel declined roughly 1.9% quarter-over-quarter, mainly due to lower raw material input costs partially offset by higher energy costs.',
  },
  {
    question: 'Which plant has the highest energy cost ratio?',
    answer: 'Rourkela Plant currently shows the highest energy cost ratio among the five plants, reflecting higher furnace utilization.',
  },
  {
    question: 'Is labor cost variance within an acceptable range?',
    answer: 'Labor cost variance has improved to 2.1%, well within the acceptable band, down from 3.4% last period.',
  },
  {
    question: 'How much has overhead cost ratio changed?',
    answer: 'Overhead cost ratio increased slightly to 9.4%, up from 9.1%, driven by higher administrative allocations.',
  },
  {
    question: 'Which plant is contributing the most production cost savings?',
    answer: 'Hazira Plant is the largest contributor to production cost savings this period, driven by process efficiency initiatives.',
  },
];

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

  const costPerTonne = findKpi(kpis, 'cost-per-tonne-of-steel');
  const energyCostRatio = findKpi(kpis, 'energy-cost-ratio');
  const laborCostVariance = findKpi(kpis, 'labor-cost-variance');
  const overheadCostRatio = findKpi(kpis, 'overhead-cost-ratio');
  const productionCostSavings = findKpi(kpis, 'production-cost-savings');

  const cardKpis = [costPerTonne, energyCostRatio, overheadCostRatio, productionCostSavings];

  const matchingPathFor = (kpi: KPI): string[] =>
    drill.hierarchy === kpi.drilldown.dimension ? drill.path : [];

  const handleChartClick = (kpi: KPI, matchingPath: string[]) => (label: string) => {
    const nodes = getNodesAtPath(kpi.drilldown.root, matchingPath);
    const clicked = nodes.find((n) => n.label === label);
    if (clicked?.children) {
      drillInto(kpi.drilldown.dimension, label);
    }
  };

  const energyCostRatioPath = matchingPathFor(energyCostRatio);
  const costPerTonnePath = matchingPathFor(costPerTonne);
  const laborCostVariancePath = matchingPathFor(laborCostVariance);

  const energyCostRatioByPlant = getNodesAtPath(energyCostRatio.drilldown.root, energyCostRatioPath).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const costPerTonneOverTime = getNodesAtPath(costPerTonne.drilldown.root, costPerTonnePath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const laborCostVarianceOverTime = getNodesAtPath(laborCostVariance.drilldown.root, laborCostVariancePath).map(
    (node) => ({
      period: node.label,
      value: node.value,
    }),
  );

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = breadcrumbPath.join(' / ');

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
            const node = matchingPath.length ? getNodeAtPath(kpi.drilldown.root, matchingPath) : null;
            const isActiveHierarchy = kpi.drilldown.dimension === drill.hierarchy;
            return (
              <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  title={kpi.name}
                  value={node ? node.value : kpi.current}
                  unit={kpi.unit}
                  percentChange={kpi.percentChange}
                  trend={kpi.trend}
                  status={kpi.status}
                  sparklineData={flattenLeafValues(getNodesAtPath(kpi.drilldown.root, matchingPath))}
                  onClick={isActiveHierarchy ? undefined : () => drillToHierarchyRoot(kpi.drilldown.dimension)}
                />
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="bar"
              title={`Energy Cost Ratio by Plant${titleSuffix(energyCostRatioPath)}`}
              data={energyCostRatioByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Energy Cost Ratio (%)' }]}
              onElementClick={handleChartClick(energyCostRatio, energyCostRatioPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title={`Cost per Tonne of Steel over Time${titleSuffix(costPerTonnePath)}`}
              data={costPerTonneOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost per Tonne (INR)' }]}
              onElementClick={handleChartClick(costPerTonne, costPerTonnePath)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="area"
              title={`Labor Cost Variance over Time${titleSuffix(laborCostVariancePath)}`}
              data={laborCostVarianceOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Labor Cost Variance (%)' }]}
              onElementClick={handleChartClick(laborCostVariance, laborCostVariancePath)}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel insights={COST_ANALYTICS_INSIGHTS} contextLabel={contextLabel} />
        <ConversationalInsightsPanel qaPairs={COST_ANALYTICS_QA_PAIRS} contextLabel={contextLabel} />
      </Stack>
    </Stack>
  );
};

export default CostAnalyticsTab;
