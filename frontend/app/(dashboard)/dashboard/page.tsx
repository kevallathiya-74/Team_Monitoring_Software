'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Avatar, LinearProgress, Skeleton, Alert, Tooltip,
  IconButton, Divider, Button
} from '@mui/material';
import {
  DevicesRounded, WifiRounded, WifiOffRounded,
  HourglassEmptyRounded, RefreshRounded,
  ArrowForwardRounded, TrendingUpRounded,
  FiberManualRecordRounded, OpenInNewRounded,
  AccessTimeRounded
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import TopBar from '@/components/TopBar';
import { getDashboardDevices, generateCode, type DeviceSummary } from '@/lib/api';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, loading, sublabel
}: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; loading: boolean; sublabel?: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {label}
            </Typography>
            {loading
              ? <Skeleton width={60} height={48} sx={{ mt: 0.5 }} />
              : <Typography variant="h3" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>
                  {value}
                </Typography>
            }
            {sublabel && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {sublabel}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={loading ? 0 : 100}
          sx={{ mt: 2.5, height: 3, '& .MuiLinearProgress-bar': { background: color } }}
        />
      </CardContent>
    </Card>
  );
}

// ─── Device Card ─────────────────────────────────────────────────────────────
function DeviceCard({ device }: { device: DeviceSummary }) {
  const router = useRouter();
  const lastSeen = (() => {
    try { return formatDistanceToNow(parseISO(device.last_seen_at), { addSuffix: true }); }
    catch { return 'Unknown'; }
  })();

  const statusColor = device.is_online ? '#00d4aa' : '#ff4d6a';
  const statusLabel = device.is_online ? 'Online' : 'Offline';

  return (
    <Card
      onClick={() => router.push(`/devices/${device.id}`)}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(79,107,255,0.2)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: device.is_online
              ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,106,0.1)',
            border: `1px solid ${statusColor}30`,
          }}>
            {device.is_online
              ? <WifiRounded sx={{ color: '#00d4aa', fontSize: 20 }} />
              : <WifiOffRounded sx={{ color: '#ff4d6a', fontSize: 20 }} />
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
            <Typography variant="caption" color="text.secondary">
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
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [devices, setDevices]   = useState<DeviceSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [code, setCode]         = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeExpiry, setCodeExpiry]   = useState(0);

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

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchDevices, 30_000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

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
    try {
      const res = await generateCode();
      setCode(res.data.code);
      setCodeExpiry(res.data.expires_in_seconds);
    } catch { /* silent */ }
    finally { setCodeLoading(false); }
  };

  const online  = devices.filter((d) => d.is_online).length;
  const offline = devices.filter((d) => !d.is_online).length;
  const total   = devices.length;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Dashboard"
        subtitle="Real-time workforce overview"
        onRefresh={() => { setLoading(true); fetchDevices(); }}
        liveCount={online}
      />

      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* ── Stat Cards ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Total Devices"
              value={total}
              icon={<DevicesRounded />}
              color="#4f6bff"
              loading={loading}
              sublabel="Registered endpoints"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Online Now"
              value={online}
              icon={<WifiRounded />}
              color="#00d4aa"
              loading={loading}
              sublabel="Active in last 5 min"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Offline"
              value={offline}
              icon={<WifiOffRounded />}
              color="#ff4d6a"
              loading={loading}
              sublabel="Not seen recently"
            />
          </Grid>
        </Grid>

        {/* ── Generate Code + Live Grid Row ── */}
        <Grid container spacing={2.5}>
          {/* Generate Auth Code Panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpRounded sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>Device Pairing</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Generate a 6-digit auth code for a new device to register with the monitoring agent.
                </Typography>

                {code ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      p: 2, borderRadius: '12px',
                      background: 'rgba(79,107,255,0.1)',
                      border: '2px dashed rgba(79,107,255,0.3)',
                      mb: 1.5,
                    }}>
                      <Typography variant="h3" fontWeight={800} letterSpacing="0.2em" color="primary.light">
                        {code}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(codeExpiry / 300) * 100}
                      sx={{ mb: 1, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#4f6bff,#00d4aa)' } }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Expires in {codeExpiry}s — Single use only
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
                  >
                    {codeLoading ? 'Generating…' : 'Generate Auth Code'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Device Grid */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DevicesRounded sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Live Device Grid
                    </Typography>
                  </Box>
                  <Chip label={`${total} total`} size="small"
                    sx={{ background: 'rgba(79,107,255,0.1)', color: 'primary.light', fontSize: '0.72rem' }} />
                </Box>

                {loading ? (
                  <Grid container spacing={1.5}>
                    {[...Array(4)].map((_, i) => (
                      <Grid key={i} size={{ xs: 12, sm: 6 }}>
                        <Skeleton variant="rounded" height={110} />
                      </Grid>
                    ))}
                  </Grid>
                ) : devices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DevicesRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
                    <Typography color="text.secondary" variant="body2">
                      No devices registered yet.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generate a code and register your first agent.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {devices.map((device) => (
                      <Grid key={device.id} size={{ xs: 12, sm: 6 }}>
                        <DeviceCard device={device} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
