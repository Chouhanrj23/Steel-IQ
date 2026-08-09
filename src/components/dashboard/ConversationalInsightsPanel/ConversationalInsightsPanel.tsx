import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Card } from '@components/common';
import type { LibraryQuestion, QuestionCategory, QuestionContext } from '@/data/conversationalQuestions';
import { fillAnswerTemplate } from '@/data/conversationalQuestions';

export interface ConversationalQAPair {
  question: string;
  answer: string;
}

export interface ConversationalInsightsPanelProps {
  /** Static mode: a fixed set of pre-written Q&A pairs, shown as-is (existing tabs). */
  qaPairs?: ConversationalQAPair[];
  /** Interactive mode: clickable question chips whose answers are filled from `context` and
   * appended to a growing chat thread. When provided, `qaPairs` is ignored. */
  questionLibrary?: LibraryQuestion[];
  context?: QuestionContext;
  contextLabel?: string;
}

const CATEGORY_ORDER: QuestionCategory[] = ['Reasoning', 'Intelligent Insight', 'Decision-Making'];

export const ConversationalInsightsPanel = ({
  qaPairs,
  questionLibrary,
  context,
  contextLabel,
}: ConversationalInsightsPanelProps) => {
  const [asked, setAsked] = useState<ConversationalQAPair[]>([]);

  const handleAsk = (libraryQuestion: LibraryQuestion) => {
    const answer = fillAnswerTemplate(
      libraryQuestion.answerTemplate,
      context ?? { plant: 'All Plants', period: 'All Time', bu: 'All Business Units', region: 'All Regions' },
    );
    setAsked((prev) => [...prev, { question: libraryQuestion.question, answer }]);
  };

  const displayPairs = questionLibrary ? asked : (qaPairs ?? []);

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
        {questionLibrary && (
          <Stack spacing={1}>
            {CATEGORY_ORDER.map((category) => {
              const categoryQuestions = questionLibrary.filter((q) => q.category === category);
              if (categoryQuestions.length === 0) return null;
              return (
                <Stack key={category} spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {category}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {categoryQuestions.map((q) => (
                      <Chip
                        key={q.id}
                        label={q.question}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => handleAsk(q)}
                        sx={{
                          maxWidth: '100%',
                          height: 'auto',
                          '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
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
