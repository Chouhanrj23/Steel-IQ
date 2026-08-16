import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { Card } from '@components/common';
import { STATUS_COLORS, STATUS_TINTS } from '../chartPalette';
import { KPILensToggle } from '../KPILensToggle';
import { TrendLensBody, VarianceLensBody, AgeingLensBody } from './lensBodies';
import type { VerticalDensity } from '../verticalTheme';
import type { KPIStatus, KPITrend, KPIHistoryPoint } from '@/types/dashboard';
import type { LensType } from '@/data/earlyWarningRules';

/** Overrides for the two non-default densities only — 'standard' (or no `density` prop at all)
 * renders exactly as before, byte-for-byte, so the other seven verticals see zero visual change
 * until the preview above is approved and extended to them. */
const DENSITY_OVERRIDES: Partial<
  Record<VerticalDensity, { borderRadius: number; borderWidth: number; valueWeight: number; spacing: number }>
> = {
  // Heavier, squarer, denser — physical/tonnage KPIs read as industrial equipment gauges.
  industrial: { borderRadius: 1, borderWidth: 5, valueWeight: 800, spacing: 1.25 },
  // Lighter, rounder, airier — financial KPIs read as a refined statement, not a shop-floor dial.
  financial: { borderRadius: 4, borderWidth: 2, valueWeight: 500, spacing: 1.75 },
};

export interface KPICardProps {
  /** DOM id placed on the card's root element — the anchor the Exceptions view and Early
   * Warning Strip scroll to when jumping here. */
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  percentChange: number;
  trend: KPITrend;
  status: KPIStatus;
  /** The KPI's own current reading, unaffected by drilling — same convention as
   * `percentChange`/`trend`/`status`. Backs the Variance lens; `value` above may be a drilled
   * sub-node and isn't a valid comparison against `target`. */
  kpiCurrent: number;
  history: KPIHistoryPoint[];
  target: number;
  /** `null` when this KPI has no age-bucket level in its drilldown tree — disables the Ageing
   * lens rather than hiding it. */
  ageingBreakdown: Record<string, number> | null;
  lens: LensType;
  onLensChange: (lens: LensType) => void;
  onClick?: () => void;
  /** Purely decorative topic icon (e.g. a truck for a logistics KPI) — optional since not every
   * KPI has an entry in `KPI_ICONS` yet; the card lays out identically either way. */
  icon?: SvgIconComponent;
  /** Set when the active Product Category filter was simply never modeled for this KPI (most
   * non-plant-dimensioned KPIs' mock data has no "Wire Rods" leaf, for instance) — the card
   * shows "N/A" with this string as the explanation instead of a bare "0", which would
   * otherwise look like a real (if uninteresting) filtered result rather than a KPI/category
   * combination that was never modeled. */
  notApplicable?: string;
  /** This KPI's vertical accent — when set, tints the icon badge instead of the status color
   * (status still fully carries through the border/tint/chip, so nothing is lost), the one
   * place on the card that identifies *which vertical* rather than *how healthy*. Undefined for
   * verticals `isPreviewModule` hasn't approved yet, so the icon badge stays status-colored
   * exactly as before. */
  accentColor?: string;
  /** 'standard' (or omitted) renders identically to before. See `DENSITY_OVERRIDES`. */
  density?: VerticalDensity;
}

const STATUS_ICON: Record<KPIStatus, SvgIconComponent> = {
  good: CheckCircleIcon,
  warning: WarningAmberIcon,
  critical: ErrorOutlineIcon,
};

const STATUS_LABEL: Record<KPIStatus, string> = {
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
};

const TREND_ICON: Record<KPITrend, SvgIconComponent> = {
  up: ArrowUpwardIcon,
  down: ArrowDownwardIcon,
  flat: TrendingFlatIcon,
};

export const KPICard = ({
  id,
  title,
  value,
  unit,
  percentChange,
  trend,
  status,
  kpiCurrent,
  history,
  target,
  ageingBreakdown,
  lens,
  onLensChange,
  onClick,
  icon: Icon,
  notApplicable,
  accentColor,
  density,
}: KPICardProps) => {
  const color = STATUS_COLORS[status];
  const tint = STATUS_TINTS[status];
  const StatusIcon = STATUS_ICON[status];
  const TrendIcon = TREND_ICON[trend];
  const sign = percentChange > 0 ? '+' : '';
  const densityStyle = density ? DENSITY_OVERRIDES[density] : undefined;
  const cardRadius = densityStyle?.borderRadius ?? 3;
  const borderWidth = densityStyle?.borderWidth ?? 3;
  const stackSpacing = densityStyle?.spacing ?? 1.5;

  return (
    <Box
      id={id}
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-radius 0.2s ease',
        borderRadius: cardRadius,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Card
        sx={{
          borderLeft: `${borderWidth}px solid ${color}`,
          borderTopLeftRadius: cardRadius,
          borderBottomLeftRadius: cardRadius,
          borderTopRightRadius: cardRadius,
          borderBottomRightRadius: cardRadius,
          // A faint status tint instead of flat white — status reads from the whole card, not
          // just a 3px sliver, without competing with the KPI value's own contrast.
          backgroundColor: tint,
          transition: 'background-color 0.3s ease',
        }}
      >
        <Stack spacing={stackSpacing}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 0 }}>
              {Icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    // Identity (which vertical) when known, status (how healthy) otherwise —
                    // status still fully carries through the border/tint/chip either way, so
                    // this is never the only place it's shown.
                    bgcolor: accentColor ?? color,
                    flexShrink: 0,
                    // Nudged down half a line so it lines up with the first line of a title
                    // that wraps to two, instead of straddling both.
                    mt: '1px',
                  }}
                >
                  <Icon sx={{ fontSize: 15, color: '#FFFFFF' }} />
                </Box>
              )}
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                {title}
              </Typography>
            </Stack>
            {notApplicable ? (
              <Chip
                size="small"
                icon={<BlockOutlinedIcon fontSize="small" />}
                label="N/A"
                variant="outlined"
                sx={{ color: 'text.disabled', borderColor: 'divider', flexShrink: 0 }}
              />
            ) : (
              <Chip
                size="small"
                icon={<StatusIcon fontSize="small" />}
                label={STATUS_LABEL[status]}
                variant="outlined"
                sx={{ color, borderColor: color, flexShrink: 0, '& .MuiChip-icon': { color } }}
              />
            )}
          </Stack>
          {notApplicable ? (
            <Tooltip title={notApplicable} arrow>
              <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ cursor: 'help' }}>
                <Typography variant="h4" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  N/A
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  not applicable
                </Typography>
              </Stack>
            </Tooltip>
          ) : (
            <>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography
                  variant="h4"
                  sx={{
                    transition: 'color 0.3s ease',
                    ...(densityStyle && { fontWeight: densityStyle.valueWeight }),
                  }}
                >
                  {value}
                </Typography>
                {unit && (
                  <Typography variant="body2" color="text.secondary">
                    {unit}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendIcon sx={{ fontSize: 18, color }} />
                <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                  {sign}
                  {percentChange}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs previous period
                </Typography>
              </Stack>
            </>
          )}
          <Stack spacing={0.75}>
            <Box onClick={(event) => event.stopPropagation()} sx={{ alignSelf: 'flex-start' }}>
              <KPILensToggle value={lens} onChange={onLensChange} ageingEnabled={ageingBreakdown !== null} />
            </Box>
            {lens === 'Trend' && <TrendLensBody history={history} color={color} />}
            {lens === 'Variance' && (
              <VarianceLensBody current={kpiCurrent} target={target} unit={unit ?? ''} color={color} />
            )}
            {lens === 'Ageing' && ageingBreakdown && (
              <AgeingLensBody breakdown={ageingBreakdown} unit={unit ?? ''} />
            )}
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};
