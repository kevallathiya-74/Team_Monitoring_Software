'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar,
  LinearProgress, Skeleton, Alert, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Select,
  MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  AssessmentRounded, TrendingUpRounded, WifiRounded,
  WifiOffRounded, AppsRounded, HourglassEmptyRounded,
  BarChartRounded
} from '@mui/icons-material';
import TopBar from '@/components/TopBar';
import { getDashboardDevices, getDeviceTimeline, type DeviceSummary, type ActivityLog } from '@/lib/api';
import { format, subHours } from 'date-fns';

interface DeviceReport {
  device: DeviceSummary;
  activeSeconds: number;
  idleSeconds: number;
  topApps: { name: string; seconds: number }[];
  logCount: number;
}

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ReportCard({ report }: { report: DeviceReport }) {
  const total = report.activeSeconds + report.idleSeconds;
  const activeRatio = total > 0 ? (report.activeSeconds / total) * 100 : 0;
  const statusColor = report.device.is_online ? '#00d4aa' : '#ff4d6a';

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Avatar sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: report.device.is_online ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,106,0.1)',
          }}>
            {report.device.is_online
              ? <WifiRounded sx={{ color: '#00d4aa', fontSize: 20 }} />
              : <WifiOffRounded sx={{ color: '#ff4d6a', fontSize: 20 }} />
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
              background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
              color: statusColor, fontWeight: 700, fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Time stats */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '8px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.12)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Active</Typography>
              <Typography variant="h6" fontWeight={700} color="#00d4aa" fontSize="1rem">
                {fmtDuration(report.activeSeconds)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '8px', background: 'rgba(255,179,71,0.06)', border: '1px solid rgba(255,179,71,0.12)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Idle</Typography>
              <Typography variant="h6" fontWeight={700} color="#ffb347" fontSize="1rem">
                {fmtDuration(report.idleSeconds)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="#00d4aa">Active {activeRatio.toFixed(0)}%</Typography>
            <Typography variant="caption" color="#ffb347">Idle {(100 - activeRatio).toFixed(0)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={activeRatio}
            sx={{
              height: 6, borderRadius: 3,
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00d4aa, #4f6bff)' }
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
  const [reports, setReports]       = useState<DeviceReport[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [timeRange, setTimeRange]   = useState(24);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const devRes = await getDashboardDevices();
      const devices = devRes.data;

      const startTime = subHours(new Date(), timeRange).toISOString();
      const endTime   = new Date().toISOString();

      const reportData: DeviceReport[] = await Promise.all(
        devices.map(async (device) => {
          try {
            const tlRes = await getDeviceTimeline(device.id, startTime, endTime);
            const logs: ActivityLog[] = tlRes.data;
            const activeSeconds = logs.filter((l) => !l.is_idle).reduce((s, l) => s + l.duration_seconds, 0);
            const idleSeconds   = logs.filter((l) => l.is_idle).reduce((s, l) => s + l.duration_seconds, 0);

            // App usage aggregation
            const appMap: Record<string, number> = {};
            logs.filter((l) => !l.is_idle && l.app_name).forEach((l) => {
              appMap[l.app_name] = (appMap[l.app_name] || 0) + l.duration_seconds;
            });
            const topApps = Object.entries(appMap)
              .map(([name, seconds]) => ({ name, seconds }))
              .sort((a, b) => b.seconds - a.seconds);

            return { device, activeSeconds, idleSeconds, topApps, logCount: logs.length };
          } catch {
            return { device, activeSeconds: 0, idleSeconds: 0, topApps: [], logCount: 0 };
          }
        })
      );

      // Sort by active time desc
      reportData.sort((a, b) => b.activeSeconds - a.activeSeconds);
      setReports(reportData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const totalActive  = reports.reduce((s, r) => s + r.activeSeconds, 0);
  const totalIdle    = reports.reduce((s, r) => s + r.idleSeconds, 0);
  const onlineCount  = reports.filter((r) => r.device.is_online).length;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Reports"
        subtitle="Team productivity summary"
        onRefresh={fetchReports}
        liveCount={onlineCount}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

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
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <TrendingUpRounded sx={{ fontSize: 32, color: '#00d4aa', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Total Active Time</Typography>
                {loading ? <Skeleton width={100} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="#00d4aa">{fmtDuration(totalActive)}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <HourglassEmptyRounded sx={{ fontSize: 32, color: '#ffb347', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Total Idle Time</Typography>
                {loading ? <Skeleton width={100} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="#ffb347">{fmtDuration(totalIdle)}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <BarChartRounded sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">Devices Tracked</Typography>
                {loading ? <Skeleton width={60} sx={{ mx: 'auto' }} height={36} /> : (
                  <Typography variant="h5" fontWeight={800} color="primary.light">{reports.length}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Per-device cards */}
        {loading ? (
          <Grid container spacing={2.5}>
            {[...Array(4)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))}
          </Grid>
        ) : reports.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentRounded sx={{ fontSize: 56, opacity: 0.2, display: 'block', mx: 'auto', mb: 2 }} />
            <Typography color="text.secondary">No data available for this time range.</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {reports.map((report) => (
              <Grid key={report.device.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <ReportCard report={report} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
