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
import { evaluateKpiSignals, type Signal } from '@/data/earlyWarningRules';
import { useDashboardStore } from '@store/dashboard';
import { STATUS_COLORS } from '../chartPalette';
import { ExceptionDetailModal } from '../ExceptionDetailModal';
import type { KPI, ModuleKey } from '@/types/dashboard';

export interface EarlyWarningStripProps {
  module: ModuleKey;
  /** The tab's full KPI list, not just the ones rendered as cards — some KPIs (geography/
   * department/category-dimensioned) have no card today, but can still trigger a signal. */
  kpis: KPI[];
}

interface WarningTileProps {
  signal: Signal;
  onViewDetails: () => void;
}

/** One signal, collapsed by default to a single-line chip-weight tile (icon + KPI name + trigger
 * type only) — click anywhere on the tile to expand it in place for the description and "View
 * Details", click again to collapse. Each tile owns its own expanded state independently, so any
 * number can be open at once — simpler than coordinating a single-open accordion, and there's no
 * reason a user comparing two warnings should be forced to close one first. */
const WarningTile = ({ signal, onViewDetails }: WarningTileProps) => {
  const [expanded, setExpanded] = useState(false);
  const SeverityIcon = signal.severity === 'critical' ? ErrorOutlineIcon : WarningAmberIcon;
  const severityColor = STATUS_COLORS[signal.severity];

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
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          px: 1.25,
          py: 0.625,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <SeverityIcon sx={{ fontSize: 16, color: severityColor, flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
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
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            ml: 1,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </ButtonBase>
      <Collapse in={expanded}>
        <Stack spacing={1} sx={{ px: 1.25, pb: 1.25, pt: 0.25 }}>
          <Typography variant="body2" color="text.secondary">
            {signal.description}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onViewDetails}
            sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
          >
            View Details
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
};

/** Compact per-tab list of currently-triggered Early Warning Signals — the same
 * `evaluateKpiSignals` call the Exceptions view uses, so the two never disagree. Collapsed by
 * default to one chip-weight tile per signal; each expands in place on click for its description
 * and "View Details" (which opens the same ExceptionDetailModal the Exceptions view uses).
 * Purely store-driven (no polling): recomputes on every render from the KPI data passed in. */
export const EarlyWarningStrip = ({ module, kpis }: EarlyWarningStripProps) => {
  const [detailSignal, setDetailSignal] = useState<Signal | null>(null);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);
  const signals = kpis.flatMap((kpi) =>
    evaluateKpiSignals(kpi, module, { threshold: thresholdOverrides, variance: varianceOverrides }),
  );

  if (signals.length === 0) return null;

  const criticalCount = signals.filter((s) => s.severity === 'critical').length;
  const warningCount = signals.length - criticalCount;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha(STATUS_COLORS.warning, 0.35),
        bgcolor: alpha(STATUS_COLORS.warning, 0.06),
        borderRadius: 2,
        px: 2,
        py: 1.25,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
        <WarningAmberIcon sx={{ fontSize: 18, color: STATUS_COLORS.warning }} />
        <Typography variant="subtitle2">
          {signals.length} Early Warning{signals.length > 1 ? 's' : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({criticalCount} critical, {warningCount} warning)
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        {signals.map((signal, index) => (
          <WarningTile
            key={`${signal.kpiId}-${signal.type}-${index}`}
            signal={signal}
            onViewDetails={() => setDetailSignal(signal)}
          />
        ))}
      </Stack>

      <ExceptionDetailModal signal={detailSignal} onClose={() => setDetailSignal(null)} />
    </Box>
  );
};
