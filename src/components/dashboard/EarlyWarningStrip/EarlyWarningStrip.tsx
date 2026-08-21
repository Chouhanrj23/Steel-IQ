import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { evaluateKpiSignals, type Signal } from '@/data/earlyWarningRules';
import { matchBusinessScenariosForModule, findScenarioForKpi } from '@/data/businessScenarios';
import { useDashboardStore } from '@store/dashboard';
import { STATUS_COLORS } from '../chartPalette';
import { ExceptionDetailModal } from '../ExceptionDetailModal';
import { WarningAccordionItem } from '../WarningAccordionItem';
import type { KPI, ModuleKey } from '@/types/dashboard';

export interface EarlyWarningStripProps {
  module: ModuleKey;
  /** The tab's full KPI list, not just the ones rendered as cards — some KPIs (geography/
   * department/category-dimensioned) have no card today, but can still trigger a signal. */
  kpis: KPI[];
}

// Bounds the list's own height so a tab with many simultaneous warnings doesn't push its KPI
// cards and charts far down the page — every warning still renders inside this box (never
// truncated), it just scrolls internally once there are enough to exceed this height. A tab with
// only 2-3 warnings never shows a scrollbar at all, since the box only grows to fit its content
// up to this cap.
const LIST_MAX_HEIGHT = 420;

/** Compact per-tab list of currently-triggered Early Warning Signals — the same
 * `evaluateKpiSignals` call the Exceptions view uses, so the two never disagree. Every signal
 * renders as its own expandable/collapsible row (`WarningAccordionItem`), collapsed by default;
 * expanding one shows the matched business scenario's full Insight/Why/Business-Impact/
 * Recommended-Actions narrative when its KPI participates in one, else falls back to the signal's
 * own description exactly as before scenarios existed. Purely store-driven (no polling):
 * recomputes on every render from the KPI data passed in. */
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
  const moduleScenarios = matchBusinessScenariosForModule(module, kpis);

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
      <Stack spacing={0.75} sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto', pr: 0.5 }}>
        {signals.map((signal, index) => {
          const kpi = kpis.find((k) => k.id === signal.kpiId);
          const scenario = findScenarioForKpi(signal.kpiId, moduleScenarios);
          return (
            <WarningAccordionItem
              key={`${signal.kpiId}-${signal.type}-${index}`}
              signal={signal}
              kpi={kpi}
              scenario={scenario}
              onViewDetails={() => setDetailSignal(signal)}
            />
          );
        })}
      </Stack>

      <ExceptionDetailModal signal={detailSignal} onClose={() => setDetailSignal(null)} />
    </Box>
  );
};
