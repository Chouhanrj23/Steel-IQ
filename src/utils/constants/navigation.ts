import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { ROUTES } from '@routes/paths';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: DashboardOutlinedIcon },
  { label: 'Analytics', path: ROUTES.ANALYTICS, icon: InsightsOutlinedIcon },
  { label: 'Agent Summary', path: ROUTES.AGENT_SUMMARY, icon: SupportAgentOutlinedIcon },
  { label: 'Conversational Insights', path: ROUTES.CONVERSATIONAL_INSIGHTS, icon: ForumOutlinedIcon },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: SettingsOutlinedIcon },
];
