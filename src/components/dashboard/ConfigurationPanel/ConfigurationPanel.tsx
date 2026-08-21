import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
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

// Wide enough for the largest values these fields actually show (targets run up to 6 digits,
// e.g. Sale of Iron Ore's ~182000 tonnes) plus the widest unit ("tonnes"/"₹ Lakh"/"INR Cr") without
// clipping — 120px only fit ~3 digits before the unit adornment crowded the number out. Also
// drops the native number-input spin buttons, which were eating into that same space.
const NUMBER_FIELD_SX = {
  width: 176,
  '& input[type=number]': {
    MozAppearance: 'textfield',
  },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
} as const;

/** Smaller, muted unit label — frees up horizontal room for the number itself (the actual value
 * being configured) rather than giving the unit text equal visual weight. */
const UnitAdornment = ({ unit }: { unit: string }) => (
  <InputAdornment position="end">
    <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
      {unit}
    </Typography>
  </InputAdornment>
);

interface KpiConfigRowProps {
  kpi: KPI;
  thresholdOverride: number | undefined;
  varianceOverride: number | undefined;
  onApply: (kpiId: string, threshold: number, variance: number) => void;
  onClear: (kpiId: string) => void;
}

// How long the "Applied" confirmation shows on the button before the section auto-collapses —
// long enough to register as feedback, short enough that it doesn't feel like a stuck state.
const APPLY_CONFIRMATION_MS = 1100;

/** One KPI's controls — collapsed by default to just its name + a chevron (identical
 * expand/collapse language to the Early Warning Strip's tiles), expanding in place to reveal the
 * Threshold/Variance/Trend fields plus Apply and Reset. Threshold/Variance each keep their own
 * local "draft" text, decoupled from the committed store value both so a controlled field never
 * snaps back mid-edit (see the earlier fix for that) and — now — because edits are meant to stay
 * local until Apply is clicked: nothing here touches the store, and therefore nothing cascades
 * into the KPI card/Strip/Agent Summary, until that explicit action. */
const KpiConfigRow = ({ kpi, thresholdOverride, varianceOverride, onApply, onClear }: KpiConfigRowProps) => {
  const polarity = KPI_POLARITY[kpi.id];
  const direction = polarity === 'up-good' ? 'below' : 'above';
  const defaultThreshold = getDefaultThresholdBoundary(kpi);

  const [expanded, setExpanded] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState(String(thresholdOverride ?? defaultThreshold));
  const [varianceDraft, setVarianceDraft] = useState(String(varianceOverride ?? VARIANCE_THRESHOLD_PCT));
  const [justApplied, setJustApplied] = useState(false);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    },
    [],
  );

  const appliedThreshold = thresholdOverride ?? defaultThreshold;
  const appliedVariance = varianceOverride ?? VARIANCE_THRESHOLD_PCT;
  const draftThresholdNum = toNumber(thresholdDraft);
  const draftVarianceNum = toNumber(varianceDraft);
  const isDirty =
    draftThresholdNum !== null &&
    draftVarianceNum !== null &&
    (draftThresholdNum !== appliedThreshold || draftVarianceNum !== appliedVariance);
  const hasOverride = thresholdOverride !== undefined || varianceOverride !== undefined;

  const handleApply = () => {
    if (draftThresholdNum === null || draftVarianceNum === null) return;
    onApply(kpi.id, draftThresholdNum, draftVarianceNum);
    setJustApplied(true);
    applyTimeoutRef.current = setTimeout(() => {
      setJustApplied(false);
      setExpanded(false);
    }, APPLY_CONFIRMATION_MS);
  };

  const handleReset = () => {
    onClear(kpi.id);
    setThresholdDraft(String(defaultThreshold));
    setVarianceDraft(String(VARIANCE_THRESHOLD_PCT));
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <ButtonBase
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          px: 1.25,
          py: 0.75,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {kpi.name}
        </Typography>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            ml: 1,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </ButtonBase>
      <Collapse in={expanded}>
        <Stack spacing={1.25} sx={{ px: 1.25, pb: 1.25, pt: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" rowGap={1}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
              Flag if {direction}
            </Typography>
            <TextField
              type="number"
              size="small"
              value={thresholdDraft}
              onChange={(event) => setThresholdDraft(event.target.value)}
              slotProps={{
                input: { endAdornment: <UnitAdornment unit={kpi.unit} /> },
              }}
              sx={NUMBER_FIELD_SX}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" rowGap={1}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
              Variance tolerance
            </Typography>
            <TextField
              type="number"
              size="small"
              value={varianceDraft}
              onChange={(event) => setVarianceDraft(event.target.value)}
              slotProps={{ input: { endAdornment: <UnitAdornment unit="%" /> } }}
              sx={NUMBER_FIELD_SX}
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

          <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              color={justApplied ? 'success' : 'primary'}
              disabled={!isDirty}
              onClick={handleApply}
              startIcon={justApplied ? <CheckIcon fontSize="small" /> : undefined}
            >
              {justApplied ? 'Applied' : 'Apply'}
            </Button>
            <Button size="small" variant="outlined" disabled={!hasOverride && !isDirty} onClick={handleReset}>
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
};

/** Per-tab, session-only Early Warning rule tuning — lets a user adjust a KPI's Threshold
 * boundary or Variance tolerance and, on Apply, cascade that change into the KPI card badge, the
 * Early Warning Strip, and the Agent Summary text. Collapsed by default at both levels: the panel
 * itself, and (once open) each KPI's own section — matching the Early Warning Strip's tile
 * pattern, so a tab with several configurable KPIs still reads as a short list, not a wall of
 * fields. Nothing here is saved anywhere real — see the caption below the header. */
export const ConfigurationPanel = ({ module, kpis }: ConfigurationPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  const varianceOverrides = useDashboardStore((state) => state.varianceOverrides);
  const setThresholdOverride = useDashboardStore((state) => state.setThresholdOverride);
  const setVarianceOverride = useDashboardStore((state) => state.setVarianceOverride);
  const clearThresholdOverride = useDashboardStore((state) => state.clearThresholdOverride);
  const clearVarianceOverride = useDashboardStore((state) => state.clearVarianceOverride);

  const configurableKpis = kpis.filter((kpi) => kpi.module === module && KPI_POLARITY[kpi.id] !== undefined);
  if (configurableKpis.length === 0) {
    return null;
  }

  const handleApply = (kpiId: string, threshold: number, variance: number) => {
    setThresholdOverride(kpiId, threshold);
    setVarianceOverride(kpiId, variance);
  };
  const handleClear = (kpiId: string) => {
    clearThresholdOverride(kpiId);
    clearVarianceOverride(kpiId);
  };

  return (
    <Card>
      <Stack spacing={1.5}>
        <ButtonBase
          id={`configuration-panel-header-${module}`}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`configuration-panel-body-${module}`}
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
          Session-only demo controls — edits stay local until you click Apply, and are lost on reload. Nothing
          here is saved.
        </Typography>

        <Collapse in={expanded}>
          <Stack
            role="region"
            id={`configuration-panel-body-${module}`}
            aria-labelledby={`configuration-panel-header-${module}`}
            spacing={0.75}
            sx={{ pt: 0.5 }}
          >
            {configurableKpis.map((kpi) => (
              <KpiConfigRow
                key={kpi.id}
                kpi={kpi}
                thresholdOverride={thresholdOverrides[kpi.id]}
                varianceOverride={varianceOverrides[kpi.id]}
                onApply={handleApply}
                onClear={handleClear}
              />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};
