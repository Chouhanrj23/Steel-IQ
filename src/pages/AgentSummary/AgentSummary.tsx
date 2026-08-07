import { PageHeader } from '@components/common';
import { AgentSummaryPanel } from '@components/dashboard';

const GENERIC_INSIGHTS = [
  'Overall plant efficiency trended upward this period, led by improved capacity utilization at two facilities.',
  'Cost variance narrowed across raw material and logistics categories compared to the prior quarter.',
  'No critical supply chain disruptions were flagged in the current reporting window.',
];

export const AgentSummary = () => {
  return (
    <>
      <PageHeader title="Agent Summary" />
      <AgentSummaryPanel insights={GENERIC_INSIGHTS} />
    </>
  );
};

export default AgentSummary;
