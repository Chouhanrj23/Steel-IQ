import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card } from '@components/common';

export interface ChartCardProps {
  title?: string;
  children: ReactNode;
}

// 2 lines of subtitle1 text at its (unoverridden, inherited-default) 1.75 line-height: 1rem ×
// 1.75 × 2. Fixed in rem rather than measured per-instance so every chart's plot area starts at
// the same Y regardless of whether THIS chart's own title happens to need one line or two —
// previously a short title (1 line) and a long one (2 lines) sitting in the same Grid row pushed
// that row's charts to different starting heights, breaking alignment across the row.
const TITLE_BLOCK_HEIGHT = '3.5rem';

/** Shared outer chrome for every chart on the dashboard — both `ChartContainer` (Recharts) and
 * `EChartsContainer` (ECharts) render through this, so a Recharts bar chart and an ECharts
 * treemap sitting side by side in the same row share identical padding/border/background/corner
 * radius (the same `Card` used everywhere else in the app, not a chart-specific one-off), and
 * identical title-block height/behavior — no visual seam between the two libraries' output. A
 * title long enough to need 2 lines gets them; anything shorter is vertically centered in the
 * same reserved space rather than left top-aligned with dead space below it. */
export const ChartCard = ({ title, children }: ChartCardProps) => (
  <Card>
    {title && (
      <Box sx={{ minHeight: TITLE_BLOCK_HEIGHT, display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>
      </Box>
    )}
    {children}
  </Card>
);
