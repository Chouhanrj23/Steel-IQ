import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { Modal } from '@components/common';
import { useDashboardStore } from '@store/dashboard';
import { MODULE_LABELS } from '@pages/Dashboard/moduleTabs';
import { STATUS_COLORS } from '../chartPalette';
import { VERTICAL_THEME, isPreviewModule } from '../verticalTheme';
import { getExceptionHistory } from '@/data/exceptionHistory';
import type { Signal } from '@/data/earlyWarningRules';

export interface ExceptionDetailModalProps {
  signal: Signal | null;
  onClose: () => void;
}

type ActionKind = 'whatsapp' | 'email' | 'workflow';

interface ActionDef {
  kind: ActionKind;
  label: string;
  icon: SvgIconComponent;
  bgcolor: string;
  color: string;
  confirmation: string;
}

// Purely cosmetic — there is no backend behind any of these. Each click only reveals the
// confirmation text below; nothing is sent anywhere. WhatsApp keeps its real brand green so the
// row reads as recognizable at a glance; Email/AI-Workflow use the app's own brand teal/aubergine
// (the same pairing AgentSummaryPanel/ConversationalInsightsPanel already use for their header
// badges) so the row still feels native to this product, not three unrelated stickers.
const ACTIONS: ActionDef[] = [
  {
    kind: 'whatsapp',
    label: 'Notify via WhatsApp',
    icon: WhatsAppIcon,
    bgcolor: '#25D366',
    color: '#FFFFFF',
    confirmation: 'This would notify the plant team via WhatsApp — not connected in this prototype.',
  },
  {
    kind: 'email',
    label: 'Notify via Email',
    icon: EmailOutlinedIcon,
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    confirmation:
      'This would send an email notification to the relevant stakeholders — not connected in this prototype.',
  },
  {
    kind: 'workflow',
    label: 'Trigger AI Workflow',
    icon: AutoAwesomeIcon,
    bgcolor: 'secondary.main',
    color: 'secondary.contrastText',
    confirmation:
      'This would trigger an AI-assisted workflow to investigate and route this exception — not connected in this prototype.',
  },
];

const formatHistoryDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** The Alert → Description container opened by every exception row/card's "View Details" CTA,
 * shared between the Exceptions view and every tab's Early Warning Strip so there's exactly one
 * detail surface, not one per caller. Also hosts "Initiate Action" (cosmetic-only — see
 * `ACTIONS` above) and "Suggested by Past Actions" (synthetic history — see
 * `@/data/exceptionHistory`), a historical record deliberately kept free of any implied
 * recommendation for the current exception, per client instruction. */
export const ExceptionDetailModal = ({ signal, onClose }: ExceptionDetailModalProps) => {
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const requestFocus = useDashboardStore((state) => state.requestFocus);
  const [cosmeticAction, setCosmeticAction] = useState<ActionKind | null>(null);

  if (!signal) {
    return null;
  }

  const { icon: ModuleIcon, accent } = VERTICAL_THEME[signal.module];
  const accented = isPreviewModule(signal.module);
  const SeverityIcon = signal.severity === 'critical' ? ErrorOutlineIcon : WarningAmberIcon;
  const severityColor = STATUS_COLORS[signal.severity];

  const handleClose = () => {
    setCosmeticAction(null);
    onClose();
  };

  const goToKpi = () => {
    setActiveTab(signal.module);
    requestFocus(signal.kpiId, signal.lens);
    handleClose();
  };

  const activeConfirmation = ACTIONS.find((action) => action.kind === cosmeticAction)?.confirmation ?? '';
  const history = getExceptionHistory(signal.kpiId);
  const pastActions = Array.from(new Set(history.flatMap((entry) => entry.actionsTaken))).slice(0, 4);

  return (
    <Modal
      open
      onClose={handleClose}
      maxWidth="sm"
      title={
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          <SeverityIcon sx={{ color: severityColor, mt: 0.25 }} />
          <Stack spacing={0.5}>
            <Typography variant="h6">{signal.kpiName}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                size="small"
                label={signal.type}
                variant="outlined"
                sx={{ color: severityColor, borderColor: severityColor }}
              />
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <ModuleIcon sx={{ fontSize: 16, color: accented ? accent : 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {MODULE_LABELS[signal.module]}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      }
      actions={
        <>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={goToKpi}>
            View in {MODULE_LABELS[signal.module]}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Typography variant="body1">{signal.description}</Typography>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Initiate Action</Typography>
          <Stack direction="row" spacing={1.5}>
            {ACTIONS.map((action) => (
              <Tooltip key={action.kind} title={action.label}>
                <IconButton
                  aria-label={action.label}
                  onClick={() => setCosmeticAction(action.kind)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: action.bgcolor,
                    color: action.color,
                    '&:hover': { bgcolor: action.bgcolor, filter: 'brightness(0.92)' },
                  }}
                >
                  <action.icon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
          <Collapse in={cosmeticAction !== null}>
            <Alert severity="info" variant="outlined" onClose={() => setCosmeticAction(null)}>
              {activeConfirmation}
            </Alert>
          </Collapse>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Suggested by Past Actions</Typography>
          {history.length === 0 ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                No prior occurrences recorded for this metric yet.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {history.map((entry) => (
                  <Box component="li" key={entry.date}>
                    <Typography variant="body2" color="text.secondary">
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {formatHistoryDate(entry.date)}
                      </Typography>{' '}
                      — {entry.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="body2">Similar exceptions were previously handled using:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {pastActions.map((action) => (
                    <Box component="li" key={action}>
                      <Typography variant="body2" color="text.secondary">
                        {action}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                Historical record only, shown for context — not a recommendation for this specific exception.
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};
