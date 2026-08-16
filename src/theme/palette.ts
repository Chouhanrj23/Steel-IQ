import type { PaletteOptions } from '@mui/material/styles';

// Deliberately not navy blue + steel grey + red/orange — that combination reads as Tata Group's
// own public identity (the old primary, #00338D, was in fact a near-exact match for it), and
// this is a client-facing internal tool, not a Tata-branded surface. Built as its own
// self-consistent language instead: a deep teal anchors the chrome (cool but distinctly
// green-blue, not corporate navy), a warm aubergine gives it a second, non-competing accent,
// and the neutrals shift warm (stone/charcoal) rather than the previous cool blue-grey, so the
// temperature shift holds even where no brand color is visible at all. See
// `src/components/dashboard/verticalTheme.ts` for the nine per-vertical accents built to
// coordinate with this same palette.
export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#146B63',
    light: '#3D8F87',
    dark: '#0B4C46',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#6B3B5C',
    light: '#8F5C7E',
    dark: '#4A2640',
    contrastText: '#FFFFFF',
  },
  background: {
    // Warm stone instead of the previous cool blue-grey — a soft canvas (vs. pure white cards)
    // still gives cards visual "lift" without heavy shadows/borders, but the warmth carries the
    // temperature shift into every corner of the page, not just wherever an accent color shows.
    default: '#F7F5F1',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#2A2622',
    secondary: '#6B6459',
  },
  divider: 'rgba(42, 38, 34, 0.08)',
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
