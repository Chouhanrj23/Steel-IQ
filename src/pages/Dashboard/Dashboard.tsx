import type { ComponentType } from 'react';
import { useDashboardStore, type TabKey } from '@store/dashboard';
import { OverviewTab } from './OverviewTab';
import { ExploreTab } from './ExploreTab';
import { ExceptionsTab } from './ExceptionsTab';
import { RawMaterialTab } from './RawMaterialTab';
import { CostAnalyticsTab } from './CostAnalyticsTab';
import { SupplyChainTab } from './SupplyChainTab';
import { ProcurementTab } from './ProcurementTab';
import { EPTab } from './EPTab';
import { TSKTab } from './TSKTab';
import { TSJTab } from './TSJTab';
import { TSPLTab } from './TSPLTab';
import { MarketingFinanceTab } from './MarketingFinanceTab';

// Keyed by TabKey rather than array position — the *visible* tab list's length and order are
// persona-scoped (see src/data/personas.ts), but every tab's content always exists here so
// navigating to a tab outside the current persona's scope (e.g. an Exceptions "View in X" link)
// still renders correctly, it just won't be highlighted in the strip (rendered by `TabStrip`,
// a standalone layout component — see `AppLayout.tsx` — not by this page itself).
const TAB_COMPONENTS: Record<TabKey, ComponentType> = {
  overview: OverviewTab,
  explore: ExploreTab,
  exceptions: ExceptionsTab,
  rawMaterial: RawMaterialTab,
  costAnalytics: CostAnalyticsTab,
  supplyChain: SupplyChainTab,
  procurement: ProcurementTab,
  ep: EPTab,
  tsk: TSKTab,
  tsj: TSJTab,
  tspl: TSPLTab,
  marketingFinance: MarketingFinanceTab,
};

export const Dashboard = () => {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return <ActiveTabComponent />;
};

export default Dashboard;
