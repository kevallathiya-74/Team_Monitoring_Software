'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check localStorage directly for hydration safety
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  if (!isAuthenticated && !storedToken) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#4f6bff' }} size={40} />
        <Typography variant="body2" color="text.secondary">
          Verifying session…
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
