import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Card } from '@components/common';
import {
  matchQuestion,
  fillAnswerTemplate,
  type LibraryQuestion,
  type QuestionContext,
} from '@/data/conversationalQuestions';

export interface ConversationalQAPair {
  question: string;
  answer: string;
}

export interface ConversationalInsightsPanelProps {
  /** Static mode: a fixed set of pre-written Q&A pairs, shown as-is (existing tabs). */
  qaPairs?: ConversationalQAPair[];
  /** Interactive mode: typing a question matches it (via `matchQuestion`, searched against the
   * full global question library, not just this tab's `questionLibrary`) and appends the
   * resolved Q&A pair to this session's thread. `questionLibrary` itself isn't read directly by
   * this component — it's what gates interactive vs. static mode, matching every tab's existing
   * call site (`questionLibrary={X_QUESTIONS}`), and is kept as a prop so a future "suggested
   * questions" UI has a ready-made per-tab source without touching every tab again. */
  questionLibrary?: LibraryQuestion[];
  context?: QuestionContext;
  contextLabel?: string;
}

const DEFAULT_CONTEXT: QuestionContext = {
  plant: 'All Plants',
  period: 'All Time',
  bu: 'All Business Units',
  region: 'All Regions',
  category: 'All Categories',
};

const NO_MATCH_ANSWER =
  'No matching insight for that yet — try asking about a specific KPI on this tab, e.g. why it moved or which plant is driving the change.';

export const ConversationalInsightsPanel = ({
  qaPairs,
  questionLibrary,
  context,
  contextLabel,
}: ConversationalInsightsPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [askedPairs, setAskedPairs] = useState<ConversationalQAPair[]>([]);

  const displayPairs = questionLibrary ? askedPairs : (qaPairs ?? []);

  const handleSubmit = () => {
    const query = inputValue.trim();
    if (!query) return;
    const matched = matchQuestion(query);
    const answer = matched
      ? fillAnswerTemplate(matched.answerTemplate, context ?? DEFAULT_CONTEXT)
      : NO_MATCH_ANSWER;
    setAskedPairs((prev) => [...prev, { question: query, answer }]);
    setInputValue('');
  };

  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ForumOutlinedIcon sx={{ color: 'primary.contrastText' }} fontSize="small" />
          </Box>
          <Typography variant="h6">Conversational Insights</Typography>
        </Stack>
        {contextLabel && (
          <Typography variant="caption" color="text.secondary">
            Showing: {contextLabel}
          </Typography>
        )}
        <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {displayPairs.map((pair, index) => (
            <Stack key={index} spacing={1}>
              <Box
                sx={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2">{pair.question}</Typography>
              </Box>
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2">{pair.answer}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Ask a question…"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
              }
            }}
            disabled={!questionLibrary}
          />
          <IconButton onClick={handleSubmit} disabled={!questionLibrary || !inputValue.trim()}>
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};
