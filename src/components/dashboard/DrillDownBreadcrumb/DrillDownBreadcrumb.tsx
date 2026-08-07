import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';

export interface DrillDownBreadcrumbProps {
  path: string[];
}

export const DrillDownBreadcrumb = ({ path }: DrillDownBreadcrumbProps) => {
  return (
    <MuiBreadcrumbs aria-label="drill-down path" separator="/" sx={{ mb: 2 }}>
      {path.map((segment, index) => {
        const isLast = index === path.length - 1;
        return (
          <Typography
            key={segment}
            variant="body2"
            color={isLast ? 'text.primary' : 'text.secondary'}
            sx={{ fontWeight: isLast ? 600 : 400, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {index === 0 && <PlaceOutlinedIcon sx={{ fontSize: 16 }} />}
            {segment}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
};
