import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button } from '@components/common';
import { ScenarioNarrativeSections } from '../ScenarioNarrativeSections';
import type { Signal } from '@/data/earlyWarningRules';
import type { MatchedBusinessScenario } from '@/data/businessScenarios';
import type { KPI } from '@/types/dashboard';
import { STATUS_COLORS } from '../chartPalette';

export interface WarningAccordionItemProps {
  signal: Signal;
  /** The signal's own KPI, when the caller has it on hand — supplies the KPI/current/target
   * context line in the expanded view. Left undefined (never fabricated) when unavailable. */
  kpi?: KPI;
  /** The matched business scenario this signal's KPI participates in, if any (see
   * `findScenarioForKpi` in `@/data/businessScenarios`) — supplies the richer Insight / Why /
   * Business Impact / Recommended Actions content. `null` falls back to the signal's own
   * `description`, exactly how this surface behaved before the scenario engine existed. */
  scenario: MatchedBusinessScenario | null;
  onViewDetails: () => void;
  /** Whether this item starts expanded. Defaults to collapsed, same as before — every warning
   * still renders regardless, this only affects its initial open/closed state. */
  defaultExpanded?: boolean;
}

/**
 * One warning, collapsed by default to a compact header row (severity icon, KPI name, trigger-
 * type chip, one-line summary) — click or keyboard-activate to expand in place for the full
 * detail, click again to collapse. Each item owns its own expanded state independently, so any
 * number can be open at once and every warning always stays in the list — there is no truncation
 * here or in either caller (EarlyWarningStrip, ExceptionsTab): all signals passed in are rendered,
 * whether there are 2 or 20.
 */
export const WarningAccordionItem = ({
  signal,
  kpi,
  scenario,
  onViewDetails,
  defaultExpanded = false,
}: WarningAccordionItemProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const SeverityIcon = signal.severity === 'critical' ? ErrorOutlineIcon : WarningAmberIcon;
  const severityColor = STATUS_COLORS[signal.severity];
  const domId = `${signal.kpiId}-${signal.type}`.replace(/\s+/g, '-');
  const headerId = `warning-header-${domId}`;
  const panelId = `warning-panel-${domId}`;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha(severityColor, 0.35),
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      <ButtonBase
        id={headerId}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={panelId}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          px: 1.5,
          py: 1,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <SeverityIcon sx={{ fontSize: 18, color: severityColor, flexShrink: 0, mt: 0.25 }} />
          <Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {signal.kpiName}
              </Typography>
              <Chip
                size="small"
                label={signal.type}
                variant="outlined"
                sx={{
                  color: severityColor,
                  borderColor: severityColor,
                  height: 20,
                  flexShrink: 0,
                  '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                }}
              />
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {signal.message}
            </Typography>
          </Stack>
        </Stack>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            ml: 1,
            mt: 0.25,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </ButtonBase>
      <Collapse in={expanded}>
        <Box role="region" id={panelId} aria-labelledby={headerId}>
          <Stack spacing={1.25} sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>
            {scenario ? (
              <ScenarioNarrativeSections scenario={scenario.scenario} narrative={scenario.narrative} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {signal.description}
              </Typography>
            )}
            {kpi && (
              <Typography variant="caption" color="text.secondary">
                {kpi.name}: current {kpi.current} {kpi.unit} vs target {kpi.target} {kpi.unit}
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={onViewDetails}
              sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
            >
              View Details
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
