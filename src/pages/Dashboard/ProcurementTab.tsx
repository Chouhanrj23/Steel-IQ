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
import { getQuestionsForTab, resolveQuestionContext } from '@/data/conversationalQuestions';
import { resolveAgentSummary } from '@/data/agentSummaryTemplates';
import { describeOverriddenStatuses } from '@/data/earlyWarningRules';

const mockData = mockDataJson as DashboardMockData;

const PROCUREMENT_INSIGHTS = [
  'Creditors Payment Terms now run 38.4 days while Actual Spend rose to ₹18,600 Lakh, led by the Raw Materials category — Vendor On-Time Delivery improved to 88.4% even as Purchase Order Cycle Time tightened to 4.2 days.',
];

const PROCUREMENT_QUESTIONS = getQuestionsForTab('procurement');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const ProcurementTab = () => {
  const { kpis } = mockData.modules.procurement;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditorsPaymentTerms = findKpi(kpis, 'creditors-payment-terms');
  const actualSpend = findKpi(kpis, 'actual-spend');
  const vendorOnTimeDelivery = findKpi(kpis, 'vendor-on-time-delivery');
  const poCycleTime = findKpi(kpis, 'purchase-order-cycle-time');

  const cardKpis = [creditorsPaymentTerms, actualSpend, vendorOnTimeDelivery, poCycleTime];

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

  const creditorsPaymentTermsPath = matchingPathFor(creditorsPaymentTerms);
  const actualSpendPath = matchingPathFor(actualSpend);
  const vendorOnTimeDeliveryPath = matchingPathFor(vendorOnTimeDelivery);
  const poCycleTimePath = matchingPathFor(poCycleTime);

  const creditorsPaymentTermsOverTime = getNodesAtPath(
    filteredRoot(creditorsPaymentTerms),
    creditorsPaymentTermsPath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const actualSpendOverTime = getNodesAtPath(filteredRoot(actualSpend), actualSpendPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const vendorOnTimeDeliveryByPlant = getNodesAtPath(
    filteredRoot(vendorOnTimeDelivery),
    vendorOnTimeDeliveryPath,
  ).map((node) => ({ plant: node.label, value: node.value }));
  const poCycleTimeOverTime = getNodesAtPath(filteredRoot(poCycleTime), poCycleTimePath).map((node) => ({
    period: node.label,
    value: node.value,
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const dynamicSummary = resolveAgentSummary('procurement', kpis, drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : PROCUREMENT_INSIGHTS;
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

        <EarlyWarningStrip module="procurement" kpis={kpis} />

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
              title={`Creditors Payment Terms over Time${titleSuffix(creditorsPaymentTermsPath)}`}
              data={creditorsPaymentTermsOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Payment Terms (days)' }]}
              onElementClick={handleChartClick(creditorsPaymentTerms, creditorsPaymentTermsPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Actual Spend over Time${titleSuffix(actualSpendPath)}`}
              data={actualSpendOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Actual Spend (₹ Lakh)' }]}
              onElementClick={handleChartClick(actualSpend, actualSpendPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`Vendor On-Time Delivery by Plant${titleSuffix(vendorOnTimeDeliveryPath)}`}
              data={vendorOnTimeDeliveryByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'On-Time Delivery (%)' }]}
              onElementClick={handleChartClick(vendorOnTimeDelivery, vendorOnTimeDeliveryPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Purchase Order Cycle Time over Time${titleSuffix(poCycleTimePath)}`}
              data={poCycleTimeOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'PO Cycle Time (days)' }]}
              onElementClick={handleChartClick(poCycleTime, poCycleTimePath)}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="procurement" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={PROCUREMENT_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default ProcurementTab;
