import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <MuiBreadcrumbs aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.to) {
          return (
            <Typography key={item.label} color="text.primary" variant="body2">
              {item.label}
            </Typography>
          );
        }
        return (
          <Link key={item.label} component={RouterLink} to={item.to} underline="hover" variant="body2">
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
