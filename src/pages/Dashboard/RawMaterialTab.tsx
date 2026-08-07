import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, DrillDownNode, KPI } from '@types/dashboard';
import {
  KPICard,
  ChartContainer,
  DrillDownBreadcrumb,
  AgentSummaryPanel,
  ConversationalInsightsPanel,
} from '@components/dashboard';

const mockData = mockDataJson as DashboardMockData;

const RAW_MATERIAL_INSIGHTS = [
  'Iron ore inventory at Rourkela has grown 6.1% quarter-over-quarter while coking coal costs rose per tonne — current stock levels cover roughly 38 days of blast furnace demand, above the 30-day safety threshold.',
];

const RAW_MATERIAL_QA_PAIRS = [
  {
    question: 'Which plant holds the highest raw material inventory?',
    answer: 'Rourkela Plant currently holds the largest iron ore inventory among the five plants, followed by Jamshedpur.',
  },
  {
    question: 'Why did coking coal costs increase this quarter?',
    answer: 'Coking coal cost per tonne rose primarily due to higher import freight rates and global benchmark price increases.',
  },
  {
    question: 'Is the raw material wastage rate within target?',
    answer: 'The current wastage rate is slightly above target, driven by higher fines generation at two plants.',
  },
  {
    question: 'How many days of limestone supply do we have on hand?',
    answer: 'Current limestone consumption trends indicate roughly 25 days of on-hand supply at average draw rates.',
  },
  {
    question: 'Which region contributes most to raw material lead time?',
    answer: 'The South zone shows the longest average lead times, largely due to longer inbound freight distances.',
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

export const RawMaterialTab = () => {
  const { kpis } = mockData.modules.rawMaterial;

  const inventory = findKpi(kpis, 'iron-ore-inventory');
  const coalCost = findKpi(kpis, 'coking-coal-cost-per-tonne');
  const wastageRate = findKpi(kpis, 'raw-material-wastage-rate');
  const limestone = findKpi(kpis, 'limestone-consumption');
  const leadTime = findKpi(kpis, 'raw-material-lead-time');

  const cardKpis = [inventory, coalCost, wastageRate, limestone];

  const inventoryByPlant = inventory.drilldown.root.map((node) => ({ plant: node.label, value: node.value }));
  const coalCostOverTime = coalCost.drilldown.root.map((node) => ({ period: node.label, value: node.value }));
  const leadTimeByGeography = leadTime.drilldown.root.map((node) => ({ zone: node.label, value: node.value }));

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <DrillDownBreadcrumb path={['All Plants', 'East', 'Rourkela Plant']} />

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
              title="Iron Ore Inventory by Plant"
              data={inventoryByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Inventory (tonnes)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title="Coking Coal Cost per Tonne over Time"
              data={coalCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost per Tonne (INR)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="donut"
              title="Raw Material Lead Time by Geography"
              data={leadTimeByGeography}
              categoryKey="zone"
              series={[{ key: 'value', label: 'Lead Time (days)' }]}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel insights={RAW_MATERIAL_INSIGHTS} />
        <ConversationalInsightsPanel qaPairs={RAW_MATERIAL_QA_PAIRS} />
      </Stack>
    </Stack>
  );
};

export default RawMaterialTab;
