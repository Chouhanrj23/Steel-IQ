import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { SelectChangeEvent } from '@mui/material/Select';
import { APP_NAME, HEADER_HEIGHT } from '@utils/constants';
import { useDashboardStore } from '@store/dashboard';
import { PERSONAS, getPersona } from '@/data/personas';

export const Header = () => {
  const personaId = useDashboardStore((state) => state.personaId);
  const setPersona = useDashboardStore((state) => state.setPersona);
  const persona = getPersona(personaId);

  const handlePersonaChange = (event: SelectChangeEvent) => {
    setPersona(event.target.value);
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        height: HEADER_HEIGHT,
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.04)',
        width: '100%',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #146B63 0%, #3D8F87 100%)',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: '0px 2px 4px rgba(20, 107, 99, 0.25)',
            }}
            aria-hidden
          >
            S
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h6" component="span" sx={{ lineHeight: 1.2, display: 'block' }}>
              {APP_NAME}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              Enterprise Analytics
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Stack alignItems="flex-end" spacing={0.25}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              Viewing as
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="persona-select-label">Persona</InputLabel>
                <Select
                  labelId="persona-select-label"
                  label="Persona"
                  value={personaId}
                  onChange={handlePersonaChange}
                >
                  {PERSONAS.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip
                title={`Simulated role view for demo purposes only — scopes which tabs are shown, not a real access-control boundary. ${persona.description}.`}
              >
                <IconButton size="small" aria-label="About persona view">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            <PersonOutlineIcon fontSize="small" />
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
