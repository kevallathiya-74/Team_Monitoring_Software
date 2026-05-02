'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, CircularProgress, InputAdornment, Divider, Chip, Link
} from '@mui/material';
import {
  KeyRounded, MonitorHeartRounded, LockOpenRounded, 
  ShieldRounded, AdminPanelSettingsRounded
} from '@mui/icons-material';
import { verifyCode, apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();

  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [hostname, setHostname] = useState('');
  const [localIp, setLocalIp]   = useState('');

  useEffect(() => {
    // Get system info (in real app, this would come from agent)
    setHostname(typeof window !== 'undefined' ? window.location.hostname || 'Device' : 'Device');
    setLocalIp('127.0.0.1'); // Placeholder, would be set by agent
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter your access code.');
      return;
    }
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Code must be 6 digits.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await verifyCode(code, hostname, localIp);
      setToken(res.data.access_token, res.data.device_id, res.data.session_id);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Invalid code. Please check and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 60%), linear-gradient(135deg, #0a0e1a 0%, #0d1533 100%)',
        p: 2,
      }}
    >
      {/* Floating orbs */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(3)].map((_, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.15,
            ...(i === 0 && { width: 400, height: 400, background: '#a855f7', top: '-100px', left: '-100px' }),
            ...(i === 1 && { width: 300, height: 300, background: '#06b6d4', bottom: '10%', right: '5%' }),
            ...(i === 2 && { width: 200, height: 200, background: '#d946ef', top: '40%', left: '60%' }),
          }} />
        ))}
      </Box>

      <Card
        sx={{
          width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
          background: 'rgba(15, 22, 41, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(168,85,247,0.45)',
              }}
            >
              <MonitorHeartRounded sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              WorkForce AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Employee Access Code Login
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Chip
              icon={<KeyRounded sx={{ fontSize: '14px !important' }} />}
              label="Secure Access"
              size="small"
              sx={{ fontSize: '0.72rem', color: 'text.secondary', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Divider>

          {/* Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 500 }}>
                Enter 6-Digit Access Code
              </Typography>
              <TextField
                id="login-code"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                fullWidth
                sx={{
                  '& .MuiInput-root': {
                    fontSize: '2rem',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontWeight: 600,
                  },
                  '& input': {
                    textAlign: 'center',
                  },
                }}
                slotProps={{
                  input: {
                    autoComplete: 'off',
                    autoFocus: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOpenRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Button
              id="login-submit"
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || code.length !== 6}
              sx={{ 
                mt: 1, 
                py: 1.4, 
                fontSize: '1rem',
                background: code.length === 6 && !loading 
                  ? 'linear-gradient(135deg, #a855f7, #d946ef)' 
                  : undefined,
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : 'Enter Device'
              }
            </Button>
          </Box>

          {/* Info box */}
          <Box sx={{ mt: 3.5, p: 2.5, borderRadius: '10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.1)' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              💡 <strong>First time?</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.6 }}>
              Ask your administrator for a 6-digit access code to register your device.
            </Typography>
          </Box>

          {/* Admin login link */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                router.push('/login/admin');
              }}
              sx={{
                color: '#a855f7',
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <AdminPanelSettingsRounded sx={{ fontSize: 16 }} />
              Admin Login
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
