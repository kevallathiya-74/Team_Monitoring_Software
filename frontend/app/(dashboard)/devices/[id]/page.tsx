'use client';
import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Avatar,
  Skeleton, Divider, LinearProgress,
  Tab, Tabs, Button
} from '@mui/material';
import {
  ArrowBackRounded,
  AppsRounded, VideocamRounded, FiberManualRecordRounded,
  DesktopWindowsRounded
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import { apiErrorMessage } from '@/lib/api';
import { useDashboardDevices, useDeviceRecordings, useDeviceTimeline } from '@/hooks/useMonitoringData';
import { useMonitoringStore } from '@/store/monitoringStore';
import { ErrorState } from '@/components/ui/DataState';

const ActivityTimelineTable = dynamic(() => import('@/components/device/ActivityTimelineTable'));
const RecordingsTable = dynamic(() => import('@/components/device/RecordingsTable'));

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tab = useMonitoringStore((s) => s.deviceDetailTab);
  const setTab = useMonitoringStore((s) => s.setDeviceDetailTab);
  const timelineFilter = useMonitoringStore((s) => s.timelineFilter);
  const setTimelineFilter = useMonitoringStore((s) => s.setTimelineFilter);
  const recordingsPage = useMonitoringStore((s) => s.recordingsPage);
  const setRecordingsPage = useMonitoringStore((s) => s.setRecordingsPage);
  const recordingsRowsPerPage = useMonitoringStore((s) => s.recordingsRowsPerPage);
  const setRecordingsRowsPerPage = useMonitoringStore((s) => s.setRecordingsRowsPerPage);

  const {
    data: devices = [],
    error: deviceErr,
    isLoading: deviceLoading,
    isValidating: deviceRefreshing,
    mutate: refreshDevices,
  } = useDashboardDevices();

  const {
    data: timeline = [],
    error: timelineErr,
    isLoading: timelineLoading,
    isValidating: timelineRefreshing,
    mutate: refreshTimeline,
  } = useDeviceTimeline(id);

  const {
    data: recordings = [],
    error: recordingsErr,
    isLoading: recordingsLoading,
    isValidating: recordingsRefreshing,
    mutate: refreshRecordings,
  } = useDeviceRecordings(id);

  const loading = deviceLoading || timelineLoading || recordingsLoading;
  const refreshing = deviceRefreshing || timelineRefreshing || recordingsRefreshing;

  const device = useMemo(
    () => devices.find((d) => d.id === id) || null,
    [devices, id],
  );

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
        onRefresh={() => {
          void Promise.all([refreshDevices(), refreshTimeline(), refreshRecordings()]);
        }}
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

        {(deviceErr || timelineErr || recordingsErr) && (
          <Box sx={{ mb: 2.5 }}>
            <ErrorState
              message={apiErrorMessage(deviceErr || timelineErr || recordingsErr, 'Failed to load device data.')}
              onRetry={() => {
                void Promise.all([refreshDevices(), refreshTimeline(), refreshRecordings()]);
              }}
            />
          </Box>
        )}

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
            <ActivityTimelineTable
              loading={timelineLoading && timeline.length === 0}
              logs={timeline}
              filter={timelineFilter}
              onFilterChange={setTimelineFilter}
            />
          )}

          {/* Recordings tab */}
          {tab === 1 && (
            <RecordingsTable
              loading={recordingsLoading && recordings.length === 0}
              recordings={recordings}
              page={recordingsPage}
              rowsPerPage={recordingsRowsPerPage}
              onPageChange={setRecordingsPage}
              onRowsPerPageChange={(value) => {
                setRecordingsRowsPerPage(value);
                setRecordingsPage(0);
              }}
            />
          )}
        </Card>

        {refreshing && !loading && (
          <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            Refreshing latest device data...
          </Typography>
        )}
      </Box>
    </Box>
  );
}
