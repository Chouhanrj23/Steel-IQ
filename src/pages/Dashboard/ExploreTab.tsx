import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@components/common';
import { ExploreBuilder } from '@components/dashboard';

export const ExploreTab = () => {
  const [comparing, setComparing] = useState(false);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5">Self-Service Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Pick a KPI, a level of its own hierarchy to break it down by, and a chart type — a user-driven
          alternative to clicking through drill-down one level at a time. For scripted, ask-a-question access
          to this same data, use Conversational Insights on each tab instead.
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: 'text.secondary', pt: 0.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            Explores the same synthetic dataset as the rest of this dashboard — not a live query system.
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: comparing ? 6 : 12 }}>
          <ExploreBuilder title={comparing ? 'KPI A' : undefined} />
        </Grid>
        {comparing ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <ExploreBuilder title="KPI B" onRemove={() => setComparing(false)} />
          </Grid>
        ) : (
          <Grid size={{ xs: 12 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setComparing(true)}>
              Compare another KPI
            </Button>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
};

export default ExploreTab;
