import { useId, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { SelectChangeEvent } from '@mui/material/Select';
import mockDataJson from '@mock/mockData.json';
import type { DashboardMockData, ModuleKey } from '@/types/dashboard';
import { useDashboardStore } from '@store/dashboard';
import { applyCrossFilters, getNodesAtDepth } from '@pages/Dashboard/drillDownUtils';
import { MODULE_TAB_ORDER, MODULE_LABELS } from '@pages/Dashboard/moduleTabs';
import { getLevelNames } from '@/data/kpiDimensionLevels';
import { Card, EmptyState, Button } from '@components/common';
import { ChartContainer } from '../ChartContainer';
import type { ChartType } from '../ChartContainer';

const mockData = mockDataJson as DashboardMockData;

// A flat, module-grouped list of every KPI, built once — the picker's source of truth. Order
// matches the tab strip (MODULE_TAB_ORDER), not mockData.json's own key order.
const KPI_OPTIONS: { kpiId: string; name: string; module: ModuleKey }[] = MODULE_TAB_ORDER.flatMap((module) =>
  mockData.modules[module].kpis.map((kpi) => ({ kpiId: kpi.id, name: kpi.name, module })),
);

type BuilderChartType = Extract<ChartType, 'bar' | 'line'> | 'table';
const CHART_TYPES: { value: BuilderChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'table', label: 'Table' },
];

/** Above this many rows, a bar/line chart stops being legible — the builder still renders
 * whatever the user picked (this is a self-service tool; it doesn't override their choice), but
 * nudges toward Table for a level this granular. */
const CHART_ROW_WARNING_THRESHOLD = 40;

export interface ExploreBuilderProps {
  /** Shown in the panel header — lets compare mode label its two panels "KPI A"/"KPI B". */
  title?: string;
  onRemove?: () => void;
}

/** One self-contained pick-a-KPI / pick-a-level / pick-a-chart-type builder panel. Renders its
 * result with the same `ChartContainer` every tab's drill-down charts use — this is a
 * user-driven way to jump straight to one level of a KPI's existing hierarchy, not a new query
 * engine or new data. Kept fully self-contained (owns its own KPI/level/chart-type state) so
 * `ExploreTab` can mount a second one unmodified for side-by-side comparison. */
export const ExploreBuilder = ({ title, onRemove }: ExploreBuilderProps) => {
  // React's own unique-id generator, not a slug of `title` — titles are free text ("KPI B"),
  // and HTML id attributes can't safely contain arbitrary characters like spaces.
  const instanceId = useId();
  const kpiLabelId = `explore-kpi-label-${instanceId}`;
  const levelLabelId = `explore-level-label-${instanceId}`;
  const crossFilters = useDashboardStore((state) => state.crossFilters);
  const [kpiId, setKpiId] = useState('');
  const [levelIndex, setLevelIndex] = useState(1);
  const [chartType, setChartType] = useState<BuilderChartType>('bar');

  const selected = KPI_OPTIONS.find((o) => o.kpiId === kpiId);
  const kpi = selected ? mockData.modules[selected.module].kpis.find((k) => k.id === kpiId) : undefined;
  const levelNames = kpiId ? getLevelNames(kpiId) : [];

  const handleKpiChange = (event: SelectChangeEvent) => {
    setKpiId(event.target.value);
    setLevelIndex(1);
  };

  const rows = kpi ? getNodesAtDepth(applyCrossFilters(kpi.drilldown.root, crossFilters), levelIndex) : [];
  const levelName = levelNames[levelIndex - 1];
  const showRowCountWarning = chartType !== 'table' && rows.length > CHART_ROW_WARNING_THRESHOLD;

  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {title && (
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
          )}
          {onRemove && (
            <Button size="small" variant="text" color="inherit" onClick={onRemove} sx={{ ml: 'auto' }}>
              Remove
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id={kpiLabelId}>KPI</InputLabel>
            <Select
              labelId={kpiLabelId}
              label="KPI"
              value={kpiId}
              onChange={handleKpiChange}
              MenuProps={{ PaperProps: { sx: { maxHeight: 420 } } }}
            >
              {MODULE_TAB_ORDER.flatMap((module) => [
                <ListSubheader key={`header-${module}`}>{MODULE_LABELS[module]}</ListSubheader>,
                ...KPI_OPTIONS.filter((o) => o.module === module).map((option) => (
                  <MenuItem key={option.kpiId} value={option.kpiId}>
                    {option.name}
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }} disabled={!kpiId}>
            <InputLabel id={levelLabelId}>Break down by</InputLabel>
            <Select
              labelId={levelLabelId}
              label="Break down by"
              value={kpiId ? String(levelIndex) : ''}
              onChange={(event) => setLevelIndex(Number(event.target.value))}
            >
              {levelNames.map((name, index) => (
                <MenuItem key={name} value={index + 1}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={chartType}
            onChange={(_event, value: BuilderChartType | null) => {
              if (value) setChartType(value);
            }}
            aria-label="chart type"
          >
            {CHART_TYPES.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ px: 2 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {!kpi ? (
          <EmptyState
            title="Pick a KPI to begin"
            description="Choose a KPI, then a level of its own hierarchy to break it down by."
          />
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">
              {kpi.name} by {levelName}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({rows.length} {rows.length === 1 ? 'row' : 'rows'}, {kpi.unit})
              </Typography>
            </Typography>

            {showRowCountWarning && (
              <Alert severity="info" variant="outlined">
                {rows.length} rows at this level — bar/line charts read best under{' '}
                {CHART_ROW_WARNING_THRESHOLD}. Try Table view, or break down by an earlier level.
              </Alert>
            )}

            {rows.length === 0 ? (
              <EmptyState
                title="No data at this level"
                description="This branch of the hierarchy has no matching rows for the current filters."
              />
            ) : chartType === 'table' ? (
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{levelName}</TableCell>
                      <TableCell align="right">Value {kpi.unit ? `(${kpi.unit})` : ''}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.qualifiedLabel} hover>
                        <TableCell>{row.qualifiedLabel}</TableCell>
                        <TableCell align="right">{row.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <ChartContainer
                type={chartType}
                data={rows.map((row) => ({ category: row.qualifiedLabel, value: row.value }))}
                categoryKey="category"
                series={[{ key: 'value', label: `${kpi.name} (${kpi.unit})` }]}
                height={340}
              />
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default ExploreBuilder;
