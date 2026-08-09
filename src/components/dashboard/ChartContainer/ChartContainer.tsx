import Box from '@mui/material/Box';
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
}

interface CartesianClickState {
  activeLabel?: string | number;
}

const isPieType = (type: ChartType) => type === 'pie' || type === 'donut';

function renderChart(
  type: ChartType,
  data: Record<string, string | number>[],
  categoryKey: string,
  series: ChartSeriesConfig[],
  showLegend: boolean,
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
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              radius={[4, 4, 0, 0]}
              cursor={cursor}
            />
          ))}
        </BarChart>
      );
    case 'stackedBar':
      return (
        <BarChart data={data} onClick={handleCartesianClick}>
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
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="stack"
              fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
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
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, cursor }}
              activeDot={{ r: 5, cursor }}
            />
          ))}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={data} onClick={handleCartesianClick}>
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
          />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3, cursor }}
              activeDot={{ r: 5, cursor }}
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
              <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
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
}: ChartContainerProps) => {
  const showLegend = isPieType(type) ? data.length > 1 : series.length > 1;
  const hasData = hasRenderableData(data, series);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
      )}
      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart(type, data, categoryKey, series, showLegend, onElementClick)}
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
    </Box>
  );
};
