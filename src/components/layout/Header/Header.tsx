import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import { APP_NAME, DRAWER_WIDTH, HEADER_HEIGHT } from '@utils/constants';

export interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
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
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            onClick={onMenuClick}
            edge="start"
            sx={{ display: { md: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {APP_NAME}
          </Typography>
        </Stack>
        <Avatar sx={{ width: 36, height: 36 }} />
      </Toolbar>
    </AppBar>
  );
};
