import { useEffect, useState } from 'react';
import { useDashboardStore } from '@store/dashboard';
import type { LensType } from '@/data/earlyWarningRules';

/** Owns a single KPI card's lens selection, and consumes the store's one-shot `focusRequest`
 * when it names this KPI: switches to the requested lens, scrolls the card's anchor
 * (`#kpi-anchor-{kpiId}`) into view, then clears the request. Local-state-by-default (matching
 * how `Dashboard.tsx` already manages its own UI state), with the store only used for the one
 * piece of state that genuinely needs to cross tab boundaries — a card being told to focus by
 * the Exceptions view or another tab's Early Warning Strip. */
export const useKpiCardFocus = (kpiId: string) => {
  const [lens, setLens] = useState<LensType>('Trend');
  const focusRequest = useDashboardStore((state) => state.focusRequest);
  const clearFocusRequest = useDashboardStore((state) => state.clearFocusRequest);

  useEffect(() => {
    if (focusRequest?.kpiId !== kpiId) return;
    setLens(focusRequest.lens);
    const el = document.getElementById(`kpi-anchor-${kpiId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clearFocusRequest();
  }, [focusRequest, kpiId, clearFocusRequest]);

  return { lens, setLens };
};
