import { useState, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { PageHeader, EmptyState } from '@components/common';
import { RawMaterialTab } from './RawMaterialTab';
import { CostAnalyticsTab } from './CostAnalyticsTab';
import { SupplyChainTab } from './SupplyChainTab';

const MODULE_TABS = [
  'Raw Material',
  'Cost Analytics',
  'Supply Chain',
  'Procurement',
  'Product',
  'Marketing & Finance',
];

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (_event: SyntheticEvent, value: number) => {
    setActiveTab(value);
  };

  return (
    <>
      <PageHeader title="Dashboard" />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {MODULE_TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>
      {activeTab === 0 && <RawMaterialTab />}
      {activeTab === 1 && <CostAnalyticsTab />}
      {activeTab === 2 && <SupplyChainTab />}
      {activeTab > 2 && (
        <EmptyState
          title={`${MODULE_TABS[activeTab] ?? ''} Coming Soon`}
          description="This module is under active development."
        />
      )}
    </>
  );
};

export default Dashboard;
