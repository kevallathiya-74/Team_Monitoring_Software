'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Avatar,
  Skeleton, Alert, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress,
  Tab, Tabs, IconButton, Tooltip, Button
} from '@mui/material';
import {
  ArrowBackRounded, WifiRounded, WifiOffRounded, AccessTimeRounded,
  AppsRounded, VideocamRounded, FiberManualRecordRounded,
  RefreshRounded, PlayCircleRounded, DesktopWindowsRounded,
  HourglassEmptyRounded
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import TopBar from '@/components/TopBar';
import { getDashboardDevices, getDeviceTimeline, getDeviceRecordings, type DeviceSummary, type ActivityLog, type Recording } from '@/lib/api';

// ─── Activity Timeline Item ────────────────────────────────────────────────────
function TimelineRow({ log }: { log: ActivityLog }) {
  const ts = (() => { try { return format(parseISO(log.timestamp), 'HH:mm:ss'); } catch { return '—'; } })();
  const dur = log.duration_seconds >= 60
    ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
    : `${log.duration_seconds}s`;

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace" color="text.secondary">{ts}</Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AppsRounded sx={{ fontSize: 14, color: log.is_idle ? 'warning.main' : 'primary.main' }} />
          <Typography variant="body2" fontWeight={600} noWrap>{log.app_name || '—'}</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: 280 }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {log.window_title || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={log.is_idle ? 'Idle' : 'Active'}
          size="small"
          sx={{
            fontSize: '0.68rem', fontWeight: 700,
            background: log.is_idle ? 'rgba(255,179,71,0.12)' : 'rgba(0,212,170,0.1)',
            color: log.is_idle ? '#ffb347' : '#00d4aa',
            border: `1px solid ${log.is_idle ? '#ffb34730' : '#00d4aa30'}`,
          }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">{dur}</Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Recording Row ─────────────────────────────────────────────────────────────
function RecordingRow({ rec }: { rec: Recording }) {
  const date = (() => { try { return format(parseISO(rec.start_time || rec.created_at), 'MMM d, yyyy HH:mm'); } catch { return '—'; } })();
  const dur = rec.duration_seconds >= 60
    ? `${Math.floor(rec.duration_seconds / 60)}m ${rec.duration_seconds % 60}s`
    : `${rec.duration_seconds}s`;

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayCircleRounded sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" fontFamily="monospace" fontSize="0.78rem" color="text.secondary" noWrap>
            {rec.file_path.split(/[\\/]/).pop()}
          </Typography>
        </Box>
      </TableCell>
      <TableCell><Typography variant="body2" color="text.secondary">{date}</Typography></TableCell>
      <TableCell><Typography variant="body2" color="text.secondary">{dur}</Typography></TableCell>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace" color="text.secondary" fontSize="0.7rem" sx={{
          background: 'rgba(255,255,255,0.04)', px: 1, py: 0.4, borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block',
        }}>
          {rec.file_path}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [device, setDevice]         = useState<DeviceSummary | null>(null);
  const [timeline, setTimeline]     = useState<ActivityLog[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState(0);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const [devRes, timelineRes, recsRes] = await Promise.all([
        getDashboardDevices(),
        getDeviceTimeline(id),
        getDeviceRecordings(id),
      ]);
      const found = devRes.data.find((d) => d.id === id);
      setDevice(found || null);
      setTimeline(timelineRes.data);
      setRecordings(recsRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load device data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // Compute stats from timeline
  const activeSeconds = timeline.filter((l) => !l.is_idle).reduce((s, l) => s + l.duration_seconds, 0);
  const idleSeconds   = timeline.filter((l) => l.is_idle).reduce((s, l) => s + l.duration_seconds, 0);
  const totalSeconds  = activeSeconds + idleSeconds;
  const activeRatio   = totalSeconds > 0 ? (activeSeconds / totalSeconds) * 100 : 0;

  const fmt = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  const statusColor = device?.is_online ? '#00d4aa' : '#ff4d6a';
  const lastSeen = device?.last_seen_at
    ? (() => { try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); } catch { return '—'; } })()
    : '—';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={loading ? 'Loading device…' : (device?.hostname || 'Device Detail')}
        subtitle={device ? `${device.local_ip} · Last seen ${lastSeen}` : ''}
        onRefresh={() => { setLoading(true); fetchAll(); }}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => router.push('/devices')}
          sx={{ mb: 2.5, color: 'text.secondary', fontSize: '0.85rem' }}
        >
          Back to Devices
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

        {/* ── Device Info Header ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar sx={{
                width: 56, height: 56, borderRadius: '14px',
                background: device?.is_online ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,106,0.1)',
                border: `2px solid ${device?.is_online ? '#00d4aa30' : '#ff4d6a30'}`,
              }}>
                <DesktopWindowsRounded sx={{ fontSize: 26, color: device?.is_online ? '#00d4aa' : '#ff4d6a' }} />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                {loading
                  ? <><Skeleton width={180} height={28} /><Skeleton width={120} height={20} /></>
                  : <>
                    <Typography variant="h5" fontWeight={700}>{device?.hostname || id}</Typography>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {device?.local_ip} · ID: {id?.slice(0, 12)}…
                    </Typography>
                  </>
                }
              </Box>

              {device && (
                <Chip
                  icon={<FiberManualRecordRounded sx={{ fontSize: '10px !important', color: `${statusColor} !important` }} />}
                  label={device.is_online ? 'Online' : 'Offline'}
                  sx={{
                    background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                    color: statusColor, fontWeight: 700, fontSize: '0.82rem', px: 1,
                  }}
                />
              )}
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Activity summary */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '10px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Active Time (24h)</Typography>
                  {loading ? <Skeleton width={80} sx={{ mx: 'auto' }} /> : (
                    <Typography variant="h6" fontWeight={700} color="#00d4aa">{fmt(activeSeconds)}</Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '10px', background: 'rgba(255,179,71,0.06)', border: '1px solid rgba(255,179,71,0.15)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Idle Time (24h)</Typography>
                  {loading ? <Skeleton width={80} sx={{ mx: 'auto' }} /> : (
                    <Typography variant="h6" fontWeight={700} color="#ffb347">{fmt(idleSeconds)}</Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '10px', background: 'rgba(79,107,255,0.06)', border: '1px solid rgba(79,107,255,0.15)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Recordings</Typography>
                  {loading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> : (
                    <Typography variant="h6" fontWeight={700} color="primary.light">{recordings.length}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Active ratio progress bar */}
            {!loading && totalSeconds > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="#00d4aa">Active {activeRatio.toFixed(0)}%</Typography>
                  <Typography variant="caption" color="#ffb347">Idle {(100 - activeRatio).toFixed(0)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={activeRatio}
                  sx={{
                    height: 8, borderRadius: 4,
                    '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00d4aa, #4f6bff)' },
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ── Tabs: Timeline | Recordings ── */}
        <Card>
          <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: 2,
                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.85rem', minHeight: 52 },
              }}
            >
              <Tab
                icon={<AppsRounded sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Activity Timeline (${timeline.length})`}
                id="tab-timeline"
              />
              <Tab
                icon={<VideocamRounded sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Recordings (${recordings.length})`}
                id="tab-recordings"
              />
            </Tabs>
          </Box>

          {/* Timeline tab */}
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Window Title</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(5)].map((__, j) => (
                          <TableCell key={j}><Skeleton height={22} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : timeline.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                        <HourglassEmptyRounded sx={{ fontSize: 40, opacity: 0.3, display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No activity logs for the last 24 hours.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeline.map((log) => <TimelineRow key={log.id} log={log} />)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Recordings tab */}
          {tab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Recorded At</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>File Path</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(4)].map((__, j) => (
                          <TableCell key={j}><Skeleton height={22} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : recordings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6 }}>
                        <VideocamRounded sx={{ fontSize: 40, opacity: 0.3, display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No recordings available for this device.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recordings.map((rec) => <RecordingRow key={rec.id} rec={rec} />)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Box>
  );
}
