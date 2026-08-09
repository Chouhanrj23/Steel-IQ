import { ResponsiveContainer, LineChart, Line } from 'recharts';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import type { SvgIconComponent } from '@mui/icons-material';
import { Card } from '@components/common';
import { STATUS_COLORS } from '../chartPalette';
import type { KPIStatus, KPITrend } from '@/types/dashboard';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  percentChange: number;
  trend: KPITrend;
  status: KPIStatus;
  sparklineData?: number[];
  onClick?: () => void;
}

const STATUS_ICON: Record<KPIStatus, SvgIconComponent> = {
  good: CheckCircleIcon,
  warning: WarningAmberIcon,
  critical: ErrorOutlineIcon,
};

const STATUS_LABEL: Record<KPIStatus, string> = {
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
};

const TREND_ICON: Record<KPITrend, SvgIconComponent> = {
  up: ArrowUpwardIcon,
  down: ArrowDownwardIcon,
  flat: TrendingFlatIcon,
};

export const KPICard = ({
  title,
  value,
  unit,
  percentChange,
  trend,
  status,
  sparklineData,
  onClick,
}: KPICardProps) => {
  const color = STATUS_COLORS[status];
  const StatusIcon = STATUS_ICON[status];
  const TrendIcon = TREND_ICON[trend];
  const sign = percentChange > 0 ? '+' : '';

  return (
    <Box
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
        borderRadius: 3,
        ...(onClick && {
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-1px)',
          },
        }),
      }}
    >
      <Card
        sx={{
          borderLeft: `3px solid ${color}`,
          borderTopLeftRadius: 3,
          borderBottomLeftRadius: 3,
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Chip
              size="small"
              icon={<StatusIcon fontSize="small" />}
              label={STATUS_LABEL[status]}
              variant="outlined"
              sx={{ color, borderColor: color, '& .MuiChip-icon': { color } }}
            />
          </Stack>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h4">{value}</Typography>
            {unit && (
              <Typography variant="body2" color="text.secondary">
                {unit}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <TrendIcon sx={{ fontSize: 18, color }} />
            <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
              {sign}
              {percentChange}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs previous period
            </Typography>
          </Stack>
          {sparklineData && sparklineData.length > 1 && (
            <Box sx={{ height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData.map((v, i) => ({ index: i, value: v }))}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Stack>
      </Card>
    </Box>
  );
};
