import { create } from 'zustand';

export type DashboardState = Record<string, never>;

export const useDashboardStore = create<DashboardState>(() => ({}));
