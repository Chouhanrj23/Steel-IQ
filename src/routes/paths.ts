export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  AGENT_SUMMARY: '/agent-summary',
  CONVERSATIONAL_INSIGHTS: '/conversational-insights',
  SETTINGS: '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
