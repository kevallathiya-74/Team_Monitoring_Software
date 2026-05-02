'use client';
import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Chip, Tooltip
} from '@mui/material';
import {
  MenuRounded, RefreshRounded,
  FiberManualRecordRounded
} from '@mui/icons-material';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onRefresh?: () => void;
  liveCount?: number;
  lastUpdatedSeconds?: number;
}

export default function TopBar({
  title,
  subtitle,
  onMenuClick,
  onRefresh,
  liveCount,
  lastUpdatedSeconds,
}: TopBarProps) {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 60 }, px: { xs: 2, sm: 3 } }}>
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
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Live badge */}
        {liveCount !== undefined && (
          <Chip
            icon={<FiberManualRecordRounded sx={{ fontSize: '10px !important', color: '#10b981 !important' }} />}
            label={`${liveCount} Online`}
            size="small"
            sx={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        )}

        {lastUpdatedSeconds !== undefined && (
          <Chip
            label={`Updated ${lastUpdatedSeconds}s ago`}
            size="small"
            sx={{
              background: 'rgba(203, 213, 225, 0.08)',
              border: '1px solid rgba(203, 213, 225, 0.2)',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.72rem',
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
      </Toolbar>
    </AppBar>
  );
}
