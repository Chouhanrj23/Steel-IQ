import { useId } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { CATEGORICAL_COLORS, CHART_CHROME, TOOLTIP_STYLE } from '../chartPalette';
import { ChartCard } from '../ChartCard';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'stackedBar';

export interface ChartSeriesConfig {
  key: string;
  label: string;
}

export interface ChartContainerProps {
  type: ChartType;
  data: Record<string, string | number>[];
  categoryKey: string;
  series: ChartSeriesConfig[];
  title?: string;
  height?: number;
  onElementClick?: (categoryLabel: string) => void;
  /** Rotates which `CATEGORICAL_COLORS` entry a single-series chart starts from. Without this,
   * every single-series chart lands on index 0 (blue) — `series.map((s, i) => ...)` only ever
   * produces `i=0` when there's one series, so a tab's four single-metric charts all rendered in
   * the same blue regardless of what they showed. Pass each chart in a row a different offset
   * (0/1/2/3) so the row reads as four distinct colors instead of four shades of one. */
  colorOffset?: number;
}

interface CartesianClickState {
  activeLabel?: string | number;
}

const isPieType = (type: ChartType) => type === 'pie' || type === 'donut';

// A muted, brand-teal-tinted band instead of Recharts' default flat grey — echoes the highlight
// an ECharts `axisPointer`/bar-hover shows, so hovering a Recharts chart and an EChartsContainer
// chart reads as the same interaction language rather than two different chart libraries.
const HOVER_CURSOR_FILL = 'rgba(20, 107, 99, 0.06)';
const HOVER_CURSOR_LINE = { stroke: CHART_CHROME.axis, strokeDasharray: '4 4' };
const TOOLTIP_ANIMATION = { animationDuration: 200, animationEasing: 'ease-out' as const };

const gradientId = (prefix: string, i: number) => `${prefix}-grad-${i}`;

const colorAt = (i: number, colorOffset: number): string =>
  CATEGORICAL_COLORS[(i + colorOffset) % CATEGORICAL_COLORS.length] as string;

/** One `<linearGradient>` per series color actually used, so a bar/area's `fill="url(#...)"`
 * resolves — SVG gradients are per-document defs, and multiple ChartContainer instances render
 * on the same page at once (four per tab), so ids are namespaced per instance via `useId()`
 * rather than by color index alone, which would collide across cards. */
const GradientDefs = ({
  prefix,
  count,
  bottomOpacity,
  colorOffset,
}: {
  prefix: string;
  count: number;
  bottomOpacity: number;
  colorOffset: number;
}) => (
  <defs>
    {Array.from({ length: count }, (_, i) => {
      const color = colorAt(i, colorOffset);
      return (
        <linearGradient key={i} id={gradientId(prefix, i)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={bottomOpacity} />
        </linearGradient>
      );
    })}
  </defs>
);

function renderChart(
  type: ChartType,
  data: Record<string, string | number>[],
  categoryKey: string,
  series: ChartSeriesConfig[],
  showLegend: boolean,
  gradientPrefix: string,
  colorOffset: number,
  onElementClick?: (categoryLabel: string) => void,
) {
  const handleCartesianClick = onElementClick
    ? (state: CartesianClickState) => {
        if (state.activeLabel !== undefined) {
          onElementClick(String(state.activeLabel));
        }
      }
    : undefined;

  const cursor = onElementClick ? 'pointer' : undefined;

  switch (type) {
    case 'bar':
      return (
        <BarChart data={data} onClick={handleCartesianClick}>
          <GradientDefs
            prefix={gradientPrefix}
            count={series.length}
            bottomOpacity={0.55}
            colorOffset={colorOffset}
          />
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke={CHART_CHROME.axis}
            tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }}
          />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            cursor={{ fill: HOVER_CURSOR_FILL }}
            {...TOOLTIP_ANIMATION}
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={`url(#${gradientId(gradientPrefix, i)})`}
              radius={[4, 4, 0, 0]}
              cursor={cursor}
            />
          ))}
        </BarChart>
      );
    case 'stackedBar':
      return (
        <BarChart data={data} onClick={handleCartesianClick}>
          <GradientDefs
            prefix={gradientPrefix}
            count={series.length}
            bottomOpacity={0.55}
            colorOffset={colorOffset}
          />
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke={CHART_CHROME.axis}
            tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }}
          />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            cursor={{ fill: HOVER_CURSOR_FILL }}
            {...TOOLTIP_ANIMATION}
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="stack"
              fill={`url(#${gradientId(gradientPrefix, i)})`}
              cursor={cursor}
            />
          ))}
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={data} onClick={handleCartesianClick}>
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke={CHART_CHROME.axis}
            tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }}
          />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            cursor={HOVER_CURSOR_LINE}
            {...TOOLTIP_ANIMATION}
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={colorAt(i, colorOffset)}
              strokeWidth={2}
              dot={{ r: 3, cursor }}
              activeDot={{ r: 6, cursor, stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={data} onClick={handleCartesianClick}>
          <GradientDefs
            prefix={gradientPrefix}
            count={series.length}
            bottomOpacity={0.03}
            colorOffset={colorOffset}
          />
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke={CHART_CHROME.axis}
            tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }}
          />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            cursor={HOVER_CURSOR_LINE}
            {...TOOLTIP_ANIMATION}
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={colorAt(i, colorOffset)}
              fill={`url(#${gradientId(gradientPrefix, i)})`}
              fillOpacity={1}
              strokeWidth={2}
              dot={{ r: 3, cursor }}
              activeDot={{ r: 6, cursor, stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      );
    case 'pie':
    case 'donut': {
      const valueKey = series[0]?.key ?? 'value';
      return (
        <PieChart>
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            {...TOOLTIP_ANIMATION}
          />
          {showLegend && <Legend />}
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={categoryKey}
            innerRadius={type === 'donut' ? '60%' : 0}
            outerRadius="85%"
            paddingAngle={2}
            cursor={cursor}
            onClick={
              onElementClick
                ? (_entry: unknown, index: number) => {
                    const item = data[index];
                    const label = item?.[categoryKey];
                    if (typeof label === 'string') {
                      onElementClick(label);
                    }
                  }
                : undefined
            }
          >
            {data.map((_, i) => (
              // A thin white stroke between wedges — same segmentation cue as EChartsContainer's
              // treemap borders — so a donut and a treemap read as the same "chrome," not two
              // different libraries' default styles.
              <Cell key={i} fill={colorAt(i, colorOffset)} stroke="#FFFFFF" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      );
    }
  }
}

/** True once at least one row has a nonzero value in at least one series — a chart full of
 * zeros (e.g. a drill/filter combination with no matching underlying records) is visually
 * indistinguishable from a broken chart, so it gets the empty-state treatment instead. */
const hasRenderableData = (data: Record<string, string | number>[], series: ChartSeriesConfig[]): boolean =>
  data.length > 0 && data.some((row) => series.some((s) => Number(row[s.key]) !== 0));

export const ChartContainer = ({
  type,
  data,
  categoryKey,
  series,
  title,
  height = 300,
  onElementClick,
  colorOffset = 0,
}: ChartContainerProps) => {
  const gradientPrefix = useId();
  const showLegend = isPieType(type) ? data.length > 1 : series.length > 1;
  const hasData = hasRenderableData(data, series);

  return (
    <ChartCard title={title}>
      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart(
            type,
            data,
            categoryKey,
            series,
            showLegend,
            gradientPrefix,
            colorOffset,
            onElementClick,
          )}
        </ResponsiveContainer>
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
