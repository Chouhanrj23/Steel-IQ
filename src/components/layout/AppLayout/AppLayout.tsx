import { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { GlobalFilterBar } from '../GlobalFilterBar';
import { DRAWER_WIDTH } from '@utils/constants';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={() => setMobileOpen((prev) => !prev)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <GlobalFilterBar />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
