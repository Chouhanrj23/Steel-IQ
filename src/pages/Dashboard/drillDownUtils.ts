import type { DrillDownNode, DrilldownDimension, KPI, RecordTags } from '@/types/dashboard';
import type { CrossFilters, DrillSelection, HierarchyKey } from '@store/dashboard';

export const ROOT_LABEL: Record<DrilldownDimension, string> = {
  plant: 'All Plants',
  time: 'All Time',
  geography: 'All Locations',
  department: 'All Departments',
  category: 'All Categories',
};

// The hierarchy toggle only ever offers these two.
export const HIERARCHY_OPTIONS: { value: HierarchyKey; label: string }[] = [
  { value: 'time', label: 'Time' },
  { value: 'plant', label: 'Plant' },
];

/** Depth-first search for a node labeled `label` anywhere under `nodes` (not just its
 * immediate children). Different tabs' trees put the same kind of label at different
 * depths (e.g. Raw Material's plant hierarchy has Plant at level 1, Cost Analytics' still
 * has Region at level 1 and Plant at level 2) — searching the whole subtree means a path
 * built from filter-bar selections resolves correctly regardless of which tab is showing. */
const findDescendant = (nodes: DrillDownNode[], label: string): DrillDownNode | null => {
  for (const node of nodes) {
    if (node.label === label) return node;
    if (node.children) {
      const found = findDescendant(node.children, label);
      if (found) return found;
    }
  }
  return null;
};

const isDirectChild = (nodes: DrillDownNode[], label: string): boolean =>
  nodes.some((n) => n.label === label);

/** Every occurrence of `label` found under each of `root`'s own top-level branches, paired with
 * that branch's label — e.g. for a Year-rooted time tree and `label='Q2'`, one match per year
 * that has a Q2. Used only for the "Quarter/Month picked without a Year" case below; a normal
 * path walk never needs this since `findDescendant` already searches within a known subtree. */
const findUnderEachTopLevelBranch = (
  root: DrillDownNode[],
  label: string,
): { branchLabel: string; node: DrillDownNode }[] => {
  const results: { branchLabel: string; node: DrillDownNode }[] = [];
  for (const top of root) {
    const match = top.label === label ? top : findDescendant(top.children ?? [], label);
    if (match) results.push({ branchLabel: top.label, node: match });
  }
  return results;
};

/** A synthetic aggregate node standing in for every occurrence of `label` across the whole
 * tree — the Year/Quarter/Month filter bar allows picking a Quarter or Month without first
 * picking a Year (see `GlobalFilterBar`'s `handleTimeChange`), which produces a one-segment path
 * like `['Q2']` that was never really a location in the tree (the tree's actual top level is
 * Year). Rather than guessing a single year's Q2, this sums Q2 across every year, with each
 * year's own Q2 kept as a qualified child so a chart can still show one bar per year instead of
 * one flat total. */
const getYearlessTimeAggregate = (root: DrillDownNode[], label: string): DrillDownNode | null => {
  const matches = findUnderEachTopLevelBranch(root, label);
  if (matches.length === 0) return null;
  const children = matches.map(({ branchLabel, node }) => ({
    ...node,
    label: `${node.label} (${branchLabel})`,
  }));
  return { label, value: roundForDisplay(children.reduce((sum, n) => sum + n.value, 0)), children };
};

/** The single node identified by walking `path` one label at a time (each step searched
 * anywhere in the remaining subtree), or null if `path` is empty. If `path`'s first segment
 * isn't actually one of `root`'s own labels (a Quarter/Month selected without its Year — the
 * only case this can happen, since every other path is built from real breadcrumb/tree
 * navigation), the *last* segment is treated as a yearless label and aggregated across the
 * whole tree instead of walked, since a Month only ever occurs under one Quarter per year
 * anyway — aggregating on the most specific unit given is always correct. */
export const getNodeAtPath = (root: DrillDownNode[], path: string[]): DrillDownNode | null => {
  if (path.length > 0 && !isDirectChild(root, path[0]!)) {
    return getYearlessTimeAggregate(root, path[path.length - 1]!);
  }
  let node: DrillDownNode | null = null;
  let level = root;
  for (const segment of path) {
    const match = findDescendant(level, segment);
    if (!match) return node;
    node = match;
    level = match.children ?? [];
  }
  return node;
};

/** The array of nodes a chart/sparkline should render for `path` — children of the node at
 * `path`, the root if `path` is empty, or a single-element array if `path` lands on a leaf. */
export const getNodesAtPath = (root: DrillDownNode[], path: string[]): DrillDownNode[] => {
  if (path.length === 0) return root;
  const node = getNodeAtPath(root, path);
  if (!node) return root;
  return node.children ?? [node];
};

export const flattenLeafValues = (nodes: DrillDownNode[]): number[] =>
  nodes.flatMap((node) => (node.children ? flattenLeafValues(node.children) : [node.value]));

/** Rounds away binary floating-point drift (e.g. 0.1 + 0.2) from repeated summation while
 * keeping enough precision for any KPI's decimal values. */
const roundForDisplay = (value: number): number => Math.round(value * 1e6) / 1e6;

/** Sums every node anywhere in the tree whose label is in `labels`, grouped by label — e.g.
 * the Ageing lens groups a KPI's whole tree by its age-bucket level ("0-30 Days" / "31+ Days")
 * without needing to know that level's absolute depth, which varies by KPI. A label only
 * recurs at one consistent depth-role within a given KPI's tree (the depth-extension pass
 * applied each level's names uniformly under every branch), so summing every occurrence of a
 * label gives that bucket's true total. */
export const sumByLabelSet = (nodes: DrillDownNode[], labels: readonly string[]): Record<string, number> => {
  const totals: Record<string, number> = Object.fromEntries(labels.map((label) => [label, 0]));
  const walk = (level: DrillDownNode[]) => {
    for (const node of level) {
      if (labels.includes(node.label)) {
        totals[node.label] = roundForDisplay((totals[node.label] ?? 0) + node.value);
      } else if (node.children) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return totals;
};

export interface DepthNode {
  /** The node's own label at that level (may repeat across different parents — e.g. every
   * Shop has a "Unit 1"). */
  label: string;
  /** Ancestor chain including this node, joined for display where `label` alone would be
   * ambiguous — e.g. "Rourkela Plant / Melting Shop / Unit 1". */
  qualifiedLabel: string;
  value: number;
  path: string[];
}

/** Every node exactly `depth` levels down (1-indexed, root = 1) — the Explore builder's way of
 * jumping straight to one level of a KPI's own hierarchy instead of drilling into it one click
 * at a time. Purely a tree walk over the existing `DrillDownNode` shape; no new data or
 * aggregation rules. Nodes whose branch doesn't reach `depth` (shouldn't happen for a valid
 * depth, since depth-extension applied every level uniformly, but stays safe if ever mixed)
 * are simply absent from the result rather than padded with a fabricated value. */
export const getNodesAtDepth = (nodes: DrillDownNode[], depth: number): DepthNode[] => {
  const results: DepthNode[] = [];
  const walk = (level: DrillDownNode[], path: string[]) => {
    for (const node of level) {
      const nextPath = [...path, node.label];
      if (nextPath.length === depth) {
        results.push({
          label: node.label,
          qualifiedLabel: nextPath.join(' / '),
          value: node.value,
          path: nextPath,
        });
      } else if (node.children) {
        walk(node.children, nextPath);
      }
    }
  };
  walk(nodes, []);
  return results;
};

/** Recomputes a tree with only the leaves matching every active filter counted, propagating
 * sums back up through parents. Shape (labels/nesting) is untouched, so it can be fed straight
 * into getNodeAtPath/getNodesAtPath — cross-filters compose with the Time/Plant drill rather
 * than replacing it. Returns `nodes` unchanged (same reference) when no filter is active. */
export const applyCrossFilters = (nodes: DrillDownNode[], filters: CrossFilters): DrillDownNode[] => {
  if (!filters.region && !filters.businessUnit && !filters.productCategory && !filters.plant) return nodes;

  const recompute = (node: DrillDownNode): DrillDownNode => {
    if (!node.children) {
      const tags = node.tags;
      const matches =
        (!filters.region || tags?.region === filters.region) &&
        (!filters.businessUnit || tags?.businessUnit === filters.businessUnit) &&
        (!filters.productCategory || tags?.productCategory === filters.productCategory) &&
        (!filters.plant || tags?.plant === filters.plant);
      return { ...node, value: matches ? node.value : 0 };
    }
    const children = node.children.map(recompute);
    return {
      ...node,
      children,
      value: roundForDisplay(children.reduce((sum, child) => sum + child.value, 0)),
    };
  };

  return nodes.map(recompute);
};

/** Sum of a filtered tree's top-level values — the "no drill" aggregate for a KPI card. */
export const sumRootValues = (nodes: DrillDownNode[]): number =>
  roundForDisplay(nodes.reduce((sum, node) => sum + node.value, 0));

/** Whether `kpi` has at least one leaf tagged with `tags[key] === value` — the shared walk behind
 * `kpiSupportsProductCategory`/`kpiSupportsPlant` below. */
const kpiSupportsTagValue = (kpi: KPI, key: keyof RecordTags, value: string): boolean => {
  let supported = false;
  const walk = (nodes: DrillDownNode[]) => {
    for (const node of nodes) {
      if (node.children) walk(node.children);
      else if (node.tags?.[key] === value) supported = true;
    }
  };
  walk(kpi.drilldown.root);
  return supported;
};

/** Whether `kpi` has at least one leaf tagged with `category`. Most non-plant-dimensioned KPIs'
 * mock data only models 4 of the 5 Product Category values (missing "Wire Rods" specifically —
 * plant-dimensioned KPIs have all 5) — rather than treating that gap as a data bug to patch
 * everywhere, a KPI/category combination that was simply never modeled is surfaced as "N/A, not
 * applicable" instead of a bare "0", which would otherwise look like a real (if uninteresting)
 * filtered result. */
export const kpiSupportsProductCategory = (kpi: KPI, category: string): boolean =>
  kpiSupportsTagValue(kpi, 'productCategory', category);

/** Same gap as Product Category above, but for Plant: most non-plant-dimensioned KPIs are each
 * missing exactly one Plant value from their mock leaves (which one varies per KPI) — without this
 * check, picking that Plant in the global filter bar renders an unexplained "0" for that KPI
 * instead of the same "N/A, not applicable" treatment Product Category already gets. */
export const kpiSupportsPlant = (kpi: KPI, plant: string): boolean =>
  kpiSupportsTagValue(kpi, 'plant', plant);

/** The Agent Summary/Conversational Insights "Showing:" caption — built from the in-page
 * Time/Plant drill-down breadcrumb (unrelated to the global filter bar's own Plant/Region/BU/
 * Category filters, which don't appear here). Flags the breadcrumb with a "(no …-level data on
 * this tab)" note whenever it's drilled into an axis none of this tab's own KPIs are actually
 * dimensioned on (e.g. drilling "Plant" on Cost Analytics, which has no plant-dimensioned KPI,
 * or "Time" on TSJ, which has no time-dimensioned KPI) — previously the caption changed either
 * way, implying a filter took effect when nothing on the tab actually moved. */
export const buildContextLabel = (drill: DrillSelection, cardKpis: KPI[], fullName?: string): string => {
  const isRelevantAxis =
    drill.hierarchy !== 'plant' && drill.hierarchy !== 'time'
      ? true
      : cardKpis.some((kpi) => kpi.drilldown.dimension === drill.hierarchy);

  const breadcrumb = [ROOT_LABEL[drill.hierarchy], ...drill.path].join(' / ');
  const label =
    drill.path.length > 0 && !isRelevantAxis
      ? `${breadcrumb} (no ${drill.hierarchy}-level data on this tab)`
      : breadcrumb;

  return [fullName, label].filter(Boolean).join(' — ');
};
