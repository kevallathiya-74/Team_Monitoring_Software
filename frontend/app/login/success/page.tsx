'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography,
} from '@mui/material';
import { CheckCircleRounded, ComputerRounded, FiberManualRecordRounded } from '@mui/icons-material';
import AuthGuard from '@/components/AuthGuard';
import { useEmployeeMe } from '@/hooks/useMonitoringData';
import { apiErrorMessage } from '@/lib/api';

export default function LoginSuccessPage() {
  const router = useRouter();
  const { data: device, error, isLoading, mutate } = useEmployeeMe();

  return (
    <AuthGuard role="employee">
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #0a0e1a 0%, #102018 100%)',
      }}>
        <Card sx={{ width: '100%', maxWidth: 460, borderRadius: '16px' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <CheckCircleRounded sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
              Connected Successfully
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your device is paired and ready to report activity securely.
            </Typography>

            {isLoading ? (
              <CircularProgress size={28} sx={{ my: 2 }} />
            ) : error ? (
              <Stack spacing={2}>
                <Typography color="error">
                  {apiErrorMessage(error, 'Unable to load device details.')}
                </Typography>
                <Button variant="outlined" onClick={() => { void mutate(); }}>
                  Retry
                </Button>
              </Stack>
            ) : device ? (
              <Box sx={{
                p: 2,
                mb: 3,
                borderRadius: '12px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.22)',
                textAlign: 'left',
              }}>
                <Stack direction="row" spacing={1.25} sx={{ mb: 1, alignItems: 'center' }}>
                  <ComputerRounded sx={{ color: '#10b981' }} />
                  <Typography fontWeight={700} color="text.primary">{device.hostname}</Typography>
                </Stack>
                <Chip
                  size="small"
                  icon={<FiberManualRecordRounded sx={{ fontSize: '9px !important', color: '#10b981 !important' }} />}
                  label={device.is_online ? 'Active' : 'Connected'}
                  sx={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.28)', background: 'rgba(16,185,129,0.12)' }}
                />
              </Box>
            ) : null}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => router.push('/employee/dashboard')}
              disabled={isLoading || Boolean(error)}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </Box>
    </AuthGuard>
  );
}
