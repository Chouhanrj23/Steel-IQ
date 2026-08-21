import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import type { BusinessScenario, ScenarioNarrative } from '@/data/businessScenarios';

export interface ScenarioNarrativeSectionsProps {
  scenario: BusinessScenario;
  narrative: ScenarioNarrative;
}

/** A small uppercase, letter-spaced caption used to label a block of narrative text (Insight, Why,
 * Recommended Actions, ...) — exported so any Agent Summary surface can reuse the same visual
 * language for "this text is labeled content," not just the scenario-matched cards below. */
export const SectionLabel = ({ children, color }: { children: ReactNode; color?: string }) => (
  <Typography
    variant="caption"
    sx={{
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: color ?? 'text.secondary',
    }}
  >
    {children}
  </Typography>
);

/**
 * Renders one matched business scenario's full Insight / Why / Business Impact / Recommended
 * Actions narrative — the shared building block behind both the Agent Summary's scenario card
 * and the Warnings accordion's expanded detail, so the two surfaces can never visually drift
 * apart. Business Impact is only rendered when the scenario actually has one authored (several of
 * the 8 scenarios don't — see businessScenarios.ts) rather than inventing filler text.
 */
export const ScenarioNarrativeSections = ({ scenario, narrative }: ScenarioNarrativeSectionsProps) => (
  <>
    <Box>
      <SectionLabel>Insight</SectionLabel>
      <Typography variant="body2">{narrative.whatHappened}</Typography>
    </Box>

    <Box>
      <SectionLabel>Why</SectionLabel>
      <Typography variant="body2">{scenario.interpretation}</Typography>
      {scenario.potentialReasons.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
          {scenario.potentialReasons.map((reason) => (
            <Box component="li" key={reason}>
              <Typography variant="body2" color="text.secondary">
                {reason}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>

    {scenario.businessImpact.length > 0 && (
      <Box>
        <SectionLabel>Business Impact</SectionLabel>
        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
          {scenario.businessImpact.map((impact) => (
            <Box component="li" key={impact}>
              <Typography variant="body2" color="text.secondary">
                {impact}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )}

    <Divider />

    <Box>
      <SectionLabel color="primary.main">Recommended Actions</SectionLabel>
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
        {scenario.recommendedActions.map((action) => (
          <Box component="li" key={action}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {action}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </>
);
