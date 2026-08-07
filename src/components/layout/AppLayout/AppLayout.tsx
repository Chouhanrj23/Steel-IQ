import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { GlobalFilterBar } from '../GlobalFilterBar';

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
        <GlobalFilterBar />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
