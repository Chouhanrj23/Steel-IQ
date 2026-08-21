import type { DrillDownNode, KPI } from '@/types/dashboard';
import type { CrossFilters, DrillSelection } from '@store/dashboard';
import type { SunburstNode } from '@components/dashboard/EChartsContainer';
import {
  applyCrossFilters,
  resolveLatestPeriodNode,
  TIME_HIERARCHY_DEPTH,
} from '@pages/Dashboard/drillDownUtils';

/**
 * Reusable chart-data transforms behind the Agent Summary's two business-hierarchy visuals (a
 * Sunburst + a matching Contribution bar chart) — kept here, not inline in `AgentSummaryPanel`,
 * so the panel stays a thin renderer and this logic can be unit-tested/reused independently.
 * Framework-free (no React/MUI): every export takes plain data and returns plain data, same
 * convention as `@/data/businessScenarios`.
 */

const toHierarchyChartNodes = (nodes: DrillDownNode[]): SunburstNode[] =>
  nodes.map((node) => ({
    name: node.label,
    value: node.value,
    children: node.children ? toHierarchyChartNodes(node.children) : undefined,
  }));

export interface ContributionSlice {
  name: string;
  value: number;
}

export interface HierarchyVisualData {
  /** The KPI this snapshot narrates, e.g. "Inventory Quantity" — used in both charts' titles. */
  kpiName: string;
  unit: string;
  /** What the immediate next level actually represents in this KPI's tree, e.g. "Category" or
   * "Plant" — there's no tag on a `DrillDownNode` saying what its level "means" business-wise
   * (only labels/values), so this is supplied by the caller, who already hand-authors every other
   * chart title on its tab from the same tree-shape knowledge. */
  levelLabel: string;
  /** The single period this snapshot represents (e.g. "2024 / Q4 / Dec") — always the real
   * resolved tree path, never a fabricated "current" placeholder, so the chart captions never
   * leave which period ambiguous. */
  periodLabel: string;
  /** Full remaining sub-tree below the resolved period, shaped for the Sunburst. */
  sunburst: SunburstNode[];
  /** The same period's immediate next-level nodes, flattened — identical real numbers as the
   * Sunburst's innermost ring, given as a flat list so a bar chart can rank them precisely
   * (a Sunburst's ring proportions are for shape/contribution at a glance, not exact ranking). */
  contribution: ContributionSlice[];
}

/**
 * Builds both business-hierarchy visuals for one KPI, scoped to the current drill/filter context.
 * Only meaningful for a time-dimensioned KPI (the only shape with a real, established 3-level
 * Time prefix — see `TIME_HIERARCHY_DEPTH`) with at least one level of real business hierarchy
 * beneath it; returns `null` for anything else (a different `dimension`, a period with no
 * children, or one that nets to zero after cross-filters) rather than fabricating placeholder
 * data — callers should simply omit the visuals section in that case, exactly like every other
 * "nothing to show" case in this app.
 */
export const buildHierarchyVisualData = (
  kpi: KPI,
  levelLabel: string,
  drill: DrillSelection,
  crossFilters: CrossFilters,
): HierarchyVisualData | null => {
  if (kpi.drilldown.dimension !== 'time') return null;

  const filteredRoot = applyCrossFilters(kpi.drilldown.root, crossFilters);
  const path = drill.hierarchy === 'time' ? drill.path : [];
  const resolved = resolveLatestPeriodNode(filteredRoot, path, TIME_HIERARCHY_DEPTH);
  if (!resolved) return null;
  const { node: periodNode, path: resolvedPath } = resolved;
  if (!periodNode.children || periodNode.children.length === 0) return null;
  if (periodNode.value === 0) return null;

  return {
    kpiName: kpi.name,
    unit: kpi.unit,
    levelLabel,
    periodLabel: resolvedPath.join(' / '),
    sunburst: toHierarchyChartNodes(periodNode.children),
    contribution: periodNode.children.map((node) => ({ name: node.label, value: node.value })),
  };
};
