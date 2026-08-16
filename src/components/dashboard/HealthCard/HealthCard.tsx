import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ReactNode } from 'react';
import { Card } from '@components/common';
import { STATUS_COLORS } from '../chartPalette';
import type { KPIStatus } from '@/types/dashboard';

export interface HealthCardProps {
  icon: ReactNode;
  label: string;
  status: KPIStatus;
  flaggedCount: number;
  totalCount: number;
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

/** A rollup status card — distinct from `KPICard`, which shows one metric's own value. This
 * shows aggregate health across several KPIs (a Plant's or a Function's), so there's no single
 * "value" to display, only a status and a flagged-count. */
export const HealthCard = ({ icon, label, status, flaggedCount, totalCount, onClick }: HealthCardProps) => {
  const color = STATUS_COLORS[status];
  const StatusIcon = STATUS_ICON[status];

  return (
    <Box
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderRadius: 3,
        ...(onClick && { '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' } }),
      }}
    >
      <Card sx={{ borderTop: `3px solid ${color}` }}>
        <Stack spacing={1.25}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
              <Typography variant="subtitle2">{label}</Typography>
            </Stack>
            <Chip
              size="small"
              icon={<StatusIcon fontSize="small" />}
              label={STATUS_LABEL[status]}
              variant="outlined"
              sx={{ color, borderColor: color, '& .MuiChip-icon': { color } }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {flaggedCount} of {totalCount} KPIs flagged
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
};
