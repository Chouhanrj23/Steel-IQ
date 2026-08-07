import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface FilterDef {
  id: string;
  label: string;
  options: string[];
}

const FILTERS: FilterDef[] = [
  {
    id: 'plant',
    label: 'Plant',
    options: ['All Plants', 'Rourkela Plant', 'Jamshedpur Plant', 'Bhilai Plant', 'Hazira Plant', 'Bellary Plant'],
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
    options: ['All Categories', 'Flat Products', 'Long Products', 'Tubes & Pipes', 'Wire Rods', 'Value-Added Steel'],
  },
  { id: 'year', label: 'Year', options: ['All Years', '2024', '2025'] },
  { id: 'quarter', label: 'Quarter', options: ['All Quarters', 'Q1', 'Q2', 'Q3', 'Q4'] },
  {
    id: 'month',
    label: 'Month',
    options: ['All Months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
];

export const GlobalFilterBar = () => {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: 3, py: 1.5 }}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {FILTERS.map((filter) => (
          <FormControl key={filter.id} size="small" sx={{ minWidth: 160 }}>
            <InputLabel id={`${filter.id}-filter-label`}>{filter.label}</InputLabel>
            <Select labelId={`${filter.id}-filter-label`} label={filter.label} defaultValue={filter.options[0]}>
              {filter.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Stack>
    </Box>
  );
};
