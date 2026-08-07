import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, DrillDownNode, KPI } from '@/types/dashboard';
import {
  KPICard,
  ChartContainer,
  DrillDownBreadcrumb,
  AgentSummaryPanel,
  ConversationalInsightsPanel,
} from '@components/dashboard';

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

const flattenLeafValues = (nodes: DrillDownNode[]): number[] =>
  nodes.flatMap((node) => (node.children ? flattenLeafValues(node.children) : [node.value]));

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const CostAnalyticsTab = () => {
  const { kpis } = mockData.modules.costAnalytics;

  const costPerTonne = findKpi(kpis, 'cost-per-tonne-of-steel');
  const energyCostRatio = findKpi(kpis, 'energy-cost-ratio');
  const laborCostVariance = findKpi(kpis, 'labor-cost-variance');
  const overheadCostRatio = findKpi(kpis, 'overhead-cost-ratio');
  const productionCostSavings = findKpi(kpis, 'production-cost-savings');

  const cardKpis = [costPerTonne, energyCostRatio, overheadCostRatio, productionCostSavings];

  const energyCostRatioByPlant = energyCostRatio.drilldown.root.map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const costPerTonneOverTime = costPerTonne.drilldown.root.map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const laborCostVarianceOverTime = laborCostVariance.drilldown.root.map((node) => ({
    period: node.label,
    value: node.value,
  }));

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <DrillDownBreadcrumb path={['All Plants', 'West', 'Hazira Plant']} />

        <Grid container spacing={3}>
          {cardKpis.map((kpi) => (
            <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard
                title={kpi.name}
                value={kpi.current}
                unit={kpi.unit}
                percentChange={kpi.percentChange}
                trend={kpi.trend}
                status={kpi.status}
                sparklineData={flattenLeafValues(kpi.drilldown.root)}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="bar"
              title="Energy Cost Ratio by Plant"
              data={energyCostRatioByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Energy Cost Ratio (%)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title="Cost per Tonne of Steel over Time"
              data={costPerTonneOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost per Tonne (INR)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="area"
              title="Labor Cost Variance over Time"
              data={laborCostVarianceOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Labor Cost Variance (%)' }]}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel insights={COST_ANALYTICS_INSIGHTS} />
        <ConversationalInsightsPanel qaPairs={COST_ANALYTICS_QA_PAIRS} />
      </Stack>
    </Stack>
  );
};

export default CostAnalyticsTab;
