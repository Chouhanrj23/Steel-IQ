import { create } from 'zustand';
import type { DrilldownDimension } from '@/types/dashboard';

export type HierarchyKey = DrilldownDimension;

export interface DrillSelection {
  hierarchy: HierarchyKey;
  path: string[];
}

export interface DashboardState {
  drill: DrillSelection;
  drillInto: (hierarchy: HierarchyKey, label: string) => void;
  drillToHierarchyRoot: (hierarchy: HierarchyKey) => void;
  drillToSegment: (index: number) => void;
  setHierarchyPath: (hierarchy: HierarchyKey, path: string[]) => void;
}

const INITIAL_DRILL: DrillSelection = { hierarchy: 'plant', path: [] };

export const useDashboardStore = create<DashboardState>((set) => ({
  drill: INITIAL_DRILL,
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
        index < 0 ? INITIAL_DRILL : { hierarchy: state.drill.hierarchy, path: state.drill.path.slice(0, index + 1) },
    })),
  setHierarchyPath: (hierarchy, path) => set({ drill: { hierarchy, path } }),
}));
