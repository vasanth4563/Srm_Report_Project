import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  IconButton, InputAdornment, Alert, Fade, CircularProgress,
  alpha, useTheme, Autocomplete, Divider, MenuItem, Select,
  FormControl, InputLabel, createFilterOptions,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../utils/api.ts';
import BrandLogo from '../components/BrandLogo.tsx';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Users list state
  const [runtimeUsers, setRuntimeUsers] = useState<any[]>([]);

  // Fetch users list on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await apiRequest<any[]>('/api/auth/users');
        if (users) {
          setRuntimeUsers(users);
        }
      } catch (err) {
        console.warn('API users list offline:', err);
      }
    };
    fetchUsers();
  }, []);

  // ── Sign-In state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loginEmail, setLoginEmail]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [signInError, setSignInError]   = useState('');
  const [signingIn, setSigningIn]       = useState(false);
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [nameSearchOpen, setNameSearchOpen]   = useState(false);

  // ── Sign-In handler ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const targetEmail = loginEmail.trim() || selectedUser?.email;
    if (!targetEmail)  { setSignInError('Please select your name from the list or enter your email address.'); return; }
    if (!password)     { setSignInError('Please enter your password.'); return; }
    setSigningIn(true); setSignInError('');
    await new Promise((r) => setTimeout(r, 700));
    const ok = await login(targetEmail.toLowerCase(), password);
    setSigningIn(false);
    if (ok) navigate('/dashboard');
    else setSignInError('Incorrect email or password. Please try again.');
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', p: 2,
      background: '#ffffff',
    }}>
      {/* Background Soft Ambient Blobs */}
      {[
        { size: 450, top: '-120px', left: '-120px', bg: 'rgba(81, 40, 136, 0.05)', delay: '0s' },
        { size: 400, bottom: '-100px', right: '-100px', bg: 'rgba(250, 136, 51, 0.06)', delay: '2s' },
        { size: 300, top: '40%', right: '10%', bg: 'rgba(142, 111, 192, 0.06)', delay: '4s' },
      ].map((b, i) => (
        <Box key={i} sx={{
          position: 'absolute', width: b.size, height: b.size, borderRadius: '50%',
          background: b.bg, filter: 'blur(90px)', pointerEvents: 'none',
          animation: 'blobFloat 8s ease-in-out infinite alternate',
          animationDelay: b.delay,
          '@keyframes blobFloat': { '0%': { transform: 'translate(0,0)' }, '100%': { transform: 'translate(15px,15px)' } },
        }} />
      ))}

      <Fade in timeout={500}>
        <Card sx={{
          width: { xs: '94%', sm: 460 },
          position: 'relative', zIndex: 10,
          background: '#ffffff',
          border: '1px solid rgba(81, 40, 136, 0.12)',
          boxShadow: '0 16px 48px rgba(81, 40, 136, 0.08)',
          borderRadius: '24px',
        }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {/* ── Brand ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
              <Box sx={{
                width: 220,
                height: 60,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' }
              }}>
                <Box
                  component="img"
                  src="/srm_logo.jpg"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                    const fb = document.getElementById('logo-fallback');
                    if (fb) fb.style.display = 'inline-flex';
                  }}
                  sx={{
                    height: 120, // keep image large
                    objectFit: 'contain',
                    transform: 'translateY(-2px)' // center the logo content vertically
                  }}
                />
                <Box id="logo-fallback" sx={{ display: 'none' }}>
                  <BrandLogo size={44} variant="full" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                Dashboard Reports and Reviews
              </Typography>
            </Box>

            {/* ── SIGN IN VIEW ── */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Welcome back 👋</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2.5 }}>
              Type or search your name and enter your password to sign in.
            </Typography>

            {signInError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{signInError}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Name search & type field */}
              <Autocomplete
                freeSolo
                open={nameSearchOpen && nameSearchInput.trim().length > 0}
                onOpen={() => {
                  if (nameSearchInput.trim().length > 0) setNameSearchOpen(true);
                }}
                onClose={() => setNameSearchOpen(false)}
                options={runtimeUsers}
                filterOptions={createFilterOptions<any>({
                  matchFrom: 'any',
                  stringify: (option) => {
                    if (typeof option === 'string') return option;
                    return `${option.name} ${option.title || ''} ${option.email || ''} ${option.designation || ''}`;
                  },
                })}
                getOptionLabel={(u) => typeof u === 'string' ? u : `${u.title ? u.title + ' ' : ''}${u.name}`}
                groupBy={(u) => typeof u === 'object' && u?.title ? u.title : ''}
                value={selectedUser}
                onChange={(_, val) => {
                  if (typeof val === 'object' && val !== null) {
                    setSelectedUser(val);
                    setLoginEmail(val.email || '');
                    setNameSearchInput(`${val.title ? val.title + ' ' : ''}${val.name}`);
                  } else if (typeof val === 'string') {
                    const match = runtimeUsers.find(
                      (u) => u.name.toLowerCase().includes(val.toLowerCase()) || u.email.toLowerCase().includes(val.toLowerCase())
                    );
                    if (match) {
                      setSelectedUser(match);
                      setLoginEmail(match.email);
                    } else {
                      setSelectedUser(null);
                      setLoginEmail(val);
                    }
                    setNameSearchInput(val);
                  } else {
                    setSelectedUser(null);
                    setLoginEmail('');
                    setNameSearchInput('');
                  }
                  setNameSearchOpen(false);
                  setSignInError('');
                }}
                onInputChange={(_, newInputValue) => {
                  setNameSearchInput(newInputValue);
                  if (newInputValue.trim().length > 0) {
                    setNameSearchOpen(true);
                  } else {
                    setNameSearchOpen(false);
                    setSelectedUser(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search or Enter Name / Email"
                    placeholder="Type your name (e.g. Dr. Kathiravan)"
                    fullWidth
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    InputProps={{
                      ...(params.InputProps || {}),
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                          </InputAdornment>
                          {params.InputProps?.startAdornment ?? null}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id || option.email}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {option.title ? `${option.title} ` : ''}{option.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {option.designation} · {option.institution}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />

              {/* Password field */}
              <TextField
                fullWidth
                label="Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                        {showPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={signingIn}
                startIcon={signingIn ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <LoginRoundedIcon />}
                sx={{ py: 1.5, fontSize: 15, borderRadius: '12px' }}>
                {signingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            {/* Hint */}
            <Box sx={{ mt: 2.5, p: 1.5, borderRadius: '10px', background: alpha(theme.palette.primary.main, 0.07), border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block' }}>Default password for all staff:</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>SRM@1234</Typography>
            </Box>

          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default LoginPage;
