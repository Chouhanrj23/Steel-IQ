import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { HEADER_HEIGHT } from '@utils/constants';
import { useDashboardStore } from '@store/dashboard';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { GlobalFilterBar } from '../GlobalFilterBar';
import { TabStrip } from '../TabStrip';

// Overview, Exceptions, and Explore each read straight from raw mock data (health rollups,
// cross-module signal evaluation, and Explore's own independent KPI/level picker respectively) —
// none of them consult `crossFilters`/`drill`, so the global filter bar's controls would sit
// there interactive but inert on those three. Hiding it there instead of leaving it visibly
// connected-but-dead is the fix; only the 9 module tabs actually filter.
const TABS_WITHOUT_GLOBAL_FILTERS = new Set(['overview', 'exceptions', 'explore']);

export const AppLayout = () => {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const showFilterBar = !TABS_WITHOUT_GLOBAL_FILTERS.has(activeTab);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {/* Tab strip and filter bar stick together as one group directly below the fixed
            Header, in that order — the tab strip is the topmost sticky element, the filter
            bar sticks right beneath it, and both stay pinned while a tab's own content
            scrolls underneath. zIndex sits just below the Header's (theme.zIndex.appBar) so
            it tucks under the Header rather than overlapping it while scrolling. */}
        <Box sx={{ position: 'sticky', top: HEADER_HEIGHT, zIndex: (theme) => theme.zIndex.appBar - 1 }}>
          <TabStrip />
          {showFilterBar && <GlobalFilterBar />}
        </Box>
        {/* Explicit `position: relative` + `zIndex: 0` here (rather than leaving this box
            unpositioned) pins every tab's content — including sidebar panels like
            ConfigurationPanel — into its own stacking context capped below the sticky bar
            above. Flex items with a z-index already form their own stacking context per spec,
            so this guarantees tab content can never accidentally paint over the sticky tab
            strip/filter bar, regardless of any z-index a descendant sets internally. */}
        <Box sx={{ flexGrow: 1, p: 3, position: 'relative', zIndex: 0 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
