import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { APP_NAME, FOOTER_HEIGHT } from '@utils/constants';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        height: FOOTER_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: 1,
        borderColor: 'divider',
        px: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © {year} {APP_NAME}. All rights reserved.
      </Typography>
    </Box>
  );
};
