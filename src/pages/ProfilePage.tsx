import React from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Grid, Divider,
  Chip, alpha, useTheme, Fade,
} from '@mui/material';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // Deep Purple & Light Blue Palette:
  const infoCards = [
    { icon: <BadgeRoundedIcon />,          label: 'Employee ID',       value: user?.id,                         color: '#4c248b' },
    { icon: <PersonRoundedIcon />,         label: 'Full Name',         value: `${user?.title ?? ''} ${user?.name ?? ''}`.trim(), color: '#0284c7' },
    { icon: <WorkRoundedIcon />,           label: 'Designation',       value: user?.designation,                color: '#38bdf8' },
    { icon: <BusinessRoundedIcon />,       label: 'Institution / Unit',value: user?.institution,               color: '#4c248b' },
    { icon: <LocationOnRoundedIcon />,     label: 'Branch',            value: user?.branch || '—',             color: '#0284c7' },
    { icon: <EmailRoundedIcon />,          label: 'Email',             value: user?.email,                     color: '#38bdf8' },
    { icon: <PhoneAndroidRoundedIcon />,   label: 'Mobile Number',     value: user?.mobile || '—',             color: '#4c248b' },
    { icon: <CheckCircleRoundedIcon />,    label: 'Status',            value: 'Active',                       color: '#0284c7' },
  ];

  return (
    <Layout pageTitle="Profile">
      <Fade in timeout={500}>
        <Box>
          {/* ── Banner + Avatar ── */}
          <Card sx={{ mb: 3, borderRadius: '20px', overflow: 'hidden' }}>
            <Box sx={{
              height: 150,
              background: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
              position: 'relative',
            }}>
              {[{ size: 130, top: -35, right: 60 }, { size: 90, top: 25, right: 210 }].map((c, i) => (
                <Box key={i} sx={{ position: 'absolute', width: c.size, height: c.size, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', top: c.top, right: c.right }} />
              ))}
              {/* Branch badge top-right */}
              {user?.branch && (
                <Chip
                  icon={<LocationOnRoundedIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                  label={user.branch}
                  size="small"
                  sx={{ position: 'absolute', top: 16, right: 20, background: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              )}
            </Box>

            <CardContent sx={{ pt: 0, px: { xs: 2.5, sm: 3.5 }, pb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: '-44px', mb: 2.5, flexWrap: 'wrap' }}>
                <Avatar sx={{
                  width: 90, height: 90, fontSize: 30, fontWeight: 800,
                  background: 'linear-gradient(135deg, #4c248b 0%, #38bdf8 100%)',
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 8px 24px rgba(76, 36, 139, 0.35)',
                }}>
                  {user?.avatar}
                </Avatar>
                <Box sx={{ pb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {user?.title} {user?.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {user?.designation} · {user?.institution}
                  </Typography>
                  {user?.mobile && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <PhoneAndroidRoundedIcon sx={{ fontSize: 13 }} /> {user.mobile}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Active" color="success" size="small" sx={{ fontWeight: 700 }} />
                  {user?.branch && (
                    <Chip
                      icon={<LocationOnRoundedIcon sx={{ fontSize: '14px !important' }} />}
                      label={user.branch}
                      size="small"
                      sx={{ fontWeight: 700, background: alpha('#0284c7', 0.12), color: '#0284c7' }}
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* ── Info Grid ── */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                Profile Details
              </Typography>
              <Grid container spacing={2.5}>
                {infoCards.map((info) => (
                  <Grid item xs={12} sm={6} md={4} key={info.label}>
                    <Box sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1.5,
                      p: 2, borderRadius: '14px',
                      background: alpha(info.color, 0.06),
                      border: `1px solid ${alpha(info.color, 0.12)}`,
                      transition: 'all 0.2s',
                      '&:hover': { background: alpha(info.color, 0.1), transform: 'translateY(-1px)' },
                    }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: alpha(info.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, flexShrink: 0 }}>
                        {info.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10 }}>
                          {info.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', color: theme.palette.text.primary }}>
                          {info.value || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* ── Contact Card ── */}
          {(user?.mobile || user?.email) && (
            <Card sx={{ borderRadius: '20px' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Contact Information</Typography>
                <Grid container spacing={2.5}>
                  {user?.email && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '14px', background: alpha('#f59e0b', 0.07), border: `1px solid ${alpha('#f59e0b', 0.15)}` }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: alpha('#f59e0b', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                          <EmailRoundedIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10, display: 'block' }}>Email</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {user?.mobile && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '14px', background: alpha('#ef4444', 0.07), border: `1px solid ${alpha('#ef4444', 0.15)}` }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: alpha('#ef4444', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <PhoneAndroidRoundedIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10, display: 'block' }}>Mobile</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.mobile}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '14px', background: alpha('#FA8833', 0.07), border: `1px solid ${alpha('#FA8833', 0.15)}` }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: alpha('#FA8833', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FA8833' }}>
                        <LocationOnRoundedIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10, display: 'block' }}>Branch</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.branch || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      </Fade>
    </Layout>
  );
};

export default ProfilePage;
