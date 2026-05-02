'use client';
import React from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar,
  LinearProgress, Skeleton, Alert, Divider, Select,
  MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  AssessmentRounded, TrendingUpRounded, WifiRounded,
  WifiOffRounded, HourglassEmptyRounded,
  BarChartRounded
} from '@mui/icons-material';
import TopBar from '@/components/TopBar';
import { apiErrorMessage } from '@/lib/api';
import { useDeviceReports, type DeviceReport } from '@/hooks/useMonitoringData';
import { useMonitoringStore } from '@/store/monitoringStore';
import { ErrorState, EmptyState } from '@/components/ui/DataState';

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ReportCard({ report }: { report: DeviceReport }) {
  const total = report.activeSeconds + report.idleSeconds;
  const activeRatio = total > 0 ? (report.activeSeconds / total) * 100 : 0;

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Avatar sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: report.device.is_online ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          }}>
            {report.device.is_online
              ? <WifiRounded sx={{ color: '#10b981', fontSize: 20 }} />
              : <WifiOffRounded sx={{ color: '#ef4444', fontSize: 20 }} />
            }
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{report.device.hostname}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{report.device.local_ip}</Typography>
          </Box>
          <Chip
            label={report.device.is_online ? 'Online' : 'Offline'}
            size="small"
            sx={{
              background: report.device.is_online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: report.device.is_online ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
              color: report.device.is_online ? '#10b981' : '#ef4444',
              fontWeight: 700, fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Time stats */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Active</Typography>
              <Typography variant="h6" fontWeight={700} color="#10b981" fontSize="1rem">
                {fmtDuration(report.activeSeconds)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '8px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Idle</Typography>
              <Typography variant="h6" fontWeight={700} color="#f97316" fontSize="1rem">
                {fmtDuration(report.idleSeconds)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="#10b981">Active {activeRatio.toFixed(0)}%</Typography>
            <Typography variant="caption" color="#f97316">Idle {(100 - activeRatio).toFixed(0)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={activeRatio}
            sx={{
              height: 6, borderRadius: 3,
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10b981, #a855f7)' }
            }}
          />
        </Box>

        {/* Top apps */}
        {report.topApps.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              Top Applications
            </Typography>
            {report.topApps.slice(0, 3).map((app, i) => {
              const pct = report.activeSeconds > 0 ? (app.seconds / report.activeSeconds) * 100 : 0;
              return (
                <Box key={i} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="caption" color="text.primary" noWrap fontWeight={500}
                      sx={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{fmtDuration(app.seconds)}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(pct, 100)}
                    sx={{
                      height: 4, borderRadius: 2,
                      '& .MuiLinearProgress-bar': { background: `hsl(${220 + i * 40}, 80%, 65%)` }
                    }}
                  />
                </Box>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const timeRange = useMonitoringStore((s) => s.reportsTimeRange);
  const setTimeRange = useMonitoringStore((s) => s.setReportsTimeRange);
  const {
    data: reports = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useDeviceReports(timeRange);

  const totalActive  = reports.reduce((s, r) => s + r.activeSeconds, 0);
  const totalIdle    = reports.reduce((s, r) => s + r.idleSeconds, 0);
  const onlineCount  = reports.filter((r) => r.device.is_online).length;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Reports"
        subtitle="Team productivity summary"
        onRefresh={() => { void mutate(); }}
        liveCount={onlineCount}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {error && (
          <Box sx={{ mb: 2.5 }}>
            <ErrorState
              message={apiErrorMessage(error, 'Failed to load report data.')}
              onRetry={() => { void mutate(); }}
            />
          </Box>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentRounded sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700}>Activity Report</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range-select"
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <MenuItem value={6}>Last 6 Hours</MenuItem>
              <MenuItem value={12}>Last 12 Hours</MenuItem>
              <MenuItem value={24}>Last 24 Hours</MenuItem>
              <MenuItem value={48}>Last 48 Hours</MenuItem>
              <MenuItem value={168}>Last 7 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Summary stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <TrendingUpRounded sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Total Active Time</Typography>
                {isLoading ? <Skeleton width={100} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="#10b981">{fmtDuration(totalActive)}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <HourglassEmptyRounded sx={{ fontSize: 32, color: '#f97316', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Total Idle Time</Typography>
                {isLoading ? <Skeleton width={100} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="#f97316">{fmtDuration(totalIdle)}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <BarChartRounded sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Devices Tracked</Typography>
                {isLoading ? <Skeleton width={60} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="primary.light">{reports.length}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Per-device cards */}
        {isLoading && reports.length === 0 ? (
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))}
          </Grid>
        ) : reports.length === 0 ? (
          <EmptyState title="No data available for this time range" subtitle="Try a wider time range or check active devices." />
        ) : (
          <Grid container spacing={2}>
            {reports.map((report) => (
              <Grid key={report.device.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <ReportCard report={report} />
              </Grid>
            ))}
          </Grid>
        )}

        {isValidating && reports.length > 0 && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: '10px' }}>
            Refreshing report data...
          </Alert>
        )}
      </Box>
    </Box>
  );
}
