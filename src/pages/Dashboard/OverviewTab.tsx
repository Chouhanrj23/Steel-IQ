import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import type { ReactNode } from 'react';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, ModuleKey } from '@/types/dashboard';
import { useDashboardStore } from '@store/dashboard';
import { computePlantHealth, computeFunctionHealth } from '@/data/healthRollup';
import { HealthCard } from '@components/dashboard';
import { MODULE_FULL_NAMES } from './moduleTabs';

const mockData = mockDataJson as DashboardMockData;

const FUNCTION_ICONS: Record<ModuleKey, ReactNode> = {
  rawMaterial: <Inventory2OutlinedIcon fontSize="small" />,
  costAnalytics: <RequestQuoteOutlinedIcon fontSize="small" />,
  supplyChain: <LocalShippingOutlinedIcon fontSize="small" />,
  procurement: <ShoppingCartOutlinedIcon fontSize="small" />,
  ep: <ConstructionOutlinedIcon fontSize="small" />,
  tsk: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
  tsj: <PrecisionManufacturingOutlinedIcon fontSize="small" />,
  tspl: <HandshakeOutlinedIcon fontSize="small" />,
  marketingFinance: <TrendingUpOutlinedIcon fontSize="small" />,
};

export const OverviewTab = () => {
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const setPendingPlantFilter = useDashboardStore((state) => state.setPendingPlantFilter);

  const plantCards = computePlantHealth(mockData);
  const functionCards = computeFunctionHealth(mockData);

  // A plant's associated KPIs span several tabs (Raw Material, Cost Analytics, Procurement,
  // Supply Chain, TSJ); Raw Material is the closest thing this app has to a single
  // plant-operations home, so that's where a plant card's click-through lands. It pre-filters
  // via the same Plant hierarchy the GlobalFilterBar's own Plant dropdown drives — no separate
  // filtering mechanism. The filter itself is applied by RawMaterialTab on mount (via
  // `pendingPlantFilter`), not here — Raw Material's own mount effect resets the drill to root,
  // which would otherwise immediately wipe out a path set before navigating to it.
  const goToPlant = (plant: string) => {
    setPendingPlantFilter(plant);
    setActiveTab('rawMaterial');
  };

  const goToFunction = (module: ModuleKey) => {
    setActiveTab(module);
  };

  return (
    <Stack spacing={4}>
      <Stack spacing={0.5}>
        <Typography variant="h5">Overview</Typography>
        <Typography variant="body2" color="text.secondary">
          Aggregate health by Plant and by Function — rolled up from the same Early Warning Signals evaluated
          on each tab, not a separate scoring system.
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">By Plant</Typography>
          <Typography variant="caption" color="text.secondary">
            {plantCards[0]?.totalCount ?? 0} plant-dimensioned KPIs per plant
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 760 }}>
          Signals are evaluated per KPI, not per plant — a flagged plant-dimensioned KPI applies to every
          plant it covers, so plants sharing the same KPIs currently show the same status. Click a card to
          open Raw Material filtered to that plant.
        </Typography>
        <Grid container spacing={2}>
          {plantCards.map((card) => (
            <Grid key={card.id} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <HealthCard
                icon={<FactoryOutlinedIcon fontSize="small" />}
                label={card.label}
                status={card.status}
                flaggedCount={card.flaggedCount}
                totalCount={card.totalCount}
                onClick={() => goToPlant(card.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="h6">By Function</Typography>
        <Grid container spacing={2}>
          {functionCards.map((card) => {
            const fullName = MODULE_FULL_NAMES[card.id as ModuleKey];
            const healthCard = (
              <HealthCard
                icon={FUNCTION_ICONS[card.id as ModuleKey]}
                label={card.label}
                status={card.status}
                flaggedCount={card.flaggedCount}
                totalCount={card.totalCount}
                onClick={() => goToFunction(card.id as ModuleKey)}
              />
            );
            return (
              <Grid key={card.id} size={{ xs: 12, sm: 6, md: 4 }}>
                {fullName ? (
                  // Tooltip clones its direct child to attach hover handlers/ref, but HealthCard
                  // doesn't forward either onto its root element — wrapping it directly would
                  // silently no-op. A `span` (a real DOM element) forwards both correctly.
                  <Tooltip title={fullName} arrow>
                    <span style={{ display: 'block', height: '100%' }}>{healthCard}</span>
                  </Tooltip>
                ) : (
                  healthCard
                )}
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Stack>
  );
};

export default OverviewTab;
