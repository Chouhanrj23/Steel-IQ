export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
