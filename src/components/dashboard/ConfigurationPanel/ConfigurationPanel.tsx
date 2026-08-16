import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Card, Button } from '@components/common';
import { useDashboardStore } from '@store/dashboard';
import {
  KPI_POLARITY,
  TREND_THRESHOLD_PCT,
  VARIANCE_THRESHOLD_PCT,
  getDefaultThresholdBoundary,
} from '@/data/earlyWarningRules';
import type { KPI, ModuleKey } from '@/types/dashboard';

export interface ConfigurationPanelProps {
  module: ModuleKey;
  /** The tab's full KPI list — narrowed internally to the ones with an Early Warning rule
   * defined (i.e. present in `KPI_POLARITY`), matching `EarlyWarningStrip`'s own prop shape. */
  kpis: KPI[];
}

const toNumber = (raw: string): number | null => {
  const value = Number(raw);
  return raw.trim() === '' || Number.isNaN(value) ? null : value;
};

/** Per-tab, session-only Early Warning rule tuning — lets a user drag a KPI's Threshold boundary
 * or Variance tolerance and immediately see the change cascade into that KPI's card badge, the
 * Early Warning Strip, the Exceptions view, and the Agent Summary text. Collapsed by default (see
 * the brief) since a tab can have several configurable KPIs and this sits above two other sidebar
 * panels. Nothing here is saved anywhere real — see the caption below the header. */
export const ConfigurationPanel = ({ module, kpis }: ConfigurationPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);
  const setThresholdOverride = useDashboardStore((state) => state.setThresholdOverride);
  const setVarianceOverride = useDashboardStore((state) => state.setVarianceOverride);
  const resetConfigOverrides = useDashboardStore((state) => state.resetConfigOverrides);

  const configurableKpis = kpis.filter((kpi) => kpi.module === module && KPI_POLARITY[kpi.id] !== undefined);
  if (configurableKpis.length === 0) {
    return null;
  }

  const hasAnyOverride =
    Object.keys(thresholdOverrides).length > 0 || Object.keys(varianceOverrides).length > 0;

  return (
    <Card>
      <Stack spacing={1.5}>
        <ButtonBase
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            textAlign: 'left',
            borderRadius: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TuneOutlinedIcon sx={{ color: 'background.paper' }} fontSize="small" />
            </Box>
            <Typography variant="h6">Configuration</Typography>
          </Stack>
          {expanded ? (
            <ExpandLessIcon sx={{ color: 'text.secondary' }} />
          ) : (
            <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
          )}
        </ButtonBase>
        <Typography variant="caption" color="text.secondary">
          Session-only demo controls — adjustments apply to this browser session and are lost on reload.
          Nothing here is saved.
        </Typography>

        <Collapse in={expanded}>
          <Stack divider={<Divider />} spacing={2} sx={{ pt: 1 }}>
            {configurableKpis.map((kpi) => {
              const polarity = KPI_POLARITY[kpi.id];
              const direction = polarity === 'up-good' ? 'below' : 'above';
              const thresholdValue = thresholdOverrides[kpi.id] ?? getDefaultThresholdBoundary(kpi);
              const varianceValue = varianceOverrides[kpi.id] ?? VARIANCE_THRESHOLD_PCT;

              return (
                <Stack key={kpi.id} spacing={1.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {kpi.name}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" rowGap={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                      Flag if {direction}
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={thresholdValue}
                      onChange={(event) => {
                        const next = toNumber(event.target.value);
                        if (next !== null) setThresholdOverride(kpi.id, next);
                      }}
                      slotProps={{
                        input: { endAdornment: <InputAdornment position="end">{kpi.unit}</InputAdornment> },
                      }}
                      sx={{ width: 120 }}
                    />
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" rowGap={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                      Variance tolerance
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={varianceValue}
                      onChange={(event) => {
                        const next = toNumber(event.target.value);
                        if (next !== null) setVarianceOverride(kpi.id, next);
                      }}
                      slotProps={{
                        input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                      }}
                      sx={{ width: 120 }}
                    />
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                      Trend sensitivity
                    </Typography>
                    <Chip
                      size="small"
                      label={`±${TREND_THRESHOLD_PCT}% (fixed)`}
                      variant="outlined"
                      sx={{ color: 'text.disabled', borderColor: 'divider' }}
                    />
                  </Stack>
                </Stack>
              );
            })}

            <Button size="small" variant="outlined" disabled={!hasAnyOverride} onClick={resetConfigOverrides}>
              Reset to defaults
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};
