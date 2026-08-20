import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, DrillDownNode, KPI } from '@/types/dashboard';
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
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';
import { describeOverriddenStatuses } from '@/data/earlyWarningRules';

const mockData = mockDataJson as DashboardMockData;

const SUPPLY_CHAIN_INSIGHTS = [
  'Imported Coal Inventory held at 18.4 days while quantity on hand rose to 48,500 tonnes, led by Australian Coal cargoes — SPC Cost/Ton edged up to ₹1,240 on higher Handling costs, even as Inventory Turnover Ratio improved to 5.4x across the plant network.',
];

const SUPPLY_CHAIN_QUESTIONS = getQuestionsForTab('supplyChain');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

// A node one level above the Plant leaves — every child present but none of them further
// nested. Imported Coal Inventory Quantity's tree is Year/Quarter/Month/Origin/Plant, so this
// identifies "Origin" nodes structurally rather than by a hardcoded depth, meaning the treemap
// below aggregates correctly across all remaining Month/Quarter/Year levels no matter how far
// the Time drill currently reaches — same "roll up whatever isn't drilled into" behavior every
// KPI card already has via sumRootValues.
const isOriginLevelNode = (node: DrillDownNode): boolean =>
  !!node.children && node.children.length > 0 && node.children.every((child) => !child.children);

/** Sums every Origin/Plant leaf pair found anywhere under `nodes` into a nested
 * origin -> plant -> total map, ready to reshape into the treemap's `name`/`children` format. */
const aggregateByOriginAndPlant = (nodes: DrillDownNode[]): Map<string, Map<string, number>> => {
  const totals = new Map<string, Map<string, number>>();
  const walk = (level: DrillDownNode[]) => {
    for (const node of level) {
      if (isOriginLevelNode(node)) {
        const plantTotals = totals.get(node.label) ?? new Map<string, number>();
        for (const plantNode of node.children ?? []) {
          plantTotals.set(plantNode.label, (plantTotals.get(plantNode.label) ?? 0) + plantNode.value);
        }
        totals.set(node.label, plantTotals);
      } else if (node.children) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return totals;
};

const toTreemapData = (originPlantTotals: Map<string, Map<string, number>>): TreemapNode[] =>
  Array.from(originPlantTotals.entries()).map(([origin, plantTotals]) => ({
    name: origin,
    children: Array.from(plantTotals.entries()).map(([plant, value]) => ({ name: plant, value })),
  }));

export const SupplyChainTab = () => {
  const { kpis } = mockData.modules.supplyChain;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importedCoalDays = findKpi(kpis, 'imported-coal-inventory-days');
  const importedCoalQuantity = findKpi(kpis, 'imported-coal-inventory-quantity');
  const spcCost = findKpi(kpis, 'spc-cost-per-tonne');
  const inventoryTurnover = findKpi(kpis, 'inventory-turnover-ratio');

  const cardKpis = [importedCoalDays, importedCoalQuantity, spcCost, inventoryTurnover];

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

  const importedCoalDaysPath = matchingPathFor(importedCoalDays);
  const importedCoalQuantityPath = matchingPathFor(importedCoalQuantity);
  const spcCostPath = matchingPathFor(spcCost);
  const inventoryTurnoverPath = matchingPathFor(inventoryTurnover);

  const importedCoalDaysOverTime = getNodesAtPath(filteredRoot(importedCoalDays), importedCoalDaysPath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  // Composition (which Origin/Plant combinations make up the total), not a time trend — Days
  // already covers the time story for imported coal, so this treemap adds a genuinely new view
  // instead of a second "over Time" chart. Still respects the current Time drill position and
  // cross-filters, same as every other chart here — it aggregates whatever Month/Quarter/Year
  // level remains above Origin, exactly like a KPI card rolls up an undrilled aggregate.
  const importedCoalQuantityTreemap = toTreemapData(
    aggregateByOriginAndPlant(getNodesAtPath(filteredRoot(importedCoalQuantity), importedCoalQuantityPath)),
  );
  const spcCostOverTime = getNodesAtPath(filteredRoot(spcCost), spcCostPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const inventoryTurnoverByPlant = getNodesAtPath(filteredRoot(inventoryTurnover), inventoryTurnoverPath).map(
    (node) => ({ plant: node.label, value: node.value }),
  );

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const dynamicSummary = resolveAgentSummary('supplyChain', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : SUPPLY_CHAIN_INSIGHTS;
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

        <EarlyWarningStrip module="supplyChain" kpis={kpis} />

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
              title={`Imported Coal Inventory (Days) over Time${titleSuffix(importedCoalDaysPath)}`}
              data={importedCoalDaysOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Inventory (Days)' }]}
              onElementClick={handleChartClick(importedCoalDays, importedCoalDaysPath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <LazyEChartsContainer
              type="treemap"
              title={`Imported Coal Inventory (Qty) by Origin & Plant${titleSuffix(importedCoalQuantityPath)}`}
              unit="tonnes"
              data={importedCoalQuantityTreemap}
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`SPC Cost/Ton over Time${titleSuffix(spcCostPath)}`}
              data={spcCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'SPC Cost (INR)' }]}
              onElementClick={handleChartClick(spcCost, spcCostPath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Inventory Turnover Ratio by Plant${titleSuffix(inventoryTurnoverPath)}`}
              data={inventoryTurnoverByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Turnover Ratio (x)' }]}
              onElementClick={handleChartClick(inventoryTurnover, inventoryTurnoverPath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="supplyChain" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={SUPPLY_CHAIN_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default SupplyChainTab;
