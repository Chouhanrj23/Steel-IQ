import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { NavLink } from 'react-router-dom';
import { APP_NAME, DRAWER_WIDTH } from '@utils/constants';
import { NAV_ITEMS } from '@utils/constants/navigation';

export interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const navList = (
  <List sx={{ px: 1.5, py: 1 }}>
    {NAV_ITEMS.map((item) => (
      <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          component={NavLink}
          to={item.path}
          sx={{
            borderRadius: 2,
            '&.active': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <item.icon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2' } }} />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6">{APP_NAME}</Typography>
        </Toolbar>
        {navList}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
        open
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6">{APP_NAME}</Typography>
        </Toolbar>
        {navList}
      </Drawer>
    </Box>
  );
};
