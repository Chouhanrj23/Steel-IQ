import { create } from 'zustand';
import type { DrilldownDimension } from '@/types/dashboard';

export interface DrillSelection {
  dimension: DrilldownDimension;
  path: string[];
}

export interface DashboardState {
  drill: DrillSelection;
  drillInto: (dimension: DrilldownDimension, label: string) => void;
  drillToDimensionRoot: (dimension: DrilldownDimension) => void;
  drillToSegment: (index: number) => void;
}

const INITIAL_DRILL: DrillSelection = { dimension: 'plant', path: [] };

export const useDashboardStore = create<DashboardState>((set) => ({
  drill: INITIAL_DRILL,
  drillInto: (dimension, label) =>
    set((state) => ({
      drill:
        state.drill.dimension === dimension
          ? { dimension, path: [...state.drill.path, label] }
          : { dimension, path: [label] },
    })),
  drillToDimensionRoot: (dimension) => set({ drill: { dimension, path: [] } }),
  drillToSegment: (index) =>
    set((state) => ({
      drill:
        index < 0 ? INITIAL_DRILL : { dimension: state.drill.dimension, path: state.drill.path.slice(0, index + 1) },
    })),
}));
