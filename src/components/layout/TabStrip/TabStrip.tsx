import type { SyntheticEvent, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { useDashboardStore, type TabKey } from '@store/dashboard';
import { getPersona } from '@/data/personas';
import { MODULE_LABELS, MODULE_FULL_NAMES } from '@pages/Dashboard/moduleTabs';
import { VERTICAL_THEME, isPreviewModule } from '@components/dashboard/verticalTheme';
import type { ModuleKey } from '@/types/dashboard';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  explore: 'Explore',
  exceptions: 'Exceptions',
  ...MODULE_LABELS,
};

// The three cross-module views aren't a "vertical" with their own accent/icon in
// VERTICAL_THEME — they keep this fixed, neutral set exactly as before.
const CROSS_MODULE_ICONS: Partial<Record<TabKey, ReactElement>> = {
  overview: <DashboardOutlinedIcon fontSize="small" />,
  explore: <TravelExploreOutlinedIcon fontSize="small" />,
  exceptions: <ReportProblemOutlinedIcon fontSize="small" />,
};

const isModuleKey = (key: TabKey): key is ModuleKey => key in VERTICAL_THEME;

/** Full business-unit names shown as a tab-strip tooltip — looked up via a widened cast since
 * `MODULE_FULL_NAMES` is keyed by `ModuleKey` only, while a tab can also be one of the three
 * cross-module views (which never have a full-name entry, so the lookup is safely `undefined`
 * for them). */
const fullNameFor = (tabKey: TabKey): string | undefined =>
  (MODULE_FULL_NAMES as Partial<Record<TabKey, string>>)[tabKey];

/** Every vertical gets its own icon here — every module tab now has one, not just the three
 * cross-module views. Only the two verticals `isPreviewModule` has approved (see
 * `verticalTheme.ts`) also get their accent *color* on the icon; the rest render in the same
 * neutral ink every tab used before, so this reads as "icons added everywhere" without
 * front-running the per-vertical color rollout the client hasn't seen yet. */
const iconFor = (tabKey: TabKey): ReactElement | undefined => {
  if (!isModuleKey(tabKey)) return CROSS_MODULE_ICONS[tabKey];
  const { icon: Icon, accent } = VERTICAL_THEME[tabKey];
  return <Icon fontSize="small" sx={isPreviewModule(tabKey) ? { color: accent } : undefined} />;
};

/** The tab strip, standalone from `Dashboard.tsx` so `AppLayout` can render it directly above
 * `GlobalFilterBar` inside one sticky header group — self-contained via the store (persona's
 * visible tabs, active tab) rather than props, same as `GlobalFilterBar` already is, so it
 * doesn't need anything from the page it sits above. */
export const TabStrip = () => {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const personaId = useDashboardStore((state) => state.personaId);

  const persona = getPersona(personaId);
  const visibleTabs = persona.tabs;

  const handleChange = (_event: SyntheticEvent, value: TabKey) => {
    setActiveTab(value);
  };

  // MUI Tabs needs its `value` to match one of the rendered Tab `value`s, or it warns and shows
  // no selection. Content can still be reached (and rendered) outside the current persona's
  // scope — e.g. a Raw Material KPI's Exceptions link while viewing as CFO — so the strip just
  // shows nothing selected in that case rather than erroring.
  const tabsValue = visibleTabs.includes(activeTab) ? activeTab : false;

  // The selected-tab underline follows whichever tab is active — for a preview-module tab it
  // takes that vertical's own accent instead of the generic brand teal, so the "which tab am I
  // on" cue in the nav is the same color the tab's own content uses, not a generic default.
  const activeAccent =
    tabsValue !== false && isModuleKey(tabsValue) && isPreviewModule(tabsValue)
      ? VERTICAL_THEME[tabsValue].accent
      : undefined;

  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: 3 }}>
      <Tabs
        value={tabsValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={activeAccent ? { sx: { backgroundColor: activeAccent } } : undefined}
      >
        {visibleTabs.map((tabKey) => {
          const fullName = fullNameFor(tabKey);
          const accented = isModuleKey(tabKey) && isPreviewModule(tabKey);
          // The tooltip wraps the *label content*, not the Tab element itself — MUI's Tabs
          // clones its direct children to inject selection/indicator props, so wrapping Tab in
          // a Tooltip would misdirect those props onto the Tooltip and break selection. The
          // full name is always-visible (a demo audience won't think to hover a tab), with the
          // tooltip kept only as secondary reinforcement — a tiny `nowrap` caption line keeps
          // each affected tab's footprint to a fixed, predictable width instead of wrapping, so
          // 11 tabs still fit the scrollable strip at a standard laptop width.
          const label = fullName ? (
            <Tooltip title={fullName} arrow>
              <Stack alignItems="center" spacing={0}>
                <span>{TAB_LABELS[tabKey]}</span>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.62rem',
                    lineHeight: 1.3,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    fontWeight: 400,
                    textTransform: 'none',
                  }}
                >
                  {fullName}
                </Typography>
              </Stack>
            </Tooltip>
          ) : (
            TAB_LABELS[tabKey]
          );
          return (
            <Tab
              key={tabKey}
              value={tabKey}
              label={label}
              icon={iconFor(tabKey)}
              iconPosition="start"
              sx={{
                ...(fullName ? { minHeight: 58, py: 0.75 } : undefined),
                ...(accented
                  ? { '&.Mui-selected': { color: VERTICAL_THEME[tabKey as ModuleKey].accent } }
                  : undefined),
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default TabStrip;
