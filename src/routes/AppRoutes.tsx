import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@components/layout';
import { Dashboard } from '@pages/Dashboard';
import { Analytics } from '@pages/Analytics';
import { AgentSummary } from '@pages/AgentSummary';
import { ConversationalInsights } from '@pages/ConversationalInsights';
import { Settings } from '@pages/Settings';
import { NotFound } from '@pages/NotFound';
import { ROUTES } from './paths';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
        <Route path={ROUTES.AGENT_SUMMARY} element={<AgentSummary />} />
        <Route path={ROUTES.CONVERSATIONAL_INSIGHTS} element={<ConversationalInsights />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
