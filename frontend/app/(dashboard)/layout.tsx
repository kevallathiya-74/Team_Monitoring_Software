'use client';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard role="admin">
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1533 100%)',
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
