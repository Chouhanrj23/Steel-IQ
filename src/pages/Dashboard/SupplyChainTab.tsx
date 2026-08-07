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

const SUPPLY_CHAIN_INSIGHTS = [
  'On-time delivery rate improved to 91.2% while order fulfillment cycle time shortened to 6.8 days — both gains were partially offset by a rise in freight cost per tonne to ₹2,140, driven by higher inbound logistics rates.',
];

const SUPPLY_CHAIN_QA_PAIRS = [
  {
    question: 'How has on-time delivery performance trended?',
    answer: 'On-time delivery rate improved to 91.2%, up from 88.6% last period, driven by better dispatch scheduling.',
  },
  {
    question: 'Why did freight cost per tonne increase?',
    answer: 'Freight cost per tonne rose to ₹2,140 primarily due to higher fuel surcharges and longer average haul distances.',
  },
  {
    question: 'Which plant has the best inventory turnover?',
    answer: 'Bellary Plant currently shows the strongest inventory turnover ratio among the five plants, reflecting leaner stock holding.',
  },
  {
    question: 'Has order fulfillment cycle time improved?',
    answer: 'Order fulfillment cycle time shortened to 6.8 days, down from 7.6 days, reflecting faster order processing.',
  },
  {
    question: 'Which zone has the highest supplier reliability score?',
    answer: 'The South zone shows the highest supplier reliability score, benefiting from a more concentrated supplier base.',
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

export const SupplyChainTab = () => {
  const { kpis } = mockData.modules.supplyChain;

  const onTimeDelivery = findKpi(kpis, 'on-time-delivery-rate');
  const orderFulfillment = findKpi(kpis, 'order-fulfillment-cycle-time');
  const freightCost = findKpi(kpis, 'freight-cost-per-tonne');
  const inventoryTurnover = findKpi(kpis, 'inventory-turnover-ratio');
  const supplierReliability = findKpi(kpis, 'supplier-reliability-score');

  const cardKpis = [onTimeDelivery, orderFulfillment, freightCost, supplierReliability];

  const inventoryTurnoverByPlant = inventoryTurnover.drilldown.root.map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const onTimeDeliveryByGeography = onTimeDelivery.drilldown.root.map((node) => ({
    zone: node.label,
    value: node.value,
  }));
  const freightCostByGeography = freightCost.drilldown.root.map((node) => ({
    zone: node.label,
    value: node.value,
  }));

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <DrillDownBreadcrumb path={['All Plants', 'South', 'Bellary Plant']} />

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
              title="Inventory Turnover Ratio by Plant"
              data={inventoryTurnoverByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Inventory Turnover (x)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title="On-Time Delivery Rate by Geography"
              data={onTimeDeliveryByGeography}
              categoryKey="zone"
              series={[{ key: 'value', label: 'On-Time Delivery (%)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="donut"
              title="Freight Cost per Tonne by Geography"
              data={freightCostByGeography}
              categoryKey="zone"
              series={[{ key: 'value', label: 'Freight Cost (INR)' }]}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel insights={SUPPLY_CHAIN_INSIGHTS} />
        <ConversationalInsightsPanel qaPairs={SUPPLY_CHAIN_QA_PAIRS} />
      </Stack>
    </Stack>
  );
};

export default SupplyChainTab;
