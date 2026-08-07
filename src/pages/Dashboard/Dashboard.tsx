import { PageHeader, EmptyState } from '@components/common';

export const Dashboard = () => {
  return (
    <>
      <PageHeader title="Dashboard" />
      <EmptyState title="Dashboard Coming Soon" description="This section is under active development." />
    </>
  );
};

export default Dashboard;
