'use client';
import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Chip, Tooltip, Badge
} from '@mui/material';
import {
  MenuRounded, NotificationsRounded, RefreshRounded,
  FiberManualRecordRounded
} from '@mui/icons-material';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onRefresh?: () => void;
  liveCount?: number;
}

export default function TopBar({ title, subtitle, onMenuClick, onRefresh, liveCount }: TopBarProps) {
  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: { xs: 60, sm: 64 } }}>
        {/* Mobile menu button */}
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' }, color: 'text.secondary' }}
        >
          <MenuRounded />
        </IconButton>

        {/* Title */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Live badge */}
        {liveCount !== undefined && (
          <Chip
            icon={<FiberManualRecordRounded sx={{ fontSize: '10px !important', color: '#00d4aa !important' }} />}
            label={`${liveCount} Online`}
            size="small"
            sx={{
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              color: '#00d4aa',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        )}

        {/* Refresh */}
        {onRefresh && (
          <Tooltip title="Refresh data">
            <IconButton onClick={onRefresh} size="small" sx={{ color: 'text.secondary' }}>
              <RefreshRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications (placeholder) */}
        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={0} color="error">
              <NotificationsRounded fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
