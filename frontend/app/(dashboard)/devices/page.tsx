'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Skeleton,
  Alert, TextField, InputAdornment, IconButton, Tooltip, Button
} from '@mui/material';
import {
  DevicesRounded, SearchRounded, RefreshRounded, OpenInNewRounded,
  WifiRounded, WifiOffRounded, FiberManualRecordRounded,
  FilterListRounded
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import TopBar from '@/components/TopBar';
import { getDashboardDevices, type DeviceSummary } from '@/lib/api';

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices]   = useState<DeviceSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'online' | 'offline'>('all');

  const fetchDevices = useCallback(async () => {
    try {
      setError('');
      const res = await getDashboardDevices();
      setDevices(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);
  useEffect(() => {
    const t = setInterval(fetchDevices, 30_000);
    return () => clearInterval(t);
  }, [fetchDevices]);

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.hostname.toLowerCase().includes(search.toLowerCase()) ||
      d.local_ip.includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'online' && d.is_online) ||
      (filter === 'offline' && !d.is_online);
    return matchSearch && matchFilter;
  });

  const online  = devices.filter((d) => d.is_online).length;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Devices"
        subtitle="All registered monitoring endpoints"
        onRefresh={() => { setLoading(true); fetchDevices(); }}
        liveCount={online}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
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
                      f === 'online' ? <FiberManualRecordRounded sx={{ fontSize: '8px !important', color: '#00d4aa !important' }} /> :
                      f === 'offline' ? <FiberManualRecordRounded sx={{ fontSize: '8px !important', color: '#ff4d6a !important' }} /> :
                      <FilterListRounded sx={{ fontSize: '14px !important' }} />
                    }
                    sx={{
                      fontWeight: 600,
                      background: filter === f ? 'rgba(79,107,255,0.18)' : 'rgba(255,255,255,0.04)',
                      border: filter === f ? '1px solid rgba(79,107,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
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
                  {loading ? (
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
                      const statusColor = device.is_online ? '#00d4aa' : '#ff4d6a';

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
                                background: device.is_online ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,106,0.1)',
                                border: `1px solid ${statusColor}25`,
                              }}>
                                {device.is_online
                                  ? <WifiRounded sx={{ fontSize: 16, color: '#00d4aa' }} />
                                  : <WifiOffRounded sx={{ fontSize: 16, color: '#ff4d6a' }} />
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
      </Box>
    </Box>
  );
}
