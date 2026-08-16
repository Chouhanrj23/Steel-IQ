import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { KPIHistoryPoint } from '@/types/dashboard';
import { VARIANCE_COLORS, AGEING_COLORS } from '../chartPalette';

const LENS_HEIGHT = 56;

export interface TrendLensBodyProps {
  history: KPIHistoryPoint[];
  color: string;
}

/** Gradient-filled sparkline over the KPI's trailing history — no axes/legend, matching the
 * precedent KPICard's original bare-line sparkline already set for compact card-embedded charts
 * (ChartContainer always renders axes/legend and has no minimum-height guard, so it doesn't fit
 * here), upgraded to the same fade-to-transparent area treatment as the tab-level charts so a
 * card's own sparkline doesn't look like a different, plainer chart library. */
export const TrendLensBody = ({ history, color }: TrendLensBodyProps) => {
  const gradientId = useId();
  return (
    <Box sx={{ height: LENS_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export interface VarianceLensBodyProps {
  current: number;
  target: number;
  unit: string;
  /** The KPI's status color — tints the "Actual" bar so the Variance lens reads as an extension
   * of the card's own status, not a generic grey-and-blue widget. */
  color: string;
}

const formatValue = (value: number, unit: string) => (unit === '%' ? `${value}%` : `${value} ${unit}`);

/** Actual vs Target as two proportional bars — hand-rolled rather than a Recharts horizontal
 * bar chart, since a two-row comparison doesn't need axes/tooltip/legend machinery. */
export const VarianceLensBody = ({ current, target, unit, color }: VarianceLensBodyProps) => {
  const max = Math.max(Math.abs(current), Math.abs(target), 1) * 1.1;
  const rows: { label: string; value: number; color: string }[] = [
    { label: 'Actual', value: current, color },
    { label: 'Target', value: target, color: VARIANCE_COLORS.target },
  ];
  return (
    <Stack spacing={0.5} sx={{ height: LENS_HEIGHT, justifyContent: 'center' }}>
      {rows.map((row) => (
        <Stack key={row.label} direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary" sx={{ width: 40, flexShrink: 0 }}>
            {row.label}
          </Typography>
          <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${Math.min((Math.abs(row.value) / max) * 100, 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${row.color} 0%, ${row.color}CC 100%)`,
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ width: 64, flexShrink: 0, textAlign: 'right' }}>
            {formatValue(row.value, unit)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

export interface AgeingLensBodyProps {
  breakdown: Record<string, number>;
  unit: string;
}

/** Stacked proportion bar over the two age buckets, summed from the KPI's own drilldown tree
 * (via `getAgeingBreakdown`/`sumByLabelSet`) rather than new mock data. */
export const AgeingLensBody = ({ breakdown, unit }: AgeingLensBodyProps) => {
  const entries = Object.entries(breakdown) as [keyof typeof AGEING_COLORS, number][];
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return (
    <Stack spacing={0.75} sx={{ height: LENS_HEIGHT, justifyContent: 'center' }}>
      <Stack direction="row" sx={{ height: 10, borderRadius: 5, overflow: 'hidden' }}>
        {entries.map(([bucket, value]) => (
          <Box
            key={bucket}
            sx={{
              width: `${(value / total) * 100}%`,
              background: `linear-gradient(90deg, ${AGEING_COLORS[bucket]} 0%, ${AGEING_COLORS[bucket]}CC 100%)`,
              transition: 'width 0.3s ease',
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        {entries.map(([bucket, value]) => (
          <Stack key={bucket} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: AGEING_COLORS[bucket] }} />
            <Typography variant="caption" color="text.secondary">
              {bucket}: {formatValue(value, unit)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
