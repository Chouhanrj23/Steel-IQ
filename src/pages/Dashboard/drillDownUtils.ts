import type { DrillDownNode, DrilldownDimension } from '@/types/dashboard';
import type { HierarchyKey } from '@store/dashboard';

export const ROOT_LABEL: Record<DrilldownDimension, string> = {
  plant: 'All Plants',
  time: 'All Time',
  geography: 'All Locations',
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
