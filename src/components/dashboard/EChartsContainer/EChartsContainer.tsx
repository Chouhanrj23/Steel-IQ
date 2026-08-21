import type { ComponentType } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import * as ReactEChartsCoreModule from 'echarts-for-react/lib/core';
import type { EChartsOption, EChartsReactProps } from 'echarts-for-react/lib/types';
import echarts from './echartsCore';
import {
  STATUS_COLORS,
  CHART_CHROME,
  CATEGORICAL_COLORS,
  BRAND_PRIMARY,
  BRAND_PRIMARY_LIGHT,
} from '../chartPalette';
import { ChartCard } from '../ChartCard';

// `echarts-for-react/lib/core` is a CJS module with no package `exports` map for its subpaths,
// and Vite's dev-time CJS interop doesn't reliably unwrap a deep subpath import's `default`
// export onto the import binding itself (unlike the package's main entry) — so it's read off
// the namespace import defensively rather than trusting `import Foo from '...'` to unwrap it.
// Vite's dev-time CJS interop wraps this particular subpath's `default` more than once (one
// wrapping to reach the real component class was not enough — it comes out as
// `{ default: { default: TheClass, __esModule: true } }`), so the export is unwrapped in a loop
// until it stops being a plain `{ default, __esModule }` wrapper, rather than hardcoding a
// specific number of `.default` hops that could silently break on a future Vite/library version.
const unwrapDefault = (mod: unknown): unknown => {
  let current = mod;
  while (current && typeof current === 'object' && 'default' in current) {
    current = (current as { default: unknown }).default;
  }
  return current;
};

const ReactEChartsCore = unwrapDefault(ReactEChartsCoreModule) as ComponentType<EChartsReactProps>;

export type EChartType = 'waterfall' | 'treemap' | 'heatmap' | 'bubbleMatrix' | 'sunburst';

export interface WaterfallItem {
  label: string;
  /** A delta for a normal step; the literal running total when `isTotal` is set (the bridge's
   * start/end anchor bars). */
  value: number;
  isTotal?: boolean;
}

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
}

/** Same shape as `TreemapNode` (a Sunburst and a Treemap are both "hierarchical value" charts in
 * ECharts, taking identical `{name, value, children}` data) — kept as its own named type rather
 * than reusing `TreemapNode` directly so a caller's intent (which chart this data is for) stays
 * clear at the call site, and so the two can diverge later without a shared-type refactor. */
export interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface BubblePoint {
  label: string;
  x: number;
  y: number;
  size: number;
}

interface BaseProps {
  title?: string;
  height?: number;
  /** Appended to formatted values in tooltips/labels (e.g. "tonnes", "₹ Lakh") — plain unit
   * text, not a currency/number formatter, matching how the rest of the dashboard labels units. */
  unit?: string;
  onElementClick?: (label: string) => void;
  /** Treemap only: rotates which `CATEGORICAL_COLORS` entry the first top-level branch starts
   * from, mirroring `ChartContainer`'s own `colorOffset` — so a treemap sitting in the same chart
   * row as three Recharts charts starts its own color sequence at the same position-based hue
   * those charts use for their own index, instead of always restarting at index 0 regardless of
   * where in the row it sits. Ignored by every other chart type, which already have a considered,
   * semantic color scheme (waterfall's increase/decrease/total, heatmap/bubbleMatrix's brand-teal
   * gradient) rather than a categorical rotation. */
  colorOffset?: number;
}

export type EChartsContainerProps =
  | (BaseProps & { type: 'waterfall'; data: WaterfallItem[] })
  | (BaseProps & { type: 'treemap'; data: TreemapNode[] })
  | (BaseProps & { type: 'heatmap'; xCategories: string[]; yCategories: string[]; data: HeatmapCell[] })
  | (BaseProps & { type: 'bubbleMatrix'; data: BubblePoint[]; xLabel?: string; yLabel?: string })
  | (BaseProps & { type: 'sunburst'; data: SunburstNode[] });

// Mirrors chartPalette.ts's TOOLTIP_STYLE (same white background, hairline border, rounded
// corners, soft shadow, Inter type) so an ECharts tooltip and a Recharts tooltip read as the
// same design system rather than two different libraries bolted together.
const ECHARTS_TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(0, 0, 0, 0.08)',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: '#2A2622', fontFamily: 'Inter, sans-serif', fontSize: 13 },
  extraCssText: 'border-radius: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);',
};

const formatValue = (value: number, unit?: string): string =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
};

function buildWaterfallOption(data: WaterfallItem[], unit?: string): EChartsOption {
  let running = 0;
  const placeholder: number[] = [];
  const increase: (number | string)[] = [];
  const decrease: (number | string)[] = [];
  const total: (number | string)[] = [];

  data.forEach((item) => {
    if (item.isTotal) {
      placeholder.push(0);
      increase.push('-');
      decrease.push('-');
      total.push(item.value);
      running = item.value;
    } else if (item.value >= 0) {
      placeholder.push(running);
      increase.push(item.value);
      decrease.push('-');
      total.push('-');
      running += item.value;
    } else {
      running += item.value;
      placeholder.push(running);
      increase.push('-');
      decrease.push(-item.value);
      total.push('-');
    }
  });

  return {
    // No always-on value labels above each bar — with up to 7 steps in the same quarter-width
    // card every other chart on the tab uses, per-bar labels collided with each other and with
    // the axis. Exact values live in the tooltip on hover, same as every Recharts bar/line chart
    // in this app already does (none of them show a permanent value label either).
    grid: {
      left: 52,
      right: 16,
      top: 20,
      bottom: 40,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...ECHARTS_TOOLTIP_STYLE,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const item = data[params[0]?.dataIndex ?? -1];
        if (!item) return '';
        const sign = !item.isTotal && item.value > 0 ? '+' : '';
        return `<strong>${item.label}</strong><br/>${sign}${formatValue(item.value, unit)}`;
      },
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.label),
      axisLine: { lineStyle: { color: CHART_CHROME.axis } },
      axisTick: { show: false },
      // Every step must stay visible on a bridge chart's axis (unlike a time axis, thinning
      // ticks would silently drop a named cost element) — rotated instead of thinned so up to
      // 7 short labels still fit this card's width without `hideOverlap` hiding any of them.
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 10, interval: 0, rotate: 35 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 11 },
      splitLine: { lineStyle: { color: CHART_CHROME.grid } },
    },
    series: [
      {
        name: 'Base',
        type: 'bar',
        stack: 'bridge',
        silent: true,
        itemStyle: { color: 'transparent' },
        emphasis: { itemStyle: { color: 'transparent' } },
        data: placeholder,
      },
      {
        name: 'Increase',
        type: 'bar',
        stack: 'bridge',
        barWidth: '55%',
        itemStyle: { color: STATUS_COLORS.good, borderRadius: [3, 3, 0, 0] },
        data: increase,
      },
      {
        name: 'Decrease',
        type: 'bar',
        stack: 'bridge',
        barWidth: '55%',
        itemStyle: { color: STATUS_COLORS.critical, borderRadius: [3, 3, 0, 0] },
        data: decrease,
      },
      {
        name: 'Total',
        type: 'bar',
        stack: 'bridge',
        barWidth: '55%',
        itemStyle: { color: BRAND_PRIMARY, borderRadius: [3, 3, 0, 0] },
        data: total,
      },
    ],
  };
}

// Rotates CATEGORICAL_COLORS to start at `offset` — the treemap's own version of
// ChartContainer's `colorAt`, so its top-level branches draw from the same palette, in the same
// position-based order, as the Recharts charts sitting beside it in the same row.
const rotatedCategoricalColors = (offset: number): string[] => {
  const n = CATEGORICAL_COLORS.length;
  const normalized = ((offset % n) + n) % n;
  return [...CATEGORICAL_COLORS.slice(normalized), ...CATEGORICAL_COLORS.slice(0, normalized)];
};

function buildTreemapOption(data: TreemapNode[], unit?: string, colorOffset = 0): EChartsOption {
  return {
    color: rotatedCategoricalColors(colorOffset),
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      formatter: (info: { name: string; value: number; treePathInfo?: Array<{ name: string }> }) => {
        const path = info.treePathInfo
          ?.map((p) => p.name)
          .filter(Boolean)
          .join(' / ');
        // Full name always shown here regardless of whether the box itself was wide enough to
        // render its own label — hover is the fallback for whatever `label`/`upperLabel` below
        // had to hide.
        return `<strong>${path || info.name}</strong><br/>${formatValue(info.value ?? 0, unit)}`;
      },
    },
    series: [
      {
        type: 'treemap',
        data,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        // `overflow: 'truncate'` + a single-character `ellipsis` gives every label a clean "…"
        // cutoff instead of the previous unconfigured default, which could render a bare
        // mid-word fragment ("Lin") with no ellipsis at all on the smallest cells. Below that,
        // once even the ellipsis can't fit the box, ECharts drops the label entirely rather than
        // rendering anything — the "hide on very small cells" behavior falls out of properly
        // configuring truncation rather than needing a separate size-threshold switch.
        label: {
          show: true,
          color: '#FFFFFF',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          overflow: 'truncate',
          ellipsis: '…',
        },
        upperLabel: {
          show: true,
          height: 24,
          color: '#FFFFFF',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          overflow: 'truncate',
          ellipsis: '…',
        },
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 2, gapWidth: 2 },
        levels: [
          {},
          {
            itemStyle: { borderColor: '#FFFFFF', borderWidth: 3, gapWidth: 3 },
          },
          {
            // The leaf level — smallest boxes, so a smaller font than the shared `label` above
            // buys extra room before truncation kicks in at all.
            colorSaturation: [0.35, 0.55],
            itemStyle: { borderColorSaturation: 0.6, gapWidth: 1, borderWidth: 1 },
            label: { fontSize: 10 },
          },
        ],
      },
    ],
  };
}

function buildSunburstOption(data: SunburstNode[], unit?: string, colorOffset = 0): EChartsOption {
  return {
    color: rotatedCategoricalColors(colorOffset),
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      formatter: (info: { name: string; value: number; treePathInfo?: Array<{ name: string }> }) => {
        const path = info.treePathInfo
          ?.map((p) => p.name)
          .filter(Boolean)
          .join(' / ');
        return `<strong>${path || info.name}</strong><br/>${formatValue(info.value ?? 0, unit)}`;
      },
    },
    series: [
      {
        type: 'sunburst',
        data,
        // Radial label rotation (below) is far more space-efficient than the old horizontal
        // "outside" labels were, so the pie can safely fill more of the canvas than the original
        // 72% while still leaving enough margin for the outermost ring's text.
        radius: [0, '82%'],
        // Clicking a ring zooms into that branch (ECharts' own built-in behavior for this
        // setting) rather than firing `onElementClick` — a Sunburst's rings are for exploring
        // proportion/contribution visually, not for driving the page's Time/Plant drill-down
        // (that's what the KPI cards/other charts already do); this keeps the two interactions
        // from fighting over what a click means on this particular chart.
        nodeClick: 'rootToNode',
        emphasis: { focus: 'ancestor' },
        label: {
          show: true,
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          // Text runs along each wedge's own radial line instead of staying horizontal — a
          // narrow outer-ring wedge can fit a far longer label this way before truncating, since
          // the label's length now follows the wedge's length rather than fighting its width.
          // This (not a smaller minAngle) is what actually recovers labels that were previously
          // getting hidden — most of them weren't too small to show, they just couldn't fit
          // horizontally in a thin wedge.
          rotate: 'radial',
          overflow: 'truncate',
          // Every real segment still gets a label down to a fairly thin sliver — below that,
          // ECharts hides it automatically rather than overlapping neighbors, same "hide once too
          // small to fit" principle the treemap's own truncation already follows. Lower than
          // before since radial rotation lets genuinely thin wedges show a label now too.
          minAngle: 5,
        },
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 1 },
        levels: [
          {},
          { r0: '10%', r: '38%', itemStyle: { borderWidth: 2 }, label: { fontSize: 13 } },
          { r0: '38%', r: '60%', label: { fontSize: 11 } },
          { r0: '60%', r: '82%', label: { fontSize: 10 } },
        ],
      },
    ],
  };
}

function buildHeatmapOption(
  xCategories: string[],
  yCategories: string[],
  cells: HeatmapCell[],
  unit?: string,
): EChartsOption {
  const values = cells.map((c) => c.value);
  return {
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      formatter: (params: { dataIndex: number }) => {
        const cell = cells[params.dataIndex];
        if (!cell) return '';
        return `<strong>${cell.y} · ${cell.x}</strong><br/>${formatValue(cell.value, unit)}`;
      },
    },
    grid: {
      left: 96,
      right: 24,
      top: 24,
      bottom: 64,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      splitArea: { show: true },
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      splitArea: { show: true },
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 11 },
    },
    visualMap: {
      min: Math.min(...values, 0),
      max: Math.max(...values, 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#eef4f3', BRAND_PRIMARY_LIGHT, BRAND_PRIMARY] },
      textStyle: { color: CHART_CHROME.mutedLabel },
    },
    series: [
      {
        type: 'heatmap',
        data: cells.map((c) => [xCategories.indexOf(c.x), yCategories.indexOf(c.y), c.value]),
        label: { show: true, color: '#2A2622', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0, 0, 0, 0.2)' } },
      },
    ],
  };
}

function buildBubbleMatrixOption(data: BubblePoint[], xLabel?: string, yLabel?: string): EChartsOption {
  const maxSize = Math.max(...data.map((d) => d.size), 1);
  const xMid = median(data.map((d) => d.x));
  const yMid = median(data.map((d) => d.y));

  return {
    tooltip: {
      ...ECHARTS_TOOLTIP_STYLE,
      formatter: (params: { dataIndex: number }) => {
        const item = data[params.dataIndex];
        if (!item) return '';
        return `<strong>${item.label}</strong><br/>${xLabel ?? 'X'}: ${item.x.toLocaleString()}<br/>${
          yLabel ?? 'Y'
        }: ${item.y.toLocaleString()}`;
      },
    },
    grid: {
      left: 64,
      right: 24,
      top: 24,
      bottom: 56,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    xAxis: {
      type: 'value',
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: { color: CHART_CHROME.mutedLabel, fontSize: 12 },
      axisLine: { lineStyle: { color: CHART_CHROME.axis } },
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 12 },
      splitLine: { lineStyle: { color: CHART_CHROME.grid } },
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      nameLocation: 'middle',
      nameGap: 44,
      nameTextStyle: { color: CHART_CHROME.mutedLabel, fontSize: 12 },
      axisLine: { lineStyle: { color: CHART_CHROME.axis } },
      axisLabel: { color: CHART_CHROME.mutedLabel, fontSize: 12 },
      splitLine: { lineStyle: { color: CHART_CHROME.grid } },
    },
    series: [
      {
        type: 'scatter',
        data: data.map((d) => [d.x, d.y, d.size, d.label]),
        symbolSize: (val: number[]) => 12 + ((val[2] ?? 0) / maxSize) * 36,
        itemStyle: { color: BRAND_PRIMARY, opacity: 0.75 },
        emphasis: {
          itemStyle: { opacity: 1, shadowBlur: 12, shadowColor: 'rgba(20, 107, 99, 0.35)' },
        },
        // Dashed cross at the median of each axis splits the plot into four quadrants (e.g.
        // "high yield / low defect" vs. its opposite) — the whole reason this chart type earns
        // its place over a plain scatter for KPI pairs a stakeholder reads by quadrant.
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: CHART_CHROME.axis, type: 'dashed' },
          label: { show: false },
          data: [{ xAxis: xMid }, { yAxis: yMid }],
        },
      },
    ],
  };
}

const hasRenderableData = (props: EChartsContainerProps): boolean => {
  switch (props.type) {
    case 'waterfall':
      return props.data.some((d) => d.value !== 0);
    case 'treemap': {
      const sum = (nodes: TreemapNode[]): number =>
        nodes.reduce((acc, n) => acc + (n.value ?? 0) + sum(n.children ?? []), 0);
      return props.data.length > 0 && sum(props.data) !== 0;
    }
    case 'heatmap':
      return props.data.some((c) => c.value !== 0);
    case 'bubbleMatrix':
      return props.data.length > 0;
    case 'sunburst': {
      const sum = (nodes: SunburstNode[]): number =>
        nodes.reduce((acc, n) => acc + (n.value ?? 0) + sum(n.children ?? []), 0);
      return props.data.length > 0 && sum(props.data) !== 0;
    }
  }
};

const buildOption = (props: EChartsContainerProps): EChartsOption => {
  switch (props.type) {
    case 'waterfall':
      return buildWaterfallOption(props.data, props.unit);
    case 'treemap':
      return buildTreemapOption(props.data, props.unit, props.colorOffset);
    case 'heatmap':
      return buildHeatmapOption(props.xCategories, props.yCategories, props.data, props.unit);
    case 'bubbleMatrix':
      return buildBubbleMatrixOption(props.data, props.xLabel, props.yLabel);
    case 'sunburst':
      return buildSunburstOption(props.data, props.unit, props.colorOffset);
  }
};

/** ECharts counterpart to `ChartContainer` — used only for the chart types Recharts renders
 * poorly (waterfall/bridge, treemap, heatmap, bubble/scatter matrices with quadrant styling).
 * Every other chart on the dashboard stays on Recharts via `ChartContainer`; this is not a
 * replacement for it. */
export const EChartsContainer = (props: EChartsContainerProps) => {
  // Treemap and Sunburst get more vertical room by default than the other chart types — both are
  // space-filling hierarchical charts where cramped labels are primarily a room problem, not a
  // font-size problem (the font-size/truncation tuning in `buildTreemapOption`/
  // `buildSunburstOption` only controls what happens once space itself is no longer the
  // constraint). Any caller can still override via its own `height` prop.
  const {
    title,
    height = props.type === 'treemap' || props.type === 'sunburst' ? 340 : 300,
    onElementClick,
  } = props;
  const hasData = hasRenderableData(props);

  const onEvents = onElementClick
    ? {
        click: (params: { name?: string }) => {
          if (params.name) onElementClick(params.name);
        },
      }
    : undefined;

  return (
    <ChartCard title={title}>
      {hasData ? (
        <ReactEChartsCore
          echarts={echarts}
          theme="brand"
          option={buildOption(props)}
          style={{ height, width: '100%' }}
          onEvents={onEvents}
          notMerge
        />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ height, color: 'text.secondary' }}
        >
          <BarChartOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          <Typography variant="body2">No data for this selection</Typography>
          <Typography variant="caption">Try adjusting the plant, time, or filter selection</Typography>
        </Stack>
      )}
    </ChartCard>
  );
};

export default EChartsContainer;
