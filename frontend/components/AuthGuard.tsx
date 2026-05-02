'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'admin' | 'employee';
}) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check localStorage directly after mount so SSR and the first client render match.
    const storedToken = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('auth_role');
    if (!storedToken && !token) {
      setAllowed(false);
      router.replace('/login');
      return;
    }

    if (role && storedRole && storedRole !== role) {
      setAllowed(false);
      router.replace(storedRole === 'employee' ? '/employee/dashboard' : '/dashboard');
      return;
    }
    setAllowed(true);
  }, [role, token, router]);

  if (!mounted || !allowed || (!isAuthenticated && !token)) {
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
