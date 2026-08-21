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

const MARKETING_FINANCE_INSIGHTS = [
  'Factoring & Collection Trend reached ₹6,240 Lakh, led by Key Account Customers in the Automotive vertical, while Interest on Overdue rose to ₹184 Lakh — Conversion Cost Trend edged up to ₹8,450, even as Net Profit grew to ₹268 Cr.',
];

const MARKETING_FINANCE_QUESTIONS = getQuestionsForTab('marketingFinance');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const MarketingFinanceTab = () => {
  const { kpis } = mockData.modules.marketingFinance;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees. None of this module's KPIs are plant-dimensioned, so the Plant hierarchy
  // starts (and stays) at full aggregate for every card — same convention as every other tab.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const factoringCollection = findKpi(kpis, 'mf-factoring-collection-trend');
  const interestOnOverdue = findKpi(kpis, 'mf-interest-on-overdue');
  const conversionCost = findKpi(kpis, 'mf-conversion-cost-trend');
  const netProfit = findKpi(kpis, 'net-profit');

  const cardKpis = [factoringCollection, interestOnOverdue, conversionCost, netProfit];

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

  const factoringCollectionPath = matchingPathFor(factoringCollection);
  const interestOnOverduePath = matchingPathFor(interestOnOverdue);
  const conversionCostPath = matchingPathFor(conversionCost);
  const netProfitPath = matchingPathFor(netProfit);

  const factoringCollectionOverTime = getNodesAtPath(
    filteredRoot(factoringCollection),
    factoringCollectionPath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const interestOnOverdueOverTime = getNodesAtPath(
    filteredRoot(interestOnOverdue),
    interestOnOverduePath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const conversionCostOverTime = getNodesAtPath(filteredRoot(conversionCost), conversionCostPath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const netProfitOverTime = getNodesAtPath(filteredRoot(netProfit), netProfitPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const dynamicSummary = resolveAgentSummary('marketingFinance', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const insights = dynamicSummary ? overrideNotes : [...MARKETING_FINANCE_INSIGHTS, ...overrideNotes];

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

        <EarlyWarningStrip module="marketingFinance" kpis={kpis} />

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
              title={`Factoring & Collection Trend over Time${titleSuffix(factoringCollectionPath)}`}
              data={factoringCollectionOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Collections (₹ Lakh)' }]}
              onElementClick={handleChartClick(factoringCollection, factoringCollectionPath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Interest on Overdue over Time${titleSuffix(interestOnOverduePath)}`}
              data={interestOnOverdueOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Interest (₹ Lakh)' }]}
              onElementClick={handleChartClick(interestOnOverdue, interestOnOverduePath)}
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`Conversion Cost Trend over Time${titleSuffix(conversionCostPath)}`}
              data={conversionCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Conversion Cost (INR)' }]}
              onElementClick={handleChartClick(conversionCost, conversionCostPath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Net Profit over Time${titleSuffix(netProfitPath)}`}
              data={netProfitOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Net Profit (INR Cr)' }]}
              onElementClick={handleChartClick(netProfit, netProfitPath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="marketingFinance" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} dynamicSummary={dynamicSummary} />
        <ConversationalInsightsPanel
          questionLibrary={MARKETING_FINANCE_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default MarketingFinanceTab;
