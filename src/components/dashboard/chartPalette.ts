export const CATEGORICAL_COLORS: string[] = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

export type StatusColorKey = 'good' | 'warning' | 'critical';

export const STATUS_COLORS: Record<StatusColorKey, string> = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
};

export const CHART_CHROME = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  mutedLabel: '#898781',
} as const;

// Mirrors theme/palette.ts (background.paper, divider, text.primary/secondary) and
// theme/index.ts's shape.borderRadius — kept as standalone literals rather than importing the
// MUI theme because Recharts' contentStyle/labelStyle/itemStyle props take plain CSS objects,
// not theme-aware sx values, matching the rest of this file's approach.
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    padding: '8px 12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
  },
  labelStyle: {
    color: '#1A2027',
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: {
    color: '#5A6472',
  },
} as const;
