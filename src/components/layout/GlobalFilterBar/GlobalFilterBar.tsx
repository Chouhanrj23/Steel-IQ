import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TuneIcon from '@mui/icons-material/Tune';
import { useDashboardStore } from '@store/dashboard';

type CrossFilterId = 'plant' | 'region' | 'businessUnit' | 'productCategory';

interface FilterDef {
  id: CrossFilterId;
  label: string;
  /** First option is always the "All" sentinel, which maps to `null` in the store. */
  options: string[];
}

// Plant lives in this same list (not wired to `drill` like the Time/Plant breadcrumb toggle
// each tab renders) so it composes with Region/Business Unit/Product Category and with
// Year/Quarter/Month via simple AND logic, rather than the two Plant controls fighting over one
// shared hierarchy/path slot — the bug the filter audit found (picking a Plant here used to
// silently discard an active Year/Quarter/Month selection, and vice versa).
const CROSS_FILTERS: FilterDef[] = [
  {
    id: 'plant',
    label: 'Plant',
    options: [
      'All Plants',
      'Rourkela Plant',
      'Jamshedpur Plant',
      'Bhilai Plant',
      'Hazira Plant',
      'Bellary Plant',
    ],
  },
  { id: 'region', label: 'Region', options: ['All Regions', 'East', 'West', 'South', 'Central'] },
  {
    id: 'businessUnit',
    label: 'Business Unit',
    options: ['All Business Units', 'Manufacturing', 'Sales & Marketing', 'Procurement', 'Finance'],
  },
  {
    id: 'productCategory',
    label: 'Product Category',
    options: [
      'All Categories',
      'Flat Products',
      'Long Products',
      'Tubes & Pipes',
      'Wire Rods',
      'Value-Added Steel',
    ],
  },
];

const YEAR_OPTIONS = ['All Years', '2024', '2025'];
const QUARTER_OPTIONS = ['All Quarters', 'Q1', 'Q2', 'Q3', 'Q4'];
const MONTH_OPTIONS = [
  'All Months',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const YEAR_LABELS = new Set(YEAR_OPTIONS.slice(1));
const QUARTER_LABELS = new Set(QUARTER_OPTIONS.slice(1));
const MONTH_LABELS = new Set(MONTH_OPTIONS.slice(1));

const QUARTER_OF_MONTH: Record<string, string> = {
  Jan: 'Q1',
  Feb: 'Q1',
  Mar: 'Q1',
  Apr: 'Q2',
  May: 'Q2',
  Jun: 'Q2',
  Jul: 'Q3',
  Aug: 'Q3',
  Sep: 'Q3',
  Oct: 'Q4',
  Nov: 'Q4',
  Dec: 'Q4',
};

/** Reads Year/Quarter/Month back out of `drill.path` by classifying each segment against the
 * three disjoint label sets, rather than assuming a fixed `[year, quarter, month]` position —
 * a Quarter or Month picked without a Year (see `handleTimeChange`) produces a one-segment path
 * like `['Q2']`, which a positional `path[0]/[1]/[2]` read would misread as a Year. */
const parseTimePath = (path: string[]): { year: string; quarter: string; month: string } => {
  let year = 'All Years';
  let quarter = 'All Quarters';
  let month = 'All Months';
  for (const segment of path) {
    if (YEAR_LABELS.has(segment)) year = segment;
    else if (QUARTER_LABELS.has(segment)) quarter = segment;
    else if (MONTH_LABELS.has(segment)) month = segment;
  }
  return { year, quarter, month };
};

export const GlobalFilterBar = () => {
  const drill = useDashboardStore((state) => state.drill);
  const setHierarchyPath = useDashboardStore((state) => state.setHierarchyPath);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const setRegion = useDashboardStore((state) => state.setRegion);
  const setBusinessUnit = useDashboardStore((state) => state.setBusinessUnit);
  const setProductCategory = useDashboardStore((state) => state.setProductCategory);
  const setPlant = useDashboardStore((state) => state.setPlant);

  const crossFilterSetters = {
    plant: setPlant,
    region: setRegion,
    businessUnit: setBusinessUnit,
    productCategory: setProductCategory,
  } satisfies Record<CrossFilterId, (value: string | null) => void>;

  const {
    year: yearValue,
    quarter: quarterValue,
    month: monthValue,
  } = drill.hierarchy === 'time'
    ? parseTimePath(drill.path)
    : { year: 'All Years', quarter: 'All Quarters', month: 'All Months' };

  const handleTimeChange = (next: { year?: string; quarter?: string; month?: string }) => {
    const year = next.year ?? yearValue;
    const quarter = next.quarter ?? quarterValue;
    const month = next.month ?? monthValue;

    const mostSpecificYearless = month !== 'All Months' ? month : quarter !== 'All Quarters' ? quarter : null;

    if (year === 'All Years') {
      // No Year picked -- if a Quarter/Month is set, filter on it across every year (a
      // one-segment path like ['Q2'], which getNodeAtPath/getNodesAtPath aggregate across all
      // years rather than guessing one) instead of silently discarding the selection.
      setHierarchyPath('time', mostSpecificYearless ? [mostSpecificYearless] : []);
      return;
    }
    if (month !== 'All Months') {
      const resolvedQuarter = quarter !== 'All Quarters' ? quarter : QUARTER_OF_MONTH[month];
      setHierarchyPath('time', resolvedQuarter ? [year, resolvedQuarter, month] : [year]);
      return;
    }
    if (quarter !== 'All Quarters') {
      setHierarchyPath('time', [year, quarter]);
      return;
    }
    setHierarchyPath('time', [year]);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.03)',
        px: 3,
        py: 1.5,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: 'text.secondary', mr: 0.5 }}>
          <TuneIcon fontSize="small" />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Filters
          </Typography>
        </Stack>

        {CROSS_FILTERS.map((filter) => {
          const allOption = filter.options[0]!;
          const value = crossFilters[filter.id] ?? allOption;
          const setValue = crossFilterSetters[filter.id];
          return (
            <FormControl key={filter.id} size="small" sx={{ minWidth: 160 }}>
              <InputLabel id={`${filter.id}-filter-label`}>{filter.label}</InputLabel>
              <Select
                labelId={`${filter.id}-filter-label`}
                label={filter.label}
                value={value}
                onChange={(event) => setValue(event.target.value === allOption ? null : event.target.value)}
              >
                {filter.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="year-filter-label">Year</InputLabel>
          <Select
            labelId="year-filter-label"
            label="Year"
            value={yearValue}
            onChange={(event) => handleTimeChange({ year: event.target.value })}
          >
            {YEAR_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="quarter-filter-label">Quarter</InputLabel>
          <Select
            labelId="quarter-filter-label"
            label="Quarter"
            value={quarterValue}
            onChange={(event) => handleTimeChange({ quarter: event.target.value })}
          >
            {QUARTER_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="month-filter-label">Month</InputLabel>
          <Select
            labelId="month-filter-label"
            label="Month"
            value={monthValue}
            onChange={(event) => handleTimeChange({ month: event.target.value })}
          >
            {MONTH_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};
