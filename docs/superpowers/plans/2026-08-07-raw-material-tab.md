# Raw Material Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the KPMG theme, mock data/types, reusable dashboard widgets, and the Raw Material tab UI, per the four committed design specs in `docs/superpowers/specs/2026-08-07-*.md`.

**Architecture:** A static-data React/MUI/Recharts frontend. `src/mock/mockData.json` (generated once by a throwaway script) is the single source of truth, typed by `src/types/dashboard.ts`, consumed directly by page components — no store, no fetching, no cross-filtering logic yet.

**Tech Stack:** React 19, TypeScript strict, MUI v7, Recharts, Vite. No test runner is configured in this repo — verification is `npm run typecheck`, `npm run lint`, and a manual check in the running dev server (this repo has zero tests anywhere; adding a test framework is out of scope for this plan).

---

## Task 1: Dashboard types

**Files:**
- Create: `src/types/dashboard.ts`

- [ ] **Step 1: Write the types file**

```ts
export type ModuleKey =
  | 'rawMaterial'
  | 'costAnalytics'
  | 'supplyChain'
  | 'procurement'
  | 'product'
  | 'marketingFinance';

export type KPITrend = 'up' | 'down' | 'flat';
export type KPIStatus = 'good' | 'warning' | 'critical';
export type DrilldownDimension = 'time' | 'plant' | 'geography';

export interface DrillDownNode {
  label: string;
  value: number;
  children?: DrillDownNode[];
}

export interface KPIDrilldown {
  dimension: DrilldownDimension;
  root: DrillDownNode[];
}

export interface KPI {
  id: string;
  name: string;
  module: ModuleKey;
  unit: string;
  current: number;
  previous: number;
  percentChange: number;
  trend: KPITrend;
  status: KPIStatus;
  drilldown: KPIDrilldown;
}

export interface ModuleData {
  label: string;
  kpis: KPI[];
}

export interface DashboardHierarchies {
  time: DrillDownNode[];
  plant: DrillDownNode[];
  geography: DrillDownNode[];
}

export interface DashboardMockData {
  modules: Record<ModuleKey, ModuleData>;
  hierarchies: DashboardHierarchies;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors (this file has no dependents yet, so it can only fail on its own syntax).

- [ ] **Step 3: Commit**

```bash
git add src/types/dashboard.ts
git commit -m "feat: add dashboard data types"
```

---

## Task 2: Generate mock data

**Files:**
- Create (temporary, not committed): `/private/tmp/claude-501/-Users-praveenagrawal-Desktop-Steel-IQ/73fbd911-9899-44ba-99b3-37817dda974e/scratchpad/generate-mock-data.mjs`
- Create: `src/mock/mockData.json`

- [ ] **Step 1: Write the generator script**

```js
import { writeFileSync } from 'node:fs';

function splitValue(total, weights, decimals = 0) {
  const factor = 10 ** decimals;
  const scaledTotal = Math.round(total * factor);
  const parts = [];
  let used = 0;
  for (let i = 0; i < weights.length; i++) {
    if (i === weights.length - 1) {
      parts.push((scaledTotal - used) / factor);
    } else {
      const part = Math.round(scaledTotal * weights[i]);
      used += part;
      parts.push(part / factor);
    }
  }
  return parts;
}

const PLANTS = [
  { region: 'East', name: 'Rourkela Plant' },
  { region: 'East', name: 'Jamshedpur Plant' },
  { region: 'Central', name: 'Bhilai Plant' },
  { region: 'West', name: 'Hazira Plant' },
  { region: 'South', name: 'Bellary Plant' },
];
const PLANT_WEIGHTS = [0.28, 0.22, 0.2, 0.17, 0.13];
const LINES = ['Blast Furnace Unit', 'Melt Shop Unit', 'Rolling Mill Unit'];
const LINE_WEIGHTS = [0.45, 0.35, 0.2];
const REGION_ORDER = ['East', 'Central', 'West', 'South'];

function buildPlantBreakdown(total, decimals) {
  const plantValues = splitValue(total, PLANT_WEIGHTS, decimals);
  const plantsWithValues = PLANTS.map((p, i) => ({ ...p, value: plantValues[i] }));
  return REGION_ORDER.map((region) => {
    const members = plantsWithValues.filter((p) => p.region === region);
    const regionValue = Number(members.reduce((sum, m) => sum + m.value, 0).toFixed(decimals));
    return {
      label: region,
      value: regionValue,
      children: members.map((m) => {
        const lineValues = splitValue(m.value, LINE_WEIGHTS, decimals);
        return {
          label: m.name,
          value: m.value,
          children: LINES.map((line, i) => ({ label: line, value: lineValues[i] })),
        };
      }),
    };
  });
}

const YEARS = ['2024', '2025'];
const YEAR_WEIGHTS = [0.45, 0.55];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_WEIGHTS = [0.22, 0.24, 0.26, 0.28];
const MONTHS_BY_QUARTER = {
  Q1: ['Jan', 'Feb', 'Mar'],
  Q2: ['Apr', 'May', 'Jun'],
  Q3: ['Jul', 'Aug', 'Sep'],
  Q4: ['Oct', 'Nov', 'Dec'],
};
const MONTH_WEIGHTS = [0.32, 0.33, 0.35];

function buildTimeBreakdown(total, decimals) {
  const yearValues = splitValue(total, YEAR_WEIGHTS, decimals);
  return YEARS.map((year, yi) => {
    const quarterValues = splitValue(yearValues[yi], QUARTER_WEIGHTS, decimals);
    return {
      label: year,
      value: yearValues[yi],
      children: QUARTERS.map((quarter, qi) => {
        const monthValues = splitValue(quarterValues[qi], MONTH_WEIGHTS, decimals);
        return {
          label: quarter,
          value: quarterValues[qi],
          children: MONTHS_BY_QUARTER[quarter].map((month, mi) => ({
            label: month,
            value: monthValues[mi],
          })),
        };
      }),
    };
  });
}

const ZONES = [
  { zone: 'North', states: [{ state: 'Punjab', city: 'Ludhiana' }, { state: 'Delhi NCR', city: 'Gurugram' }] },
  { zone: 'South', states: [{ state: 'Karnataka', city: 'Bengaluru' }, { state: 'Tamil Nadu', city: 'Chennai' }] },
  { zone: 'East', states: [{ state: 'West Bengal', city: 'Kolkata' }, { state: 'Odisha', city: 'Bhubaneswar' }] },
  { zone: 'West', states: [{ state: 'Maharashtra', city: 'Mumbai' }, { state: 'Gujarat', city: 'Ahmedabad' }] },
];
const ZONE_WEIGHTS = [0.24, 0.28, 0.26, 0.22];
const STATE_WEIGHTS = [0.55, 0.45];

function buildGeographyBreakdown(total, decimals) {
  const zoneValues = splitValue(total, ZONE_WEIGHTS, decimals);
  return ZONES.map((z, zi) => {
    const stateValues = splitValue(zoneValues[zi], STATE_WEIGHTS, decimals);
    return {
      label: z.zone,
      value: zoneValues[zi],
      children: z.states.map((s, si) => ({
        label: s.state,
        value: stateValues[si],
        children: [{ label: s.city, value: stateValues[si] }],
      })),
    };
  });
}

function buildBreakdown(dimension, total, decimals) {
  if (dimension === 'plant') return buildPlantBreakdown(total, decimals);
  if (dimension === 'time') return buildTimeBreakdown(total, decimals);
  return buildGeographyBreakdown(total, decimals);
}

// module, id, name, unit, current, previous, status, dimension, decimals
const KPI_DEFS = [
  ['rawMaterial', 'iron-ore-inventory', 'Iron Ore Inventory', 'tonnes', 128400, 121000, 'good', 'plant', 0],
  ['rawMaterial', 'coking-coal-cost-per-tonne', 'Coking Coal Cost per Tonne', 'INR', 18450, 17700, 'warning', 'time', 0],
  ['rawMaterial', 'raw-material-wastage-rate', 'Raw Material Wastage Rate', '%', 3.8, 3.4, 'warning', 'plant', 1],
  ['rawMaterial', 'limestone-consumption', 'Limestone Consumption', 'tonnes', 42600, 44100, 'good', 'plant', 0],
  ['rawMaterial', 'raw-material-lead-time', 'Raw Material Lead Time', 'days', 12.4, 11.1, 'warning', 'geography', 1],

  ['costAnalytics', 'cost-per-tonne-of-steel', 'Cost per Tonne of Steel', 'INR', 46200, 47100, 'good', 'time', 0],
  ['costAnalytics', 'energy-cost-ratio', 'Energy Cost Ratio', '%', 18.6, 17.9, 'warning', 'plant', 1],
  ['costAnalytics', 'labor-cost-variance', 'Labor Cost Variance', '%', 2.1, 3.4, 'good', 'time', 1],
  ['costAnalytics', 'overhead-cost-ratio', 'Overhead Cost Ratio', '%', 9.4, 9.1, 'warning', 'time', 1],
  ['costAnalytics', 'production-cost-savings', 'Production Cost Savings', 'INR Lakh', 312, 268, 'good', 'plant', 0],

  ['supplyChain', 'on-time-delivery-rate', 'On-Time Delivery Rate', '%', 91.2, 88.6, 'good', 'geography', 1],
  ['supplyChain', 'order-fulfillment-cycle-time', 'Order Fulfillment Cycle Time', 'days', 6.8, 7.6, 'good', 'geography', 1],
  ['supplyChain', 'freight-cost-per-tonne', 'Freight Cost per Tonne', 'INR', 2140, 1985, 'warning', 'geography', 0],
  ['supplyChain', 'inventory-turnover-ratio', 'Inventory Turnover Ratio', 'x', 5.4, 5.0, 'good', 'plant', 1],
  ['supplyChain', 'supplier-reliability-score', 'Supplier Reliability Score', '%', 87.5, 85.9, 'good', 'geography', 1],

  ['procurement', 'purchase-order-cycle-time', 'Purchase Order Cycle Time', 'days', 4.2, 5.1, 'good', 'time', 1],
  ['procurement', 'supplier-price-variance', 'Supplier Price Variance', '%', 2.9, 1.8, 'warning', 'geography', 1],
  ['procurement', 'procurement-cost-savings', 'Procurement Cost Savings', 'INR Lakh', 186, 154, 'good', 'time', 0],
  ['procurement', 'contract-compliance-rate', 'Contract Compliance Rate', '%', 96.1, 94.8, 'good', 'geography', 1],
  ['procurement', 'vendor-rejection-rate', 'Vendor Rejection Rate', '%', 1.6, 1.2, 'critical', 'plant', 1],

  ['product', 'production-volume', 'Production Volume', 'tonnes', 214500, 205800, 'good', 'plant', 0],
  ['product', 'yield-rate', 'Yield Rate', '%', 92.3, 91.6, 'good', 'plant', 1],
  ['product', 'defect-rate', 'Defect Rate', '%', 2.4, 1.9, 'critical', 'plant', 1],
  ['product', 'capacity-utilization', 'Capacity Utilization', '%', 88.1, 85.4, 'good', 'plant', 1],
  ['product', 'value-added-steel-mix', 'Value-Added Steel Mix', '%', 34.6, 31.2, 'good', 'time', 1],

  ['marketingFinance', 'revenue', 'Revenue', 'INR Cr', 1842, 1705, 'good', 'geography', 0],
  ['marketingFinance', 'ebitda-margin', 'EBITDA Margin', '%', 21.4, 19.8, 'good', 'time', 1],
  ['marketingFinance', 'net-profit', 'Net Profit', 'INR Cr', 268, 231, 'good', 'time', 0],
  ['marketingFinance', 'market-share', 'Market Share', '%', 14.2, 13.6, 'good', 'geography', 1],
  ['marketingFinance', 'customer-acquisition-cost', 'Customer Acquisition Cost', 'INR', 8600, 9400, 'good', 'geography', 0],
  ['marketingFinance', 'order-book-value', 'Order Book Value', 'INR Cr', 3120, 2860, 'good', 'geography', 0],
];

const MODULE_LABELS = {
  rawMaterial: 'Raw Material',
  costAnalytics: 'Cost Analytics',
  supplyChain: 'Supply Chain',
  procurement: 'Procurement',
  product: 'Product',
  marketingFinance: 'Marketing & Finance',
};

const modules = {};
for (const key of Object.keys(MODULE_LABELS)) {
  modules[key] = { label: MODULE_LABELS[key], kpis: [] };
}

for (const [module, id, name, unit, current, previous, status, dimension, decimals] of KPI_DEFS) {
  const percentChange = Number((((current - previous) / previous) * 100).toFixed(1));
  const trend = current > previous ? 'up' : current < previous ? 'down' : 'flat';
  modules[module].kpis.push({
    id,
    name,
    module,
    unit,
    current,
    previous,
    percentChange,
    trend,
    status,
    drilldown: {
      dimension,
      root: buildBreakdown(dimension, current, decimals),
    },
  });
}

const hierarchies = {
  time: buildTimeBreakdown(0, 0),
  plant: buildPlantBreakdown(0, 0),
  geography: buildGeographyBreakdown(0, 0),
};

const output = { modules, hierarchies };
writeFileSync(new URL('./mockData.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log('Wrote mockData.json');
```

(Standalone `hierarchies` nodes carry `value: 0` throughout — they back filter dropdowns and the drill-down breadcrumb's label list, not a specific KPI's number, so `value` there is structurally required by `DrillDownNode` but not meaningful on its own.)

- [ ] **Step 2: Run it and copy the output into the repo**

```bash
node /private/tmp/claude-501/-Users-praveenagrawal-Desktop-Steel-IQ/73fbd911-9899-44ba-99b3-37817dda974e/scratchpad/generate-mock-data.mjs
cp /private/tmp/claude-501/-Users-praveenagrawal-Desktop-Steel-IQ/73fbd911-9899-44ba-99b3-37817dda974e/scratchpad/mockData.json src/mock/mockData.json
```
Expected: `Wrote mockData.json`, then the file exists at `src/mock/mockData.json`.

- [ ] **Step 3: Spot-check the output**

Open `src/mock/mockData.json` and confirm: `modules` has all 6 keys from `MODULE_LABELS`; `modules.rawMaterial.kpis` has 5 entries with the 5 `id`s from `KPI_DEFS`; for at least one KPI, the `drilldown.root` top-level `value`s sum to that KPI's `current` (e.g. Iron Ore Inventory's 4 region values should sum to 128400).

- [ ] **Step 4: Typecheck against the new types**

Add a temporary throwaway check isn't needed — Task 14 will import and type this file. For now just confirm it's valid JSON:

Run: `node -e "JSON.parse(require('fs').readFileSync('src/mock/mockData.json', 'utf8')); console.log('valid json')"`
Expected: `valid json`

- [ ] **Step 5: Commit**

```bash
git add src/mock/mockData.json
git commit -m "feat: generate dashboard mock data for all 6 modules"
```

---

## Task 3: KPMG theme palette

**Files:**
- Modify: `src/theme/palette.ts`

- [ ] **Step 1: Replace the palette**

```ts
import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#00338D',
    light: '#335CA4',
    dark: '#002463',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#6E2C8D',
    light: '#8B56A4',
    dark: '#4D1F63',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A2027',
    secondary: '#5A6472',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
  success: {
    main: '#2E7D32',
  },
  warning: {
    main: '#ED6C02',
  },
  error: {
    main: '#D32F2F',
  },
  info: {
    main: '#0288D1',
  },
};
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/palette.ts
git commit -m "feat: apply KPMG blue/purple theme palette"
```

---

## Task 4: Header logo placeholder

**Files:**
- Modify: `src/components/layout/Header/Header.tsx`

- [ ] **Step 1: Add the logo placeholder box**

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import { APP_NAME, DRAWER_WIDTH, HEADER_HEIGHT } from '@utils/constants';

export interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        height: HEADER_HEIGHT,
        justifyContent: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            onClick={onMenuClick}
            edge="start"
            sx={{ display: { md: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
            aria-hidden
          >
            S
          </Box>
          <Typography variant="h6" component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {APP_NAME}
          </Typography>
        </Stack>
        <Avatar sx={{ width: 36, height: 36 }} />
      </Toolbar>
    </AppBar>
  );
};
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header/Header.tsx
git commit -m "feat: add logo placeholder to Header"
```

---

## Task 5: GlobalFilterBar

**Files:**
- Create: `src/components/layout/GlobalFilterBar/GlobalFilterBar.tsx`
- Create: `src/components/layout/GlobalFilterBar/index.ts`
- Modify: `src/components/layout/index.ts`
- Modify: `src/components/layout/AppLayout/AppLayout.tsx`

- [ ] **Step 1: Write the component**

```tsx
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface FilterDef {
  id: string;
  label: string;
  options: string[];
}

const FILTERS: FilterDef[] = [
  {
    id: 'plant',
    label: 'Plant',
    options: ['All Plants', 'Rourkela Plant', 'Jamshedpur Plant', 'Bhilai Plant', 'Hazira Plant', 'Bellary Plant'],
  },
  { id: 'region', label: 'Region', options: ['All Regions', 'East', 'West', 'South', 'Central'] },
  {
    id: 'businessUnit',
    label: 'Business Unit',
    options: ['All Business Units', 'Manufacturing', 'Sales & Marketing', 'Procurement', 'Finance'],
  },
  {
    id: 'productCategory',
    label: 'Product Category',
    options: ['All Categories', 'Flat Products', 'Long Products', 'Tubes & Pipes', 'Wire Rods', 'Value-Added Steel'],
  },
  { id: 'year', label: 'Year', options: ['All Years', '2024', '2025'] },
  { id: 'quarter', label: 'Quarter', options: ['All Quarters', 'Q1', 'Q2', 'Q3', 'Q4'] },
  {
    id: 'month',
    label: 'Month',
    options: ['All Months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
];

export const GlobalFilterBar = () => {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: 3, py: 1.5 }}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {FILTERS.map((filter) => (
          <FormControl key={filter.id} size="small" sx={{ minWidth: 160 }}>
            <InputLabel id={`${filter.id}-filter-label`}>{filter.label}</InputLabel>
            <Select labelId={`${filter.id}-filter-label`} label={filter.label} defaultValue={filter.options[0]}>
              {filter.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Stack>
    </Box>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { GlobalFilterBar } from './GlobalFilterBar';
```

- [ ] **Step 3: Re-export from the layout barrel**

Modify `src/components/layout/index.ts`:

```ts
export * from './Header';
export * from './Sidebar';
export * from './Footer';
export * from './AppLayout';
export * from './GlobalFilterBar';
```

- [ ] **Step 4: Wire into AppLayout**

```tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { GlobalFilterBar } from '../GlobalFilterBar';
import { DRAWER_WIDTH } from '@utils/constants';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={() => setMobileOpen((prev) => !prev)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <GlobalFilterBar />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
```

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/GlobalFilterBar src/components/layout/index.ts src/components/layout/AppLayout/AppLayout.tsx
git commit -m "feat: add static Global Filter bar to app shell"
```

---

## Task 6: Chart color palette module

**Files:**
- Create: `src/components/dashboard/chartPalette.ts`

- [ ] **Step 1: Write the constants**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors (no dependents yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/chartPalette.ts
git commit -m "feat: add dataviz-validated chart color constants"
```

---

## Task 7: KPICard

**Files:**
- Create: `src/components/dashboard/KPICard/KPICard.tsx`
- Create: `src/components/dashboard/KPICard/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import type { SvgIconComponent } from '@mui/icons-material';
import { Card } from '@components/common';
import { STATUS_COLORS } from '../chartPalette';
import type { KPIStatus, KPITrend } from '@types/dashboard';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  percentChange: number;
  trend: KPITrend;
  status: KPIStatus;
  sparklineData?: number[];
}

const STATUS_ICON: Record<KPIStatus, SvgIconComponent> = {
  good: CheckCircleIcon,
  warning: WarningAmberIcon,
  critical: ErrorOutlineIcon,
};

const STATUS_LABEL: Record<KPIStatus, string> = {
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
};

const TREND_ICON: Record<KPITrend, SvgIconComponent> = {
  up: ArrowUpwardIcon,
  down: ArrowDownwardIcon,
  flat: TrendingFlatIcon,
};

export const KPICard = ({ title, value, unit, percentChange, trend, status, sparklineData }: KPICardProps) => {
  const color = STATUS_COLORS[status];
  const StatusIcon = STATUS_ICON[status];
  const TrendIcon = TREND_ICON[trend];
  const sign = percentChange > 0 ? '+' : '';

  return (
    <Card>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          <Chip
            size="small"
            icon={<StatusIcon fontSize="small" />}
            label={STATUS_LABEL[status]}
            variant="outlined"
            sx={{ color, borderColor: color, '& .MuiChip-icon': { color } }}
          />
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography variant="h4">{value}</Typography>
          {unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TrendIcon sx={{ fontSize: 18, color }} />
          <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
            {sign}
            {percentChange}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs previous period
          </Typography>
        </Stack>
        {sparklineData && sparklineData.length > 1 && (
          <Box sx={{ height: 36 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v, i) => ({ index: i, value: v }))}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>
    </Card>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { KPICard } from './KPICard';
export type { KPICardProps } from './KPICard';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/KPICard
git commit -m "feat: add KPICard component"
```

---

## Task 8: ChartContainer

**Files:**
- Create: `src/components/dashboard/ChartContainer/ChartContainer.tsx`
- Create: `src/components/dashboard/ChartContainer/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import { CATEGORICAL_COLORS, CHART_CHROME } from '../chartPalette';

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
}

const isPieType = (type: ChartType) => type === 'pie' || type === 'donut';

function renderChart(
  type: ChartType,
  data: Record<string, string | number>[],
  categoryKey: string,
  series: ChartSeriesConfig[],
  showLegend: boolean,
) {
  switch (type) {
    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis dataKey={categoryKey} stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    case 'stackedBar':
      return (
        <BarChart data={data}>
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis dataKey={categoryKey} stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="stack"
              fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
            />
          ))}
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis dataKey={categoryKey} stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
          <XAxis dataKey={categoryKey} stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <YAxis stroke={CHART_CHROME.axis} tick={{ fill: CHART_CHROME.mutedLabel, fontSize: 12 }} />
          <Tooltip />
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
            />
          ))}
        </AreaChart>
      );
    case 'pie':
    case 'donut': {
      const valueKey = series[0]?.key ?? 'value';
      return (
        <PieChart>
          <Tooltip />
          {showLegend && <Legend />}
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={categoryKey}
            innerRadius={type === 'donut' ? '60%' : 0}
            outerRadius="85%"
            paddingAngle={2}
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

export const ChartContainer = ({ type, data, categoryKey, series, title, height = 300 }: ChartContainerProps) => {
  const showLegend = isPieType(type) ? data.length > 1 : series.length > 1;

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart(type, data, categoryKey, series, showLegend)}
      </ResponsiveContainer>
    </Box>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { ChartContainer } from './ChartContainer';
export type { ChartContainerProps, ChartType, ChartSeriesConfig } from './ChartContainer';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors. If `noFallthroughCasesInSwitch`/exhaustiveness complains about `renderChart` not returning on every path, confirm every `case` has a `return` (it does) — the switch covers all 6 `ChartType` members so no `default` is needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ChartContainer
git commit -m "feat: add ChartContainer recharts wrapper"
```

---

## Task 9: DrillDownBreadcrumb

**Files:**
- Create: `src/components/dashboard/DrillDownBreadcrumb/DrillDownBreadcrumb.tsx`
- Create: `src/components/dashboard/DrillDownBreadcrumb/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';

export interface DrillDownBreadcrumbProps {
  path: string[];
}

export const DrillDownBreadcrumb = ({ path }: DrillDownBreadcrumbProps) => {
  return (
    <MuiBreadcrumbs aria-label="drill-down path" separator="/" sx={{ mb: 2 }}>
      {path.map((segment, index) => {
        const isLast = index === path.length - 1;
        return (
          <Typography
            key={segment}
            variant="body2"
            color={isLast ? 'text.primary' : 'text.secondary'}
            sx={{ fontWeight: isLast ? 600 : 400, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {index === 0 && <PlaceOutlinedIcon sx={{ fontSize: 16 }} />}
            {segment}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { DrillDownBreadcrumb } from './DrillDownBreadcrumb';
export type { DrillDownBreadcrumbProps } from './DrillDownBreadcrumb';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/DrillDownBreadcrumb
git commit -m "feat: add static DrillDownBreadcrumb component"
```

---

## Task 10: AgentSummaryPanel

**Files:**
- Create: `src/components/dashboard/AgentSummaryPanel/AgentSummaryPanel.tsx`
- Create: `src/components/dashboard/AgentSummaryPanel/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Card } from '@components/common';

export interface AgentSummaryPanelProps {
  insights: string[];
}

export const AgentSummaryPanel = ({ insights }: AgentSummaryPanelProps) => {
  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon color="secondary" fontSize="small" />
          <Typography variant="h6">Agent Summary</Typography>
        </Stack>
        <Stack spacing={1.5}>
          {insights.map((insight, index) => (
            <Box
              key={index}
              sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}
            >
              <Typography variant="body2">{insight}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { AgentSummaryPanel } from './AgentSummaryPanel';
export type { AgentSummaryPanelProps } from './AgentSummaryPanel';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/AgentSummaryPanel
git commit -m "feat: add AgentSummaryPanel component"
```

---

## Task 11: ConversationalInsightsPanel

**Files:**
- Create: `src/components/dashboard/ConversationalInsightsPanel/ConversationalInsightsPanel.tsx`
- Create: `src/components/dashboard/ConversationalInsightsPanel/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Card } from '@components/common';

export interface ConversationalQAPair {
  question: string;
  answer: string;
}

export interface ConversationalInsightsPanelProps {
  qaPairs: ConversationalQAPair[];
}

export const ConversationalInsightsPanel = ({ qaPairs }: ConversationalInsightsPanelProps) => {
  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ForumOutlinedIcon color="secondary" fontSize="small" />
          <Typography variant="h6">Conversational Insights</Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {qaPairs.map((pair, index) => (
            <Stack key={index} spacing={1}>
              <Box
                sx={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2">{pair.question}</Typography>
              </Box>
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2">{pair.answer}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField size="small" fullWidth placeholder="Ask a question…" disabled />
          <IconButton disabled>
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};
```

- [ ] **Step 2: Write the barrel export**

```ts
export { ConversationalInsightsPanel } from './ConversationalInsightsPanel';
export type { ConversationalInsightsPanelProps, ConversationalQAPair } from './ConversationalInsightsPanel';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ConversationalInsightsPanel
git commit -m "feat: add ConversationalInsightsPanel component"
```

---

## Task 12: Dashboard components barrel

**Files:**
- Create: `src/components/dashboard/index.ts`

- [ ] **Step 1: Write the barrel**

```ts
export * from './KPICard';
export * from './ChartContainer';
export * from './DrillDownBreadcrumb';
export * from './AgentSummaryPanel';
export * from './ConversationalInsightsPanel';
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/index.ts
git commit -m "feat: add dashboard components barrel export"
```

---

## Task 13: Wire AgentSummary and ConversationalInsights pages

**Files:**
- Modify: `src/pages/AgentSummary/AgentSummary.tsx`
- Modify: `src/pages/ConversationalInsights/ConversationalInsights.tsx`

- [ ] **Step 1: Rewrite AgentSummary.tsx**

```tsx
import { PageHeader } from '@components/common';
import { AgentSummaryPanel } from '@components/dashboard';

const GENERIC_INSIGHTS = [
  'Overall plant efficiency trended upward this period, led by improved capacity utilization at two facilities.',
  'Cost variance narrowed across raw material and logistics categories compared to the prior quarter.',
  'No critical supply chain disruptions were flagged in the current reporting window.',
];

export const AgentSummary = () => {
  return (
    <>
      <PageHeader title="Agent Summary" />
      <AgentSummaryPanel insights={GENERIC_INSIGHTS} />
    </>
  );
};

export default AgentSummary;
```

- [ ] **Step 2: Rewrite ConversationalInsights.tsx**

```tsx
import { PageHeader } from '@components/common';
import { ConversationalInsightsPanel } from '@components/dashboard';

const GENERIC_QA_PAIRS = [
  {
    question: 'What changed most this period?',
    answer: 'Capacity utilization and on-time delivery both improved, while raw material lead time increased slightly.',
  },
  {
    question: 'Which module needs the most attention?',
    answer: 'Procurement shows the widest variance against target this period, primarily in vendor rejection rate.',
  },
  {
    question: 'Are there any critical alerts right now?',
    answer: 'One critical alert is active: defect rate in the Product module exceeds its threshold.',
  },
  {
    question: 'How does this quarter compare to last quarter?',
    answer: 'Revenue and EBITDA margin both improved quarter-over-quarter across most modules.',
  },
  {
    question: 'What should I look at first?',
    answer: 'Start with the Raw Material tab — it has the most significant week-over-week movement.',
  },
];

export const ConversationalInsights = () => {
  return (
    <>
      <PageHeader title="Conversational Insights" />
      <ConversationalInsightsPanel qaPairs={GENERIC_QA_PAIRS} />
    </>
  );
};

export default ConversationalInsights;
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors. (`EmptyState` is no longer imported in either file — if lint flags an unused import, it means the old import line wasn't fully removed; delete it.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/AgentSummary/AgentSummary.tsx src/pages/ConversationalInsights/ConversationalInsights.tsx
git commit -m "feat: wire AgentSummaryPanel and ConversationalInsightsPanel into their pages"
```

---

## Task 14: Raw Material tab + Dashboard tabs

**Files:**
- Create: `src/pages/Dashboard/RawMaterialTab.tsx`
- Modify: `src/pages/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Write RawMaterialTab.tsx**

```tsx
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, DrillDownNode, KPI } from '@types/dashboard';
import {
  KPICard,
  ChartContainer,
  DrillDownBreadcrumb,
  AgentSummaryPanel,
  ConversationalInsightsPanel,
} from '@components/dashboard';

const mockData = mockDataJson as DashboardMockData;

const RAW_MATERIAL_INSIGHTS = [
  'Iron ore inventory at Rourkela has grown 6.1% quarter-over-quarter while coking coal costs rose per tonne — current stock levels cover roughly 38 days of blast furnace demand, above the 30-day safety threshold.',
];

const RAW_MATERIAL_QA_PAIRS = [
  {
    question: 'Which plant holds the highest raw material inventory?',
    answer: 'Rourkela Plant currently holds the largest iron ore inventory among the five plants, followed by Jamshedpur.',
  },
  {
    question: 'Why did coking coal costs increase this quarter?',
    answer: 'Coking coal cost per tonne rose primarily due to higher import freight rates and global benchmark price increases.',
  },
  {
    question: 'Is the raw material wastage rate within target?',
    answer: 'The current wastage rate is slightly above target, driven by higher fines generation at two plants.',
  },
  {
    question: 'How many days of limestone supply do we have on hand?',
    answer: 'Current limestone consumption trends indicate roughly 25 days of on-hand supply at average draw rates.',
  },
  {
    question: 'Which region contributes most to raw material lead time?',
    answer: 'The South zone shows the longest average lead times, largely due to longer inbound freight distances.',
  },
];

const flattenLeafValues = (nodes: DrillDownNode[]): number[] =>
  nodes.flatMap((node) => (node.children ? flattenLeafValues(node.children) : [node.value]));

const findKpi = (kpis: KPI[], id: string): KPI => {
  const kpi = kpis.find((item) => item.id === id);
  if (!kpi) {
    throw new Error(`Missing KPI: ${id}`);
  }
  return kpi;
};

export const RawMaterialTab = () => {
  const { kpis } = mockData.modules.rawMaterial;

  const inventory = findKpi(kpis, 'iron-ore-inventory');
  const coalCost = findKpi(kpis, 'coking-coal-cost-per-tonne');
  const wastageRate = findKpi(kpis, 'raw-material-wastage-rate');
  const limestone = findKpi(kpis, 'limestone-consumption');
  const leadTime = findKpi(kpis, 'raw-material-lead-time');

  const cardKpis = [inventory, coalCost, wastageRate, limestone];

  const inventoryByPlant = inventory.drilldown.root.map((node) => ({ plant: node.label, value: node.value }));
  const coalCostOverTime = coalCost.drilldown.root.map((node) => ({ period: node.label, value: node.value }));
  const leadTimeByGeography = leadTime.drilldown.root.map((node) => ({ zone: node.label, value: node.value }));

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <DrillDownBreadcrumb path={['All Plants', 'East', 'Rourkela Plant']} />

        <Grid container spacing={3}>
          {cardKpis.map((kpi) => (
            <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard
                title={kpi.name}
                value={kpi.current}
                unit={kpi.unit}
                percentChange={kpi.percentChange}
                trend={kpi.trend}
                status={kpi.status}
                sparklineData={flattenLeafValues(kpi.drilldown.root)}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="bar"
              title="Iron Ore Inventory by Plant"
              data={inventoryByPlant}
              categoryKey="plant"
              series={[{ key: 'value', label: 'Inventory (tonnes)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="line"
              title="Coking Coal Cost per Tonne over Time"
              data={coalCostOverTime}
              categoryKey="period"
              series={[{ key: 'value', label: 'Cost per Tonne (INR)' }]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ChartContainer
              type="donut"
              title="Raw Material Lead Time by Geography"
              data={leadTimeByGeography}
              categoryKey="zone"
              series={[{ key: 'value', label: 'Lead Time (days)' }]}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={3} sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <AgentSummaryPanel insights={RAW_MATERIAL_INSIGHTS} />
        <ConversationalInsightsPanel qaPairs={RAW_MATERIAL_QA_PAIRS} />
      </Stack>
    </Stack>
  );
};

export default RawMaterialTab;
```

- [ ] **Step 2: Rewrite Dashboard.tsx with the module tabs**

```tsx
import { useState, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { PageHeader, EmptyState } from '@components/common';
import { RawMaterialTab } from './RawMaterialTab';

const MODULE_TABS = [
  'Raw Material',
  'Cost Analytics',
  'Supply Chain',
  'Procurement',
  'Product',
  'Marketing & Finance',
];

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (_event: SyntheticEvent, value: number) => {
    setActiveTab(value);
  };

  return (
    <>
      <PageHeader title="Dashboard" />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {MODULE_TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>
      {activeTab === 0 ? (
        <RawMaterialTab />
      ) : (
        <EmptyState
          title={`${MODULE_TABS[activeTab] ?? ''} Coming Soon`}
          description="This module is under active development."
        />
      )}
    </>
  );
};

export default Dashboard;
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors. Pay attention to `noUncheckedIndexedAccess` errors on any array indexing — `MODULE_TABS[activeTab]` is already guarded with `?? ''`; `cardKpis`/`kpis.find` results are guarded via `findKpi`'s throw.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/RawMaterialTab.tsx src/pages/Dashboard/Dashboard.tsx
git commit -m "feat: build Raw Material tab with module tab bar"
```

---

## Task 15: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (background)
Expected: server starts at `http://localhost:5173`.

- [ ] **Step 3: Visually verify in the browser**

Navigate to `http://localhost:5173/dashboard` and confirm:
- Header shows the KPMG-blue logo placeholder box and app title; background is white.
- A Global Filter bar with 7 dropdowns (Plant, Region, Business Unit, Product Category, Year, Quarter, Month) appears below the header on every page.
- The Dashboard page shows a 6-tab bar; the Raw Material tab (selected by default) shows: the drill-down breadcrumb, 4 KPI cards each with a colored status chip, trend arrow, and sparkline, 3 charts (bar / line / donut) with real numbers, and a right-hand rail with the Agent Summary panel (1 insight) and Conversational Insights panel (5 Q&A bubbles + disabled input).
- The other 5 tabs show a "Coming Soon" empty state.
- `/agent-summary` and `/conversational-insights` routes show their panels with generic placeholder content.

- [ ] **Step 4: Stop the dev server**

Stop the background `npm run dev` process once verification is done.

---

## Self-Review Notes

- **Spec coverage:** Task 1 → mock-data spec types; Task 2 → mock-data spec data; Tasks 3–4 → theme/header spec; Task 5 → filter-bar spec; Tasks 6–12 → dashboard-widgets spec (including the panel-props revision from the Raw Material tab spec); Tasks 13–14 → Raw Material tab spec's page wiring and tab structure. All four spec documents are covered.
- **Placeholder scan:** no "TBD"/"similar to Task N" — every step has complete file content.
- **Type consistency:** `KPIStatus`/`KPITrend`/`DrilldownDimension` (Task 1) are the exact names imported in KPICard (Task 7) and used as literal values in the generator (Task 2); `ChartContainerProps`/`ChartSeriesConfig` (Task 8) match the call sites in Task 14; `AgentSummaryPanelProps`/`ConversationalInsightsPanelProps` (Tasks 10–11) match their usage in Tasks 13–14.
