import type { ModuleKey } from '@/types/dashboard';

/** The nine modules, in their canonical (persona-independent) order — matches `mockData.json`
 * and the client's KPI Playbook. Used by `ExceptionsTab.tsx` to group signals; the tab
 * *strip*'s actual visible order is persona-scoped (see `src/data/personas.ts`) and lives in
 * `Dashboard.tsx`. */
export const MODULE_TAB_ORDER: ModuleKey[] = [
  'rawMaterial',
  'costAnalytics',
  'supplyChain',
  'procurement',
  'ep',
  'tsk',
  'tsj',
  'tspl',
  'marketingFinance',
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  rawMaterial: 'Raw Material',
  costAnalytics: 'Cost Analytics',
  supplyChain: 'Supply Chain',
  procurement: 'Procurement',
  ep: 'E&P',
  tsk: 'TSK',
  tsj: 'TSJ',
  tspl: 'TSPL',
  marketingFinance: 'Marketing & Finance',
};

/** Full names for the abbreviated business-unit tabs, per client clarification — shown as a
 * tooltip/caption wherever the short label alone would be ambiguous (tab strip, Health cards,
 * Exceptions grouping, each tab's own breadcrumb row and Agent Summary context). Deliberately
 * `Partial`: E&P stays abbreviation-only for now (no full form yet), and the five KPI-Playbook
 * module names (Raw Material, Cost Analytics, Supply Chain, Procurement, Marketing & Finance)
 * were never abbreviations in the first place, so neither has an entry here. */
export const MODULE_FULL_NAMES: Partial<Record<ModuleKey, string>> = {
  tsj: 'Tata Steel Jamshedpur',
  tsk: 'Tata Steel Kalinganagar',
  tspl: 'Tata Steel Downstream Products Limited',
};
