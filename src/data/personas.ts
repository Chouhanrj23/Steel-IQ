import type { ModuleKey } from '@/types/dashboard';

/** A tab in the strip is one of the cross-module views (Overview, Explore, Exceptions) or one
 * of the nine module dashboards. Kept as a single union (rather than a numeric index) so
 * persona-scoped tab lists of different lengths/orders can all use the same key space — no
 * "index 2 means something different for every persona" fragility. */
export type TabKey = 'overview' | 'explore' | 'exceptions' | ModuleKey;

export interface Persona {
  id: string;
  label: string;
  /** Short line shown in the selector to explain who this role is. */
  description: string;
  /** Visible tabs, in display/priority order — `tabs[0]` is what this persona lands on when
   * they switch to it. Tabs not listed here are hidden from the nav entirely (not just
   * de-emphasized), per the "scope the dashboard to a role" requirement. */
  tabs: TabKey[];
}

// Five personas mapped onto the nine real modules (Raw Material, Cost Analytics, Supply Chain,
// Procurement, E&P, TSK, TSJ, TSPL, Marketing & Finance) plus the cross-module Overview,
// Explore, and Exceptions views. Every persona keeps all three reachable (they're low-cost,
// high-value summary/self-service tools), but only Executive/CXO leads with Overview —
// everyone else lands on their functional home tab. Non-obvious additions beyond each
// persona's core functional tabs: Plant Head gets E&P (plant capital/expansion projects are a
// plant-floor concern); CFO gets E&P (capex tracking) and TSK (receivables/recovery); Procurement
// Lead gets TSPL (SRM/contract cost is a procurement-adjacent spend category).
export const PERSONAS: Persona[] = [
  {
    id: 'plant-head',
    label: 'Plant Head',
    description: 'Production, raw material, and plant-floor operations',
    tabs: ['rawMaterial', 'tsj', 'supplyChain', 'ep', 'overview', 'explore', 'exceptions'],
  },
  {
    id: 'cfo',
    label: 'CFO / Finance Lead',
    description: 'Cost, spend, and financial performance',
    tabs: [
      'costAnalytics',
      'procurement',
      'marketingFinance',
      'ep',
      'tsk',
      'overview',
      'explore',
      'exceptions',
    ],
  },
  {
    id: 'procurement-lead',
    label: 'Procurement Lead',
    description: 'Sourcing, vendor spend, and supplier performance',
    tabs: ['procurement', 'rawMaterial', 'costAnalytics', 'tspl', 'overview', 'explore', 'exceptions'],
  },
  {
    id: 'supply-chain-lead',
    label: 'Supply Chain Lead',
    description: 'Logistics, delivery, and inventory flow',
    tabs: ['supplyChain', 'rawMaterial', 'tsj', 'overview', 'explore', 'exceptions'],
  },
  {
    id: 'executive',
    label: 'Executive / CXO',
    description: 'Cross-functional oversight — overview and exceptions first',
    tabs: [
      'overview',
      'exceptions',
      'rawMaterial',
      'costAnalytics',
      'supplyChain',
      'procurement',
      'ep',
      'tsk',
      'tsj',
      'tspl',
      'marketingFinance',
      'explore',
    ],
  },
];

const FALLBACK_PERSONA = PERSONAS[0] as Persona;

export const DEFAULT_PERSONA_ID = FALLBACK_PERSONA.id;

export const getPersona = (id: string): Persona => PERSONAS.find((p) => p.id === id) ?? FALLBACK_PERSONA;
