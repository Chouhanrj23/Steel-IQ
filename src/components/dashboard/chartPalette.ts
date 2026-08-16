// Mirrors theme/palette.ts's primary/secondary (kept as standalone literals for the same reason
// every other color in this file is — Recharts/ECharts props take plain CSS, not theme-aware sx
// values). Exported so EChartsContainer and Header don't each hardcode their own copy of the
// brand colors.
export const BRAND_PRIMARY = '#146B63';
export const BRAND_PRIMARY_LIGHT = '#3D8F87';
export const BRAND_SECONDARY = '#6B3B5C';

// Ordered so the first four — the ones actually used, since most tabs render exactly four
// charts in a row — read as clearly distinct hues (teal/amber/rose/indigo) rather than
// variations on one color. Every single-series chart used to default to index 0 regardless of
// what it showed, since `series.map((s, i) => ...)` only ever produces i=0 for one series —
// ChartContainer's `colorOffset` prop (and EChartsContainer's per-instance rotation) exists so
// each chart in a row gets a different entry instead. None of these lead with navy blue — see
// `src/theme/palette.ts` for why.
export const CATEGORICAL_COLORS: string[] = [
  '#146B63', // teal (brand primary)
  '#B5602E', // terracotta
  '#5B4B99', // indigo
  '#A8791C', // gold
  '#1B7A96', // cyan-teal
  '#8B3B6B', // plum
  '#6B7A2E', // olive
  '#9C3B4A', // wine
];

export type StatusColorKey = 'good' | 'warning' | 'critical';

export const STATUS_COLORS: Record<StatusColorKey, string> = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
};

/** A faint status-tinted card background — same hue as `STATUS_COLORS`, low enough opacity to
 * stay readable, so a card's status reads at a glance instead of needing to spot a 3px border.
 * Literal `rgba()` rather than MUI's `alpha()` helper, matching every other color in this file
 * (kept as plain CSS since Recharts/ECharts props take plain values, not theme-aware ones) —
 * MUI's `sx` background accepts the same string either way. */
export const STATUS_TINTS: Record<StatusColorKey, string> = {
  good: 'rgba(12, 163, 12, 0.06)',
  warning: 'rgba(250, 178, 25, 0.08)',
  critical: 'rgba(208, 59, 59, 0.06)',
};

// The Variance lens's "Target" bar color — kept alongside STATUS_COLORS as a standalone literal
// for the same reason TOOLTIP_STYLE is (Recharts props take plain CSS, not theme-aware sx
// values). "Actual" isn't here: VarianceLensBody colors that bar from the KPI's own status
// color instead, so it stays in sync with the card's border/tint/chip.
export const VARIANCE_COLORS = {
  target: '#c3c2b7',
} as const;

export const AGEING_COLORS: Record<'0-30 Days' | '31+ Days', string> = {
  '0-30 Days': '#1baf7a',
  '31+ Days': '#eda100',
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
    color: '#2A2622',
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: {
    color: '#6B6459',
  },
} as const;
