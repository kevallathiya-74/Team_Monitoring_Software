'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check localStorage directly after mount so SSR and the first client render match.
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!mounted || (!isAuthenticated && !token)) {
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
        <CircularProgress sx={{ color: 'primary.main' }} size={40} />
        <Typography variant="body2" color="text.secondary">
          Verifying session…
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
