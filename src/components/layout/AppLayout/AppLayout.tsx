import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { HEADER_HEIGHT } from '@utils/constants';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { GlobalFilterBar } from '../GlobalFilterBar';
import { TabStrip } from '../TabStrip';

export const AppLayout = () => {
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
          <GlobalFilterBar />
        </Box>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
