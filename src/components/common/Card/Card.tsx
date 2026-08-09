import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export interface CardProps {
  title?: ReactNode;
  subheader?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

export const Card = ({ title, subheader, action, children, sx }: CardProps) => {
  return (
    <MuiCard variant="outlined" sx={sx}>
      {(title || subheader || action) && <CardHeader title={title} subheader={subheader} action={action} />}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
};
