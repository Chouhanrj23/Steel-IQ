import { PageHeader } from '@components/common';
import { ConversationalInsightsPanel } from '@components/dashboard';

const GENERIC_QA_PAIRS = [
  {
    question: 'What changed most this period?',
    answer: 'Capacity utilization and on-time delivery both improved, while raw material lead time increased slightly.',
  },
  {
    question: 'Which module needs the most attention?',
    answer: 'Procurement shows the widest variance against target this period, primarily in vendor rejection rate.',
  },
  {
    question: 'Are there any critical alerts right now?',
    answer: 'One critical alert is active: defect rate in the Product module exceeds its threshold.',
  },
  {
    question: 'How does this quarter compare to last quarter?',
    answer: 'Revenue and EBITDA margin both improved quarter-over-quarter across most modules.',
  },
  {
    question: 'What should I look at first?',
    answer: 'Start with the Raw Material tab — it has the most significant week-over-week movement.',
  },
];

export const ConversationalInsights = () => {
  return (
    <>
      <PageHeader title="Conversational Insights" />
      <ConversationalInsightsPanel qaPairs={GENERIC_QA_PAIRS} />
    </>
  );
};

export default ConversationalInsights;
