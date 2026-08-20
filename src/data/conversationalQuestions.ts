import type { DrillSelection, CrossFilters } from '@store/dashboard';

export type QuestionCategory = 'Reasoning' | 'Intelligent Insight' | 'Decision-Making';

export type QuestionTab =
  | 'rawMaterial'
  | 'costAnalytics'
  | 'supplyChain'
  | 'procurement'
  | 'ep'
  | 'tsk'
  | 'tsj'
  | 'tspl'
  | 'marketingFinance';

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
    id: 'rm-sale-iron-ore-reason',
    tab: 'rawMaterial',
    question: 'Why did Sale of Iron Ore change for the selected period?',
    category: 'Reasoning',
    relevantKpis: ['sale-of-iron-ore'],
    answerTemplate:
      'For {period}, Sale of Iron Ore changed mainly due to stronger external demand for Fines, partially offset by higher captive consumption diverting Lumps away from the sales pool.',
  },
  {
    id: 'rm-clean-coal-production-reason',
    tab: 'rawMaterial',
    question: 'What is driving the change in Clean Coal Production this period?',
    category: 'Reasoning',
    relevantKpis: ['clean-coal-production'],
    answerTemplate:
      'For {period}, Clean Coal Production is being driven up mainly by higher throughput in the Washing stage, with Beneficiation yield holding broadly steady.',
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
    id: 'rm-iron-ore-grade-driver',
    tab: 'rawMaterial',
    question: 'Which grade is contributing most to Sale of Iron Ore this period?',
    category: 'Intelligent Insight',
    relevantKpis: ['sale-of-iron-ore'],
    answerTemplate:
      'Fines account for the larger share of the change in Sale of Iron Ore in {period}, as Lumps volumes stay more tightly earmarked for captive blast furnace use.',
  },

  // --- Cost Analytics ---
  {
    id: 'ca-inventory-days-increase-reason',
    tab: 'costAnalytics',
    question: 'Why did Inventory Days increase for the selected plant compared to the previous period?',
    category: 'Reasoning',
    relevantKpis: ['inventory-days', 'inventory-quantity'],
    answerTemplate:
      'For {plant} in {period}, Inventory Days increased primarily due to slower dispatch cycles and a temporary build-up of WIP material, partially offset by improved raw material turnover — a net rise of roughly 6-8% over the prior period.',
  },
  {
    id: 'ca-inventory-quantity-material-mix',
    tab: 'costAnalytics',
    question:
      'Which material category is contributing most to the increase in Inventory Quantity for the selected BU?',
    category: 'Intelligent Insight',
    relevantKpis: ['inventory-quantity'],
    answerTemplate:
      'For {bu} in {period}, the increase in Inventory Quantity is led by Raw Material stock, with WIP contributing a smaller but growing share and Finished Goods holding roughly flat.',
  },
  {
    id: 'ca-inventory-ageing-concentration',
    tab: 'costAnalytics',
    question: 'Is inventory ageing concentrated in the 31+ Days bucket or the 0-30 Days bucket?',
    category: 'Decision-Making',
    relevantKpis: ['inventory-days', 'inventory-quantity'],
    answerTemplate:
      'For {plant} in {period}, inventory ageing is concentrated in the 31+ Days bucket rather than spread evenly, so a targeted clearance action would likely be more effective than a blanket inventory reduction drive.',
  },
  {
    id: 'ca-dispatch-cost-process-variation',
    tab: 'costAnalytics',
    question: 'Which process is driving the highest Dispatch Cost/Ton variation across plants?',
    category: 'Reasoning',
    relevantKpis: ['dispatch-cost-per-tonne'],
    answerTemplate:
      'Across plants in {period}, the Transport process shows the highest Dispatch Cost per Tonne variation, driven by uneven fuel surcharge exposure and longer average haul distances at {plant}, while the Loading and Warehousing processes stay comparatively stable.',
  },
  {
    id: 'ca-gagw-vp-driver',
    tab: 'costAnalytics',
    question: 'Which VP and cost element are driving the GAGW Trend increase for the selected department?',
    category: 'Intelligent Insight',
    relevantKpis: ['gagw-trend'],
    answerTemplate:
      'For {bu} in {period}, VP-Operations is the largest contributor to the GAGW Trend increase, with Material the leading cost element within that group — together accounting for over 60% of the movement.',
  },

  // --- Supply Chain ---
  {
    id: 'sc-imported-coal-inventory-days-reason',
    tab: 'supplyChain',
    question: 'Why did Imported Coal Inventory (Days) change for the selected period?',
    category: 'Reasoning',
    relevantKpis: ['imported-coal-inventory-days'],
    answerTemplate:
      'For {period}, Imported Coal Inventory (Days) improved mainly due to tighter shipping schedules and faster customs clearance on Australian Coal cargoes.',
  },
  {
    id: 'sc-imported-coal-inventory-quantity-driver',
    tab: 'supplyChain',
    question: 'Which coal origin is contributing most to Imported Coal Inventory (Qty)?',
    category: 'Intelligent Insight',
    relevantKpis: ['imported-coal-inventory-quantity'],
    answerTemplate:
      'Australian Coal is the largest contributor to the build-up in Imported Coal Inventory (Qty) in {period}, as cargo lot sizes outpaced the draw-down rate at the receiving plants.',
  },
  {
    id: 'sc-spc-cost-reason',
    tab: 'supplyChain',
    question: 'What is driving the increase in SPC Cost/Ton across plants?',
    category: 'Reasoning',
    relevantKpis: ['spc-cost-per-tonne'],
    answerTemplate:
      'SPC Cost/Ton is rising mainly due to higher Handling costs, with Screening and Blending holding comparatively flat in {period}.',
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
    id: 'pr-payment-terms-vendor-category',
    tab: 'procurement',
    question: 'Which vendor category is driving the change in average Creditors Payment Terms?',
    category: 'Intelligent Insight',
    relevantKpis: ['creditors-payment-terms'],
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
    id: 'pr-actual-spend-category-driver',
    tab: 'procurement',
    question: 'Which spend category is driving the change in Actual Spend?',
    category: 'Decision-Making',
    relevantKpis: ['actual-spend'],
    answerTemplate:
      'For {period}, Raw Materials is the largest driver of the change in Actual Spend, with Capex a smaller but faster-growing share and Services & Contracts holding broadly flat.',
  },
  {
    id: 'pr-vendor-on-time-delivery-driver',
    tab: 'procurement',
    question: 'Which plant is driving the change in Vendor On-Time Delivery?',
    category: 'Intelligent Insight',
    relevantKpis: ['vendor-on-time-delivery'],
    answerTemplate:
      'Rourkela Plant is the largest driver of the improvement in Vendor On-Time Delivery in {period}, reflecting closer coordination with its top logistics vendors.',
  },
  {
    id: 'pr-po-cycle-time-driver',
    tab: 'procurement',
    question: 'Which PO type contributes most to Purchase Order Cycle Time?',
    category: 'Intelligent Insight',
    relevantKpis: ['purchase-order-cycle-time'],
    answerTemplate:
      'Standard POs contribute the largest share of Purchase Order Cycle Time in {period}, while Urgent POs — though fewer in number — carry a disproportionately faster turnaround.',
  },

  // --- E&P ---
  {
    id: 'ep-spend-vs-plan-reason',
    tab: 'ep',
    question: 'Why did Spend vs Plan change for the selected period?',
    category: 'Reasoning',
    relevantKpis: ['ep-spend-vs-plan'],
    answerTemplate:
      'For {period}, Spend vs Plan improved mainly due to faster execution on schemes marked On Track, partially offset by a handful of Delayed schemes still ramping up.',
  },
  {
    id: 'ep-scheme-closure-driver',
    tab: 'ep',
    question: 'Which plant is driving the change in Scheme Closure?',
    category: 'Intelligent Insight',
    relevantKpis: ['ep-scheme-closure'],
    answerTemplate:
      'Rourkela Plant is the largest driver of the improvement in Scheme Closure in {period}, with Capex schemes closing out faster than Opex ones.',
  },
  {
    id: 'ep-capex-utilization-reason',
    tab: 'ep',
    question: 'What is driving the change in Capex Utilization Rate?',
    category: 'Reasoning',
    relevantKpis: ['ep-capex-utilization-rate'],
    answerTemplate:
      'For {plant} in {period}, Capex Utilization Rate improved mainly due to fewer approval-stage delays and better phasing of drawdowns against the sanctioned budget.',
  },
  {
    id: 'ep-milestone-adherence-concentration',
    tab: 'ep',
    question:
      'Is the Project Milestone Adherence decline concentrated in one plant or spread across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['ep-project-milestone-adherence'],
    answerTemplate:
      'The Project Milestone Adherence decline traces back to a handful of plants rather than a uniform trend — {plant} showed the sharpest slippage in {period} — making a site-specific project review the more effective lever.',
  },

  // --- TSK ---
  {
    id: 'tsk-receivables-reason',
    tab: 'tsk',
    question: 'Why did Other Receivables & Recovery Projections change this period?',
    category: 'Reasoning',
    relevantKpis: ['tsk-other-receivables-recovery'],
    answerTemplate:
      'For {period}, Other Receivables & Recovery Projections rose mainly on Trade Receivables, with Employee Advances and Insurance Claims contributing a smaller, steadier share.',
  },
  {
    id: 'tsk-receivables-ageing',
    tab: 'tsk',
    question: 'Is the rise in Other Receivables concentrated in the 31+ Days bucket or recent invoices?',
    category: 'Decision-Making',
    relevantKpis: ['tsk-other-receivables-recovery'],
    answerTemplate:
      'The rise is concentrated in the 31+ Days bucket in {period} rather than recent invoices, pointing to a recovery-process bottleneck rather than a spike in new billings.',
  },
  {
    id: 'tsk-competitor-comparison-driver',
    tab: 'tsk',
    question: 'How does our Realization/Ton compare to competitors this period?',
    category: 'Intelligent Insight',
    relevantKpis: ['tsk-competitor-comparison'],
    answerTemplate:
      'For {period}, our Realization/Ton runs ahead of Competitor A and Competitor B, with Competitor C the closest competitive benchmark on the Cost/Ton metric.',
  },
  {
    id: 'tsk-production-volume-reason',
    tab: 'tsk',
    question: 'What is driving the change in TSK Production Volume?',
    category: 'Reasoning',
    relevantKpis: ['tsk-production-volume'],
    answerTemplate:
      'For {period}, TSK Production Volume is being driven up mainly by the Mining business area, with Processing and Logistics holding broadly steady.',
  },

  // --- TSJ ---
  {
    id: 'tsj-profitability-driver',
    tab: 'tsj',
    question: 'Which customer segment is contributing most to Product Wise Profitability?',
    category: 'Intelligent Insight',
    relevantKpis: ['product-wise-profitability'],
    answerTemplate:
      'Key Account Customers contribute the largest share of the improvement in Product Wise Profitability in {period}, led by the Automotive segment on Grade A material.',
  },
  {
    id: 'tsj-operational-plan-reason',
    tab: 'tsj',
    question: 'Why is Operational KPIs Tracking Against Plan below target this period?',
    category: 'Reasoning',
    relevantKpis: ['operational-kpis-vs-plan'],
    answerTemplate:
      'For {plant} in {period}, Operational KPIs Tracking Against Plan is running below target mainly on the Daily Sales metric category, with Hot Metal & Crude Steel production closer to plan.',
  },
  {
    id: 'tsj-yield-rate-driver',
    tab: 'tsj',
    question: 'Which plant is driving the change in Yield Rate?',
    category: 'Intelligent Insight',
    relevantKpis: ['yield-rate'],
    answerTemplate:
      'Rourkela Plant is the largest driver of the change in Yield Rate in {period}, reflecting tighter process control across its melting and rolling stages.',
  },
  {
    id: 'tsj-defect-rate-concentration',
    tab: 'tsj',
    question: 'Is the Defect Rate increase concentrated in one plant or spread across all plants?',
    category: 'Decision-Making',
    relevantKpis: ['defect-rate'],
    answerTemplate:
      'Rather than a uniform network-wide trend, the Defect Rate increase traces back to a handful of plants — {plant} showed the sharpest movement in {period} — making a site-specific quality intervention the more effective lever.',
  },

  // --- TSPL ---
  {
    id: 'tspl-srm-cost-reason',
    tab: 'tspl',
    question: 'What is driving the change in SRM Expenses/Contract Cost Trend?',
    category: 'Reasoning',
    relevantKpis: ['tspl-srm-expenses-contract-cost'],
    answerTemplate:
      'For {plant} in {period}, SRM Expenses/Contract Cost Trend is being driven up mainly by AMC contracts, with Manpower Services and Logistics Contracts holding a steadier share.',
  },
  {
    id: 'tspl-customer-rejections-driver',
    tab: 'tspl',
    question: 'Which vertical is contributing most to Customer Rejections?',
    category: 'Intelligent Insight',
    relevantKpis: ['tspl-customer-rejections'],
    answerTemplate:
      'The Automotive vertical contributes the largest share of Customer Rejections in {period}, reflecting tighter tolerance specifications relative to Construction and Infrastructure accounts.',
  },
  {
    id: 'tspl-otif-reason',
    tab: 'tspl',
    question: 'Why did OTIF Delivery change for the selected plant?',
    category: 'Reasoning',
    relevantKpis: ['tspl-otif-delivery'],
    answerTemplate:
      'For {plant} in {period}, OTIF Delivery improved mainly due to tighter dispatch scheduling and fewer part-shipments versus the prior period.',
  },
  {
    id: 'tspl-realization-driver',
    tab: 'tspl',
    question: 'Which plant is driving the change in Realization/Ton?',
    category: 'Intelligent Insight',
    relevantKpis: ['tspl-realization-per-ton'],
    answerTemplate:
      'Jamshedpur Plant is the largest driver of the change in Realization/Ton in {period}, benefiting from a richer long-products sales mix.',
  },

  // --- Marketing & Finance ---
  {
    id: 'mf-factoring-collection-reason',
    tab: 'marketingFinance',
    question: 'Why did Factoring & Collection Trend change for the selected vertical?',
    category: 'Reasoning',
    relevantKpis: ['mf-factoring-collection-trend'],
    answerTemplate:
      'For {period}, Factoring & Collection Trend improved mainly due to faster collections from Key Account Customers in the Automotive vertical.',
  },
  {
    id: 'mf-interest-overdue-driver',
    tab: 'marketingFinance',
    question: 'Which customer segment contributes most to Interest on Overdue?',
    category: 'Intelligent Insight',
    relevantKpis: ['mf-interest-on-overdue'],
    answerTemplate:
      'Other Customers contribute the largest share of Interest on Overdue in {period}, reflecting longer average settlement delays than Key Account Customers.',
  },
  {
    id: 'mf-conversion-cost-reason',
    tab: 'marketingFinance',
    question: 'What is driving the change in Conversion Cost Trend?',
    category: 'Reasoning',
    relevantKpis: ['mf-conversion-cost-trend'],
    answerTemplate:
      'For {period}, Conversion Cost Trend is rising mainly due to higher energy and consumables costs allocated across the Construction and Infrastructure verticals.',
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
];

export const getQuestionsForTab = (tab: LibraryQuestion['tab']): LibraryQuestion[] =>
  QUESTION_LIBRARY.filter((q) => q.tab === tab);

export interface QuestionContext {
  plant: string;
  period: string;
  bu: string;
  region: string;
  category: string;
}

/** Derives the {plant}/{period}/{bu}/{region}/{category} values shown in mock answers from the
 * live drill + filter state, so answers read as context-aware even though the underlying lookup
 * is a template fill. Shared by the Conversational Insights question engine and the Agent
 * Summary generator so both features read the exact same context for a given drill/filter
 * state. */
export const resolveQuestionContext = (
  drill: DrillSelection,
  crossFilters: CrossFilters,
): QuestionContext => {
  // The global Plant filter (crossFilters.plant) takes priority over the in-page Time/Plant
  // drill-down's own path when both happen to be set — it's the more explicit, deliberate
  // signal (a dropdown pick vs. wherever the breadcrumb happens to be sitting), and unlike the
  // in-page drill it's guaranteed to actually be a plant name rather than a Year/Quarter/Month.
  const plant =
    crossFilters.plant ?? (drill.hierarchy === 'plant' && drill.path[0] ? drill.path[0] : 'All Plants');

  let period = 'All Time';
  if (drill.hierarchy === 'time' && drill.path.length > 0) {
    const [year, quarter, month] = drill.path;
    if (month) period = `${month} ${year}`;
    else if (quarter) period = `${quarter} ${year}`;
    else period = year ?? 'All Time';
  }

  const bu = crossFilters.businessUnit ?? 'All Business Units';
  const region = crossFilters.region ?? 'All Regions';
  const category = crossFilters.productCategory ?? 'All Categories';

  return { plant, period, bu, region, category };
};

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export const fillAnswerTemplate = (template: string, context: QuestionContext): string =>
  template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = (context as unknown as Record<string, string>)[key];
    return value ?? match;
  });

// Generic connector/pattern words shared across many canned questions ("why did X change",
// "which plant is driving...", "is X concentrated in one plant or spread across all plants") —
// stripped before matching so a match hinges on each question's actual distinguishing
// vocabulary (the KPI name, "wastage", "receivables", etc.) rather than on sentence scaffolding
// every question shares, which is what would otherwise cause cross-KPI false positives. Includes
// a couple of common contraction remnants ("whats", "hows") since punctuation is stripped before
// tokenizing, so "What's" becomes "whats" rather than "what".
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'why',
  'what',
  'whats',
  'which',
  'who',
  'whom',
  'how',
  'hows',
  'did',
  'does',
  'do',
  'for',
  'to',
  'in',
  'on',
  'at',
  'of',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'we',
  'our',
  'change',
  'changed',
  'changing',
  'selected',
  'period',
  'across',
  'or',
  'and',
  'driving',
  'drive',
  'drives',
  'contribute',
  'contributing',
  'contributes',
  'most',
  'concentrated',
  'spread',
  'all',
  'one',
  'than',
  'compared',
  'previous',
  'compare',
  'vs',
  'increase',
  'decrease',
  'decline',
  'improved',
  'improving',
  'below',
  'above',
]);

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '');

const significantTokens = (text: string): string[] =>
  normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));

// Plain overlap-count scoring (matched tokens ÷ candidate's own token count) systematically
// favors short candidates: many questions share a "Which plant is driving the change in X?"
// shape, so a 3-token candidate like "plant / yield / rate" only needs 2 hits to hit 67%, while
// the genuinely correct but longer "raw / material / wastage / rate / plant / plants" candidate
// needs proportionally more — a query built around "wastage" could out-score on the wrong,
// shorter candidate despite never mentioning "yield" at all (this happened in testing). Weighting
// each token by its rarity across the library (inverse document frequency) fixes it: "wastage" or
// "receivables", which each appear in exactly one question, carry far more weight than "plant" or
// "rate", which recur across a dozen — so matches are driven by what actually distinguishes a
// question, not by incidentally sharing its most common words.
const QUESTION_TOKEN_SETS: string[][] = QUESTION_LIBRARY.map((q) =>
  Array.from(new Set(significantTokens(q.question))),
);

const TOKEN_WEIGHT: Map<string, number> = (() => {
  const documentFrequency = new Map<string, number>();
  for (const tokens of QUESTION_TOKEN_SETS) {
    for (const token of tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const weights = new Map<string, number>();
  for (const [token, df] of documentFrequency) {
    weights.set(token, 1 / df);
  }
  return weights;
})();

const weightOf = (token: string): number => TOKEN_WEIGHT.get(token) ?? 1;

/** Minimum fraction of a candidate's own *weighted* vocabulary that must appear in the query
 * before it counts as a match, and the minimum raw (unweighted) token overlap regardless of
 * weight — both guards exist so an off-topic query (no shared vocabulary at all) reliably scores
 * 0 and returns `null` instead of matching whatever candidate happens to share one word. */
const MIN_MATCH_SCORE = 0.4;
const MIN_MATCH_OVERLAP = 2;

/** Free-text matching for the Conversational Insights input — always searches the full global
 * `QUESTION_LIBRARY`, not just the current tab's own subset, so a question about any tab's KPI
 * resolves correctly no matter which tab it's asked from. An exact match (case/punctuation
 * differences aside) wins outright; otherwise every candidate is scored by its *rarity-weighted*
 * vocabulary overlap with the query (see the token-weight comment above), and only a confident
 * match is returned — `null` for anything off-topic. */
export const matchQuestion = (query: string): LibraryQuestion | null => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const exact = QUESTION_LIBRARY.find((candidate) => normalize(candidate.question) === normalizedQuery);
  if (exact) return exact;

  const queryTokens = new Set(significantTokens(query));
  if (queryTokens.size === 0) return null;

  let best: LibraryQuestion | null = null;
  let bestScore = 0;
  QUESTION_LIBRARY.forEach((candidate, index) => {
    const candidateTokens = QUESTION_TOKEN_SETS[index] ?? [];
    if (candidateTokens.length === 0) return;
    const overlapTokens = candidateTokens.filter((token) => queryTokens.has(token));
    if (overlapTokens.length < MIN_MATCH_OVERLAP) return;
    const overlapWeight = overlapTokens.reduce((sum, token) => sum + weightOf(token), 0);
    const candidateWeight = candidateTokens.reduce((sum, token) => sum + weightOf(token), 0);
    const score = overlapWeight / candidateWeight;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });

  return bestScore >= MIN_MATCH_SCORE ? best : null;
};
