import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar,
  useTheme, alpha, Fade, Chip, Menu, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  CircularProgress, Tab, Tabs, LinearProgress, Select, FormControl, InputLabel,
  TextField, InputAdornment, Badge, Alert
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded';
import { Switch, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../utils/api.ts';

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

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
  // Helper to format ISO date to readable string (e.g. 11 Aug 2026)
  const formatFmtDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  const getPreviousWorkingDayStr = (todayDate: Date): string => {
    const day = todayDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const prev = new Date(todayDate);
    if (day === 1) {
      // Monday -> previous working day is Friday (subtract 3 days)
      prev.setDate(todayDate.getDate() - 3);
    } else if (day === 0) {
      // Sunday -> previous working day is Friday (subtract 2 days)
      prev.setDate(todayDate.getDate() - 2);
    } else {
      // Other days -> previous is yesterday (subtract 1 day)
      prev.setDate(todayDate.getDate() - 1);
    }
    return prev.toISOString().split('T')[0];
  };

  const todayDateObj = new Date();
  const prevWorkingDay = getPreviousWorkingDayStr(todayDateObj);
  const prevWorkingDayFormatted = formatFmtDate(prevWorkingDay);
  
  // Check if yesterday's working day report is missing (excluding Sundays and Saturdays for today's check)
  const isSundayOrSaturday = todayDateObj.getDay() === 0 || todayDateObj.getDay() === 6;
  const isPrevReportMissing = user?.role === 'user' && !isSundayOrSaturday && reports.length > 0 && !reports.some((r) => r.date === prevWorkingDay);

  // Silently trigger email notification if yesterday's report is missing
  useEffect(() => {
    if (isPrevReportMissing && prevWorkingDay) {
      const storageKey = `missing_email_sent_${prevWorkingDay}_${user?.id}`;
      const lastEmailed = localStorage.getItem(storageKey);
      if (lastEmailed !== 'true') {
        const sendEmailReminder = async () => {
          try {
            await apiRequest('/api/reports/email-alert', {
              method: 'POST',
              body: { missed_date_formatted: prevWorkingDayFormatted }
            });
            localStorage.setItem(storageKey, 'true');
            console.log('Successfully sent missing daily report email warning.');
          } catch (e) {
            console.error('Failed to send missing daily report email warning:', e);
          }
        };
        sendEmailReminder();
      }
    }
  }, [isPrevReportMissing, prevWorkingDay, prevWorkingDayFormatted, user]);

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

  // Search query for admin / chairman user list
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Dialog and view details state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('daily');
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Edit Access Requests State
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [editRequestsDialogOpen, setEditRequestsDialogOpen] = useState(false);

  const fetchEditRequests = async () => {
    try {
      const data = await apiRequest<any[]>('/api/edit-requests');
      if (data) setEditRequests(data);
    } catch (err) {
      console.error('Failed to fetch edit requests:', err);
    }
  };

  const handleApproveEditRequest = async (id: number) => {
    try {
      await apiRequest(`/api/edit-requests/${id}/approve`, { method: 'POST' });
      fetchEditRequests();
    } catch (err) {
      console.error('Failed to approve edit request:', err);
    }
  };

  const handleRejectEditRequest = async (id: number) => {
    try {
      await apiRequest(`/api/edit-requests/${id}/reject`, { method: 'POST' });
      fetchEditRequests();
    } catch (err) {
      console.error('Failed to reject edit request:', err);
    }
  };

  // Add User State (Admin feature)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccessData, setAddUserSuccessData] = useState<any | null>(null);
  const [copiedUserCreds, setCopiedUserCreds] = useState(false);

  const initialAddUserForm = {
    id: '',
    title: 'Mr.',
    name: '',
    designation: '',
    institution: 'SRM Institute of Science and Technology',
    branch: 'Ramapuram',
    email: '',
    mobile: '',
    role: 'user',
    password: '',
  };

  const [addUserForm, setAddUserForm] = useState(initialAddUserForm);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenAddUser = () => {
    setAddUserForm({
      ...initialAddUserForm,
      password: generateRandomPassword(),
    });
    setAddUserError('');
    setAddUserDialogOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserForm.name.trim() || !addUserForm.email.trim() || !addUserForm.password.trim() || !addUserForm.designation.trim()) {
      setAddUserError('Please fill in required fields: Name, Designation, Email, and Password');
      return;
    }

    setAddUserLoading(true);
    setAddUserError('');
    try {
      const createdUser = await apiRequest<any>('/api/admin/create-user', {
        method: 'POST',
        bodyData: addUserForm,
      });

      setAddUserDialogOpen(false);
      setAddUserSuccessData({
        ...createdUser,
        plainPassword: addUserForm.password,
      });
      fetchAdminTracker();
    } catch (err: any) {
      setAddUserError(err.message || 'Failed to create user. Ensure Email or Employee ID is not already registered.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!addUserSuccessData) return;
    const credText = `🔑 SRM Portal Login Credentials
Name: ${addUserSuccessData.title || ''} ${addUserSuccessData.name}
Email / Username: ${addUserSuccessData.email}
Password: ${addUserSuccessData.plainPassword}
Role: ${addUserSuccessData.role}
Portal: ${window.location.origin}/login`;

    navigator.clipboard.writeText(credText);
    setCopiedUserCreds(true);
    setTimeout(() => setCopiedUserCreds(false), 2000);
  };

  // Fetch admin table data on mount or user shift
  const fetchAdminTracker = async () => {
    if (user?.role !== 'admin' && user?.role !== 'chairman') return;
    setLoadingUsers(true);
    try {
      const usersData = await apiRequest<any[]>('/api/admin/users');
      
      const getWeight = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('aania')) return 2;
        if (n.includes('subashini')) return 1;
        return 0;
      };

      const sorted = [...usersData].sort((a, b) => {
        const wA = getWeight(a.name || '');
        const wB = getWeight(b.name || '');
        if (wA !== wB) {
          return wB - wA; // Higher weight first
        }
        return (a.name || '').localeCompare(b.name || '');
      });

      setUserRows(sorted);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminTracker();
    fetchEditRequests();
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
    handleCloseMenu();

    setDialogLoading(true);

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{p.value}</Typography>
        </Box>
      )
    },
    {
      field: 'doneReports', headerName: 'Completed', flex: 0.4, minWidth: 60, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
          <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 700, fontSize: 11 }} />
        </Box>
      )
    },
    {
      field: 'pendingReports', headerName: 'Pending', flex: 0.4, minWidth: 60, align: 'center', headerAlign: 'center',
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
          <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 700, fontSize: 11 }} />
        </Box>
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

  const columnsToRender = useMemo(() => {
    if (user?.role === 'chairman') {
      return userColumns.filter(col => col.field !== 'progressPct');
    }
    return userColumns;
  }, [user, userColumns]);

  const gridSx = {
    border: 'none',
    '& .MuiDataGrid-columnHeaders': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', borderBottom: `1px solid ${theme.palette.divider}` },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    '& .MuiDataGrid-row:hover': { background: alpha(theme.palette.primary.main, 0.04) },
    '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}`, alignItems: 'center', display: 'flex' },
    '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'center' },
  };

  const renderMiniProgressChart = (targetUser: any) => {
    if (!targetUser) return null;
    
    const categories = [
      { key: 'daily', color: '#6366f1' },
      { key: 'goals', color: '#06b6d4' },
      { key: 'acc', color: '#10b981' },
      { key: 'pending', color: '#ef4444' },
      { key: 'weekly', color: '#8b5cf6' },
    ];
    
    const segments = categories.map(cat => {
      const stats = targetUser.moduleBreakdown?.[cat.key] || { done: 0, total: 0 };
      return {
        value: stats.done,
        color: cat.color,
      };
    });
    
    const totalCompleted = segments.reduce((sum, seg) => sum + seg.value, 0);
    const radius = 22.1;
    const strokeWidth = 5.2;
    const circumference = 2 * Math.PI * radius;
    const overallPct = targetUser.progressPct || 0;

    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Overall Progress: {overallPct}%</Typography>
            <Typography variant="caption" display="block" sx={{ fontWeight: 700 }}>
              Completed: {targetUser.doneReports} / {targetUser.totalReports} reports
            </Typography>
            {categories.map(c => {
              const stats = targetUser.moduleBreakdown?.[c.key] || { done: 0, total: 0, pct: 0 };
              const labels: Record<string, string> = {
                daily: 'Daily Reports',
                goals: '100 Days Goals',
                acc: 'Accomplishments',
                pending: 'Pending Work',
                weekly: 'Weekly Plans'
              };
              return (
                <Typography key={c.key} variant="caption" display="block" sx={{ color: c.color, fontWeight: 600 }}>
                  • {labels[c.key]}: {stats.done}/{stats.total} ({stats.pct}%)
                </Typography>
              );
            })}
          </Box>
        }
        arrow
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="caption" sx={{ fontWeight: 850, color: theme.palette.text.secondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overall Progress
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', width: 90, height: 90 }}>
            <svg width="90" height="90" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r={radius}
                fill="transparent"
                stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                strokeWidth={strokeWidth}
              />
              
              {totalCompleted === 0 ? (
                <circle
                  cx="25"
                  cy="25"
                  r={radius}
                  fill="transparent"
                  stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={strokeWidth}
                />
              ) : (
                <g transform="rotate(-90 25 25)">
                  {segments.map((seg, idx) => {
                    if (seg.value === 0) return null;
                    const segmentPercent = seg.value / totalCompleted;
                    const strokeDasharray = `${segmentPercent * circumference} ${circumference}`;
                    
                    let offset = 0;
                    for (let i = 0; i < idx; i++) {
                      if (segments[i].value > 0) {
                        offset += (segments[i].value / totalCompleted);
                      }
                    }
                    const strokeDashoffset = -offset * circumference;
                    
                    return (
                      <circle
                        key={idx}
                        cx="25"
                        cy="25"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </g>
              )}
              
              {/* Center percentage text */}
              <text
                x="25"
                y="29"
                textAnchor="middle"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 900,
                  fill: theme.palette.text.primary,
                  fontFamily: 'Outfit, Inter, sans-serif'
                }}
              >
                {overallPct}%
              </text>
            </svg>
          </Box>
        </Box>
      </Tooltip>
    );
  };

  const categoryDetails: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    daily: { label: 'Daily Reports', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.06)', icon: '📝' },
    goals: { label: '100 Days Goals', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.06)', icon: '🎯' },
    acc: { label: 'Accomplishment Report', color: '#10b981', bg: 'rgba(16, 185, 129, 0.06)', icon: '🏆' },
    pending: { label: 'Pending & Priority Work', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)', icon: '⏳' },
    weekly: { label: 'Weekly Plans', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.06)', icon: '📅' },
  };

  const renderDialogContent = () => {
    const cat = categoryDetails[selectedReportType] || { label: selectedReportType, color: '#4c248b', bg: 'rgba(76, 36, 139, 0.06)', icon: '📊' };
    const stats = menuUser?.moduleBreakdown?.[selectedReportType] || { done: 0, total: 0, pct: 0 };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Compact Category Progress Card */}
        <Box
          sx={{
            borderRadius: '12px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : cat.bg,
            p: 1.5,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : alpha(cat.color, 0.15)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(cat.color, 0.12),
                  color: cat.color,
                  width: 32,
                  height: 32,
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                {cat.icon}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1.1, fontSize: 13.5 }}>
                  {cat.label} Progress
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, fontSize: 11 }}>
                  Completion Status: {stats.done} of {stats.total} completed
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: cat.color, lineHeight: 1, fontSize: 18 }}>
                {stats.pct}%
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, fontSize: 10 }}>
                Progress
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={stats.pct}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: cat.color,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </Box>

        {/* Tab Table Content */}
        {renderTableContent()}
      </Box>
    );
  };

  const renderTableContent = () => {
    if (dialogLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (dialogData.length === 0) {
      return (
        <Typography sx={{ textAlign: 'center', py: 5, color: theme.palette.text.secondary, fontWeight: 600 }}>
          No records submitted for this module.
        </Typography>
      );
    }

    const headerBg = theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.12)' : '#e6f7f0';
    const headerTextColor = theme.palette.mode === 'dark' ? '#34d399' : '#064e3b';

    switch (selectedReportType) {
      case 'daily':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Area', 'Report Details', 'Date', 'Status'].map((h) => (
                    <TableCell 
                      key={h} 
                      align={h === 'Status' ? 'center' : 'left'}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: 13, 
                        color: headerTextColor, 
                        py: 1.5,
                        width: h === 'Status' ? 120 : 'auto',
                        minWidth: h === 'Status' ? 120 : 'auto'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={row.area} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '12px' }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 280, fontSize: 13, color: theme.palette.text.primary }}>{row.report}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600 }}>{row.date}</TableCell>
                    <TableCell align="center" sx={{ width: 120, minWidth: 120 }}>
                      <Chip
                        label={row.completed ? 'Completed' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: 11, px: 1,
                          bgcolor: row.completed ? '#1e7e34' : '#ef4444',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'reports':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Area', 'Date of Commencement', 'Planned Work Details', 'Status'].map((h) => (
                    <TableCell 
                      key={h} 
                      align={h === 'Status' ? 'center' : 'left'}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: 13.5, 
                        color: headerTextColor, 
                        py: 1.25,
                        width: h === 'Status' ? 120 : 'auto',
                        minWidth: h === 'Status' ? 120 : 'auto'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13, width: 60 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={row.area} size="small" sx={{ fontSize: 12, fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '12px' }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date}</TableCell>
                    <TableCell sx={{ minWidth: 280, fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.report}</TableCell>
                    <TableCell align="center" sx={{ width: 120, minWidth: 120 }}>
                      <Chip
                        label={row.completed ? 'Completed' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 800, fontSize: 11.5, px: 1,
                          bgcolor: row.completed ? '#1e7e34' : '#ef4444',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'goals':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Date of Commencement', 'Planned Work Details', 'Status'].map((h) => (
                    <TableCell 
                      key={h} 
                      align={h === 'Status' ? 'center' : 'left'}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: 13.5, 
                        color: headerTextColor, 
                        py: 1.25,
                        width: h === 'Status' ? 120 : 'auto',
                        minWidth: h === 'Status' ? 120 : 'auto'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13, color: '#0369a1' }}>Day {String(row.day || index + 1).padStart(3, '0')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date}</TableCell>
                    <TableCell sx={{ minWidth: 280, fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.goal}</TableCell>
                    <TableCell align="center" sx={{ width: 120, minWidth: 120 }}>
                      <Chip
                        label={row.completed ? 'Completed' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 800, fontSize: 11.5, px: 1,
                          bgcolor: row.completed ? '#1e7e34' : '#ef4444',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'acc':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Area', 'Date of Commencement', 'Planned Work Details', 'Date of Completion', 'Status'].map((h) => (
                    <TableCell 
                      key={h} 
                      align={h === 'Status' ? 'center' : 'left'}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: 13.5, 
                        color: headerTextColor, 
                        py: 1.25,
                        width: h === 'Status' ? 120 : 'auto',
                        minWidth: h === 'Status' ? 120 : 'auto'
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13, width: 60 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={row.area} size="small" sx={{ fontSize: 12, fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '12px' }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{formatDateDMY(row.date_start)}</TableCell>
                    <TableCell sx={{ minWidth: 280, fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.work}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{formatDateDMY(row.date_end)}</TableCell>
                    <TableCell align="center" sx={{ width: 120, minWidth: 120 }}>
                      <Chip
                        label={row.completed ? 'Completed' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 800, fontSize: 11.5, px: 1,
                          bgcolor: row.completed ? '#1e7e34' : '#ef4444',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'pending':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Areas', 'Date of Commencement', 'Planned Work Details', 'Status', 'Remarks', 'Date of Completion'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 13.5, color: headerTextColor, py: 1.25 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 13, width: 60 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={row.areas} size="small" sx={{ fontSize: 12, fontWeight: 700, bgcolor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px' }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date_start ? formatDateDMY(row.date_start) : '—'}</TableCell>
                    <TableCell sx={{ minWidth: 220, fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.particulars}</TableCell>
                    <TableCell sx={{ fontSize: 13.5, color: theme.palette.text.secondary }}>{row.status || '—'}</TableCell>
                    <TableCell sx={{ fontSize: 13.5, color: theme.palette.text.secondary }}>{row.remarks || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date_end ? formatDateDMY(row.date_end) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'weekly':
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: headerBg }}>
                <TableRow>
                  {['Sl.No', 'Date of Commencement', 'Planned Work Details', 'Date of Completion'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 13.5, color: headerTextColor, py: 1.25 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogData.map((row, index) => (
                  <TableRow key={row.id || index} sx={{ '&:hover': { bgcolor: alpha('#10b981', 0.04) } }}>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date_start ? formatDateDMY(row.date_start) : (row.date ? formatDateDMY(row.date) : '—')}</TableCell>
                    <TableCell sx={{ minWidth: 280, fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.work}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.date_end ? formatDateDMY(row.date_end) : '—'}</TableCell>
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
                <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 220 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: user?.role === 'chairman'
                        ? 'linear-gradient(135deg, #512888, #FA8833)'
                        : 'linear-gradient(135deg, #312e81, #4338ca)',
                      color: '#fff', fontSize: 20, flexShrink: 0,
                    }}>
                      {user?.role === 'chairman' ? '👑' : <PeopleAltRoundedIcon sx={{ fontSize: 20 }} />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: user?.role === 'chairman' ? '#512888' : '#4338ca' }}>
                        {user?.role === 'chairman' ? 'Staff Performance & Overall Progress' : 'Employee Reports Tracker'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Displaying {userRows.filter(r => {
                          if (r.role === 'chairman' || r.name.includes('Chairman')) return false;
                          if (branchFilter !== 'All' && r.branch !== branchFilter) return false;
                          if (userSearchQuery.trim()) {
                            const q = userSearchQuery.toLowerCase().trim();
                            return (r.name?.toLowerCase().includes(q) || r.designation?.toLowerCase().includes(q) || r.institution?.toLowerCase().includes(q) || r.branch?.toLowerCase().includes(q) || r.id?.toString().includes(q));
                          }
                          return true;
                        }).length} staff users
                      </Typography>
                    </Box>
                  </Box>

                  {/* Header Search & Filter Bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', ml: 'auto' }}>
                    <TextField
                      size="small"
                      placeholder="Search user name, designation..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon sx={{ color: user?.role === 'chairman' ? '#FA8833' : '#6366f1', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: userSearchQuery ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setUserSearchQuery('')}>
                              <ClearRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        width: { xs: '100%', sm: 260 },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          fontSize: 13,
                          fontWeight: 600,
                          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          '& fieldset': { borderColor: user?.role === 'chairman' ? alpha('#FA8833', 0.3) : alpha('#6366f1', 0.25) },
                          '&:hover fieldset': { borderColor: user?.role === 'chairman' ? '#FA8833' : '#6366f1' },
                        },
                      }}
                    />

                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonAddRoundedIcon />}
                          onClick={handleOpenAddUser}
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2,
                            py: 0.8,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669, #047857)',
                            },
                          }}
                        >
                          Add User
                        </Button>
                        <Badge badgeContent={editRequests.filter(r => r.status === 'pending').length} color="error">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PendingActionsRoundedIcon />}
                            onClick={() => setEditRequestsDialogOpen(true)}
                            sx={{
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                            }}
                          >
                            Edit Access Requests
                          </Button>
                        </Badge>
                      </>
                    )}

                    {/* Branch Filter — Chairman */}
                    {user?.role === 'chairman' && (
                      <FormControl size="small" sx={{ minWidth: 150 }}>
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
                          if (userSearchQuery.trim()) {
                            const q = userSearchQuery.toLowerCase().trim();
                            return (
                              r.name?.toLowerCase().includes(q) ||
                              r.designation?.toLowerCase().includes(q) ||
                              r.institution?.toLowerCase().includes(q) ||
                              r.branch?.toLowerCase().includes(q) ||
                              r.id?.toString().includes(q)
                            );
                          }
                          return true;
                        })}
                        columns={columnsToRender}
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
            <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0, pt: 2.5, px: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PeopleAltRoundedIcon sx={{ color: '#4c248b', fontSize: 26 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, fontSize: { xs: 15, sm: 19 } }}>
                    {menuUser ? `${menuUser.title || ''} ${menuUser.name} (${menuUser.designation})` : 'User Performance Summary'}
                  </Typography>
                </Box>
                {menuUser && renderMiniProgressChart(menuUser)}
              </Box>
              <Tabs
                value={selectedReportType}
                onChange={(_, val) => handleSelectReport(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: 'none',
                    py: 1.2,
                    px: 2,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: '#4c248b',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#4c248b',
                    height: 3.5,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                <Tab
                  icon={<DescriptionRoundedIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>Daily Reports</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, mt: 0.25, color: '#6366f1' }}>
                        {menuUser?.moduleBreakdown?.daily?.done ?? 0} of {menuUser?.moduleBreakdown?.daily?.total ?? 100} completed ({menuUser?.moduleBreakdown?.daily?.pct ?? 0}%)
                      </Typography>
                    </Box>
                  }
                  value="daily"
                />
                <Tab
                  icon={<AutoAwesomeIcon sx={{ fontSize: 18, color: '#06b6d4' }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>100 Days Goals</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, mt: 0.25, color: '#06b6d4' }}>
                        {menuUser?.moduleBreakdown?.goals?.done ?? 0} of {menuUser?.moduleBreakdown?.goals?.total ?? 100} completed ({menuUser?.moduleBreakdown?.goals?.pct ?? 0}%)
                      </Typography>
                    </Box>
                  }
                  value="goals"
                />
                <Tab
                  icon={<VerifiedRoundedIcon sx={{ fontSize: 18, color: '#10b981' }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>Accomplishments</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, mt: 0.25, color: '#10b981' }}>
                        {menuUser?.moduleBreakdown?.acc?.done ?? 0} of {menuUser?.moduleBreakdown?.acc?.total ?? 100} completed ({menuUser?.moduleBreakdown?.acc?.pct ?? 0}%)
                      </Typography>
                    </Box>
                  }
                  value="acc"
                />
                <Tab
                  icon={<PendingActionsRoundedIcon sx={{ fontSize: 18, color: '#ef4444' }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>Pending Work</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, mt: 0.25, color: '#ef4444' }}>
                        {menuUser?.moduleBreakdown?.pending?.done ?? 0} of {menuUser?.moduleBreakdown?.pending?.total ?? 100} completed ({menuUser?.moduleBreakdown?.pending?.pct ?? 0}%)
                      </Typography>
                    </Box>
                  }
                  value="pending"
                />
                <Tab
                  icon={<TodayRoundedIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>Weekly Plans</Typography>
                      <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 700, mt: 0.25, color: '#8b5cf6' }}>
                        {menuUser?.moduleBreakdown?.weekly?.done ?? 0} of {menuUser?.moduleBreakdown?.weekly?.total ?? 100} completed ({menuUser?.moduleBreakdown?.weekly?.pct ?? 0}%)
                      </Typography>
                    </Box>
                  }
                  value="weekly"
                />
              </Tabs>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {renderDialogContent()}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button 
                variant="outlined" 
                onClick={() => setReportDialogOpen(false)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.secondary, 0.04),
                    borderColor: theme.palette.text.secondary,
                  }
                }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          {/* Custom SVG Donut Chart Progress Dialog */}
          <Dialog
            open={progressDialogOpen}
            onClose={() => setProgressDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '24px',
                p: 1.5,
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 800, pb: 1, pt: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                  Staff Progress Analysis
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                  {menuUser ? `${menuUser.title || ''} ${menuUser.name} (${menuUser.designation})` : ''}
                </Typography>
              </Box>
              <IconButton onClick={() => setProgressDialogOpen(false)} size="small" sx={{ color: theme.palette.text.secondary }}>
                <ClearRoundedIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ px: 3, py: 2 }}>
              {menuUser && (() => {
                const categories = [
                  { label: 'Daily Reports', key: 'daily', color: '#6366f1' },
                  { label: '100 Days Goals', key: 'goals', color: '#06b6d4' },
                  { label: 'Accomplishments', key: 'acc', color: '#10b981' },
                  { label: 'Pending Work', key: 'pending', color: '#ef4444' },
                  { label: 'Weekly Plans', key: 'weekly', color: '#8b5cf6' },
                ];
                
                const segments = categories.map(cat => {
                  const stats = menuUser.moduleBreakdown?.[cat.key] || { done: 0, total: 0, pct: 0 };
                  return {
                    label: cat.label,
                    value: stats.done,
                    total: stats.total,
                    pct: stats.pct,
                    color: cat.color,
                  };
                });
                
                const totalCompleted = segments.reduce((sum, seg) => sum + seg.value, 0);
                const radius = 50;
                const strokeWidth = 16;
                const circumference = 2 * Math.PI * radius;
                
                return (
                  <Grid container spacing={4} alignItems="center">
                    {/* Left: Donut Chart */}
                    <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', width: 170, height: 170 }}>
                        <svg width="170" height="170" viewBox="0 0 150 150">
                          {/* Background Track */}
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                            strokeWidth={strokeWidth}
                          />
                          
                          {totalCompleted === 0 ? (
                            <circle
                              cx="75"
                              cy="75"
                              r={radius}
                              fill="transparent"
                              stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
                              strokeWidth={strokeWidth}
                            />
                          ) : (
                            <g transform="rotate(-90 75 75)">
                              {segments.map((seg, idx) => {
                                if (seg.value === 0) return null;
                                const segmentPercent = seg.value / totalCompleted;
                                const strokeDasharray = `${segmentPercent * circumference} ${circumference}`;
                                
                                // Calculate cumulative offset
                                let offset = 0;
                                for (let i = 0; i < idx; i++) {
                                  if (segments[i].value > 0) {
                                    offset += (segments[i].value / totalCompleted);
                                  }
                                }
                                const strokeDashoffset = -offset * circumference;
                                
                                return (
                                  <circle
                                    key={idx}
                                    cx="75"
                                    cy="75"
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                  />
                                );
                              })}
                            </g>
                          )}
                          
                          {/* Center Text */}
                          <text
                            x="75"
                            y="70"
                            textAnchor="middle"
                            style={{
                              fontSize: '22px',
                              fontWeight: 850,
                              fill: theme.palette.text.primary,
                              fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                          >
                            {menuUser.progressPct || 0}%
                          </text>
                          <text
                            x="75"
                            y="88"
                            textAnchor="middle"
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              fill: theme.palette.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '1.2px',
                              fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                          >
                            Overall
                          </text>
                          <text
                            x="75"
                            y="102"
                            textAnchor="middle"
                            style={{
                              fontSize: '8px',
                              fontWeight: 600,
                              fill: theme.palette.text.secondary,
                              fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                          >
                            {menuUser.doneReports}/{menuUser.totalReports} Done
                          </text>
                        </svg>
                      </Box>
                    </Grid>
                    
                    {/* Right: Legend & Breakdowns */}
                    <Grid item xs={12} sm={7}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {segments.map((seg, idx) => (
                          <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '4px', bgcolor: seg.color, flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: theme.palette.text.primary }}>
                                  {seg.label}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 13, color: seg.color }}>
                                {seg.pct}%
                              </Typography>
                            </Box>
                            <Box sx={{ pl: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: 11 }}>
                                {seg.value} of {seg.total} completed
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={seg.pct}
                                sx={{
                                  width: 90,
                                  height: 5,
                                  borderRadius: 2.5,
                                  bgcolor: alpha(seg.color, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 2.5,
                                    bgcolor: seg.color
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                );
              })()}
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => setProgressDialogOpen(false)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    borderColor: theme.palette.text.primary,
                  }
                }}
              >
                Close Analysis
              </Button>
            </DialogActions>
          </Dialog>

          {/* Admin Edit Access Requests Approval Dialog */}
          <Dialog open={editRequestsDialogOpen} onClose={() => setEditRequestsDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingActionsRoundedIcon sx={{ color: '#f59e0b' }} />
                User Edit Access Requests (24h Window)
              </Box>
              <Chip
                label={`${editRequests.filter(r => r.status === 'pending').length} Pending`}
                color={editRequests.filter(r => r.status === 'pending').length > 0 ? 'warning' : 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              {editRequests.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                  No edit access requests submitted yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Staff User</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Module & Item</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Requested Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell sx={{ fontWeight: 700 }}>{req.user_name || req.user_id}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip label={`${req.module.toUpperCase()} #${req.item_id}`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: theme.palette.text.secondary }}>{req.reason || 'Needs modification'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            {req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={req.status === 'approved' ? 'Approved (24h Pass)' : req.status === 'pending' ? 'Pending' : 'Rejected'}
                              color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'error'}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {req.status === 'pending' ? (
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApproveEditRequest(req.id)}
                                  sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none' }}
                                >
                                  Approve (24h)
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRejectEditRequest(req.id)}
                                  sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none' }}
                                >
                                  Reject
                                </Button>
                              </Box>
                            ) : req.status === 'approved' ? (
                              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                                Active 24h Pass
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                                Closed
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setEditRequestsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* ── ADD USER DIALOG (ADMIN) ── */}
          <Dialog
            open={addUserDialogOpen}
            onClose={() => !addUserLoading && setAddUserDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
          >
            <form onSubmit={handleCreateUserSubmit}>
              <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <Avatar sx={{ bgcolor: alpha('#10b981', 0.15), color: '#10b981' }}>
                  <PersonAddRoundedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>➕ Add New Employee / User</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Create account and automatically email login credentials to user
                  </Typography>
                </Box>
              </DialogTitle>

              <DialogContent dividers sx={{ py: 2.5 }}>
                {addUserError && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
                    {addUserError}
                  </Alert>
                )}

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      label="Title"
                      size="small"
                      value={addUserForm.title}
                      onChange={(e) => setAddUserForm({ ...addUserForm, title: e.target.value })}
                    >
                      {['Mr.', 'Dr.', 'Mrs.', 'Ms.', 'Prof.'].map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={9}>
                    <TextField
                      fullWidth
                      required
                      label="Full Name"
                      size="small"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Designation"
                      size="small"
                      placeholder="e.g. Associate Professor"
                      value={addUserForm.designation}
                      onChange={(e) => setAddUserForm({ ...addUserForm, designation: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Institution / Unit"
                      size="small"
                      value={addUserForm.institution}
                      onChange={(e) => setAddUserForm({ ...addUserForm, institution: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Email Address (Username)"
                      type="email"
                      size="small"
                      placeholder="user@srm.edu.in"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><EmailRoundedIcon sx={{ fontSize: 18, color: '#0284c7' }} /></InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      size="small"
                      placeholder="e.g. +91 9876543210"
                      value={addUserForm.mobile}
                      onChange={(e) => setAddUserForm({ ...addUserForm, mobile: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><PhoneAndroidRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /></InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Branch"
                      size="small"
                      value={addUserForm.branch}
                      onChange={(e) => setAddUserForm({ ...addUserForm, branch: e.target.value })}
                    >
                      <MenuItem value="Ramapuram">Ramapuram</MenuItem>
                      <MenuItem value="Trichy">Trichy</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="User Role"
                      size="small"
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                    >
                      <MenuItem value="user">Staff User</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        required
                        label="Login Password"
                        size="small"
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><KeyRoundedIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></InputAdornment>,
                        }}
                      />
                      <Tooltip title="Generate Strong Password">
                        <IconButton
                          onClick={() => setAddUserForm({ ...addUserForm, password: generateRandomPassword() })}
                          sx={{ background: alpha('#f59e0b', 0.1), color: '#f59e0b', '&:hover': { background: alpha('#f59e0b', 0.2) } }}
                        >
                          <RefreshRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>

                <Alert severity="info" icon={<SendRoundedIcon />} sx={{ mt: 3, borderRadius: '12px' }}>
                  System will automatically dispatch an email with the login URL, Username, and Password to <strong>{addUserForm.email || 'the user email'}</strong>.
                </Alert>
              </DialogContent>

              <DialogActions sx={{ p: 2.5, gap: 1 }}>
                <Button onClick={() => setAddUserDialogOpen(false)} disabled={addUserLoading} color="inherit">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={addUserLoading}
                  startIcon={addUserLoading ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
                  sx={{
                    px: 3,
                    borderRadius: '12px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                  }}
                >
                  {addUserLoading ? 'Creating User & Emailing...' : 'Create & Send Credentials'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* ── USER CREDENTIALS CREATED SUCCESS DIALOG ── */}
          <Dialog
            open={!!addUserSuccessData}
            onClose={() => setAddUserSuccessData(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
          >
            <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: alpha('#10b981', 0.15), color: '#10b981', mx: 'auto', mb: 1.5 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Account Created Successfully! 🎉</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                Login credentials have been generated for <strong>{addUserSuccessData?.email}</strong>.
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 2 }}>
              <Card variant="outlined" sx={{ borderRadius: '16px', background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', p: 2.5, mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                  USER CREDENTIALS SUMMARY
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={5}><Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Employee Name:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2" sx={{ fontWeight: 700 }}>{addUserSuccessData?.title} {addUserSuccessData?.name}</Typography></Grid>

                  <Grid item xs={5}><Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Login Email:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>{addUserSuccessData?.email}</Typography></Grid>

                  <Grid item xs={5}><Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Password:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626', fontSize: 16 }}>{addUserSuccessData?.plainPassword}</Typography></Grid>

                  <Grid item xs={5}><Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Login Link:</Typography></Grid>
                  <Grid item xs={7}><Typography variant="body2" sx={{ fontWeight: 700, color: '#4c248b' }}>{window.location.origin}/login</Typography></Grid>
                </Grid>
              </Card>

              {addUserSuccessData?.email_sent ? (
                <Alert severity="success" sx={{ borderRadius: '12px', fontSize: 13 }}>
                  ✅ Login credentials email has been sent to <strong>{addUserSuccessData?.email}</strong>.
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ borderRadius: '12px', fontSize: 13 }}>
                  ⚠️ Account created, but email could not be sent ({addUserSuccessData?.email_status_msg || 'SMTP not configured in .env'}). You can copy the credentials below to share manually.
                </Alert>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
              <Button
                variant={copiedUserCreds ? 'contained' : 'outlined'}
                color={copiedUserCreds ? 'success' : 'primary'}
                startIcon={copiedUserCreds ? <CheckCircleRoundedIcon /> : <ContentCopyRoundedIcon />}
                onClick={handleCopyCredentials}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                {copiedUserCreds ? 'Credentials Copied!' : '📋 Copy Credentials'}
              </Button>
              <Button
                variant="contained"
                onClick={() => setAddUserSuccessData(null)}
                sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
              >
                Done
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Fade>
    </Layout>
  );
};

export default DashboardPage;
