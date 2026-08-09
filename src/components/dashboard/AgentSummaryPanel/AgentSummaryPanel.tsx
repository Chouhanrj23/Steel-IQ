import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Card } from '@components/common';

export interface AgentSummaryPanelProps {
  insights: string[];
  contextLabel?: string;
}

export const AgentSummaryPanel = ({ insights, contextLabel }: AgentSummaryPanelProps) => {
  return (
    <Card>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'secondary.contrastText' }} fontSize="small" />
          </Box>
          <Typography variant="h6">Agent Summary</Typography>
        </Stack>
        {contextLabel && (
          <Typography variant="caption" color="text.secondary">
            Showing: {contextLabel}
          </Typography>
        )}
        <Stack spacing={1.5}>
          {insights.map((insight, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2">{insight}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};
