import TerrainOutlinedIcon from '@mui/icons-material/TerrainOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import RecyclingOutlinedIcon from '@mui/icons-material/RecyclingOutlined';
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

/** One relevant icon per KPI, keyed by `kpi.id` — hand-authored (like `KPI_POLARITY` and
 * `KPI_LEVEL_NAMES`) since "which icon suits this KPI" isn't derivable from the data model.
 * Purely decorative: a missing entry just renders the card without an icon rather than erroring,
 * so this can be extended per-KPI without blocking anything else. */
export const KPI_ICONS: Record<string, SvgIconComponent> = {
  // Raw Material
  'sale-of-iron-ore': TerrainOutlinedIcon,
  'clean-coal-production': LocalFireDepartmentOutlinedIcon,
  'raw-material-wastage-rate': RecyclingOutlinedIcon,
  'limestone-consumption': GrainOutlinedIcon,
  // Cost Analytics
  'inventory-days': ScheduleOutlinedIcon,
  'inventory-quantity': Inventory2OutlinedIcon,
  'dispatch-cost-per-tonne': LocalShippingOutlinedIcon,
  'gagw-trend': PaidOutlinedIcon,
  // Supply Chain
  'imported-coal-inventory-days': WarehouseOutlinedIcon,
  'imported-coal-inventory-quantity': Inventory2OutlinedIcon,
  'spc-cost-per-tonne': LocalShippingOutlinedIcon,
  'inventory-turnover-ratio': AutorenewOutlinedIcon,
  // Procurement
  'creditors-payment-terms': ReceiptLongOutlinedIcon,
  'actual-spend': PaidOutlinedIcon,
  'vendor-on-time-delivery': LocalShippingOutlinedIcon,
  'purchase-order-cycle-time': AutorenewOutlinedIcon,
  // E&P
  'ep-spend-vs-plan': PaidOutlinedIcon,
  'ep-scheme-closure': TaskAltOutlinedIcon,
  'ep-capex-utilization-rate': ConstructionOutlinedIcon,
  'ep-project-milestone-adherence': FlagOutlinedIcon,
  // TSK
  'tsk-other-receivables-recovery': AccountBalanceWalletOutlinedIcon,
  'tsk-competitor-comparison': LeaderboardOutlinedIcon,
  'tsk-production-volume': FactoryOutlinedIcon,
  'tsk-cost-efficiency-index': SpeedOutlinedIcon,
  // TSJ
  'product-wise-profitability': TrendingUpOutlinedIcon,
  'operational-kpis-vs-plan': TaskAltOutlinedIcon,
  'yield-rate': PrecisionManufacturingOutlinedIcon,
  'defect-rate': ReportProblemOutlinedIcon,
  // TSPL
  'tspl-srm-expenses-contract-cost': ReceiptLongOutlinedIcon,
  'tspl-customer-rejections': ThumbDownAltOutlinedIcon,
  'tspl-otif-delivery': LocalShippingOutlinedIcon,
  'tspl-realization-per-ton': PaidOutlinedIcon,
  // Marketing & Finance
  'mf-factoring-collection-trend': AccountBalanceWalletOutlinedIcon,
  'mf-interest-on-overdue': PercentOutlinedIcon,
  'mf-conversion-cost-trend': PaidOutlinedIcon,
  'net-profit': TrendingUpOutlinedIcon,
};
