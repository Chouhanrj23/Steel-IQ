import type { DrillDownNode, DrilldownDimension } from '@/types/dashboard';
import type { CrossFilters, HierarchyKey } from '@store/dashboard';

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

/** The single node identified by walking `path` one label at a time (each step searched
 * anywhere in the remaining subtree), or null if `path` is empty. */
export const getNodeAtPath = (root: DrillDownNode[], path: string[]): DrillDownNode | null => {
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

/** Recomputes a tree with only the leaves matching every active filter counted, propagating
 * sums back up through parents. Shape (labels/nesting) is untouched, so it can be fed straight
 * into getNodeAtPath/getNodesAtPath — cross-filters compose with the Time/Plant drill rather
 * than replacing it. Returns `nodes` unchanged (same reference) when no filter is active. */
export const applyCrossFilters = (nodes: DrillDownNode[], filters: CrossFilters): DrillDownNode[] => {
  if (!filters.region && !filters.businessUnit && !filters.productCategory) return nodes;

  const recompute = (node: DrillDownNode): DrillDownNode => {
    if (!node.children) {
      const tags = node.tags;
      const matches =
        (!filters.region || tags?.region === filters.region) &&
        (!filters.businessUnit || tags?.businessUnit === filters.businessUnit) &&
        (!filters.productCategory || tags?.productCategory === filters.productCategory);
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
