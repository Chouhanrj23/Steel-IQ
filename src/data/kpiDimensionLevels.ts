/**
 * Human-readable names for each level of a KPI's own drilldown tree — e.g. Sale of Iron Ore's
 * tree is Year → Quarter → Month → Plant → Process → Grade. `DrillDownNode` itself only carries
 * the *value* at each level (its label is a specific plant/month/grade name, not the general
 * concept "Plant"), so there's nowhere in the existing data model to read these from — this is
 * the one small piece of new metadata the Explore builder needs, purely for labeling picklist
 * options. It does not change how any tree is walked or aggregated; `getNodesAtDepth` in
 * `drillDownUtils.ts` does that generically from the existing `DrillDownNode` shape.
 *
 * Order and length here must match each KPI's actual tree exactly (verified against the
 * mockData restructuring script's own depth report) — most KPIs are 4-6 levels deep, matching
 * how deep their own real-world hierarchy genuinely goes (e.g. Competitor Comparison and
 * Operational KPIs Tracking Against Plan are intentionally shallow, not padded to 6).
 */
export const KPI_LEVEL_NAMES: Record<string, string[]> = {
  // Raw Material
  'sale-of-iron-ore': ['Year', 'Quarter', 'Month', 'Plant', 'Process', 'Grade'],
  'clean-coal-production': ['Year', 'Quarter', 'Month', 'Plant', 'Process', 'Grade'],
  'raw-material-wastage-rate': ['Plant', 'Line', 'Shop', 'Unit', 'Shift', 'Waste Cause'],
  'limestone-consumption': ['Plant', 'Line', 'Shop', 'Unit', 'Feed Bin', 'Batch/Lot'],
  // Cost Analytics
  'inventory-days': ['Year', 'Quarter', 'Month', 'Material', 'Plant', 'Age Bucket'],
  'inventory-quantity': ['Year', 'Quarter', 'Month', 'Material', 'Plant', 'Age Bucket'],
  'dispatch-cost-per-tonne': ['Year', 'Quarter', 'Month', 'Plant', 'Process'],
  'gagw-trend': ['Year', 'Quarter', 'Month', 'VP', 'Cost Element', 'Dept'],
  // Supply Chain
  'imported-coal-inventory-days': ['Year', 'Quarter', 'Month', 'Material', 'Plant'],
  'imported-coal-inventory-quantity': ['Year', 'Quarter', 'Month', 'Material', 'Plant'],
  'spc-cost-per-tonne': ['Year', 'Quarter', 'Month', 'Plant', 'Process'],
  'inventory-turnover-ratio': [
    'Region',
    'Plant',
    'Unit',
    'Product Category',
    'SKU Group',
    'Storage Location',
  ],
  // Procurement
  'creditors-payment-terms': ['Year', 'Quarter', 'Month', 'Vendor Category', 'Plant'],
  'actual-spend': ['Year', 'Quarter', 'Month', 'Plant', 'Category'],
  'vendor-on-time-delivery': ['Plant', 'Line', 'Shop', 'Unit', 'Vendor', 'Shipment Type'],
  'purchase-order-cycle-time': ['Year', 'Quarter', 'Month', 'PO Type', 'Vendor Category', 'Plant'],
  // E&P
  'ep-spend-vs-plan': ['Year', 'Quarter', 'Month', 'Plant', 'Scheme Status'],
  'ep-scheme-closure': ['Year', 'Quarter', 'Month', 'Plant', 'Capex/Opex'],
  'ep-capex-utilization-rate': ['Year', 'Quarter', 'Month', 'Plant'],
  'ep-project-milestone-adherence': ['Year', 'Quarter', 'Month', 'Plant'],
  // TSK
  'tsk-other-receivables-recovery': ['Year', 'Quarter', 'Month', 'Nature', 'Age Bucket'],
  'tsk-competitor-comparison': ['Company', 'Cost Head/Price Metric'],
  'tsk-production-volume': ['Year', 'Quarter', 'Month', 'Business Area'],
  'tsk-cost-efficiency-index': ['Year', 'Quarter', 'Month', 'Business Area'],
  // TSJ
  'product-wise-profitability': ['Customer', 'Segment', 'Grade', 'Zone'],
  'operational-kpis-vs-plan': ['Metric Category', 'Plant'],
  'yield-rate': ['Region', 'Plant', 'Unit', 'Product Line', 'Shift', 'Heat/Batch'],
  'defect-rate': ['Region', 'Plant', 'Unit', 'Product Line', 'Shift', 'Heat/Batch'],
  // TSPL
  'tspl-srm-expenses-contract-cost': ['Year', 'Quarter', 'Month', 'Plant', 'Contract Category'],
  'tspl-customer-rejections': ['Year', 'Quarter', 'Month', 'Customer', 'Vertical'],
  'tspl-otif-delivery': ['Year', 'Quarter', 'Month', 'Plant'],
  'tspl-realization-per-ton': ['Year', 'Quarter', 'Month', 'Plant'],
  // Marketing & Finance
  'mf-factoring-collection-trend': ['Year', 'Quarter', 'Month', 'Customer', 'Vertical'],
  'mf-interest-on-overdue': ['Year', 'Quarter', 'Month', 'Customer', 'Vertical'],
  'mf-conversion-cost-trend': ['Year', 'Quarter', 'Month', 'Customer', 'Vertical'],
  'net-profit': ['Year', 'Quarter', 'Month', 'Business Unit', 'Product Segment', 'Cost Center'],
};

export const getLevelNames = (kpiId: string): string[] => KPI_LEVEL_NAMES[kpiId] ?? [];
