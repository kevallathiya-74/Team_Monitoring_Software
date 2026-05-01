'use client';
import React from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, Tooltip, IconButton, GlobalStyles
} from '@mui/material';
import {
  DashboardRounded, DevicesRounded, AssessmentRounded,
  LogoutRounded, MonitorHeartRounded, CircleRounded,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'Dashboard',  icon: <DashboardRounded />,  path: '/dashboard' },
  { label: 'Devices',    icon: <DevicesRounded />,    path: '/devices' },
  { label: 'Reports',    icon: <AssessmentRounded />, path: '/reports' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearToken } = useAuthStore();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f6bff 0%, #7b8fff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(79,107,255,0.4)',
          }}
        >
          <MonitorHeartRounded sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} color="text.primary">
            WorkForce AI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Monitoring Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status indicator */}
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircleRounded sx={{ fontSize: 8, color: '#00d4aa', animation: 'pulse 2s infinite' }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Live Monitoring Active
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Nav links */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto' }}>
        <Typography
          variant="caption"
          sx={{ px: 3, py: 1, display: 'block', color: 'text.secondary',
            textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}
        >
          Navigation
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const active = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Tooltip key={item.path} title="" placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => { router.push(item.path); onClose?.(); }}
                  sx={{ mx: 1, mb: 0.5, borderRadius: '10px' }}
                >
                  <ListItemIcon sx={{
                    minWidth: 38,
                    color: active ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.9rem',
                      color: active ? 'primary.light' : 'text.primary',
                    }}
                  />
                  {active && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: 'primary.main',
                      boxShadow: '0 0 8px #4f6bff',
                    }} />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* User & Logout */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
          borderRadius: '10px', background: 'rgba(79,107,255,0.06)',
          border: '1px solid rgba(79,107,255,0.12)',
        }}>
          <Avatar sx={{
            width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #4f6bff, #7b8fff)',
          }}>
            A
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>Admin</Typography>
            <Chip label="Administrator" size="small" color="primary" variant="outlined"
              sx={{ height: 18, fontSize: '0.65rem', mt: 0.2 }} />
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary',
              '&:hover': { color: 'error.main' } }}>
              <LogoutRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {content}
      </Drawer>

      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {content}
      </Drawer>

      <GlobalStyles styles={{
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
      }} />
    </>
  );
}

export { DRAWER_WIDTH };
