'use client';

import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { HourglassEmptyRounded, RefreshRounded } from '@mui/icons-material';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      sx={{ borderRadius: '12px' }}
      action={
        onRetry ? (
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshRounded fontSize="small" />}
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <HourglassEmptyRounded
        sx={{
          fontSize: 44,
          opacity: 0.3,
          display: 'block',
          mx: 'auto',
          mb: 1,
          color: 'text.secondary',
        }}
      />
      <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>{title}</Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
