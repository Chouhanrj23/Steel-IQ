import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Card } from '@components/common';
import type { LibraryQuestion, QuestionContext } from '@/data/conversationalQuestions';

export interface ConversationalQAPair {
  question: string;
  answer: string;
}

export interface ConversationalInsightsPanelProps {
  /** Static mode: a fixed set of pre-written Q&A pairs, shown as-is (existing tabs). */
  qaPairs?: ConversationalQAPair[];
  /** Interactive mode: same context-driven panel as the static one, minus suggested-question
   * chips — kept as a prop (rather than removed from every tab) so tabs don't need touching
   * just to stop showing suggestions. */
  questionLibrary?: LibraryQuestion[];
  context?: QuestionContext;
  contextLabel?: string;
}

export const ConversationalInsightsPanel = ({
  qaPairs,
  questionLibrary,
  contextLabel,
}: ConversationalInsightsPanelProps) => {
  // No suggested-question chips — the interactive mode's chat thread stays empty (nothing
  // populates it without a chip to click) rather than pre-seeding fake conversation history.
  const displayPairs = questionLibrary ? [] : (qaPairs ?? []);

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
          <TextField size="small" fullWidth placeholder="Ask a question…" disabled />
          <IconButton disabled>
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};
