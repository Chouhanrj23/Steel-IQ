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
