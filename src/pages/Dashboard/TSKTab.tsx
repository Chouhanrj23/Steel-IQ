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

const TSK_INSIGHTS = [
  'Other Receivables & Recovery Projections rose to ₹3,120 Lakh, led by Trade Receivables ageing into the 31+ Days bucket — TSK Production Volume grew to 54,200 tonnes and Cost Efficiency Index improved to 96.2, while our Realization/Ton continues to run ahead of the tracked competitor set.',
];

const TSK_QUESTIONS = getQuestionsForTab('tsk');
const TSK_FULL_NAME = MODULE_FULL_NAMES.tsk;

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const TSKTab = () => {
  const { kpis } = mockData.modules.tsk;
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

  const otherReceivables = findKpi(kpis, 'tsk-other-receivables-recovery');
  const competitorComparison = findKpi(kpis, 'tsk-competitor-comparison');
  const productionVolume = findKpi(kpis, 'tsk-production-volume');
  const costEfficiencyIndex = findKpi(kpis, 'tsk-cost-efficiency-index');

  const cardKpis = [otherReceivables, competitorComparison, productionVolume, costEfficiencyIndex];

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

  const otherReceivablesPath = matchingPathFor(otherReceivables);
  const productionVolumePath = matchingPathFor(productionVolume);
  const costEfficiencyIndexPath = matchingPathFor(costEfficiencyIndex);
  // Competitor Comparison is category-dimensioned; the hierarchy toggle only offers time/plant,
  // so drill.hierarchy can never equal 'category' and this is always []. Kept explicit (rather
  // than hardcoding the chart off the raw root) so the "always full aggregate" behavior is a
  // direct consequence of the same matching logic every other KPI uses.
  const competitorComparisonPath = matchingPathFor(competitorComparison);

  const otherReceivablesOverTime = getNodesAtPath(filteredRoot(otherReceivables), otherReceivablesPath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const competitorComparisonByCompany = getNodesAtPath(
    filteredRoot(competitorComparison),
    competitorComparisonPath,
  ).map((node) => ({ company: node.label, value: node.value }));
  const productionVolumeOverTime = getNodesAtPath(filteredRoot(productionVolume), productionVolumePath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const costEfficiencyIndexOverTime = getNodesAtPath(
    filteredRoot(costEfficiencyIndex),
    costEfficiencyIndexPath,
  ).map((node) => ({ period: node.label, value: node.value }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  // The full business-unit name is display-only context, not a real drill step, so it's passed
  // separately into buildContextLabel (Agent Summary/Conversational Insights "Showing:" caption)
  // rather than inserted into `breadcrumbPath` itself — DrillDownBreadcrumb's click handler
  // below assumes index 0 of that array is always the hierarchy root, and inserting an extra
  // leading segment would shift every other segment's click target off by one.
  const contextLabel = buildContextLabel(drill, cardKpis, TSK_FULL_NAME);
  const dynamicSummary = resolveAgentSummary('tsk', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : TSK_INSIGHTS;
  const insights = overrideNotes.length > 0 ? [...baseInsights, ...overrideNotes] : baseInsights;

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Stack spacing={0.5}>
          {TSK_FULL_NAME && (
            <Typography variant="caption" color="text.secondary">
              {TSK_FULL_NAME}
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
              value={drill.hierarchy === 'category' ? null : drill.hierarchy}
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

        <EarlyWarningStrip module="tsk" kpis={kpis} />

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
              title={`Other Receivables & Recovery Projections over Time${titleSuffix(otherReceivablesPath)}`}
              data={otherReceivablesOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Receivables (₹ Lakh)' }]}
              onElementClick={handleChartClick(otherReceivables, otherReceivablesPath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="donut"
              title="Competitor Comparison by Company"
              data={competitorComparisonByCompany}
              categoryKey="company"
              series={[{ key: 'value', label: 'Realization / Cost (INR)' }]}
              // No onElementClick: company isn't part of the Time/Plant toggle, so this chart is
              // intentionally non-interactive and always shows the full aggregate.
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`TSK Production Volume over Time${titleSuffix(productionVolumePath)}`}
              data={productionVolumeOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Production Volume (tonnes)' }]}
              onElementClick={handleChartClick(productionVolume, productionVolumePath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`TSK Cost Efficiency Index over Time${titleSuffix(costEfficiencyIndexPath)}`}
              data={costEfficiencyIndexOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost Efficiency Index' }]}
              onElementClick={handleChartClick(costEfficiencyIndex, costEfficiencyIndexPath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="tsk" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={TSK_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default TSKTab;
