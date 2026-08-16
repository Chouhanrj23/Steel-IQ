import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { CATEGORICAL_COLORS } from './chartPalette';
import type { ModuleKey } from '@/types/dashboard';

export type VerticalDensity = 'industrial' | 'financial' | 'standard';

export interface VerticalThemeEntry {
  /** This vertical's own accent — distinct from `STATUS_COLORS`, which stays reserved for
   * health (good/warning/critical) everywhere. Eight of the nine are drawn straight from
   * `CATEGORICAL_COLORS` (replayed here with the meaning "this specific vertical" rather than
   * "the Nth data series" — one palette, two roles) — periwinkle is the one exception, since
   * nine verticals don't divide evenly into an eight-color rotation. */
  accent: string;
  /** The vertical's own icon — carried from the tab strip into that tab's own content (KPI card
   * icon badges, Exceptions grouping) so there's a visual thread from "which tab" to "what am I
   * looking at", per the rebrand brief. */
  icon: SvgIconComponent;
  density: VerticalDensity;
}

/** One accent + icon per vertical, coordinated (not random) — see `src/theme/palette.ts` for
 * the reasoning behind the palette itself. Icons picked for domain fit: a literal
 * factory/smelter for the two ore-and-metal-producing tabs, a hard hat for engineering &
 * projects, a bank for the finance tab, etc. */
export const VERTICAL_THEME: Record<ModuleKey, VerticalThemeEntry> = {
  rawMaterial: { accent: '#B5602E', icon: FactoryOutlinedIcon, density: 'industrial' }, // terracotta
  costAnalytics: { accent: '#1E7A5F', icon: PaidOutlinedIcon, density: 'standard' }, // emerald
  supplyChain: { accent: '#1B7A96', icon: LocalShippingOutlinedIcon, density: 'standard' }, // cyan-teal
  procurement: { accent: '#A8791C', icon: ShoppingCartOutlinedIcon, density: 'standard' }, // gold
  ep: { accent: '#5B4B99', icon: EngineeringOutlinedIcon, density: 'standard' }, // indigo
  tsk: { accent: '#8B3B6B', icon: DomainOutlinedIcon, density: 'standard' }, // plum
  tsj: { accent: '#6B7A2E', icon: PrecisionManufacturingOutlinedIcon, density: 'standard' }, // olive
  tspl: { accent: '#5E6FA3', icon: Inventory2OutlinedIcon, density: 'standard' }, // periwinkle
  marketingFinance: { accent: '#9C3B4A', icon: AccountBalanceOutlinedIcon, density: 'financial' }, // wine
};

/** Which verticals have the full accent-color + density treatment switched on — everything
 * else still gets its icon (per the brief's "add icons throughout", not scoped to a preview)
 * but keeps the previous neutral tab-strip/KPI-card coloring until this rollout is approved and
 * every remaining `ModuleKey` is added here. Delete this gate (and the `isPreviewModule` checks
 * that read it) once that happens — nothing else about the design should need to change. */
const PREVIEW_MODULES = new Set<ModuleKey>(['rawMaterial', 'marketingFinance']);

export const isPreviewModule = (module: ModuleKey): boolean => PREVIEW_MODULES.has(module);

/** `ChartContainer`'s `colorOffset` for the `index`-th chart in a preview-module tab's row, so
 * that row's *first* chart lands on the vertical's own accent instead of always starting the
 * rotation at index 0 — the concrete form of "the tab's accent carries through into its
 * content." Falls back to a plain `index` (today's default rotation) for a vertical whose
 * accent isn't one of the eight `CATEGORICAL_COLORS` entries (only periwinkle/TSPL, currently),
 * rather than erroring. */
export const verticalColorOffset = (module: ModuleKey, index: number): number => {
  const base = CATEGORICAL_COLORS.indexOf(VERTICAL_THEME[module].accent);
  return base === -1 ? index : (base + index) % CATEGORICAL_COLORS.length;
};
