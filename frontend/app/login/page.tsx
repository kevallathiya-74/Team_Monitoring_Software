'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, CircularProgress, InputAdornment, IconButton, Divider, Chip
} from '@mui/material';
import {
  EmailRounded, LockRounded, VisibilityRounded,
  VisibilityOffRounded, MonitorHeartRounded, ShieldRounded
} from '@mui/icons-material';
import { adminLogin } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();

  const [email, setEmail]       = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(email, password);
      setToken(res.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Login failed. Check your credentials.');
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
        background: 'radial-gradient(ellipse at 20% 50%, rgba(79,107,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,170,0.08) 0%, transparent 60%), linear-gradient(135deg, #0a0e1a 0%, #0d1533 100%)',
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
            ...(i === 0 && { width: 400, height: 400, background: '#4f6bff', top: '-100px', left: '-100px' }),
            ...(i === 1 && { width: 300, height: 300, background: '#00d4aa', bottom: '10%', right: '5%' }),
            ...(i === 2 && { width: 200, height: 200, background: '#7b8fff', top: '40%', left: '60%' }),
          }} />
        ))}
      </Box>

      <Card
        sx={{
          width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
          background: 'rgba(15, 22, 41, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(79,107,255,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '16px', mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #4f6bff 0%, #7b8fff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(79,107,255,0.45)',
              }}
            >
              <MonitorHeartRounded sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              WorkForce AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin Portal — Sign in to continue
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Chip
              icon={<ShieldRounded sx={{ fontSize: '14px !important' }} />}
              label="Secure Login"
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

            <TextField
              id="login-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              id="login-password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass((s) => !s)} edge="end">
                      {showPass
                        ? <VisibilityOffRounded sx={{ fontSize: 18 }} />
                        : <VisibilityRounded sx={{ fontSize: 18 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              id="login-submit"
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 0.5, py: 1.4, fontSize: '1rem' }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : 'Sign In to Dashboard'
              }
            </Button>
          </Box>

          {/* Footer hint */}
          <Box sx={{ mt: 3, p: 2, borderRadius: '10px', background: 'rgba(79,107,255,0.06)', border: '1px solid rgba(79,107,255,0.1)' }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              Default credentials: <strong style={{ color: '#94a3b8' }}>admin@example.com</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              Set password via backend bootstrap script
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
