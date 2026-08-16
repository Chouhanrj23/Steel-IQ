import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import type { LensType } from '@/data/earlyWarningRules';

export interface KPILensToggleProps {
  value: LensType;
  onChange: (lens: LensType) => void;
  /** Ageing only applies to KPIs whose drilldown tree carries an age-bucket level — every
   * other KPI shows it disabled rather than hiding it, so the control's shape stays
   * predictable across cards. */
  ageingEnabled: boolean;
}

const LENSES: LensType[] = ['Trend', 'Variance', 'Ageing'];

export const KPILensToggle = ({ value, onChange, ageingEnabled }: KPILensToggleProps) => (
  <ToggleButtonGroup
    size="small"
    exclusive
    value={value}
    onChange={(_event, next: LensType | null) => {
      if (next) onChange(next);
    }}
    aria-label="analysis lens"
    sx={{ height: 26, '& .MuiToggleButton-root': { px: 1, py: 0, fontSize: 11, lineHeight: '24px' } }}
  >
    {LENSES.map((lens) => {
      const button = (
        <ToggleButton key={lens} value={lens} disabled={lens === 'Ageing' && !ageingEnabled}>
          {lens}
        </ToggleButton>
      );
      if (lens === 'Ageing' && !ageingEnabled) {
        return (
          <Tooltip key={lens} title="Not applicable for this KPI">
            <span>{button}</span>
          </Tooltip>
        );
      }
      return button;
    })}
  </ToggleButtonGroup>
);
