import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';

export interface DrillDownBreadcrumbProps {
  path: string[];
  onSegmentClick?: (index: number) => void;
}

export const DrillDownBreadcrumb = ({ path, onSegmentClick }: DrillDownBreadcrumbProps) => {
  return (
    <MuiBreadcrumbs aria-label="drill-down path" separator="/" sx={{ mb: 2 }}>
      {path.map((segment, index) => {
        const isLast = index === path.length - 1;

        if (!isLast && onSegmentClick) {
          return (
            <Link
              key={segment}
              component="button"
              type="button"
              variant="body2"
              color="text.secondary"
              underline="hover"
              onClick={() => onSegmentClick(index)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {index === 0 && <PlaceOutlinedIcon sx={{ fontSize: 16 }} />}
              {segment}
            </Link>
          );
        }

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
