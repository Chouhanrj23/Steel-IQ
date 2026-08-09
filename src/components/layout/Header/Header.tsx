import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { APP_NAME, HEADER_HEIGHT } from '@utils/constants';

export const Header = () => {
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
              background: 'linear-gradient(135deg, #00338D 0%, #335CA4 100%)',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: '0px 2px 4px rgba(0, 51, 141, 0.25)',
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
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
          <PersonOutlineIcon fontSize="small" />
        </Avatar>
      </Toolbar>
    </AppBar>
  );
};
