import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';

const themeOptions: ThemeOptions = {
  palette,
  typography,
  shadows,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            borderColor: 'rgba(16, 24, 40, 0.08)',
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06), 0px 1px 2px rgba(16, 24, 40, 0.04)',
          },
        },
      ],
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          minHeight: 48,
          '&.Mui-selected': {
            fontWeight: 700,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export default theme;
