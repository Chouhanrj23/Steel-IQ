import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
import { MODULE_FULL_NAMES } from './moduleTabs';

const mockData = mockDataJson as DashboardMockData;

const TSPL_INSIGHTS = [
  'SRM Expenses/Contract Cost Trend rose to ₹1,860 Lakh, driven mainly by AMC contracts, while Customer Rejections climbed to 1.8% led by the Automotive vertical — OTIF Delivery improved to 91.4% and Realization/Ton reached ₹52,400, both moving in the right direction this period.',
];

const TSPL_QUESTIONS = getQuestionsForTab('tspl');
const TSPL_FULL_NAME = MODULE_FULL_NAMES.tspl;

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const TSPLTab = () => {
  const { kpis } = mockData.modules.tspl;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees. None of TSPL's KPIs are plant-dimensioned, so the Plant hierarchy starts
  // (and stays) at full aggregate for every card — same convention as every other tab.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const srmExpenses = findKpi(kpis, 'tspl-srm-expenses-contract-cost');
  const customerRejections = findKpi(kpis, 'tspl-customer-rejections');
  const otifDelivery = findKpi(kpis, 'tspl-otif-delivery');
  const realizationPerTon = findKpi(kpis, 'tspl-realization-per-ton');

  const cardKpis = [srmExpenses, customerRejections, otifDelivery, realizationPerTon];

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

  const srmExpensesPath = matchingPathFor(srmExpenses);
  const customerRejectionsPath = matchingPathFor(customerRejections);
  const otifDeliveryPath = matchingPathFor(otifDelivery);
  const realizationPerTonPath = matchingPathFor(realizationPerTon);

  const srmExpensesOverTime = getNodesAtPath(filteredRoot(srmExpenses), srmExpensesPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const customerRejectionsOverTime = getNodesAtPath(
    filteredRoot(customerRejections),
    customerRejectionsPath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const otifDeliveryOverTime = getNodesAtPath(filteredRoot(otifDelivery), otifDeliveryPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const realizationPerTonOverTime = getNodesAtPath(
    filteredRoot(realizationPerTon),
    realizationPerTonPath,
  ).map((node) => ({ period: node.label, value: node.value }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  // The full business-unit name is display-only context, not a real drill step, so it's passed
  // separately into buildContextLabel (Agent Summary/Conversational Insights "Showing:" caption)
  // rather than inserted into `breadcrumbPath` itself — DrillDownBreadcrumb's click handler
  // below assumes index 0 of that array is always the hierarchy root, and inserting an extra
  // leading segment would shift every other segment's click target off by one.
  const contextLabel = buildContextLabel(drill, cardKpis, TSPL_FULL_NAME);
  const dynamicSummary = resolveAgentSummary('tspl', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const insights = dynamicSummary ? overrideNotes : [...TSPL_INSIGHTS, ...overrideNotes];

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Stack spacing={0.5}>
          {TSPL_FULL_NAME && (
            <Typography variant="caption" color="text.secondary">
              {TSPL_FULL_NAME}
            </Typography>
          )}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            rowGap={1}
          >
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
        </Stack>

        <EarlyWarningStrip module="tspl" kpis={kpis} />

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
              title={`SRM Expenses/Contract Cost Trend over Time${titleSuffix(srmExpensesPath)}`}
              data={srmExpensesOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'SRM Expenses (₹ Lakh)' }]}
              onElementClick={handleChartClick(srmExpenses, srmExpensesPath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Customer Rejections over Time${titleSuffix(customerRejectionsPath)}`}
              data={customerRejectionsOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Customer Rejections (%)' }]}
              onElementClick={handleChartClick(customerRejections, customerRejectionsPath)}
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`OTIF Delivery over Time${titleSuffix(otifDeliveryPath)}`}
              data={otifDeliveryOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'OTIF Delivery (%)' }]}
              onElementClick={handleChartClick(otifDelivery, otifDeliveryPath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Realization/Ton over Time${titleSuffix(realizationPerTonPath)}`}
              data={realizationPerTonOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Realization/Ton (INR)' }]}
              onElementClick={handleChartClick(realizationPerTon, realizationPerTonPath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="tspl" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} dynamicSummary={dynamicSummary} />
        <ConversationalInsightsPanel
          questionLibrary={TSPL_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default TSPLTab;
