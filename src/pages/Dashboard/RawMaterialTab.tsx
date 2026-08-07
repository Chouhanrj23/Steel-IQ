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

  const inventoryByPlant = getNodesAtPath(inventory.drilldown.root, inventoryPath).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const coalCostOverTime = getNodesAtPath(coalCost.drilldown.root, coalCostPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const leadTimeByGeography = getNodesAtPath(leadTime.drilldown.root, leadTimePath).map((node) => ({
    zone: node.label,
    value: node.value,
  }));

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
        <AgentSummaryPanel insights={RAW_MATERIAL_INSIGHTS} contextLabel={contextLabel} />
        <ConversationalInsightsPanel qaPairs={RAW_MATERIAL_QA_PAIRS} contextLabel={contextLabel} />
      </Stack>
    </Stack>
  );
};

export default RawMaterialTab;
