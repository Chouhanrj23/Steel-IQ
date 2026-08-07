import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#00338D',
    light: '#335CA4',
    dark: '#002463',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#6E2C8D',
    light: '#8B56A4',
    dark: '#4D1F63',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#FFFFFF',
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
