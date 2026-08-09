import type { DrillSelection, CrossFilters } from '@store/dashboard';

export type QuestionCategory = 'Reasoning' | 'Intelligent Insight' | 'Decision-Making';

export type QuestionTab =
  'rawMaterial' | 'costAnalytics' | 'supplyChain' | 'procurement' | 'product' | 'marketingFinance';

export interface LibraryQuestion {
  id: string;
  tab: QuestionTab;
  question: string;
  category: QuestionCategory;
  relevantKpis: string[];
  /** May reference {plant}, {period}, {bu} — filled in from the active filter/drill state. */
  answerTemplate: string;
}

export const QUESTION_LIBRARY: LibraryQuestion[] = [
  // --- Raw Material ---
  {
    id: 'rm-iron-ore-inventory-increase-reason',
    tab: 'rawMaterial',
    question: 'Why did Iron Ore Inventory increase for the selected plant compared to the previous period?',
    category: 'Reasoning',
    relevantKpis: ['iron-ore-inventory'],
    answerTemplate:
      'For {plant} in {period}, Iron Ore Inventory increased primarily due to higher inbound receipts ahead of the monsoon logistics window, partially offset by steady blast furnace consumption — a net rise of roughly 6% over the prior period.',
  },
  {
    id: 'rm-coking-coal-cost-reason',
    tab: 'rawMaterial',
    question: 'What is driving the change in Coking Coal Cost per Tonne this period?',
    category: 'Reasoning',
    relevantKpis: ['coking-coal-cost-per-tonne'],
    answerTemplate:
      'For {period}, Coking Coal Cost per Tonne is being driven up mainly by higher import freight rates and firmer global benchmark prices, with only a partial offset from long-term contract pricing.',
  },
  {
    id: 'rm-wastage-rate-concentration',
    tab: 'rawMaterial',
    question:
      'Is the Raw Material Wastage Rate increase concentrated in one plant or spread across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['raw-material-wastage-rate'],
    answerTemplate:
      'Two of the five plants account for most of the recent rise in Raw Material Wastage Rate — {plant} among them in {period} — so a targeted process review would likely outperform a blanket fix.',
  },
  {
    id: 'rm-limestone-consumption-driver',
    tab: 'rawMaterial',
    question: 'Which plant is contributing most to the change in Limestone Consumption?',
    category: 'Intelligent Insight',
    relevantKpis: ['limestone-consumption'],
    answerTemplate:
      'Rourkela Plant is the largest contributor to the change in Limestone Consumption in {period}, followed by Jamshedpur, consistent with their larger blast furnace charge requirements.',
  },
  {
    id: 'rm-lead-time-zone-driver',
    tab: 'rawMaterial',
    question: 'Which zone contributes most to Raw Material Lead Time?',
    category: 'Intelligent Insight',
    relevantKpis: ['raw-material-lead-time'],
    answerTemplate:
      'The South zone contributes the most to Raw Material Lead Time, largely due to longer inbound freight distances from key raw material sources.',
  },

  // --- Cost Analytics ---
  {
    id: 'ca-inventory-days-increase-reason',
    tab: 'costAnalytics',
    question: 'Why did Inventory Days increase for the selected plant compared to the previous period?',
    category: 'Reasoning',
    relevantKpis: ['inventory-days', 'inventory-quantity'],
    answerTemplate:
      'For {plant} in {period}, Inventory Days increased primarily due to slower dispatch cycles and a temporary build-up of semi-finished goods in the Rolling Shop, partially offset by improved raw material turnover — a net rise of roughly 6-8% over the prior period.',
  },
  {
    id: 'ca-inventory-quantity-materials',
    tab: 'costAnalytics',
    question:
      'Which materials are contributing most to the increase in Inventory Quantity for the selected BU?',
    category: 'Intelligent Insight',
    relevantKpis: ['inventory-quantity'],
    answerTemplate:
      'For {bu} in {period}, the increase in Inventory Quantity is led by Flat Products and Long Products, together accounting for roughly 58% of the added tonnage, with Wire Rods contributing a smaller but growing share.',
  },
  {
    id: 'ca-inventory-ageing-concentration',
    tab: 'costAnalytics',
    question: 'Is inventory ageing concentrated in critical materials or spread across all materials?',
    category: 'Decision-Making',
    relevantKpis: ['inventory-days', 'inventory-quantity'],
    answerTemplate:
      'For {plant} in {period}, inventory ageing is concentrated in a small set of critical materials — mainly semi-finished coils and billets — rather than spread evenly, so a targeted clearance action would likely be more effective than a blanket inventory reduction drive.',
  },
  {
    id: 'ca-dispatch-cost-process-variation',
    tab: 'costAnalytics',
    question: 'Which process is driving the highest Dispatch Cost/Ton variation across plants?',
    category: 'Reasoning',
    relevantKpis: ['dispatch-cost-per-tonne'],
    answerTemplate:
      'Across plants in {period}, the Transport Process shows the highest Dispatch Cost per Tonne variation, driven by uneven fuel surcharge exposure and longer average haul distances at {plant}, while the Loading and Warehousing processes stay comparatively stable.',
  },
  {
    id: 'ca-gagw-cost-element',
    tab: 'costAnalytics',
    question: 'Which cost element contributed most to the GAGW increase for the selected department?',
    category: 'Intelligent Insight',
    relevantKpis: ['gagw-trend', 'gagw-by-department'],
    answerTemplate:
      'For {bu} in {period}, the Material cost element is the largest contributor to the GAGW increase, followed by Labor — together accounting for over 70% of the movement, with Overhead relatively flat.',
  },

  // --- Supply Chain ---
  {
    id: 'sc-on-time-delivery-reason',
    tab: 'supplyChain',
    question: 'Why did On-Time Delivery Rate change for the selected period?',
    category: 'Reasoning',
    relevantKpis: ['on-time-delivery-rate'],
    answerTemplate:
      'For {period}, On-Time Delivery Rate improved mainly due to better dispatch scheduling and tighter coordination with logistics partners, only partly offset by isolated congestion at inbound depots.',
  },
  {
    id: 'sc-freight-cost-reason',
    tab: 'supplyChain',
    question: 'What is driving the increase in Freight Cost per Tonne across zones?',
    category: 'Reasoning',
    relevantKpis: ['freight-cost-per-tonne'],
    answerTemplate:
      'Freight Cost per Tonne is rising mainly due to higher fuel surcharges and longer average haul distances, with zones further from plant clusters seeing the sharpest increases in {period}.',
  },
  {
    id: 'sc-order-fulfillment-zone-driver',
    tab: 'supplyChain',
    question: 'Which zone is driving the change in Order Fulfillment Cycle Time?',
    category: 'Intelligent Insight',
    relevantKpis: ['order-fulfillment-cycle-time'],
    answerTemplate:
      'The West zone is the largest driver of the improvement in Order Fulfillment Cycle Time in {period}, benefiting from streamlined warehouse-to-dispatch handoffs.',
  },
  {
    id: 'sc-supplier-lead-time-zone-driver',
    tab: 'supplyChain',
    question: 'Which zone contributes most to Supplier Lead Time?',
    category: 'Intelligent Insight',
    relevantKpis: ['supplier-lead-time'],
    answerTemplate:
      'The South zone contributes the most to Supplier Lead Time, reflecting a more dispersed vendor base relative to other zones.',
  },
  {
    id: 'sc-inventory-turnover-concentration',
    tab: 'supplyChain',
    question:
      'Is the change in Inventory Turnover Ratio concentrated in one plant or visible across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['inventory-turnover-ratio'],
    answerTemplate:
      'The improvement in Inventory Turnover Ratio is visible across most plants rather than concentrated in one, though {plant} shows the largest gain in {period} — pointing to a broader stock-discipline initiative rather than a single-site fix.',
  },

  // --- Procurement ---
  {
    id: 'pr-payment-terms-critical-vendors-reason',
    tab: 'procurement',
    question: 'Why have Creditor Payment Terms changed for critical vendors in the selected period?',
    category: 'Reasoning',
    relevantKpis: ['creditors-payment-terms'],
    answerTemplate:
      'In {period}, payment terms for critical vendors at {plant} shifted mainly due to renegotiated contracts with Raw Material Suppliers extending average terms, partially offset by tighter terms held with select Logistics Partners.',
  },
  {
    id: 'pr-payment-terms-vendor-category',
    tab: 'procurement',
    question: 'Which vendor category is driving the change in average payment terms?',
    category: 'Intelligent Insight',
    relevantKpis: ['creditors-payment-terms', 'creditors-payment-terms-by-vendor'],
    answerTemplate:
      'For {period}, Raw Material Suppliers are the largest driver of the change in average payment terms, followed by Equipment Vendors — together accounting for the majority of the shift, while Service Contractors remain broadly unchanged.',
  },
  {
    id: 'pr-payment-terms-plant-concentration',
    tab: 'procurement',
    question: 'Is the payment term change concentrated in one plant or visible across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['creditors-payment-terms'],
    answerTemplate:
      'The change in payment terms is visible across all plants rather than concentrated in one, though {plant} shows the largest movement in {period} — this points to a company-wide vendor negotiation trend rather than an isolated plant-level shift.',
  },
  {
    id: 'pr-actual-spend-capex-opex',
    tab: 'procurement',
    question: 'Is the Actual Spend increase driven more by Capex or Opex?',
    category: 'Decision-Making',
    relevantKpis: ['actual-spend', 'actual-spend-by-capex-opex'],
    answerTemplate:
      'For {period}, the Actual Spend increase is driven far more by Capex — up roughly 26%, led by Machinery & Equipment and Plant Expansion — compared to Opex, which grew only about 2% over the same period.',
  },
  {
    id: 'pr-actual-spend-category-variance',
    tab: 'procurement',
    question: 'Which category contributed most to Actual Spend variance for the selected BU?',
    category: 'Intelligent Insight',
    relevantKpis: ['actual-spend', 'actual-spend-by-capex-opex'],
    answerTemplate:
      'For {bu} in {period}, Machinery & Equipment contributed most to the Actual Spend variance, followed by Raw Materials — together explaining the majority of the movement versus the prior period.',
  },

  // --- Product ---
  {
    id: 'pd-production-volume-reason',
    tab: 'product',
    question: 'Why did Production Volume change for the selected plant compared to the previous period?',
    category: 'Reasoning',
    relevantKpis: ['production-volume'],
    answerTemplate:
      'For {plant} in {period}, Production Volume changed mainly due to shifts in furnace utilization and scheduled maintenance windows, partially offset by improved rolling mill throughput.',
  },
  {
    id: 'pd-capacity-utilization-reason',
    tab: 'product',
    question: 'What is driving the change in Capacity Utilization for the selected plant?',
    category: 'Reasoning',
    relevantKpis: ['capacity-utilization'],
    answerTemplate:
      'At {plant} in {period}, Capacity Utilization is being driven by sustained furnace run-rates and fewer unplanned downtime events versus the prior period.',
  },
  {
    id: 'pd-yield-rate-driver',
    tab: 'product',
    question: 'Which plant is driving the change in Yield Rate?',
    category: 'Intelligent Insight',
    relevantKpis: ['yield-rate'],
    answerTemplate:
      'Rourkela Plant is the largest driver of the change in Yield Rate in {period}, reflecting tighter process control across its melting and rolling stages.',
  },
  {
    id: 'pd-value-added-mix-driver',
    tab: 'product',
    question: 'Which product category is contributing most to the shift in Value-Added Steel Mix?',
    category: 'Intelligent Insight',
    relevantKpis: ['value-added-steel-mix'],
    answerTemplate:
      'The Value-Added Steel mix is being shifted most by growth in Tubes & Pipes and Wire Rods output in {period}, as the portfolio tilts toward higher-margin grades.',
  },
  {
    id: 'pd-defect-rate-concentration',
    tab: 'product',
    question: 'Is the Defect Rate increase concentrated in one plant or spread across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['defect-rate'],
    answerTemplate:
      'Rather than a uniform network-wide trend, the Defect Rate increase traces back to a handful of plants — {plant} showed the sharpest movement in {period} — making a site-specific quality intervention the more effective lever.',
  },

  // --- Marketing & Finance ---
  {
    id: 'mf-revenue-reason',
    tab: 'marketingFinance',
    question: 'Why did Revenue change for the selected zone in the selected period?',
    category: 'Reasoning',
    relevantKpis: ['revenue'],
    answerTemplate:
      'For {period}, Revenue changed mainly due to stronger regional demand and improved price realization, partially offset by softer volumes in select zones.',
  },
  {
    id: 'mf-ebitda-margin-reason',
    tab: 'marketingFinance',
    question: 'What is driving the change in EBITDA Margin for the selected period?',
    category: 'Reasoning',
    relevantKpis: ['ebitda-margin'],
    answerTemplate:
      'For {period}, EBITDA Margin is being driven by steady cost discipline alongside revenue growth, with input cost inflation only partially eroding the gain.',
  },
  {
    id: 'mf-net-profit-driver',
    tab: 'marketingFinance',
    question: 'Which period is contributing most to the change in Net Profit?',
    category: 'Intelligent Insight',
    relevantKpis: ['net-profit'],
    answerTemplate:
      'The most recent quarter of {period} is the largest contributor to the change in Net Profit, as margin gains outpaced input cost inflation.',
  },
  {
    id: 'mf-order-book-value-driver',
    tab: 'marketingFinance',
    question: 'Which zone contributes most to Order Book Value?',
    category: 'Intelligent Insight',
    relevantKpis: ['order-book-value'],
    answerTemplate:
      'The South zone contributes the most to Order Book Value, reflecting a stronger pipeline of confirmed orders relative to other zones.',
  },
  {
    id: 'mf-market-share-concentration',
    tab: 'marketingFinance',
    question: 'Is the Market Share gain concentrated in one zone or visible across all zones?',
    category: 'Decision-Making',
    relevantKpis: ['market-share'],
    answerTemplate:
      'The Market Share gain shows up broadly rather than in a single pocket, with {bu} activity in {period} contributing the largest share of the improvement.',
  },
];

export const getQuestionsForTab = (tab: LibraryQuestion['tab']): LibraryQuestion[] =>
  QUESTION_LIBRARY.filter((q) => q.tab === tab);

export interface QuestionContext {
  plant: string;
  period: string;
  bu: string;
  region: string;
}

/** Derives the {plant}/{period}/{bu}/{region} values shown in mock answers from the live drill +
 * filter state, so answers read as context-aware even though the underlying lookup is a template
 * fill. Shared by the Conversational Insights question engine and the Agent Summary generator so
 * both features read the exact same context for a given drill/filter state. */
export const resolveQuestionContext = (
  drill: DrillSelection,
  crossFilters: CrossFilters,
): QuestionContext => {
  const plant = drill.hierarchy === 'plant' && drill.path[0] ? drill.path[0] : 'All Plants';

  let period = 'All Time';
  if (drill.hierarchy === 'time' && drill.path.length > 0) {
    const [year, quarter, month] = drill.path;
    if (month) period = `${month} ${year}`;
    else if (quarter) period = `${quarter} ${year}`;
    else period = year ?? 'All Time';
  }

  const bu = crossFilters.businessUnit ?? 'All Business Units';
  const region = crossFilters.region ?? 'All Regions';

  return { plant, period, bu, region };
};

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export const fillAnswerTemplate = (template: string, context: QuestionContext): string =>
  template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = (context as unknown as Record<string, string>)[key];
    return value ?? match;
  });
