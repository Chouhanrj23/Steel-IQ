import * as echarts from 'echarts/core';
import { BarChart, TreemapChart, HeatmapChart, ScatterChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  TitleComponent,
  VisualMapComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CATEGORICAL_COLORS } from '../chartPalette';

// Registers only the chart types/components EChartsContainer actually uses (waterfall runs on
// BarChart, treemap/heatmap/bubbleMatrix on their own renderers) rather than importing all of
// `echarts`, which pulls in every chart type Steel IQ doesn't use — full `echarts` adds well
// over 1 MB minified to the bundle; this tree-shaken core entry keeps the delta closer to what
// these four chart types actually cost.
echarts.use([
  BarChart,
  TreemapChart,
  HeatmapChart,
  ScatterChart,
  TooltipComponent,
  GridComponent,
  TitleComponent,
  VisualMapComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

// Registered once at module load (a side effect of importing this file) so every
// EChartsContainer instance can reference it by name via the `theme` prop, mirroring how MUI's
// theme is defined once and consumed everywhere — mirrors src/theme/palette.ts's brand teal
// primary and the CATEGORICAL_COLORS series palette already used by the Recharts side, so a
// chart doesn't visually "change library" mid-dashboard.
echarts.registerTheme('brand', {
  color: CATEGORICAL_COLORS,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, sans-serif',
  },
  title: {
    textStyle: { color: '#2A2622', fontFamily: 'Inter, sans-serif' },
  },
});

export default echarts;
