import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar,
  useTheme, alpha, Fade, Chip, Menu, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  CircularProgress, Tab, Tabs, LinearProgress, Select, FormControl, InputLabel
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Switch, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../utils/api.ts';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const branchColor = user?.branch === 'Trichy' ? '#06b6d4' : '#6366f1';

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<any | null>(null);

  // Users data state for admin table
  const [userRows, setUserRows] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [branchFilter, setBranchFilter] = useState('All');

  // Dynamic statistics state
  const [reports, setReports] = useState<any[]>([]);

  // API Keys & Integrations state
  const [apiKey, setApiKey] = useState('srm_live_9a8b7c6d5e4f3a2b1c8d');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [integrations, setIntegrations] = useState([
    { id: 'srm_sync', name: 'SRM Central Data Sync', desc: 'Real-time synchronization with institutional portal', connected: true, icon: '🔄', status: 'Live · 2 mins ago' },
    { id: 'email_notif', name: 'Automated Email Dispatcher', desc: 'Send daily summary and weekly reports to HOD/Dean', connected: true, icon: '📧', status: 'Active · Daily 5 PM' },
    { id: 'teams_webhook', name: 'Teams & Slack Integration', desc: 'Push notifications for pending report deadlines', connected: true, icon: '💬', status: 'Connected' },
    { id: 'rest_api', name: 'Export & Analytics REST API', desc: 'Access raw report JSON & CSV data feeds', connected: true, icon: '⚡', status: 'Active · v2.4 API' },
  ]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(`srm_live_${randomHex}`);
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => item.id === id ? { ...item, connected: !item.connected } : item));
  };

  // Fetch user stats reports directly from backend API
  useEffect(() => {
    const fetchStatsData = async () => {
      if (!user) return;
      try {
        const data = await apiRequest<any[]>('/api/reports');
        setReports(data || []);
      } catch (err) {
        console.error('Failed to load user reports for statistics:', err);
      }
    };
    fetchStatsData();
  }, [user]);

  // Compute stats metrics dynamically from backend API data
  const totalReportsCount = reports.length;
  const completedCount = reports.filter((r) => r.completed).length;
  const pendingCount = reports.filter((r) => !r.completed).length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeekCount = reports.filter((r) => new Date(r.date) >= sevenDaysAgo).length;

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let workingDaysElapsed = 0;
  for (let d = new Date(currentMonthStart); d <= today; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysElapsed++;
    }
  }
  const submittedDatesThisMonth = new Set(
    reports
      .filter((r) => new Date(r.date) >= currentMonthStart)
      .map((r) => new Date(r.date).toISOString().split('T')[0])
  );
  const missingReportsCount = Math.max(0, workingDaysElapsed - submittedDatesThisMonth.size);

  const statConfig = [
    { label: 'Total Reports', value: totalReportsCount, change: 'All-time entries', trendColor: '#4c248b', icon: DescriptionRoundedIcon, gradient: 'linear-gradient(135deg, #4c248b, #7c53c3)' },
    { label: 'This Week', value: thisWeekCount, change: 'Recent 7 days', trendColor: '#0284c7', icon: TodayRoundedIcon, gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
    { label: 'Completed', value: completedCount, change: 'Completed', trendColor: '#10b981', icon: VerifiedRoundedIcon, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { label: 'Pending Review', value: pendingCount, change: 'In Progress', trendColor: '#f59e0b', icon: PendingActionsRoundedIcon, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { label: 'Missing Reports', value: missingReportsCount, change: missingReportsCount > 0 ? 'Action Required' : 'Up to Date', trendColor: missingReportsCount > 0 ? '#ef4444' : '#10b981', icon: WarningAmberRoundedIcon, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  ];

  // Dialog and view details state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('daily');
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Fetch admin table data on mount or user shift
  const fetchAdminTracker = async () => {
    if (user?.role !== 'admin' && user?.role !== 'chairman') return;
    setLoadingUsers(true);
    try {
      const usersData = await apiRequest<any[]>('/api/admin/users');
      setUserRows(usersData);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminTracker();
  }, [user]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(row);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectReport = async (type: string, targetUser?: any) => {
    const userToFetch = targetUser || menuUser;
    if (!userToFetch) return;
    setSelectedReportType(type);
    setReportDialogOpen(true);
    setDialogLoading(true);
    handleCloseMenu();

    // Map report types to routes
    const endpointMap: Record<string, string> = {
      daily: `/api/reports?user_id=${userToFetch.id}`,
      goals: `/api/goals?user_id=${userToFetch.id}`,
      acc: `/api/accomplishments?user_id=${userToFetch.id}`,
      pending: `/api/pending?user_id=${userToFetch.id}`,
      weekly: `/api/weekly?user_id=${userToFetch.id}`,
    };

    try {
      const data = await apiRequest<any[]>(endpointMap[type]);
      setDialogData(data);
    } catch (err) {
      console.error(`Failed to fetch ${type} reports:`, err);
      setDialogData([]);
    } finally {
      setDialogLoading(false);
    }
  };

  const userColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.4, minWidth: 60 },
    {
      field: 'name', headerName: 'Full Name', flex: 1.2, minWidth: 160,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <Avatar sx={{
            width: 26, height: 26, fontSize: 10, fontWeight: 700,
            bgcolor: user?.role === 'chairman' ? '#b45309' : theme.palette.primary.main,
          }}>
            {p.row.name.replace(/Dr\.|Mr\.|Ms\.|Mrs\.|Prof\./, '').trim().substring(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.row.title ? `${p.row.title} ` : ''}{p.value}
          </Typography>
        </Box>
      )
    },
    { field: 'mobile', headerName: 'Mobile', flex: 0.8, minWidth: 110 },
    { field: 'designation', headerName: 'Designation', flex: 1.1, minWidth: 140 },
    {
      field: 'progressPct', headerName: 'Overall Progress', flex: 0.9, minWidth: 130, align: 'center', headerAlign: 'center',
      renderCell: (p) => {
        const val = p.value || 0;
        return (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{
                fontWeight: 800,
                color: val >= 80 ? '#10b981' : val >= 50 ? (user?.role === 'chairman' ? '#d97706' : '#6366f1') : '#f59e0b',
                fontSize: 11
              }}>
                {val}%
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 10, color: theme.palette.text.secondary }}>
                {p.row.doneReports}/{p.row.totalReports}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(val, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: val >= 80
                    ? 'linear-gradient(90deg,#10b981,#059669)'
                    : val >= 50
                    ? (user?.role === 'chairman' ? 'linear-gradient(90deg,#d97706,#b45309)' : 'linear-gradient(90deg,#6366f1,#4f46e5)')
                    : 'linear-gradient(90deg,#f59e0b,#d97706)',
                }
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'totalReports', headerName: 'Total', flex: 0.4, minWidth: 60, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{p.value}</Typography>
      )
    },
    {
      field: 'doneReports', headerName: 'Done', flex: 0.4, minWidth: 60, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 700, fontSize: 11 }} />
      )
    },
    {
      field: 'pendingReports', headerName: 'Pending', flex: 0.4, minWidth: 60, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 700, fontSize: 11 }} />
      )
    },
    {
      field: 'actions', headerName: 'Actions', flex: 0.6, minWidth: 90, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Button variant="contained" size="small"
          onClick={() => { setMenuUser(p.row); handleSelectReport('daily', p.row); }}
          sx={{
            borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.5, px: 1.5,
            background: user?.role === 'chairman'
              ? 'linear-gradient(135deg,#d97706,#b45309)'
              : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          }}>
          View Data
        </Button>
      )
    },
  ];

  const gridSx = {
    border: 'none',
    '& .MuiDataGrid-columnHeaders': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', borderBottom: `1px solid ${theme.palette.divider}` },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    '& .MuiDataGrid-row:hover': { background: alpha(theme.palette.primary.main, 0.04) },
    '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}`, alignItems: 'center', display: 'flex' },
    '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'center' },
  };

  const renderDialogContent = () => {
    if (dialogLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (dialogData.length === 0) {
      return (
        <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
          No records found.
        </Typography>
      );
    }

    switch (selectedReportType) {
      case 'daily':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(99,102,241,0.08)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sl.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Report Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={row.area} size="small" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell sx={{ minWidth: 280 }}>{row.report}</TableCell>
                    <TableCell align="center">
                      {row.completed ? <CheckCircleRoundedIcon sx={{ color: '#22c55e' }} /> : <ErrorOutlineRoundedIcon sx={{ color: '#ef4444' }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'goals':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(251,191,36,0.08)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sl. No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Work</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Responsible Person</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 800, color: '#fbbf24' }}>Sl. No. {String(row.day).padStart(3, '0')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                    <TableCell>{row.goal}</TableCell>
                    <TableCell>
                      <Chip label={row.responsible_person || 'Self'} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={row.completed ? 'Completed' : 'Pending'} size="small" color={row.completed ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: 10 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'acc':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(16,185,129,0.08)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sl.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Work Completed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={row.area} size="small" color="secondary" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell>{row.work}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date_start}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date_end}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.completed ? 'Completed' : 'Pending'} size="small" color={row.completed ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: 10 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'pending':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(245,158,11,0.08)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sl.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Areas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Particulars</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Responsible</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Timeline</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={row.areas} size="small" color="warning" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell>{row.particulars}</TableCell>
                    <TableCell>{row.responsible_person || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date_start} to {row.date_end || '—'}</TableCell>
                    <TableCell>{row.remarks || '—'}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.completed ? 'Completed' : 'Pending'} size="small" color={row.completed ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: 10 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'weekly':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(6,182,212,0.08)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sl.No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Planned Work</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Responsible Person</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                    <TableCell>{row.work}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={row.responsible_person || 'Self'} size="small" color="info" sx={{ fontSize: 11 }} /></TableCell>
                    <TableCell align="center">
                      <Chip label={row.completed ? 'Completed' : 'Pending'} size="small" color={row.completed ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: 10 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    if (!menuUser) return '';
    const labelMap: Record<string, string> = {
      daily: 'Daily Reports',
      goals: '100 Days Goals',
      acc: 'Accomplishment Report',
      pending: 'Pending & Priority Work',
      weekly: 'Weekly Plans',
    };
    return `${menuUser.name} - ${labelMap[selectedReportType] || ''}`;
  };

  return (
    <Layout pageTitle="Dashboard">
      <Fade in timeout={500}>
        <Box>
          {/* ═══════════════════════════════════════════════
              CHAIRMAN — EXECUTIVE DESIGN
          ═══════════════════════════════════════════════ */}
          {user?.role === 'chairman' && (
            <>
              {/* Executive Split Banner */}
              <Card sx={{
                mb: 3, borderRadius: '24px', overflow: 'hidden',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg,rgba(81,40,136,0.15) 0%,rgba(142,111,192,0.08) 100%)'
                  : 'linear-gradient(135deg,rgba(81,40,136,0.06) 0%,rgba(250,136,51,0.04) 100%)',
                border: `1.5px solid ${alpha('#512888', 0.18)}`,
                boxShadow: '0 4px 24px rgba(81,40,136,0.08)',
              }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                  {/* Left — Gradient identity panel */}
                  <Box sx={{
                    p: { xs: 3, sm: 4 }, flex: '0 0 auto',
                    background: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    minWidth: { md: 220 }, position: 'relative', overflow: 'hidden',
                  }}>
                    {[120, 80, 50].map((s, i) => (
                      <Box key={i} sx={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', top: i * 30 - 20, right: i * 40 - 30, opacity: 0.3 }} />
                    ))}
                    <Avatar sx={{ width: 72, height: 72, fontSize: 28, fontWeight: 800, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', mb: 1.5 }}>
                      {user?.avatar}
                    </Avatar>
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 18, sm: 20 }, textAlign: 'center' }}>
                      {user?.name}
                    </Typography>
                    <Chip label="👑 Chairman" size="small" sx={{
                      mt: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 11,
                      border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)',
                    }} />
                  </Box>
                  {/* Right — Details & quick info */}
                  <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: 18, sm: 22 } }}>
                      Welcome back! 👑
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2.5 }}>
                      Your institutional overview and staff performance at a glance.
                    </Typography>
                    {/* Inline employee details as horizontal pills */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {[
                        { icon: <WorkRoundedIcon sx={{ fontSize: 15 }} />, text: user?.designation, color: '#4c248b' },
                        { icon: <BusinessRoundedIcon sx={{ fontSize: 15 }} />, text: user?.institution, color: '#0284c7' },
                        { icon: <PhoneAndroidRoundedIcon sx={{ fontSize: 15 }} />, text: user?.mobile, color: '#38bdf8' },
                      ].map((item, i) => (
                        <Box key={i} sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75,
                          px: 1.5, py: 0.75, borderRadius: '10px',
                          background: alpha(item.color, theme.palette.mode === 'dark' ? 0.12 : 0.06),
                          border: `1px solid ${alpha(item.color, 0.18)}`,
                        }}>
                          <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 12 }}>{item.text || '—'}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Card>

            </>
          )}

          {/* ═══════════════════════════════════════════════
              ADMIN — CLEAN COMMAND CENTER DESIGN
          ═══════════════════════════════════════════════ */}
          {user?.role === 'admin' && (
            <>
              {/* Compact Admin Banner */}
              <Box sx={{
                mb: 3, borderRadius: '20px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
                boxShadow: '0 8px 32px rgba(76,36,139,0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'stretch', flexDirection: { xs: 'column', sm: 'row' } }}>
                  {/* Left greeting */}
                  <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '16px', background: 'rgba(165,180,252,0.2)',
                      border: '2px solid rgba(165,180,252,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                    }}>🛡️</Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 17, sm: 20 } }}>
                        Admin Control Panel
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(199,210,254,0.8)', display: 'block' }}>
                        {user?.name} — {user?.designation}
                      </Typography>
                    </Box>
                  </Box>
                  {/* Right — Quick info badges on the banner itself */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: { xs: 2.5, sm: 3 }, py: { xs: 1.5, sm: 0 },
                    flexWrap: 'wrap', borderLeft: { sm: '1px solid rgba(165,180,252,0.15)' },
                  }}>
                    {[
                      { icon: <BusinessRoundedIcon sx={{ fontSize: 14 }} />, text: user?.institution },
                      { icon: <PhoneAndroidRoundedIcon sx={{ fontSize: 14 }} />, text: user?.mobile },
                    ].map((b, i) => (
                      <Box key={i} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5,
                        borderRadius: '8px', background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                      }}>
                        <Box sx={{ color: 'rgba(199,210,254,0.9)', display: 'flex' }}>{b.icon}</Box>
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>{b.text || '—'}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

            </>
          )}

          {/* ═══════════════════════════════════════════════
              STAFF USER — ORIGINAL DESIGN (unchanged)
          ═══════════════════════════════════════════════ */}
          {user?.role === 'user' && (
            <>
              {/* Welcome banner */}
              <Box sx={{
                mb: 3, p: { xs: 2.5, sm: 3.5 }, borderRadius: '20px',
                background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#06b6d4 100%)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
              }}>
                {[{ size: 160, top: -40, right: 40 }, { size: 100, top: 20, right: 180 }, { size: 80, bottom: -20, right: 100 }].map((c, i) => (
                  <Box key={i} sx={{
                    position: 'absolute', width: c.size, height: c.size,
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)',
                    top: c.top, right: c.right, bottom: (c as any).bottom, opacity: 0.15,
                  }} />
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, fontSize: 20, fontWeight: 800, background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}>
                    {user?.avatar}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 0.25, fontSize: { xs: 18, sm: 22 } }}>
                      Good morning, {user?.name?.split(' ')[0]}! 🌟
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Here's what's happening with your reports today.
                    </Typography>
                  </Box>
                  {user?.branch && (
                    <Chip
                      icon={<LocationOnRoundedIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                      label={user.branch} size="small"
                      sx={{ flexShrink: 0, background: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)', fontSize: 12 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Employee Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1.5, color: theme.palette.text.secondary, fontWeight: 600 }}>Employee Details</Typography>
                <Grid container spacing={2} columns={{ xs: 1, sm: 2, md: 4 }}>
                  {[
                    { icon: <BadgeRoundedIcon />, label: 'Name & Designation', value: user?.designation ? `${user?.name} — ${user?.designation}` : user?.name, color: '#6366f1' },
                    { icon: <BusinessRoundedIcon />, label: 'Institution / Unit', value: user?.institution, color: '#10b981' },
                    { icon: <LocationOnRoundedIcon />, label: 'Branch', value: user?.branch || '—', color: branchColor },
                    { icon: <PhoneAndroidRoundedIcon />, label: 'Mobile Number', value: user?.mobile || '—', color: '#ef4444' },
                  ].map((info) => (
                    <Grid item xs={1} sm={1} md={1} key={info.label} sx={{ display: 'flex' }}>
                      <Card sx={{
                        width: '100%', height: '100%', borderRadius: '16px',
                        border: `1px solid ${alpha(info.color, 0.2)}`,
                        background: alpha(info.color, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                        display: 'flex', flexDirection: 'column',
                      }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '16px !important', width: '100%', flex: 1 }}>
                          <Box sx={{ width: 42, height: 42, borderRadius: '12px', background: alpha(info.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, flexShrink: 0 }}>
                            {info.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block' }}>{info.label}</Typography>
                            <Typography variant="body2" title={info.value || ''} sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.value || '—'}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Stats Overview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1.5, color: theme.palette.text.secondary, fontWeight: 600 }}>Statistics Overview</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2 }}>
                  {statConfig.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Box key={stat.label} sx={{
                        gridColumn: index === 4 ? { xs: '1 / -1', sm: 'span 1' } : 'span 1',
                        display: 'flex', justifyContent: index === 4 ? { xs: 'center', sm: 'stretch' } : 'stretch',
                      }}>
                        <Card sx={{
                          borderRadius: '18px', overflow: 'hidden', position: 'relative',
                          display: 'flex', flexDirection: 'column',
                          width: index === 4 ? { xs: 'calc(50% - 8px)', sm: '100%' } : '100%',
                          minHeight: { xs: 140, sm: 170 },
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(99,102,241,0.2)' },
                          transition: 'all 0.3s',
                        }}>
                          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.gradient }} />
                          <CardContent sx={{ p: { xs: '12px !important', sm: '16px !important' }, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <Box>
                              <Box sx={{ width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 }, borderRadius: '12px', background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', mb: 1, '& svg': { fontSize: { xs: 18, sm: 20 } } }}>
                                <IconComponent />
                              </Box>
                              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>{stat.value}</Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, display: 'block', minHeight: { xs: 26, sm: 30 }, lineHeight: 1.2, fontSize: { xs: 11, sm: 12 } }}>
                                {stat.label}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
                              {stat.label === 'Missing Reports' && stat.value > 0
                                ? <TrendingDownRoundedIcon sx={{ fontSize: 13, color: stat.trendColor }} />
                                : <TrendingUpRoundedIcon sx={{ fontSize: 13, color: stat.trendColor }} />}
                              <Typography variant="caption" sx={{ color: stat.trendColor, fontWeight: 600, fontSize: { xs: 10, sm: 11 } }}>{stat.change}</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

            </>
          )}

          {/* Executive Overview & Chairman Table */}
          {(user?.role === 'admin' || user?.role === 'chairman') && (
            <Box sx={{ mb: 3 }}>
              {/* User Details & Progress Table */}
              <Card sx={{
                borderRadius: '20px',
                border: user?.role === 'chairman'
                  ? `1.5px solid ${alpha('#FA8833', 0.3)}`
                  : `1.5px solid ${alpha('#4338ca', 0.25)}`,
                overflow: 'hidden',
              }}>
                {/* Top accent bar */}
                <Box sx={{
                  height: 4,
                  background: user?.role === 'chairman'
                    ? 'linear-gradient(90deg, #FA8833, #CE4200, #512888)'
                    : 'linear-gradient(90deg, #312e81, #4338ca, #6366f1)',
                }} />
                <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: user?.role === 'chairman'
                      ? 'linear-gradient(135deg, #512888, #FA8833)'
                      : 'linear-gradient(135deg, #312e81, #4338ca)',
                    color: '#fff', fontSize: 20,
                  }}>
                    {user?.role === 'chairman' ? '👑' : <PeopleAltRoundedIcon sx={{ fontSize: 20 }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: user?.role === 'chairman' ? '#512888' : '#4338ca' }}>
                      {user?.role === 'chairman' ? 'Staff Performance & Overall Progress' : 'Employee Reports Tracker'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Displaying {branchFilter === 'All' ? 'all' : branchFilter} {userRows.filter(r => {
                        if (r.role === 'chairman' || r.name.includes('Chairman')) return false;
                        if (branchFilter !== 'All' && r.branch !== branchFilter) return false;
                        return true;
                      }).length} staff users
                    </Typography>
                  </Box>
                  {/* Branch Filter — Chairman */}
                  {user?.role === 'chairman' && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel sx={{ fontWeight: 600, fontSize: 13 }}>Branch</InputLabel>
                      <Select
                        value={branchFilter}
                        label="Branch"
                        onChange={(e) => setBranchFilter(e.target.value)}
                        sx={{
                          borderRadius: '12px', fontWeight: 600, fontSize: 13,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FA8833', 0.3) },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FA8833' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#CE4200' },
                        }}
                      >
                        <MenuItem value="All">🏢 All Branches</MenuItem>
                        <MenuItem value="Ramapuram">📍 Ramapuram</MenuItem>
                        <MenuItem value="Trichy">📍 Trichy</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
                <Box sx={{ borderRadius: '0 0 20px 20px' }}>
                  <Box sx={{ width: '100%' }}>
                    {loadingUsers ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <CircularProgress sx={{ color: user?.role === 'chairman' ? '#f59e0b' : '#6366f1' }} />
                      </Box>
                    ) : (
                      <DataGrid
                        rows={userRows.filter(r => {
                          if (r.role === 'chairman' || r.name.includes('Chairman')) return false;
                          if (branchFilter !== 'All' && r.branch !== branchFilter) return false;
                          return true;
                        })}
                        columns={userColumns}
                        autoHeight
                        pageSizeOptions={[5, 10, 20]}
                        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                        disableRowSelectionOnClick
                        disableColumnMenu={false}
                        sx={{
                          ...gridSx,
                          border: 'none',
                          '& .MuiDataGrid-columnHeaders': {
                            fontSize: 12,
                            background: user?.role === 'chairman'
                              ? (theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)')
                              : (theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'),
                            borderBottom: `2px solid ${user?.role === 'chairman' ? alpha('#f59e0b', 0.3) : alpha('#6366f1', 0.2)}`,
                          },
                          '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5,
                            color: user?.role === 'chairman' ? '#b45309' : '#4f46e5',
                          },
                          '& .MuiDataGrid-row:hover': {
                            background: user?.role === 'chairman'
                              ? alpha('#f59e0b', 0.04)
                              : alpha('#6366f1', 0.04),
                          },
                          '& .MuiDataGrid-cell': { fontSize: 12, borderBottom: `1px solid ${theme.palette.divider}` },
                          '& .MuiDataGrid-footerContainer': {
                            borderTop: `1px solid ${theme.palette.divider}`,
                            justifyContent: 'center',
                            background: user?.role === 'chairman'
                              ? alpha('#f59e0b', 0.03)
                              : alpha('#6366f1', 0.02),
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Card>
            </Box>
          )}

          {/* More actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleSelectReport('daily')}>View Daily Reports</MenuItem>
            <MenuItem onClick={() => handleSelectReport('goals')}>View 100 Days Goals</MenuItem>
            <MenuItem onClick={() => handleSelectReport('acc')}>View Accomplishments</MenuItem>
            <MenuItem onClick={() => handleSelectReport('pending')}>View Pending Work</MenuItem>
            <MenuItem onClick={() => handleSelectReport('weekly')}>View Weekly Plans</MenuItem>
          </Menu>

          {/* User Report viewer Dialog */}
          <Dialog
            open={reportDialogOpen}
            onClose={() => setReportDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: user?.role === 'chairman' ? 2 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: user?.role === 'chairman' ? 0 : 1.5 }}>
                <PeopleAltRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {menuUser ? `${menuUser.name} (${menuUser.designation}) ${user?.role === 'chairman' ? '— Executive Progress Overview' : ''}` : 'User Performance Summary'}
                </Typography>
              </Box>
              {user?.role !== 'chairman' && (
                <Tabs
                  value={selectedReportType}
                  onChange={(_, val) => handleSelectReport(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none', py: 1 } }}
                >
                  <Tab label="Daily Reports" value="daily" />
                  <Tab label="100 Days Goals" value="goals" />
                  <Tab label="Accomplishments" value="acc" />
                  <Tab label="Pending Work" value="pending" />
                  <Tab label="Weekly Plans" value="weekly" />
                </Tabs>
              )}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {menuUser && (
                <Card sx={{ mb: user?.role === 'chairman' ? 0 : 3, p: 2.5, borderRadius: '16px', background: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Individual Staff Overall Progress</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Computed across all 5 report module tables for {menuUser.name} ({menuUser.designation})
                      </Typography>
                    </Box>
                    <Chip
                      label={`${menuUser.progressPct || 0}% Overall Progress (${menuUser.doneReports}/${menuUser.totalReports} Done)`}
                      color={menuUser.progressPct >= 75 ? 'success' : 'warning'}
                      sx={{ fontWeight: 800, fontSize: 12 }}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(menuUser.progressPct || 0, 100)}
                    sx={{
                      height: 8, borderRadius: 4, mb: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #10b981, #6366f1)' }
                    }}
                  />

                  {/* Category Breakdown */}
                  {menuUser.moduleBreakdown && (
                    <Grid container spacing={1.5}>
                      {[
                        { label: 'Daily Reports', key: 'daily', color: '#6366f1' },
                        { label: '100 Days Goals', key: 'goals', color: '#06b6d4' },
                        { label: 'Accomplishments', key: 'acc', color: '#10b981' },
                        { label: 'Pending Work', key: 'pending', color: '#ef4444' },
                        { label: 'Weekly Plans', key: 'weekly', color: '#8b5cf6' },
                      ].map((m) => {
                        const stats = menuUser.moduleBreakdown?.[m.key] || { done: 0, total: 0, pct: 0 };
                        return (
                          <Grid item xs={6} sm={2.4} key={m.key}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(m.color, 0.08), border: `1px solid ${alpha(m.color, 0.2)}`, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: m.color, fontSize: 11 }}>{m.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 13, my: 0.25 }}>{stats.pct}%</Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: 10 }}>{stats.done}/{stats.total} Done</Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Card>
              )}

              {user?.role !== 'chairman' && renderDialogContent()}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="contained" onClick={() => setReportDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Fade>
    </Layout>
  );
};

export default DashboardPage;
