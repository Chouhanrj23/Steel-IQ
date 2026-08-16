import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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

/** Compact per-tab list of currently-triggered Early Warning Signals — the same
 * `evaluateKpiSignals` call the Exceptions view uses, so the two never disagree. Each signal
 * renders as an Alert (KPI + trigger type) → Description → CTA row; the CTA opens the same
 * ExceptionDetailModal the Exceptions view uses. Purely store-driven (no polling): recomputes on
 * every render from the KPI data passed in. */
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
      <Stack divider={<Divider sx={{ borderColor: alpha(STATUS_COLORS.warning, 0.2) }} />} spacing={1}>
        {signals.map((signal, index) => {
          const SeverityIcon = signal.severity === 'critical' ? ErrorOutlineIcon : WarningAmberIcon;
          const severityColor = STATUS_COLORS[signal.severity];
          return (
            <Stack
              key={`${signal.kpiId}-${signal.type}-${index}`}
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
              sx={{ pt: index === 0 ? 0 : 1 }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <SeverityIcon sx={{ fontSize: 18, color: severityColor, mt: 0.25, flexShrink: 0 }} />
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.5}>
                    <Typography variant="subtitle2">{signal.kpiName}</Typography>
                    <Chip
                      size="small"
                      label={signal.type}
                      variant="outlined"
                      sx={{ color: severityColor, borderColor: severityColor, bgcolor: 'background.paper' }}
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {signal.description}
                  </Typography>
                </Stack>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDetailSignal(signal)}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                View Details
              </Button>
            </Stack>
          );
        })}
      </Stack>

      <ExceptionDetailModal signal={detailSignal} onClose={() => setDetailSignal(null)} />
    </Box>
  );
};
