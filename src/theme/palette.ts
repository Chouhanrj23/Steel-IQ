import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#1565C0',
    light: '#5E92F3',
    dark: '#003C8F',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#26A69A',
    light: '#64D8CB',
    dark: '#00766C',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F6F8FB',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A2027',
    secondary: '#5A6472',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
  success: {
    main: '#2E7D32',
  },
  warning: {
    main: '#ED6C02',
  },
  error: {
    main: '#D32F2F',
  },
  info: {
    main: '#0288D1',
  },
};
