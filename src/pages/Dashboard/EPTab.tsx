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

const EP_INSIGHTS = [
  'Spend vs Plan reached ₹4,820 Cr against an annual plan of ₹5,500 Cr, with Scheme Closure improving to 68% — Capex Utilization Rate climbed to 82.4% even as Project Milestone Adherence slipped to 74.1%, pointing to a handful of plants running behind their approved schedules.',
];

const EP_QUESTIONS = getQuestionsForTab('ep');

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const EPTab = () => {
  const { kpis } = mockData.modules.ep;
  const drill = useDashboardStore((state) => state.drill);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const drillInto = useDashboardStore((state) => state.drillInto);
  const drillToHierarchyRoot = useDashboardStore((state) => state.drillToHierarchyRoot);
  const drillToSegment = useDashboardStore((state) => state.drillToSegment);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  // Reset to a clean default whenever this tab mounts (including switching back into it),
  // since the drill store is shared across tabs and another tab's path won't match this
  // tab's trees. None of E&P's KPIs are plant-dimensioned, so the Plant hierarchy starts (and
  // stays) at full aggregate for every card — same convention as every other tab.
  useEffect(() => {
    drillToHierarchyRoot('plant');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spendVsPlan = findKpi(kpis, 'ep-spend-vs-plan');
  const schemeClosure = findKpi(kpis, 'ep-scheme-closure');
  const capexUtilizationRate = findKpi(kpis, 'ep-capex-utilization-rate');
  const projectMilestoneAdherence = findKpi(kpis, 'ep-project-milestone-adherence');

  const cardKpis = [spendVsPlan, schemeClosure, capexUtilizationRate, projectMilestoneAdherence];

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

  const spendVsPlanPath = matchingPathFor(spendVsPlan);
  const schemeClosurePath = matchingPathFor(schemeClosure);
  const capexUtilizationRatePath = matchingPathFor(capexUtilizationRate);
  const projectMilestoneAdherencePath = matchingPathFor(projectMilestoneAdherence);

  const spendVsPlanOverTime = getNodesAtPath(filteredRoot(spendVsPlan), spendVsPlanPath).map((node) => ({
    period: node.label,
    value: node.value,
  }));
  const schemeClosureOverTime = getNodesAtPath(filteredRoot(schemeClosure), schemeClosurePath).map(
    (node) => ({ period: node.label, value: node.value }),
  );
  const capexUtilizationRateOverTime = getNodesAtPath(
    filteredRoot(capexUtilizationRate),
    capexUtilizationRatePath,
  ).map((node) => ({ period: node.label, value: node.value }));
  const projectMilestoneAdherenceOverTime = getNodesAtPath(
    filteredRoot(projectMilestoneAdherence),
    projectMilestoneAdherencePath,
  ).map((node) => ({ period: node.label, value: node.value }));

  const titleSuffix = (path: string[]) => (path.length ? ` — ${path.join(' / ')}` : '');

  const breadcrumbPath = [ROOT_LABEL[drill.hierarchy], ...drill.path];
  const contextLabel = buildContextLabel(drill, cardKpis);
  const dynamicSummary = resolveAgentSummary('ep', kpis, drill, crossFilters, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const questionContext = resolveQuestionContext(drill, crossFilters);
  const overrideNotes = describeOverriddenStatuses(cardKpis, { threshold: thresholdOverrides });
  const baseInsights = dynamicSummary ? [dynamicSummary] : EP_INSIGHTS;
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

        <EarlyWarningStrip module="ep" kpis={kpis} />

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
              title={`Spend vs Plan over Time${titleSuffix(spendVsPlanPath)}`}
              data={spendVsPlanOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Spend vs Plan (INR Cr)' }]}
              onElementClick={handleChartClick(spendVsPlan, spendVsPlanPath)}
              colorOffset={0}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="line"
              title={`Scheme Closure over Time${titleSuffix(schemeClosurePath)}`}
              data={schemeClosureOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Scheme Closure (%)' }]}
              onElementClick={handleChartClick(schemeClosure, schemeClosurePath)}
              colorOffset={1}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="area"
              title={`Capex Utilization Rate over Time${titleSuffix(capexUtilizationRatePath)}`}
              data={capexUtilizationRateOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Capex Utilization Rate (%)' }]}
              onElementClick={handleChartClick(capexUtilizationRate, capexUtilizationRatePath)}
              colorOffset={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartContainer
              type="bar"
              title={`Project Milestone Adherence over Time${titleSuffix(projectMilestoneAdherencePath)}`}
              data={projectMilestoneAdherenceOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Milestone Adherence (%)' }]}
              onElementClick={handleChartClick(projectMilestoneAdherence, projectMilestoneAdherencePath)}
              colorOffset={3}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <ConfigurationPanel module="ep" kpis={kpis} />
        <AgentSummaryPanel insights={insights} contextLabel={contextLabel} />
        <ConversationalInsightsPanel
          questionLibrary={EP_QUESTIONS}
          context={questionContext}
          contextLabel={contextLabel}
        />
      </Stack>
    </Stack>
  );
};

export default EPTab;
