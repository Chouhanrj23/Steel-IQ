import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@components/layout';
import { Dashboard } from '@pages/Dashboard';
import { NotFound } from '@pages/NotFound';
import { ROUTES } from './paths';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
