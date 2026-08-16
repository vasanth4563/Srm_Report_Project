import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Switch, Divider,
  Slider, alpha, useTheme, Fade, Chip, Button, Grid,
} from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useColorMode } from '../context/ThemeContext.tsx';
import Layout from '../components/Layout.tsx';

const notifSettings = [
  { label: 'Email Notifications', desc: 'Receive report reminders via email', key: 'email' },
  { label: 'Push Notifications', desc: 'Browser push alerts for deadlines', key: 'push' },
  { label: 'Weekly Summary', desc: 'Get a weekly digest every Monday', key: 'weekly' },
];

const privacySettings = [
  { label: 'Two-Factor Authentication', desc: 'Add an extra layer of account security', key: '2fa' },
  { label: 'Activity Logs', desc: 'Log all user activity and access history', key: 'activity' },
];

import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { TextField, InputAdornment, IconButton, Alert, Snackbar } from '@mui/material';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const [switches, setSwitches] = useState<Record<string, boolean>>({ email: true, push: false, weekly: true, '2fa': false, activity: true });
  const [fontSize, setFontSize] = useState(14);
  const toggle = (key: string) => setSwitches((p) => ({ ...p, [key]: !p[key] }));

  // Password fields state
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirmPwd: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ open: false, text: '', severity: 'success' as 'success' | 'error' });

  const SectionCard: React.FC<{ icon: React.ReactNode; title: string; color: string; children: React.ReactNode }> = ({ icon, title, color, children }) => (
    <Card sx={{ mb: 2.5, borderRadius: '20px', border: `1px solid ${alpha(color, 0.15)}` }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Layout pageTitle="Settings">
      <Fade in timeout={500}>
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Settings</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Manage your preferences, notifications, and account security.</Typography>
          </Box>

          <SectionCard icon={<DarkModeRoundedIcon />} title="Appearance" color="#4c248b">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Dark Mode</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Switch between light and dark interface</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={mode === 'dark' ? 'Dark' : 'Light'} size="small" sx={{ background: alpha('#4c248b', 0.1), color: '#4c248b', fontWeight: 600 }} />
                <Switch checked={mode === 'dark'} onChange={toggleColorMode} color="primary" />
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Font Size: {fontSize}px</Typography>
              <Slider value={fontSize} min={12} max={20} step={1} marks onChange={(_, v) => setFontSize(v as number)} sx={{ color: '#4c248b' }} />
            </Box>
          </SectionCard>

          <SectionCard icon={<NotificationsRoundedIcon />} title="Notifications" color="#0284c7">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notifSettings.map((s, i) => (
                <React.Fragment key={s.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{s.desc}</Typography>
                    </Box>
                    <Switch checked={switches[s.key]} onChange={() => toggle(s.key)} color="primary" />
                  </Box>
                  {i < notifSettings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          </SectionCard>

          <SectionCard icon={<SecurityRoundedIcon />} title="Security & Privacy" color="#38bdf8">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {privacySettings.map((s, i) => (
                <React.Fragment key={s.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{s.desc}</Typography>
                    </Box>
                    <Switch checked={switches[s.key]} onChange={() => toggle(s.key)} color="primary" />
                  </Box>
                  {i < privacySettings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
              Change Password
            </Typography>
             <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Current Password" type={showCurrent ? 'text' : 'password'}
                  value={pwdForm.current} onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowCurrent((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                            {showCurrent ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="New Password" type={showNew ? 'text' : 'password'}
                  value={pwdForm.newPwd} onChange={(e) => setPwdForm((p) => ({ ...p, newPwd: e.target.value }))}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><KeyRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNew((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                            {showNew ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Confirm New Password" type={showConfirm ? 'text' : 'password'}
                  value={pwdForm.confirmPwd} onChange={(e) => setPwdForm((p) => ({ ...p, confirmPwd: e.target.value }))}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><KeyRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: theme.palette.text.secondary }}>
                            {showConfirm ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard icon={<LanguageRoundedIcon />} title="Language & Region" color="#f59e0b">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Language</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>English (India)</Typography>
              </Box>
              <Chip label="EN-IN" size="small" sx={{ fontWeight: 700 }} />
            </Box>
          </SectionCard>

          <Button variant="contained" size="large" startIcon={<SaveRoundedIcon />} sx={{ px: 4 }}>Save Changes</Button>
          <Snackbar open={pwdMsg.open} autoHideDuration={3000} onClose={() => setPwdMsg((p) => ({ ...p, open: false }))}>
            <Alert severity={pwdMsg.severity}>{pwdMsg.text}</Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Layout>
  );
};

export default SettingsPage;
