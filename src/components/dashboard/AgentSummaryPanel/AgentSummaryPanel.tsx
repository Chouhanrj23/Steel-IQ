import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SvgIconComponent } from '@mui/icons-material';
import { Card } from '@components/common';
import { ChartContainer } from '../ChartContainer';
// Imported directly (not via the '@components/dashboard' barrel) so `echarts` only ends up in the
// chunk a user downloads when they actually open a tab whose Agent Summary renders a Sunburst —
// same code-splitting convention every other EChartsContainer consumer already follows.
import { LazyEChartsContainer } from '../EChartsContainer';
import { STATUS_COLORS } from '../chartPalette';
import { ScenarioNarrativeSections, SectionLabel } from '../ScenarioNarrativeSections';
import type { MatchedBusinessScenario } from '@/data/businessScenarios';
import type { HierarchyVisualData } from '@/data/agentSummaryVisuals';
import type { AgentSummaryResult } from '@/data/agentSummaryTemplates';
import type { KPIStatus } from '@/types/dashboard';

export interface AgentSummaryPanelProps {
  insights: string[];
  contextLabel?: string;
  /** The per-KPI template narrative from `resolveAgentSummary` — rendered as a labeled Insight /
   * Recommended Action block, distinct from the plain `insights` text below it, so the action is
   * never left for the reader to notice buried inside a paragraph. `null`/omitted falls back to
   * whatever plain string the tab put in `insights` instead (its static baseline sentence, for the
   * rare case a tab genuinely has no template/KPI to narrate). */
  dynamicSummary?: AgentSummaryResult | null;
  /** Matched business scenarios (Insight / Why / Business Impact / Recommended Actions) for the
   * current module's live KPI values — rendered as a structured, actionable card above the plain
   * `insights` text, per the reusable scenario engine in `@/data/businessScenarios`. Omitted or
   * empty on modules with no scenario group configured, or when the live KPI values don't
   * currently land in any of a configured group's four quadrants (including a group that's
   * defined but inactive because its required KPI doesn't exist yet — see
   * `IRON_ORE_PRODUCTION_KPI_ID`) — in every one of those cases `insights` below continues to
   * carry the summary exactly as it did before this existed, so nothing regresses on tabs or
   * moments without scenario coverage. */
  scenarios?: MatchedBusinessScenario[];
  /** A Sunburst of one KPI's real business sub-hierarchy for the current period, plus a matching
   * Contribution bar chart of that same sub-hierarchy's immediate level — computed by the tab via
   * `buildHierarchyVisualData` (`@/data/agentSummaryVisuals`) so this panel stays a thin renderer,
   * never owning chart-config logic itself. The existing "over Time" chart in the tab's own main
   * chart grid is untouched; these are additional, complementary visuals. `null`/omitted when the
   * KPI isn't time-dimensioned or the current period nets to no real business breakdown — the
   * panel simply omits this section rather than rendering an empty chart shell. */
  hierarchyVisual?: HierarchyVisualData | null;
}

// Local rather than imported from KPICard — same convention ExceptionDetailModal already uses for
// its own severity icon (re-deriving a small icon-per-status map at the call site rather than
// reaching into another component's private constants).
const STATUS_ICON: Record<KPIStatus, SvgIconComponent> = {
  good: CheckCircleIcon,
  warning: WarningAmberIcon,
  critical: ErrorOutlineIcon,
};

const STATUS_RANK: Record<KPIStatus, number> = { good: 0, warning: 1, critical: 2 };

/** The more severe of a scenario's two driving KPIs' own authored statuses — used purely to color
 * and iconify the scenario card consistently with how that severity already reads everywhere else
 * in the app (KPICard's border/chip, Early Warning Signals), not a new severity concept. */
const worseStatus = (a: KPIStatus, b: KPIStatus): KPIStatus => (STATUS_RANK[a] >= STATUS_RANK[b] ? a : b);

const ScenarioCard = ({ match }: { match: MatchedBusinessScenario }) => {
  const { scenario, narrative, primaryKpi, secondaryKpi } = match;
  const severity = worseStatus(primaryKpi.status, secondaryKpi.status);
  const color = STATUS_COLORS[severity];
  const SeverityIcon = STATUS_ICON[severity];

  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 1.5,
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        borderLeft: 3,
        borderLeftColor: color,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={0.5}>
          <Chip
            size="small"
            icon={<SeverityIcon fontSize="small" />}
            label={scenario.name}
            variant="outlined"
            sx={{ color, borderColor: color, fontWeight: 600, '& .MuiChip-icon': { color } }}
          />
          <Typography variant="caption" color="text.secondary">
            {primaryKpi.name} &amp; {secondaryKpi.name}
          </Typography>
        </Stack>

        <ScenarioNarrativeSections scenario={scenario} narrative={narrative} />
      </Stack>
    </Box>
  );
};

export const AgentSummaryPanel = ({
  insights,
  contextLabel,
  scenarios = [],
  dynamicSummary,
  hierarchyVisual,
}: AgentSummaryPanelProps) => {
  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'secondary.contrastText' }} fontSize="small" />
          </Box>
          <Typography variant="h6">Agent Summary</Typography>
        </Stack>
        {contextLabel && (
          <Typography variant="caption" color="text.secondary">
            Showing: {contextLabel}
          </Typography>
        )}

        {scenarios.length > 0 && (
          <Stack spacing={1.5}>
            {scenarios.map((match) => (
              <ScenarioCard key={`${match.group.id}-${match.scenario.id}`} match={match} />
            ))}
          </Stack>
        )}

        {dynamicSummary && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Stack spacing={1.25}>
              <Box>
                <SectionLabel>Insight</SectionLabel>
                <Typography variant="body2">{dynamicSummary.insight}</Typography>
              </Box>
              <Box>
                <SectionLabel color="primary.main">Recommended Action</SectionLabel>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dynamicSummary.recommendedAction}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Stack spacing={1.5}>
          {insights.map((insight, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2">{insight}</Typography>
            </Box>
          ))}
        </Stack>

        {hierarchyVisual && (
          <Stack spacing={1.5}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Business Hierarchy — {hierarchyVisual.periodLabel}
            </Typography>
            <LazyEChartsContainer
              type="sunburst"
              title={`${hierarchyVisual.kpiName} by ${hierarchyVisual.levelLabel}`}
              unit={hierarchyVisual.unit}
              data={hierarchyVisual.sunburst}
              height={300}
            />
            <ChartContainer
              type="bar"
              title={`Contribution by ${hierarchyVisual.levelLabel}`}
              data={hierarchyVisual.contribution.map((slice) => ({
                segment: slice.name,
                value: slice.value,
              }))}
              categoryKey="segment"
              series={[{ key: 'value', label: hierarchyVisual.kpiName }]}
              height={220}
            />
          </Stack>
        )}
      </Stack>
    </Card>
  );
};
