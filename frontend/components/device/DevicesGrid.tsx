'use client';
import React, { memo, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Tooltip, InputAdornment, TextField, useMediaQuery, useTheme
} from '@mui/material';
import {
  WifiRounded, WifiOffRounded, OpenInNewRounded,
  SearchRounded, AccessTimeRounded, DevicesRounded
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { DeviceSummary } from '@/lib/api';

export interface DeviceGridProps {
  devices: DeviceSummary[];
  loading?: boolean;
  onViewDevice?: (deviceId: string) => void;
}

type DeviceStatus = 'active' | 'idle' | 'offline';

const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
  idle: { label: 'Idle', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.12)' },
  offline: { label: 'Offline', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)' },
};

const getDeviceStatus = (device: DeviceSummary): DeviceStatus => {
  if (!device.is_online) return 'offline';
  return 'idle';
};

// ─── Desktop Table View ─────────────────────────────────────────────────────────
const DevicesTable = memo(function DevicesTable({ devices, onViewDevice }: {
  devices: DeviceSummary[];
  onViewDevice?: (deviceId: string) => void;
}) {
  const router = useRouter();
  
  return (
    <TableContainer sx={{ borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: 'rgba(168, 85, 247, 0.06)' }}>
            <TableCell>Device</TableCell>
            <TableCell>IP Address</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Seen</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => {
            const status = getDeviceStatus(device);
            const config = STATUS_CONFIG[status];
            const lastSeen = (() => {
              try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); }
              catch { return 'Unknown'; }
            })();

            return (
              <TableRow
                key={device.id}
                sx={{
                  transition: 'all 0.15s ease',
                  '&:hover': { background: 'rgba(168, 85, 247, 0.06)' },
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/devices/${device.id}`)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: `${config.color}1a`,
                      border: `1px solid ${config.color}3a`,
                      fontSize: '0.75rem',
                    }}>
                      {status === 'offline' 
                        ? <WifiOffRounded sx={{ fontSize: 16, color: config.color }} />
                        : <WifiRounded sx={{ fontSize: 16, color: config.color }} />
                      }
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                        {device.hostname}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    {device.local_ip}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={config.label}
                    sx={{
                      background: config.bgColor,
                      color: config.color,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      border: `1px solid ${config.color}3a`,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeRounded sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {lastSeen}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/devices/${device.id}`);
                      }}
                      sx={{ color: 'primary.main' }}
                    >
                      <OpenInNewRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

// ─── Mobile Card View ─────────────────────────────────────────────────────────
const DevicesCardGrid = memo(function DevicesCardGrid({ devices, onViewDevice }: {
  devices: DeviceSummary[];
  onViewDevice?: (deviceId: string) => void;
}) {
  const router = useRouter();
  
  return (
    <Grid container spacing={2}>
      {devices.map((device) => {
        const status = getDeviceStatus(device);
        const config = STATUS_CONFIG[status];
        const lastSeen = (() => {
          try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); }
          catch { return 'Unknown'; }
        })();

        return (
          <Grid key={device.id} size={{ xs: 12, sm: 6 }}>
            <Card
              onClick={() => router.push(`/devices/${device.id}`)}
              sx={{
                cursor: 'pointer',
                borderRadius: '16px',
                transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                borderColor: `${config.color}28`,
                boxShadow: `0 0 0 1px ${config.color}12`,
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.4)' },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: `${config.color}1a`,
                    border: `1px solid ${config.color}30`,
                  }}>
                    {status === 'offline'
                      ? <WifiOffRounded sx={{ color: config.color, fontSize: 20 }} />
                      : <WifiRounded sx={{ color: config.color, fontSize: 20 }} />
                    }
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap color="text.primary">
                      {device.hostname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: 'monospace' }}>
                      {device.local_ip}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {lastSeen}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={config.label}
                    sx={{
                      background: config.bgColor,
                      color: config.color,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      border: `1px solid ${config.color}3a`,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
});

// ─── Main Hybrid Component ──────────────────────────────────────────────────────
const DevicesGrid = memo(function DevicesGrid({ devices, loading = false, onViewDevice }: DeviceGridProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(d =>
      d.hostname.toLowerCase().includes(q) ||
      d.local_ip.includes(q)
    );
  }, [devices, searchQuery]);

  if (devices.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <DevicesRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
        <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
          No devices connected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search bar */}
      <TextField
        placeholder="Search devices..."
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            transition: 'all 0.15s ease',
          },
        }}
      />

      {/* Table on desktop, Cards on mobile */}
      {isDesktop ? (
        <DevicesTable devices={filteredDevices} onViewDevice={onViewDevice} />
      ) : (
        <DevicesCardGrid devices={filteredDevices} onViewDevice={onViewDevice} />
      )}
    </Box>
  );
});

export default DevicesGrid;
