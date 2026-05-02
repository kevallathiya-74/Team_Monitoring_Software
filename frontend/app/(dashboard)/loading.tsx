import React from 'react';
import { Box, Grid, Skeleton } from '@mui/material';

export default function DashboardRouteLoading() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[...Array(3)].map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={130} sx={{ borderRadius: '14px' }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Skeleton variant="rounded" height={260} sx={{ borderRadius: '14px' }} />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: '14px' }} />
        </Grid>
      </Grid>
    </Box>
  );
}
