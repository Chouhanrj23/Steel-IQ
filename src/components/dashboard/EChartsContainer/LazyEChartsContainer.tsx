import { lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { EChartsContainerProps } from './EChartsContainer';

const EChartsContainer = lazy(() =>
  import('./EChartsContainer').then((module) => ({ default: module.EChartsContainer })),
);

/** Code-split entry point for `EChartsContainer` — only the tabs that render a waterfall/
 * treemap/heatmap/bubble-matrix import this (directly, not through the shared `@components/
 * dashboard` barrel every tab already uses for ChartContainer etc.), so `echarts` only downloads
 * when a user actually opens one of those tabs rather than on every page load. */
export const LazyEChartsContainer = (props: EChartsContainerProps) => (
  <Suspense
    fallback={
      <Box
        sx={{ height: props.height ?? 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress size={28} />
      </Box>
    }
  >
    <EChartsContainer {...props} />
  </Suspense>
);

export default LazyEChartsContainer;
