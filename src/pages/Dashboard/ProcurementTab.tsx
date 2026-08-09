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

const PROCUREMENT_INSIGHTS = [
  'Creditors payment terms extended to 38.4 days while actual spend rose 10.1% to ₹18,600 Lakh — the increase was driven far more by Capex (up ~26% on Machinery & Equipment and Plant Expansion) than by Opex (up ~2%), even as vendor on-time delivery improved to 88.4%.',
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

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditorsPaymentTerms = findKpi(kpis, 'creditors-payment-terms');
  const creditorsPaymentTermsByVendor = findKpi(kpis, 'creditors-payment-terms-by-vendor');
  const actualSpend = findKpi(kpis, 'actual-spend');
  const actualSpendByCapexOpex = findKpi(kpis, 'actual-spend-by-capex-opex');
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
  // Both "by vendor category" and "by Capex/Opex" are category-dimensioned; the hierarchy
  // toggle only offers time/plant, so drill.hierarchy can never equal 'category' and these are
  // always []. Kept explicit (rather than hardcoding the breakdowns off the raw root) so the
  // "always full aggregate" behavior is a direct consequence of the same matching logic every
  // other KPI uses.
  const creditorsPaymentTermsByVendorPath = matchingPathFor(creditorsPaymentTermsByVendor);
  const actualSpendByCapexOpexPath = matchingPathFor(actualSpendByCapexOpex);

  const creditorsPaymentTermsByPlant = getNodesAtPath(
    filteredRoot(creditorsPaymentTerms),
    creditorsPaymentTermsPath,
  ).map((node) => ({
    plant: node.label,
    value: node.value,
  }));
  const creditorsPaymentTermsByVendorCategory = getNodesAtPath(
    filteredRoot(creditorsPaymentTermsByVendor),
    creditorsPaymentTermsByVendorPath,
  ).map((node) => ({
    category: node.label,
    value: node.value,
  }));
  const actualSpendOverTime = getNodesAtPath(filteredRoot(actualSpend), actualSpendPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const actualSpendByCapexOpexBreakdown = getNodesAtPath(
    filteredRoot(actualSpendByCapexOpex),
    actualSpendByCapexOpexPath,
  ).map((node) => ({
    category: node.label,
    value: node.value,
  }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = breadcrumbPath.join(' / ');
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const dynamicSummary = resolveAgentSummary('procurement', kpis, drill, crossFilters);

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
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Creditors Payment Terms by Plant${titleSuffix(creditorsPaymentTermsPath)}`}
              data={creditorsPaymentTermsByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Payment Terms (days)' }]}
              onElementClick={handleChartClick(creditorsPaymentTerms, creditorsPaymentTermsPath)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="donut"
              title="Creditors Payment Terms by Vendor Category"
              data={creditorsPaymentTermsByVendorCategory}
              categoryKey="category"
              series={[{ key: 'value', label: 'Payment Terms (days)' }]}
              // No onElementClick: vendor category isn't part of the Time/Plant toggle, so this
              // chart is intentionally non-interactive and always shows the full aggregate.
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
              type="donut"
              title="Actual Spend by Capex/Opex"
              data={actualSpendByCapexOpexBreakdown}
              categoryKey="category"
              series={[{ key: 'value', label: 'Actual Spend (₹ Lakh)' }]}
              // No onElementClick: Capex/Opex isn't part of the Time/Plant toggle, so this
              // chart is intentionally non-interactive and always shows the full aggregate.
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel
          insights={dynamicSummary ? [dynamicSummary] : PROCUREMENT_INSIGHTS}
          contextLabel={contextLabel}
        />
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
