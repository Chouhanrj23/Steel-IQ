import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
  size?: number;
}

export const Loader = ({ label, fullScreen = false, size = 40 }: LoaderProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: '100%',
        height: fullScreen ? '100vh' : '100%',
        py: fullScreen ? 0 : 6,
      }}
    >
      <CircularProgress size={size} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
};
