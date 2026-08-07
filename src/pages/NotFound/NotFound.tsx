import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@routes/paths';

export const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        minHeight: '70vh',
      }}
    >
      <Typography variant="h1" color="primary.main">
        404
      </Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Typography variant="body2" color="text.secondary">
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" disableElevation component={RouterLink} to={ROUTES.DASHBOARD}>
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
