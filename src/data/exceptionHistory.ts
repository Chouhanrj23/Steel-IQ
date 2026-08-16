export interface HistoricalException {
  /** ISO date (YYYY-MM-DD) the occurrence was recorded. */
  date: string;
  /** Brief description, styled like the live Threshold/Trend/Variance message this occurrence
   * would have triggered — synthetic, not derived from real history. */
  description: string;
  /** 2-3 generic operational responses — deliberately not KPI-specific business logic (e.g.
   * never "increase blending ratio"), since the client asked this stay a historical record, not
   * an implied correct action for the current exception. */
  actionsTaken: string[];
}

/** Synthetic past-occurrence log, keyed by KPI id. Populated for a handful of KPIs across
 * different modules only — most KPIs intentionally have no entries, since this is new synthetic
 * data rather than a real action log, so the "Suggested by Past Actions" section's empty state is
 * the common case, not an edge case. */
export const EXCEPTION_HISTORY: Partial<Record<string, HistoricalException[]>> = {
  'raw-material-wastage-rate': [
    {
      date: '2026-06-02',
      description: 'Raw Material Wastage Rate breached its warning threshold at 4.2%.',
      actionsTaken: [
        'Escalated to plant manager',
        'Scheduled a root-cause review',
        'Flagged for vendor review',
      ],
    },
    {
      date: '2026-03-18',
      description: 'Raw Material Wastage Rate moved up 9.6% versus the prior period.',
      actionsTaken: ['Opened a corrective action ticket', 'Notified regional supply chain lead'],
    },
    {
      date: '2025-11-27',
      description: 'Raw Material Wastage Rate was off plan by 12.8% against target.',
      actionsTaken: [
        'Escalated to plant manager',
        'Adjusted procurement schedule',
        'Looped in quality assurance team',
      ],
    },
  ],
  'inventory-days': [
    {
      date: '2026-05-09',
      description: 'Average Inventory Days was off plan by 10.3% against target.',
      actionsTaken: ['Adjusted procurement schedule', 'Notified regional supply chain lead'],
    },
    {
      date: '2026-01-22',
      description: 'Average Inventory Days breached its warning threshold at 24.8 days.',
      actionsTaken: [
        'Escalated to plant manager',
        'Opened a corrective action ticket',
        'Requested vendor performance report',
      ],
    },
  ],
  'spc-cost-per-tonne': [
    {
      date: '2026-07-11',
      description: 'SPC Cost/Ton moved up 6.4% versus the prior period.',
      actionsTaken: ['Flagged for vendor review', 'Adjusted procurement schedule'],
    },
    {
      date: '2026-04-05',
      description: 'SPC Cost/Ton breached its warning threshold at INR 1,310.',
      actionsTaken: [
        'Escalated to plant manager',
        'Requested vendor performance report',
        'Opened a corrective action ticket',
      ],
    },
    {
      date: '2025-12-14',
      description: 'SPC Cost/Ton was off plan by 9.7% against target.',
      actionsTaken: ['Notified regional supply chain lead', 'Scheduled a root-cause review'],
    },
  ],
  'actual-spend': [
    {
      date: '2026-06-20',
      description: 'Actual Spend was off plan by 13.5% against target.',
      actionsTaken: ['Escalated to plant manager', 'Raised to finance controller'],
    },
    {
      date: '2026-02-08',
      description: 'Actual Spend moved up 8.1% versus the prior period.',
      actionsTaken: [
        'Opened a corrective action ticket',
        'Adjusted procurement schedule',
        'Raised to finance controller',
      ],
    },
  ],
  'ep-project-milestone-adherence': [
    {
      date: '2026-05-30',
      description: 'Project Milestone Adherence breached its warning threshold at 76.2%.',
      actionsTaken: ['Escalated to plant manager', 'Scheduled a root-cause review'],
    },
    {
      date: '2026-02-17',
      description: 'Project Milestone Adherence moved down 7.4% versus the prior period.',
      actionsTaken: [
        'Opened a corrective action ticket',
        'Notified regional supply chain lead',
        'Escalated to plant manager',
      ],
    },
  ],
  'tsk-other-receivables-recovery': [
    {
      date: '2026-07-02',
      description: 'Other Receivables & Recovery Projections was off plan by 11.9% against target.',
      actionsTaken: ['Raised to finance controller', 'Opened a corrective action ticket'],
    },
    {
      date: '2026-03-25',
      description: 'Other Receivables & Recovery Projections breached its warning threshold at ₹3,340 Lakh.',
      actionsTaken: [
        'Escalated to plant manager',
        'Requested vendor performance report',
        'Raised to finance controller',
      ],
    },
    {
      date: '2025-10-19',
      description: 'Other Receivables & Recovery Projections moved up 10.2% versus the prior period.',
      actionsTaken: ['Scheduled a root-cause review', 'Notified regional supply chain lead'],
    },
  ],
  'defect-rate': [
    {
      date: '2026-07-28',
      description: 'Defect Rate breached its critical threshold at 2.6%.',
      actionsTaken: [
        'Escalated to plant manager',
        'Looped in quality assurance team',
        'Opened a corrective action ticket',
      ],
    },
    {
      date: '2026-05-16',
      description: 'Defect Rate moved up 14.3% versus the prior period.',
      actionsTaken: ['Looped in quality assurance team', 'Scheduled a root-cause review'],
    },
    {
      date: '2026-02-21',
      description: 'Defect Rate was off plan by 22.6% against target.',
      actionsTaken: ['Escalated to plant manager', 'Opened a corrective action ticket'],
    },
    {
      date: '2025-11-04',
      description: 'Defect Rate breached its warning threshold at 2.1%.',
      actionsTaken: [
        'Looped in quality assurance team',
        'Requested vendor performance report',
        'Notified regional supply chain lead',
      ],
    },
  ],
  'tspl-customer-rejections': [
    {
      date: '2026-06-13',
      description: 'Customer Rejections moved up 18.7% versus the prior period.',
      actionsTaken: ['Looped in quality assurance team', 'Escalated to plant manager'],
    },
    {
      date: '2026-01-30',
      description: 'Customer Rejections was off plan by 15.4% against target.',
      actionsTaken: [
        'Opened a corrective action ticket',
        'Requested vendor performance report',
        'Looped in quality assurance team',
      ],
    },
  ],
  'mf-interest-on-overdue': [
    {
      date: '2026-07-19',
      description: 'Interest on Overdue breached its warning threshold at ₹198 Lakh.',
      actionsTaken: ['Raised to finance controller', 'Escalated to plant manager'],
    },
    {
      date: '2026-04-22',
      description: 'Interest on Overdue moved up 12.9% versus the prior period.',
      actionsTaken: ['Raised to finance controller', 'Opened a corrective action ticket'],
    },
    {
      date: '2025-12-30',
      description: 'Interest on Overdue was off plan by 19.1% against target.',
      actionsTaken: [
        'Escalated to plant manager',
        'Notified regional supply chain lead',
        'Raised to finance controller',
      ],
    },
  ],
};

/** Past occurrences for a KPI, most recent first — `[]` (not `undefined`) when none exist, so
 * callers can render an empty state without a null check. */
export const getExceptionHistory = (kpiId: string): HistoricalException[] =>
  [...(EXCEPTION_HISTORY[kpiId] ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
