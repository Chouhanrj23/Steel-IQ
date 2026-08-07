import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { Card } from '@components/common';

export interface ConversationalQAPair {
  question: string;
  answer: string;
}

export interface ConversationalInsightsPanelProps {
  qaPairs: ConversationalQAPair[];
  contextLabel?: string;
}

export const ConversationalInsightsPanel = ({ qaPairs, contextLabel }: ConversationalInsightsPanelProps) => {
  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ForumOutlinedIcon color="secondary" fontSize="small" />
          <Typography variant="h6">Conversational Insights</Typography>
        </Stack>
        {contextLabel && (
          <Typography variant="caption" color="text.secondary">
            Showing: {contextLabel}
          </Typography>
        )}
        <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {qaPairs.map((pair, index) => (
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
