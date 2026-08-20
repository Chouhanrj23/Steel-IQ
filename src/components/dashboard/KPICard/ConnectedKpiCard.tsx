import Grid from '@mui/material/Grid';
import { useKpiCardFocus } from '@hooks/useKpiCardFocus';
import { getAgeingBreakdown, getEffectiveStatus } from '@/data/earlyWarningRules';
import { kpiSupportsProductCategory, kpiSupportsPlant } from '@pages/Dashboard/drillDownUtils';
import { useDashboardStore } from '@store/dashboard';
import type { KPI } from '@/types/dashboard';
import { KPI_ICONS } from '../kpiIcons';
import { VERTICAL_THEME, isPreviewModule } from '../verticalTheme';
import { KPICard } from './KPICard';

export interface ConnectedKpiCardProps {
  kpi: KPI;
  /** The card's displayed value — may be a drilled sub-node's value, unlike `kpi.current`. */
  value: string | number;
  onClick?: () => void;
}

/** Wraps `KPICard` with the plumbing every tab needs identically: the anchor id the Exceptions
 * view and Early Warning Strip scroll to, and `useKpiCardFocus` for the card's own lens state
 * plus one-shot focus requests. A real component (not inlined in a `.map()` callback) so the
 * `useKpiCardFocus` hook call has a stable per-card identity across renders. */
export const ConnectedKpiCard = ({ kpi, value, onClick }: ConnectedKpiCardProps) => {
  const { lens, setLens } = useKpiCardFocus(kpi.id);
  const productCategoryFilter = useDashboardStore((state) => state.crossFilters.productCategory);
  const plantFilter = useDashboardStore((state) => state.crossFilters.plant);
  const thresholdOverrides = useDashboardStore((state) => state.thresholdOverrides);
  // Same "never modeled, not just empty" gap as Product Category, but for Plant — most
  // non-plant-dimensioned KPIs are each missing exactly one Plant value from their mock leaves,
  // so without this check that Plant would silently render an unexplained "0" instead of "N/A".
  const unsupportedFilterValues = [
    productCategoryFilter !== null && !kpiSupportsProductCategory(kpi, productCategoryFilter)
      ? productCategoryFilter
      : null,
    plantFilter !== null && !kpiSupportsPlant(kpi, plantFilter) ? plantFilter : null,
  ].filter((value): value is string => value !== null);
  const notApplicable = unsupportedFilterValues.length > 0;
  const vertical = VERTICAL_THEME[kpi.module];
  const previewActive = isPreviewModule(kpi.module);
  const effectiveStatus = getEffectiveStatus(kpi, { threshold: thresholdOverrides });

  return (
    <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
      <KPICard
        id={`kpi-anchor-${kpi.id}`}
        title={kpi.name}
        value={value}
        unit={kpi.unit}
        percentChange={kpi.percentChange}
        trend={kpi.trend}
        status={effectiveStatus}
        kpiCurrent={kpi.current}
        history={kpi.history}
        target={kpi.target}
        ageingBreakdown={getAgeingBreakdown(kpi)}
        lens={lens}
        onLensChange={setLens}
        onClick={onClick}
        icon={KPI_ICONS[kpi.id]}
        notApplicable={
          notApplicable ? `Not modeled for "${unsupportedFilterValues.join('", "')}"` : undefined
        }
        accentColor={previewActive ? vertical.accent : undefined}
        density={previewActive ? vertical.density : undefined}
      />
    </Grid>
  );
};
