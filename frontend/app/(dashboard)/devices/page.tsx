'use client';
import React, { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Skeleton,
  TextField, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import {
  DevicesRounded, SearchRounded, OpenInNewRounded,
  WifiRounded, WifiOffRounded, FiberManualRecordRounded,
  FilterListRounded
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import TopBar from '@/components/TopBar';
import { apiErrorMessage } from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDashboardDevices } from '@/hooks/useMonitoringData';
import { ErrorState } from '@/components/ui/DataState';

export default function DevicesPage() {
  const router = useRouter();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'online' | 'offline'>('all');
  const debouncedSearch = useDebouncedValue(search, 250);
  const { data: devices = [], error, isLoading, isValidating, mutate } = useDashboardDevices();

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return devices.filter((d) => {
      const matchSearch =
        !query ||
        d.hostname.toLowerCase().includes(query) ||
        d.local_ip.toLowerCase().includes(query);
      const matchFilter =
        filter === 'all' ||
        (filter === 'online' && d.is_online) ||
        (filter === 'offline' && !d.is_online);
      return matchSearch && matchFilter;
    });
  }, [debouncedSearch, devices, filter]);

  const online = useMemo(() => devices.filter((d) => d.is_online).length, [devices]);
  const loading = isLoading && devices.length === 0;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Devices"
        subtitle="All registered monitoring endpoints"
        onRefresh={() => { void mutate(); }}
        liveCount={online}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {error && (
          <Box sx={{ mb: 2.5 }}>
            <ErrorState
              message={apiErrorMessage(error, 'Failed to load devices.')}
              onRetry={() => { void mutate(); }}
            />
          </Box>
        )}

        <Card>
          <CardContent sx={{ p: 0 }}>
            {/* Toolbar */}
            <Box sx={{
              p: 2.5, display: 'flex', alignItems: 'center',
              flexWrap: 'wrap', gap: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
              <TextField
                id="devices-search"
                size="small"
                placeholder="Search by hostname or IP…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: { xs: '100%', sm: 280 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Filter chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['all', 'online', 'offline'] as const).map((f) => (
                  <Chip
                    key={f}
                    label={f.charAt(0).toUpperCase() + f.slice(1)}
                    size="small"
                    clickable
                    onClick={() => setFilter(f)}
                    icon={
                      f === 'online' ? <FiberManualRecordRounded sx={{ fontSize: '8px !important', color: '#10b981 !important' }} /> :
                      f === 'offline' ? <FiberManualRecordRounded sx={{ fontSize: '8px !important', color: '#ef4444 !important' }} /> :
                      <FilterListRounded sx={{ fontSize: '14px !important' }} />
                    }
                    sx={{
                      fontWeight: 700,
                      background: filter === f ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255,255,255,0.04)',
                      border: filter === f ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: filter === f ? 'primary.light' : 'text.secondary',
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {filtered.length} of {devices.length} devices
              </Typography>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell>Registered</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {(loading || isValidating) && devices.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(6)].map((__, j) => (
                          <TableCell key={j}><Skeleton height={24} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                        <DevicesRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                        <Typography color="text.secondary" variant="body2">
                          {search ? 'No devices match your search.' : 'No devices registered yet.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((device) => {
                      const lastSeen = (() => {
                        try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); }
                        catch { return '—'; }
                      })();
                      const statusColor = device.is_online ? '#10b981' : '#ef4444';

                      return (
                        <TableRow
                          key={device.id}
                          hover
                          sx={{ cursor: 'pointer', '&:hover td': { background: 'rgba(79,107,255,0.04)' } }}
                          onClick={() => router.push(`/devices/${device.id}`)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{
                                width: 34, height: 34, borderRadius: '8px', fontSize: '0.8rem',
                              background: device.is_online ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                border: `1px solid ${statusColor}25`,
                              }}>
                                {device.is_online
                                  ? <WifiRounded sx={{ fontSize: 16, color: '#10b981' }} />
                                  : <WifiOffRounded sx={{ fontSize: 16, color: '#ef4444' }} />
                                }
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{device.hostname}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {device.id.slice(0, 8)}…
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                              {device.local_ip}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<FiberManualRecordRounded sx={{ fontSize: '8px !important', color: `${statusColor} !important` }} />}
                              label={device.is_online ? 'Online' : 'Offline'}
                              size="small"
                              sx={{
                                background: `${statusColor}15`,
                                border: `1px solid ${statusColor}30`,
                                color: statusColor,
                                fontWeight: 600,
                                fontSize: '0.72rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{lastSeen}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {device.last_seen_at
                                ? (() => { try { return format(parseISO(device.last_seen_at), 'MMM d, yyyy'); } catch { return '—'; } })()
                                : '—'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View details">
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); router.push(`/devices/${device.id}`); }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                              >
                                <OpenInNewRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {isValidating && devices.length > 0 && (
          <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            Refreshing device list...
          </Typography>
        )}
      </Box>
    </Box>
  );
}
