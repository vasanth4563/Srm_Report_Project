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

  // ── view: 'signin' | 'signup' | 'success'
  const [view, setView] = useState<'signin' | 'signup' | 'success'>('signin');

  // ── Users list state
  const [runtimeUsers, setRuntimeUsers] = useState<any[]>([]);

  // Fetch users from database on load
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
  }, [view]); // Refetch when view toggles (so new signups appear)

  // ── Sign-In state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loginEmail, setLoginEmail]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [signInError, setSignInError]   = useState('');
  const [signingIn, setSigningIn]       = useState(false);
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [nameSearchOpen, setNameSearchOpen]   = useState(false);

  // ── Sign-Up state
  const [form, setForm] = useState({
    title: 'Mr.', name: '', designation: '', institution: 'SRM Institute of Science and Technology',
    email: '', password: '', confirmPassword: '', branch: 'Ramapuram', mobile: '', role: 'user',
  });
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [signUpErrors, setSignUpErrors]     = useState<Record<string, string>>({});
  const [signingUp, setSigningUp]           = useState(false);

  // ── Sign-In handlers ────────────────────────────────────────────────────────
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

  // ── Sign-Up handlers ────────────────────────────────────────────────────────
  const validateSignUp = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())            e.name = 'Full name is required';
    if (!form.designation.trim())     e.designation = 'Designation is required';
    if (!form.email.trim())           e.email = 'Email/ID is required';
    else if (runtimeUsers.find((u) => u.email.toLowerCase() === form.email.toLowerCase()))
      e.email = 'This Email/ID is already registered';
    if (form.password.length < 6)     e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setSignUpErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateSignUp()) return;
    setSigningUp(true);
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        bodyData: {
          title: form.title,
          name: form.name,
          designation: form.designation,
          institution: form.institution || 'SRM Institute of Science and Technology',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          branch: form.branch,
          mobile: form.mobile,
          role: form.role
        }
      });
      setView('success');
    } catch (err: any) {
      setSignUpErrors({ email: err.message || 'Registration failed. Try again.' });
    } finally {
      setSigningUp(false);
    }
  };

  const upd = (field: string, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  // reset
  const resetSignUp = () => setForm({ title: 'Mr.', name: '', designation: '', institution: 'SRM Institute of Science and Technology', email: '', password: '', confirmPassword: '', branch: 'Ramapuram', mobile: '' });

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

      <Fade in timeout={500} key={view}>
        <Card sx={{
          width: { xs: '94%', sm: view === 'signup' ? 520 : 460 },
          position: 'relative', zIndex: 10,
          background: '#ffffff',
          border: '1px solid rgba(81, 40, 136, 0.12)',
          boxShadow: '0 16px 48px rgba(81, 40, 136, 0.08)',
          borderRadius: '24px',
          transition: 'width 0.3s ease',
        }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {/* ── Brand ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
              <Box sx={{ mb: 1.5, transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}>
                <BrandLogo size={58} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 22 } }}>SRM Group of Institutions</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, display: 'block', mt: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Chennai Ramapuram & Trichy
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                Dashboard Reports and Reviews
              </Typography>
            </Box>

            {/* ════════════════════════════════════
                SUCCESS VIEW
            ════════════════════════════════════ */}
            {view === 'success' && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2, filter: 'drop-shadow(0 4px 12px rgba(34,197,94,0.4))' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Account Created!</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  Your account has been registered successfully.<br />You can now sign in with your credentials.
                </Typography>
                <Button fullWidth variant="contained" startIcon={<LoginRoundedIcon />}
                  onClick={() => { setView('signin'); setForm({ title: 'Mr.', name: '', designation: '', institution: 'SRM Institute of Science and Technology', email: '', password: '', confirmPassword: '' }); }}
                  sx={{ py: 1.4, borderRadius: '12px', fontSize: 15 }}>
                  Go to Sign In
                </Button>
              </Box>
            )}

            {/* ════════════════════════════════════
                SIGN IN VIEW
            ════════════════════════════════════ */}
            {view === 'signin' && (
              <>
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
                        setLoginEmail('');
                        return;
                      }
                      const match = runtimeUsers.find(
                        (u) => u.name.toLowerCase().includes(newInputValue.toLowerCase()) || u.email.toLowerCase().includes(newInputValue.toLowerCase())
                      );
                      if (match) {
                        setLoginEmail(match.email);
                      } else {
                        setLoginEmail(newInputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Your Name" placeholder="Type your name..."
                        InputProps={{
                          ...params.InputProps,
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
                      <Box component="li" {...props} key={typeof option === 'object' ? option.id : option}
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: '10px !important' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{typeof option === 'object' ? `${option.title ? option.title + ' ' : ''}${option.name}` : option}</Typography>
                        {typeof option === 'object' && option.designation && (
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{option.designation}</Typography>
                        )}
                      </Box>
                    )}
                    noOptionsText="No matching staff found"
                  />

                  {/* Email / ID input (Auto-filled or typed) */}
                  <TextField fullWidth label="Email / Staff ID" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><EmailRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                    }}
                    placeholder="Type or select name above..."
                  />

                  {/* Password */}
                  <TextField fullWidth label="Password" type={showPwd ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
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
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                              {showPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
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

                <Divider sx={{ my: 2.5 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, px: 1 }}>OR</Typography>
                </Divider>

                {/* Sign Up CTA */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    New user? Create your account
                  </Typography>
                  <Button fullWidth variant="outlined" startIcon={<PersonAddRoundedIcon />}
                    onClick={() => { setView('signup'); setSignInError(''); }}
                    sx={{ py: 1.3, borderRadius: '12px', fontWeight: 600 }}>
                    Sign Up
                  </Button>
                </Box>
              </>
            )}

            {/* ════════════════════════════════════
                SIGN UP VIEW
            ════════════════════════════════════ */}
            {view === 'signup' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <IconButton size="small" onClick={() => setView('signin')} sx={{ color: theme.palette.text.secondary }}>
                    <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Account</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Fill in your details to register</Typography>
                  </Box>
                </Box>

                {Object.keys(signUpErrors).length > 0 && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                    Please fix the errors below.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Title + Name row */}
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <FormControl sx={{ minWidth: 90 }}>
                      <InputLabel>Title</InputLabel>
                      <Select value={form.title} label="Title" onChange={(e) => upd('title', e.target.value as string)}>
                        {['Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Prof.'].map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField fullWidth label="Full Name" placeholder="Your full name"
                      value={form.name} error={!!signUpErrors.name} helperText={signUpErrors.name}
                      onChange={(e) => upd('name', e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> }}
                    />
                  </Box>

                  {/* Designation */}
                  <TextField fullWidth label="Designation" placeholder="e.g. Finance Manager, HR Head"
                    value={form.designation} error={!!signUpErrors.designation} helperText={signUpErrors.designation}
                    onChange={(e) => upd('designation', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> }}
                  />

                  {/* Institution */}
                  <TextField fullWidth label="Institution / Unit"
                    value={form.institution}
                    onChange={(e) => upd('institution', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BusinessRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> }}
                  />

                  {/* Branch & Role row */}
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <FormControl fullWidth>
                      <InputLabel>Branch</InputLabel>
                      <Select value={form.branch} label="Branch" onChange={(e) => upd('branch', e.target.value as string)}
                        startAdornment={<InputAdornment position="start"><LocationOnRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20, ml: 0.5 }} /></InputAdornment>}>
                        <MenuItem value="Ramapuram">📍 Ramapuram</MenuItem>
                        <MenuItem value="Trichy">📍 Trichy</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Account Role</InputLabel>
                      <Select value={form.role} label="Account Role" onChange={(e) => upd('role', e.target.value as string)}>
                        <MenuItem value="user">👤 Staff User</MenuItem>
                        <MenuItem value="chairman">👑 Chairman</MenuItem>
                        <MenuItem value="admin">🛡️ System Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Mobile Number */}
                  <TextField fullWidth label="Mobile Number" placeholder="e.g. 98765 43210"
                    value={form.mobile}
                    onChange={(e) => upd('mobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    inputProps={{ maxLength: 10 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneAndroidRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> }}
                  />

                  {/* Email */}
                  <TextField fullWidth label="Email Address" placeholder="you@srmist.edu.in"
                    value={form.email} error={!!signUpErrors.email} helperText={signUpErrors.email}
                    onChange={(e) => upd('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> }}
                  />

                  {/* Password */}
                  <TextField fullWidth label="Password" type={showNewPwd ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password} error={!!signUpErrors.password} helperText={signUpErrors.password}
                    onChange={(e) => upd('password', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNewPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                            {showNewPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowNewPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                              {showNewPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />

                  {/* Confirm Password */}
                  <TextField fullWidth label="Confirm Password" type={showConfirmPwd ? 'text' : 'password'}
                    value={form.confirmPassword} error={!!signUpErrors.confirmPassword} helperText={signUpErrors.confirmPassword}
                    onChange={(e) => upd('confirmPassword', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                            {showConfirmPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPwd((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                              {showConfirmPwd ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />

                  <Button fullWidth variant="contained" size="large" onClick={handleSignUp} disabled={signingUp}
                    startIcon={signingUp ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <PersonAddRoundedIcon />}
                    sx={{ py: 1.5, fontSize: 15, borderRadius: '12px', background: 'linear-gradient(135deg,#06b6d4,#6366f1)', '&:hover': { background: 'linear-gradient(135deg,#0891b2,#4f46e5)' } }}>
                    {signingUp ? 'Creating account...' : 'Create Account'}
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Already have an account?{' '}
                      <Typography component="span" variant="body2"
                        onClick={() => setView('signin')}
                        sx={{ color: theme.palette.primary.main, fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        Sign In
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default LoginPage;
