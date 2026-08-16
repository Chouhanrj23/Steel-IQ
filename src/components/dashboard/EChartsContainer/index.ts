// The eager `EChartsContainer` component itself is deliberately NOT re-exported here — doing so
// would create a static import path alongside LazyEChartsContainer's dynamic one, and Vite
// collapses a module back into the main chunk the moment both exist (confirmed by its own
// INEFFECTIVE_DYNAMIC_IMPORT build warning). Import `EChartsContainer` directly from
// './EChartsContainer' only if you specifically need the non-code-split version (e.g. a test).
export type {
  EChartsContainerProps,
  EChartType,
  WaterfallItem,
  TreemapNode,
  HeatmapCell,
  BubblePoint,
} from './EChartsContainer';
export { LazyEChartsContainer } from './LazyEChartsContainer';
