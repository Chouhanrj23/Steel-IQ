import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { ReactNode } from 'react';

export interface CardProps {
  title?: ReactNode;
  subheader?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export const Card = ({ title, subheader, action, children }: CardProps) => {
  return (
    <MuiCard variant="outlined">
      {(title || subheader || action) && <CardHeader title={title} subheader={subheader} action={action} />}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
};
