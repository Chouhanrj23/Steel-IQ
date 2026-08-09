import { create } from 'zustand';
import type { DrilldownDimension } from '@/types/dashboard';

export type HierarchyKey = DrilldownDimension;

export interface DrillSelection {
  hierarchy: HierarchyKey;
  path: string[];
}

/** Cross-cutting filters from the global filter bar. `null` means "All" (unfiltered). These
 * compose with `drill` (AND) rather than replacing it. */
export interface CrossFilters {
  region: string | null;
  businessUnit: string | null;
  productCategory: string | null;
}

export interface DashboardState {
  drill: DrillSelection;
  crossFilters: CrossFilters;
  drillInto: (hierarchy: HierarchyKey, label: string) => void;
  drillToHierarchyRoot: (hierarchy: HierarchyKey) => void;
  drillToSegment: (index: number) => void;
  setHierarchyPath: (hierarchy: HierarchyKey, path: string[]) => void;
  setRegion: (region: string | null) => void;
  setBusinessUnit: (businessUnit: string | null) => void;
  setProductCategory: (productCategory: string | null) => void;
}

const INITIAL_DRILL: DrillSelection = { hierarchy: 'plant', path: [] };
const INITIAL_CROSS_FILTERS: CrossFilters = { region: null, businessUnit: null, productCategory: null };

export const useDashboardStore = create<DashboardState>((set) => ({
  drill: INITIAL_DRILL,
  crossFilters: INITIAL_CROSS_FILTERS,
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
}));
