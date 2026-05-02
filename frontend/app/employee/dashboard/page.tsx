'use client';
import React, { useMemo } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Grid, LinearProgress, Skeleton, Stack, Typography,
} from '@mui/material';
import {
  AccessTimeRounded, ComputerRounded, FiberManualRecordRounded, HistoryRounded,
  MonitorHeartRounded, RadioButtonCheckedRounded, RefreshRounded, TimelapseRounded,
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO, subHours } from 'date-fns';
import AuthGuard from '@/components/AuthGuard';
import TopBar from '@/components/TopBar';
import { apiErrorMessage, type ActivityLog, type Recording } from '@/lib/api';
import { useDeviceRecordings, useDeviceTimeline, useEmployeeMe } from '@/hooks/useMonitoringData';

function secondsLabel(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function lastSeenSeconds(value?: string) {
  if (!value) return 0;
  try {
    return Math.max(0, Math.floor((Date.now() - parseISO(value).getTime()) / 1000));
  } catch {
    return 0;
  }
}

function latestActivity(logs: ActivityLog[]) {
  return [...logs].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())[0];
}

function latestRecording(recordings: Recording[]) {
  return [...recordings].sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime())[0];
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card sx={{ height: '100%', borderRadius: '12px' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Box sx={{ color: 'primary.light' }}>{icon}</Box>
        </Stack>
        {loading ? <Skeleton height={42} /> : <Typography variant="h5" fontWeight={800}>{value}</Typography>}
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function EmployeeDashboardPage() {
  const startTime = useMemo(() => subHours(new Date(), 24).toISOString(), []);
  const endTime = useMemo(() => new Date().toISOString(), []);
  const {
    data: device,
    error: deviceError,
    isLoading: deviceLoading,
    isValidating: deviceRefreshing,
    mutate: refreshDevice,
  } = useEmployeeMe();
  const {
    data: logs = [],
    error: timelineError,
    isLoading: timelineLoading,
    isValidating: timelineRefreshing,
    mutate: refreshTimeline,
  } = useDeviceTimeline(device?.id, startTime, endTime);
  const {
    data: recordings = [],
    error: recordingsError,
    isLoading: recordingsLoading,
    isValidating: recordingsRefreshing,
    mutate: refreshRecordings,
  } = useDeviceRecordings(device?.id, 0, 10);

  const current = useMemo(() => latestActivity(logs), [logs]);
  const recording = useMemo(() => latestRecording(recordings), [recordings]);
  const activeSeconds = useMemo(
    () => logs.filter((log) => !log.is_idle).reduce((sum, log) => sum + log.duration_seconds, 0),
    [logs],
  );
  const idleSeconds = useMemo(
    () => logs.filter((log) => log.is_idle).reduce((sum, log) => sum + log.duration_seconds, 0),
    [logs],
  );
  const topApp = useMemo(() => {
    const totals = logs.reduce<Record<string, number>>((acc, log) => {
      if (!log.is_idle && log.app_name) acc[log.app_name] = (acc[log.app_name] || 0) + log.duration_seconds;
      return acc;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  }, [logs]);

  const loading = deviceLoading || (Boolean(device?.id) && (timelineLoading || recordingsLoading));
  const refreshing = deviceRefreshing || timelineRefreshing || recordingsRefreshing;
  const status = current?.is_idle ? 'Idle' : device?.is_online ? 'Active' : 'Offline';
  const statusColor = status === 'Active' ? '#10b981' : status === 'Idle' ? '#f59e0b' : '#ef4444';
  const error = deviceError || timelineError || recordingsError;

  const refreshAll = () => {
    void refreshDevice();
    void refreshTimeline();
    void refreshRecordings();
  };

  return (
    <AuthGuard role="employee">
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #102018 100%)' }}>
        <TopBar
          title="Employee Dashboard"
          subtitle={device?.hostname || 'Your activity overview'}
          onRefresh={refreshAll}
          lastUpdatedSeconds={lastSeenSeconds(device?.last_seen_at)}
        />

        <Box sx={{ maxWidth: 1180, mx: 'auto', p: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={refreshAll}>Retry</Button>}
              sx={{ mb: 2.5, borderRadius: '10px' }}
            >
              {apiErrorMessage(error, 'Unable to load employee activity.')}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', borderRadius: '12px', borderColor: `${statusColor}55` }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={800}>Status</Typography>
                    <Chip
                      icon={<FiberManualRecordRounded sx={{ fontSize: '9px !important', color: `${statusColor} !important` }} />}
                      label={status}
                      size="small"
                      sx={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}35` }}
                    />
                  </Stack>
                  {deviceLoading ? (
                    <Skeleton variant="rounded" height={92} />
                  ) : device ? (
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                        <ComputerRounded sx={{ color: 'text.secondary' }} />
                        <Typography fontWeight={700}>{device.hostname}</Typography>
                      </Stack>
                      <Typography color="text.secondary" variant="body2">Session duration: {secondsLabel(activeSeconds + idleSeconds)}</Typography>
                      <Typography color="text.secondary" variant="body2">Current app: {current?.app_name || 'No activity yet'}</Typography>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No device data available.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MetricCard
                title="Active Time"
                value={secondsLabel(activeSeconds)}
                subtitle="Last 24 hours"
                icon={<TimelapseRounded />}
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MetricCard
                title="Idle Time"
                value={secondsLabel(idleSeconds)}
                subtitle={topApp ? `Top app: ${topApp[0]} (${secondsLabel(topApp[1])})` : 'No app usage yet'}
                icon={<AccessTimeRounded />}
                loading={loading}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ borderRadius: '12px' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                    <MonitorHeartRounded sx={{ color: 'primary.light' }} />
                    <Typography fontWeight={800}>Live Activity</Typography>
                  </Stack>
                  {timelineLoading ? (
                    <Skeleton variant="rounded" height={120} />
                  ) : current ? (
                    <Stack spacing={1.5}>
                      <Typography variant="h6" fontWeight={800}>{current.app_name || 'Unknown app'}</Typography>
                      <Typography color="text.secondary">{current.window_title || 'No window title reported'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Updated {formatDistanceToNow(parseISO(current.timestamp), { addSuffix: true })}
                      </Typography>
                      <LinearProgress variant="determinate" value={current.is_idle ? 35 : 100} sx={{ height: 4, borderRadius: '4px' }} />
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No live activity has been reported yet.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: '12px' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                    <RadioButtonCheckedRounded sx={{ color: recording ? '#10b981' : 'text.secondary' }} />
                    <Typography fontWeight={800}>Recording Status</Typography>
                  </Stack>
                  {recordingsLoading ? (
                    <Skeleton variant="rounded" height={120} />
                  ) : recording ? (
                    <Stack spacing={1.25}>
                      <Chip label="Recording metadata active" size="small" sx={{ alignSelf: 'flex-start', color: '#10b981', background: 'rgba(16,185,129,0.12)' }} />
                      <Typography color="text.secondary">Last saved {formatDistanceToNow(parseISO(recording.created_at), { addSuffix: true })}</Typography>
                      <Typography color="text.secondary">Duration: {secondsLabel(recording.duration_seconds)}</Typography>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">No recording metadata has been saved yet.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: '12px' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" sx={{ mb: 2, gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <HistoryRounded sx={{ color: 'primary.light' }} />
                      <Typography fontWeight={800}>Recent Activity</Typography>
                    </Stack>
                    {refreshing && <RefreshRounded sx={{ color: 'text.secondary', fontSize: 18 }} />}
                  </Stack>
                  {timelineLoading ? (
                    <Stack spacing={1}>{[0, 1, 2].map((item) => <Skeleton key={item} height={38} />)}</Stack>
                  ) : logs.length === 0 ? (
                    <Typography color="text.secondary">Activity will appear here when your device reports it.</Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {logs.slice(-5).reverse().map((log) => (
                        <Stack key={log.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ py: 1, justifyContent: 'space-between', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                          <Box>
                            <Typography fontWeight={700}>{log.app_name || 'Unknown app'}</Typography>
                            <Typography variant="body2" color="text.secondary">{log.window_title || 'No title'}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{secondsLabel(log.duration_seconds)}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AuthGuard>
  );
}
