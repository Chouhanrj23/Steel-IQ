import { useState, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { PageHeader } from '@components/common';
import { RawMaterialTab } from './RawMaterialTab';
import { CostAnalyticsTab } from './CostAnalyticsTab';
import { SupplyChainTab } from './SupplyChainTab';
import { ProcurementTab } from './ProcurementTab';
import { ProductTab } from './ProductTab';
import { MarketingFinanceTab } from './MarketingFinanceTab';

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
      <PageHeader
        title="Dashboard"
        subtitle="Cross-functional performance insights across raw material, cost, supply chain, procurement, product, and financial operations"
      />
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
      {activeTab === 3 && <ProcurementTab />}
      {activeTab === 4 && <ProductTab />}
      {activeTab === 5 && <MarketingFinanceTab />}
    </>
  );
};

export default Dashboard;
