'use client';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Avatar, LinearProgress, Skeleton, Alert,
  IconButton, Divider, Button
} from '@mui/material';
import {
  DevicesRounded, WifiRounded, WifiOffRounded,
  HourglassEmptyRounded, TrendingUpRounded,
  FiberManualRecordRounded, OpenInNewRounded,
  AccessTimeRounded, InfoRounded, MonitorHeartRounded
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import TopBar from '@/components/TopBar';
import { apiErrorMessage, generateCode, type DeviceSummary } from '@/lib/api';
import { useDashboardDevices } from '@/hooks/useMonitoringData';
import { ErrorState } from '@/components/ui/DataState';

type DeviceVisualStatus = 'active' | 'idle' | 'offline';

const STATUS_META: Record<DeviceVisualStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#00d4aa' },
  idle: { label: 'Idle', color: '#ffb347' },
  offline: { label: 'Offline', color: '#ff4d6a' },
};

const IDLE_SECONDS_THRESHOLD = 60;

function parseLastSeenSeconds(lastSeenAt: string): number | null {
  try {
    return Math.max(0, Math.floor((Date.now() - parseISO(lastSeenAt).getTime()) / 1000));
  } catch {
    return null;
  }
}

function getDeviceVisualStatus(device: DeviceSummary): DeviceVisualStatus {
  if (!device.is_online) return 'offline';
  const seconds = parseLastSeenSeconds(device.last_seen_at);
  if (seconds !== null && seconds > IDLE_SECONDS_THRESHOLD) return 'idle';
  return 'active';
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({
  label, value, icon, color, loading, sublabel
}: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; loading: boolean; sublabel?: string;
}) {
  return (
    <Card sx={{ height: '100%', borderRadius: '16px' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', mb: 0.5 }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: '12px',
            background: `${color}14`,
            border: `1.5px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </Box>
        </Box>
        {loading
          ? <Skeleton variant="text" height={48} sx={{ mt: 0.5 }} />
          : <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
              {value}
            </Typography>
        }
        {sublabel && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
            {sublabel}
          </Typography>
        )}
        <LinearProgress
          variant="determinate"
          value={loading ? 0 : 100}
          sx={{ mt: 'auto', height: 2, borderRadius: '2px', '& .MuiLinearProgress-bar': { background: color }, transition: 'all 150ms ease' }}
        />
      </CardContent>
    </Card>
  );
});

// ─── Device Card ─────────────────────────────────────────────────────────────
const DeviceCard = memo(function DeviceCard({
  device,
  status,
}: {
  device: DeviceSummary;
  status: DeviceVisualStatus;
}) {
  const router = useRouter();
  const lastSeen = (() => {
    try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); }
    catch { return 'Unknown'; }
  })();

  const statusColor = STATUS_META[status].color;
  const statusLabel = STATUS_META[status].label;

  return (
    <Card
      onClick={() => router.push(`/devices/${device.id}`)}
          sx={{
            cursor: 'pointer',
            borderRadius: '16px',
            transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            borderColor: `${statusColor}28`,
            boxShadow: `0 0 0 1px ${statusColor}12`,
            animation: 'statusFlash 900ms ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.4)' },
            '@keyframes statusFlash': {
              '0%': { boxShadow: `0 0 0 0 ${statusColor}44` },
              '100%': { boxShadow: `0 0 0 1px ${statusColor}12` },
            },
          }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: `${statusColor}1a`,
            border: `1px solid ${statusColor}30`,
          }}>
            {status === 'offline'
              ? <WifiOffRounded sx={{ color: statusColor, fontSize: 20 }} />
              : <WifiRounded sx={{ color: statusColor, fontSize: 20 }} />
            }
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap color="text.primary">
              {device.hostname}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {device.local_ip}
            </Typography>
          </Box>
          <Chip
            icon={<FiberManualRecordRounded sx={{ fontSize: '8px !important', color: `${statusColor} !important` }} />}
            label={statusLabel}
            size="small"
            sx={{
              minWidth: 82,
              justifyContent: 'flex-start',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}30`,
              color: statusColor,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Footer row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {lastSeen}
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <OpenInNewRounded sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
});

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [code, setCode]         = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeExpiry, setCodeExpiry]   = useState(0);
  const [codeTtl, setCodeTtl] = useState(0);
  const [codeFeedback, setCodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const {
    data: devices = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useDashboardDevices();

  // Code countdown
  useEffect(() => {
    if (!codeExpiry) return;
    const t = setInterval(() => {
      setCodeExpiry((prev) => {
        if (prev <= 1) { clearInterval(t); setCode(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [codeExpiry]);

  const handleGenerateCode = async () => {
    setCodeLoading(true);
    setCodeFeedback(null);
    try {
      const res = await generateCode();
      setCode(res.data.code);
      setCodeExpiry(res.data.expires_in_seconds);
      setCodeTtl(res.data.expires_in_seconds);
      setCodeFeedback({ type: 'success', message: 'Authentication code generated successfully.' });
    } catch (err: unknown) {
      setCodeFeedback({ type: 'error', message: apiErrorMessage(err, 'Failed to generate code.') });
    }
    finally { setCodeLoading(false); }
  };

  const dashboardDevices = useMemo(() => {
    return devices.map((device) => ({
      ...device,
      visualStatus: getDeviceVisualStatus(device),
    }));
  }, [devices]);

  const { online, offline, total } = useMemo(() => {
    const onlineCount = devices.filter((d) => d.is_online).length;
    return {
      online: onlineCount,
      offline: devices.length - onlineCount,
      total: devices.length,
    };
  }, [devices]);

  const idle = useMemo(
    () => dashboardDevices.filter((device) => device.visualStatus === 'idle').length,
    [dashboardDevices],
  );

  const lastUpdatedSeconds = useMemo(() => {
    const parsed = devices
      .map((device) => parseLastSeenSeconds(device.last_seen_at))
      .filter((value): value is number => value !== null);
    if (parsed.length === 0) return 0;
    return Math.min(...parsed);
  }, [devices]);

  const loading = isLoading && devices.length === 0;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Dashboard"
        subtitle="Real-time workforce overview"
        onRefresh={() => { void mutate(); }}
        liveCount={online}
        lastUpdatedSeconds={lastUpdatedSeconds}
      />

      <Box sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {error && (
          <Box sx={{ mb: 2.5 }}>
            <ErrorState
              message={apiErrorMessage(error, 'Failed to load data.')}
              onRetry={() => { void mutate(); }}
            />
          </Box>
        )}

        {/* ── Stat Cards ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Total Devices"
              value={total}
              icon={<DevicesRounded sx={{ fontSize: 20 }} />}
              color="#a855f7"
              loading={loading || isValidating}
              sublabel="Registered endpoints"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Online Now"
              value={online}
              icon={<WifiRounded sx={{ fontSize: 20 }} />}
              color="#10b981"
              loading={loading || isValidating}
              sublabel="Connected and reporting"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Offline"
              value={offline}
              icon={<WifiOffRounded sx={{ fontSize: 20 }} />}
              color="#ef4444"
              loading={loading || isValidating}
              sublabel="Not seen recently"
            />
          </Grid>
        </Grid>

        {/* ── Generate Code + Live Grid Row ── */}
        <Grid container spacing={2}>
          {/* Generate Auth Code Panel */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%', borderRadius: '16px' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <MonitorHeartRounded sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>Device Pairing</Typography>
                </Box>

                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Generate a 6-digit code and enter it on a new device to pair instantly.
                </Typography>

                {code ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      p: 2.5, borderRadius: '14px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '2px dashed rgba(168, 85, 247, 0.3)',
                      mb: 1.5,
                    }}>
                      <Typography variant="h3" fontWeight={800} letterSpacing="0.25em" color="primary.light" sx={{ fontSize: '2.5rem' }}>
                        {code}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={codeTtl > 0 ? (codeExpiry / codeTtl) * 100 : 0}
                      sx={{ mb: 1, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #a855f7, #06b6d4)' } }}
                    />
                    <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      Expires in {codeExpiry}s. Single-use only.
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    id="generate-code-btn"
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateCode}
                    disabled={codeLoading}
                    startIcon={<HourglassEmptyRounded />}
                    sx={{ py: 1.25 }}
                  >
                    {codeLoading ? 'Generating…' : 'Generate Auth Code'}
                  </Button>
                )}

                {codeFeedback && (
                  <Alert
                    severity={codeFeedback.type}
                    sx={{ borderRadius: '10px', py: 0.5 }}
                    icon={codeFeedback.type === 'success' ? undefined : <InfoRounded fontSize="inherit" />}
                  >
                    {codeFeedback.message}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Device Grid */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%', borderRadius: '16px' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DevicesRounded sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 500 }}>
                      Live Device Grid
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${total} total`} size="small"
                      sx={{ background: 'rgba(168, 85, 247, 0.12)', color: 'primary.light', fontSize: '0.72rem', fontWeight: 700 }} />
                    <Chip label={`${idle} idle`} size="small"
                      sx={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#f97316', fontSize: '0.72rem', fontWeight: 700 }} />
                  </Box>
                </Box>

                {loading ? (
                  <Grid container spacing={2}>
                    {[...Array(6)].map((_, i) => (
                      <Grid key={i} size={{ xs: 12, sm: 6, xl: 4 }}>
                        <Skeleton variant="rounded" height={140} sx={{ borderRadius: '14px' }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : dashboardDevices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DevicesRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
                    <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
                      No devices connected
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
                      Generate a pairing code to connect the first device.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {dashboardDevices.map((device) => (
                      <Grid key={`${device.id}-${device.visualStatus}`} size={{ xs: 12, sm: 6, xl: 4 }}>
                        <DeviceCard
                          device={device}
                          status={device.visualStatus}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {isValidating && devices.length > 0 && (
          <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            Refreshing live metrics...
          </Typography>
        )}
        </Box>
      </Box>
    </Box>
  );
}
