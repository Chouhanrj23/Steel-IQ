import { create } from 'zustand';
import type { DrilldownDimension } from '@/types/dashboard';
import type { LensType } from '@/data/earlyWarningRules';
import { DEFAULT_PERSONA_ID, getPersona, type TabKey } from '@/data/personas';

export type HierarchyKey = DrilldownDimension;
export type { TabKey };

/** A one-shot request to jump a specific KPI card into view on its own lens — set by the
 * Exceptions view or the Early Warning Strip, consumed and cleared by that card via
 * `useKpiCardFocus`. */
export interface FocusRequest {
  kpiId: string;
  lens: LensType;
}

export interface DrillSelection {
  hierarchy: HierarchyKey;
  path: string[];
}

/** Cross-cutting filters from the global filter bar. `null` means "All" (unfiltered). These
 * compose with `drill` (AND) rather than replacing it. `plant` lives here (not in `drill`) even
 * though it used to share `drill`'s single hierarchy/path slot — that made the global Plant
 * dropdown and the in-page Time/Plant drill-down toggle silently fight over the same state
 * (picking a plant discarded an active Year/Quarter/Month selection and vice versa). As a
 * cross-filter it now composes independently, the same way region/businessUnit/productCategory
 * already do, leaving `drill` free for the in-page toggle alone. */
export interface CrossFilters {
  region: string | null;
  businessUnit: string | null;
  productCategory: string | null;
  plant: string | null;
}

export interface DashboardState {
  drill: DrillSelection;
  crossFilters: CrossFilters;
  /** Which tab is showing — a key rather than a numeric index, since the visible tab list's
   * length and order both change per persona (index 2 would mean a different tab for a Plant
   * Head than for a CFO). Lifted out of `Dashboard.tsx`'s local state so the Exceptions view
   * can switch tabs from outside it. */
  activeTab: TabKey;
  /** Simulated role view — client-side only, no real access control. Determines which tabs
   * are visible/prioritized in the nav; see `src/data/personas.ts`. */
  personaId: string;
  focusRequest: FocusRequest | null;
  /** One-shot: a plant to drill straight to once Raw Material (re)mounts. Needed because every
   * tab resets `drill` to that hierarchy's root on mount (so a *different* tab's leftover path
   * isn't misread against this tab's tree) — without this, that reset would immediately wipe
   * out a plant pre-filter set from outside the tab, e.g. the Overview health cards. */
  pendingPlantFilter: string | null;
  /** Session-only Early Warning rule overrides set from each tab's Configuration panel, keyed by
   * kpiId — never persisted (no localStorage/persist middleware on this store), so a page reload
   * resets every KPI back to its authored default. See `EarlyWarningOverrides` in
   * `earlyWarningRules.ts` for how these are consumed. */
  thresholdOverrides: Record<string, number>;
  varianceOverrides: Record<string, number>;
  drillInto: (hierarchy: HierarchyKey, label: string) => void;
  drillToHierarchyRoot: (hierarchy: HierarchyKey) => void;
  drillToSegment: (index: number) => void;
  setHierarchyPath: (hierarchy: HierarchyKey, path: string[]) => void;
  setRegion: (region: string | null) => void;
  setBusinessUnit: (businessUnit: string | null) => void;
  setProductCategory: (productCategory: string | null) => void;
  setPlant: (plant: string | null) => void;
  setActiveTab: (tab: TabKey) => void;
  setPersona: (personaId: string) => void;
  requestFocus: (kpiId: string, lens: LensType) => void;
  clearFocusRequest: () => void;
  setPendingPlantFilter: (plant: string | null) => void;
  setThresholdOverride: (kpiId: string, boundary: number) => void;
  setVarianceOverride: (kpiId: string, tolerancePct: number) => void;
  /** Removes just this KPI's Threshold override, reverting it to its authored status — scoped
   * per-KPI (rather than one global "reset everything") since the Configuration panel's "Reset
   * to defaults" now lives inside each KPI's own accordion section. */
  clearThresholdOverride: (kpiId: string) => void;
  clearVarianceOverride: (kpiId: string) => void;
}

const INITIAL_DRILL: DrillSelection = { hierarchy: 'plant', path: [] };
const INITIAL_CROSS_FILTERS: CrossFilters = {
  region: null,
  businessUnit: null,
  productCategory: null,
  plant: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  drill: INITIAL_DRILL,
  crossFilters: INITIAL_CROSS_FILTERS,
  activeTab: getPersona(DEFAULT_PERSONA_ID).tabs[0] ?? 'exceptions',
  personaId: DEFAULT_PERSONA_ID,
  focusRequest: null,
  pendingPlantFilter: null,
  thresholdOverrides: {},
  varianceOverrides: {},
  drillInto: (hierarchy, label) =>
    set((state) => ({
      drill:
        state.drill.hierarchy === hierarchy
          ? { hierarchy, path: [...state.drill.path, label] }
          : { hierarchy, path: [label] },
    })),
  drillToHierarchyRoot: (hierarchy) => set({ drill: { hierarchy, path: [] } }),
  drillToSegment: (index) =>
    set((state) => ({
      drill:
        index < 0
          ? INITIAL_DRILL
          : { hierarchy: state.drill.hierarchy, path: state.drill.path.slice(0, index + 1) },
    })),
  setHierarchyPath: (hierarchy, path) => set({ drill: { hierarchy, path } }),
  setRegion: (region) => set((state) => ({ crossFilters: { ...state.crossFilters, region } })),
  setBusinessUnit: (businessUnit) =>
    set((state) => ({ crossFilters: { ...state.crossFilters, businessUnit } })),
  setProductCategory: (productCategory) =>
    set((state) => ({ crossFilters: { ...state.crossFilters, productCategory } })),
  setPlant: (plant) => set((state) => ({ crossFilters: { ...state.crossFilters, plant } })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  // Switching persona re-scopes the nav, so it also re-lands on that persona's own home tab —
  // staying on a tab the new persona doesn't show would be a broken/confusing state.
  setPersona: (personaId) => set({ personaId, activeTab: getPersona(personaId).tabs[0] ?? 'exceptions' }),
  requestFocus: (kpiId, lens) => set({ focusRequest: { kpiId, lens } }),
  clearFocusRequest: () => set({ focusRequest: null }),
  setPendingPlantFilter: (plant) => set({ pendingPlantFilter: plant }),
  setThresholdOverride: (kpiId, boundary) =>
    set((state) => ({ thresholdOverrides: { ...state.thresholdOverrides, [kpiId]: boundary } })),
  setVarianceOverride: (kpiId, tolerancePct) =>
    set((state) => ({ varianceOverrides: { ...state.varianceOverrides, [kpiId]: tolerancePct } })),
  clearThresholdOverride: (kpiId) =>
    set((state) => {
      const { [kpiId]: _removed, ...rest } = state.thresholdOverrides;
      return { thresholdOverrides: rest };
    }),
  clearVarianceOverride: (kpiId) =>
    set((state) => {
      const { [kpiId]: _removed, ...rest } = state.varianceOverrides;
      return { varianceOverrides: rest };
    }),
}));
