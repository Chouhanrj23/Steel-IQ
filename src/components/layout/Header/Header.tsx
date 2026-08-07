import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
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
        borderBottom: 1,
        borderColor: 'divider',
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
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
            aria-hidden
          >
            S
          </Box>
          <Typography variant="h6" component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {APP_NAME}
          </Typography>
        </Stack>
        <Avatar sx={{ width: 36, height: 36 }} />
      </Toolbar>
    </AppBar>
  );
};
