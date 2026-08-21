import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData } from '@/types/dashboard';
import { evaluateAllSignals, type Signal } from '@/data/earlyWarningRules';
import { matchBusinessScenariosForModule, findScenarioForKpi } from '@/data/businessScenarios';
import { useDashboardStore } from '@store/dashboard';
import { STATUS_COLORS } from '@components/dashboard/chartPalette';
import { VERTICAL_THEME, isPreviewModule } from '@components/dashboard/verticalTheme';
import { ExceptionDetailModal } from '@components/dashboard/ExceptionDetailModal';
import { WarningAccordionItem } from '@components/dashboard/WarningAccordionItem';
import { Card, EmptyState } from '@components/common';
import { MODULE_TAB_ORDER, MODULE_LABELS, MODULE_FULL_NAMES } from './moduleTabs';

const mockData = mockDataJson as DashboardMockData;

interface SummaryStatProps {
  label: string;
  value: number;
  color?: string;
}

const SummaryStat = ({ label, value, color }: SummaryStatProps) => (
  <Card sx={{ flex: 1 }}>
    <Typography variant="h4" sx={{ color }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Card>
);

export const ExceptionsTab = () => {
  const [detailSignal, setDetailSignal] = useState<Signal | null>(null);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);

  const signals = evaluateAllSignals(mockData.modules, {
    threshold: thresholdOverrides,
    variance: varianceOverrides,
  });
  const criticalCount = signals.filter((s) => s.severity === 'critical').length;
  const warningCount = signals.length - criticalCount;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5">Exceptions</Typography>
        <Typography variant="body2" color="text.secondary">
          Every KPI currently in a triggered state, across all nine modules — sourced from the same Early
          Warning Signals engine driving each tab&apos;s strip, so the counts always agree.
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <SummaryStat label="Total exceptions" value={signals.length} />
        <SummaryStat label="Critical" value={criticalCount} color={STATUS_COLORS.critical} />
        <SummaryStat label="Warning" value={warningCount} color={STATUS_COLORS.warning} />
      </Stack>

      <Stack spacing={2}>
        {MODULE_TAB_ORDER.map((module) => {
          const moduleSignals = signals.filter((s) => s.module === module);
          const moduleKpis = mockData.modules[module].kpis;
          const moduleScenarios = matchBusinessScenariosForModule(module, moduleKpis);
          const fullName = MODULE_FULL_NAMES[module];
          const { icon: ModuleIcon, accent } = VERTICAL_THEME[module];
          const accented = isPreviewModule(module);
          return (
            <Card
              key={module}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <ModuleIcon fontSize="small" sx={{ color: accented ? accent : 'text.secondary' }} />
                      <Typography variant="subtitle1">{MODULE_LABELS[module]}</Typography>
                    </Stack>
                    {fullName && (
                      <Typography variant="caption" color="text.secondary">
                        {fullName}
                      </Typography>
                    )}
                  </Stack>
                  <Chip size="small" label={moduleSignals.length} />
                </Stack>
              }
            >
              {moduleSignals.length === 0 ? (
                <EmptyState
                  icon={<CheckCircleOutlineIcon sx={{ fontSize: 48, color: STATUS_COLORS.good }} />}
                  title="No exceptions"
                  description="Every KPI in this module is within its expected range."
                />
              ) : (
                <Stack spacing={1}>
                  {moduleSignals.map((signal, index) => {
                    const kpi = moduleKpis.find((k) => k.id === signal.kpiId);
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
              )}
            </Card>
          );
        })}
      </Stack>

      <ExceptionDetailModal signal={detailSignal} onClose={() => setDetailSignal(null)} />
    </Stack>
  );
};

export default ExceptionsTab;
