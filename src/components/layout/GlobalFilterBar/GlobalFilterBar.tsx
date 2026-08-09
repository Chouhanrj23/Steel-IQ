import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TuneIcon from '@mui/icons-material/Tune';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDashboardStore } from '@store/dashboard';

type CrossFilterId = 'region' | 'businessUnit' | 'productCategory';

interface FilterDef {
  id: CrossFilterId;
  label: string;
  /** First option is always the "All" sentinel, which maps to `null` in the store. */
  options: string[];
}

const CROSS_FILTERS: FilterDef[] = [
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

const PLANT_OPTIONS = [
  'All Plants',
  'Rourkela Plant',
  'Jamshedpur Plant',
  'Bhilai Plant',
  'Hazira Plant',
  'Bellary Plant',
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

export const GlobalFilterBar = () => {
  const drill = useDashboardStore((state) => state.drill);
  const setHierarchyPath = useDashboardStore((state) => state.setHierarchyPath);
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const setRegion = useDashboardStore((state) => state.setRegion);
  const setBusinessUnit = useDashboardStore((state) => state.setBusinessUnit);
  const setProductCategory = useDashboardStore((state) => state.setProductCategory);

  const crossFilterSetters = {
    region: setRegion,
    businessUnit: setBusinessUnit,
    productCategory: setProductCategory,
  } satisfies Record<CrossFilterId, (value: string | null) => void>;

  const plantValue = drill.hierarchy === 'plant' ? (drill.path[0] ?? 'All Plants') : 'All Plants';
  const yearValue = drill.hierarchy === 'time' ? (drill.path[0] ?? 'All Years') : 'All Years';
  const quarterValue = drill.hierarchy === 'time' ? (drill.path[1] ?? 'All Quarters') : 'All Quarters';
  const monthValue = drill.hierarchy === 'time' ? (drill.path[2] ?? 'All Months') : 'All Months';

  const handlePlantChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setHierarchyPath('plant', value === 'All Plants' ? [] : [value]);
  };

  const handleTimeChange = (next: { year?: string; quarter?: string; month?: string }) => {
    const year = next.year ?? yearValue;
    const quarter = next.quarter ?? quarterValue;
    const month = next.month ?? monthValue;

    if (year === 'All Years') {
      setHierarchyPath('time', []);
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="plant-filter-label">Plant</InputLabel>
          <Select labelId="plant-filter-label" label="Plant" value={plantValue} onChange={handlePlantChange}>
            {PLANT_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
