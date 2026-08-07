import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { theme } from '@theme/index';
import { queryClient } from '@config/queryClient';
import { AppRoutes } from '@routes/AppRoutes';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
