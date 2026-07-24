import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Grid, Chip,
  Divider, Tooltip, Fade, Alert, Snackbar, alpha, useTheme,
  Tab, Tabs, LinearProgress, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import EmojiObjectsRoundedIcon from '@mui/icons-material/EmojiObjectsRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../utils/api.ts';

// ─── Types ───────────────────────────────────────────────────────────────────
type ReportRow = {
  id: number; slNo: number; date: string;
  area: string; report: string; completed: boolean;
};

type GoalRow = {
  id: number; day: number; date: string;
  goal: string; completed: boolean;
  responsiblePerson: string;
};

type AccomplishRow = {
  id: number;
  area: string;
  work: string;
  dateStart: string;
  dateEnd: string;
  completed: boolean;
};

type PendingRow = {
  id: number;
  areas: string;
  particulars: string;
  responsiblePerson: string;
  dateStart: string;
  dateEnd: string;
  statusDate: string;
  remarks: string;
  completed: boolean;
};

type WeeklyPlanRow = {
  id: number;
  date: string;
  work: string;
  responsiblePerson: string;
  completed: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const GOAL_START = new Date('2026-06-01');
const GOAL_END   = new Date('2026-09-08');
const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const initialForm = { date: '', area: '', report: '' };
const blankGoal = { day: '', date: '', goal: '', responsiblePerson: '' };
const blankAcc = { area: '', work: '', dateStart: '', dateEnd: '' };
const blankPending = { areas: '', particulars: '', responsiblePerson: '', dateStart: '', dateEnd: '', statusDate: '', remarks: '' };
const blankWeekly = { date: '', work: '', responsiblePerson: '' };

// ─── Flag Cell ───────────────────────────────────────────────────────────────
const FlagCell: React.FC<{ completed: boolean; onToggle: () => void }> = ({ completed, onToggle }) => (
  <Tooltip title={completed ? 'Completed' : 'Pending — click to mark complete'} arrow>
    <Box onClick={completed ? undefined : onToggle} sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      cursor: completed ? 'default' : 'pointer', gap: 0.75,
      '&:hover': completed ? {} : { transform: 'scale(1.08)' }, transition: 'transform 0.2s',
    }}>
      <FlagRoundedIcon sx={{
        fontSize: 22,
        color: completed ? '#22c55e' : '#ef4444',
        filter: completed ? 'drop-shadow(0 0 5px rgba(34,197,94,0.6))' : 'drop-shadow(0 0 5px rgba(239,68,68,0.6))',
        transition: 'all 0.3s',
      }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: completed ? '#22c55e' : '#ef4444', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {completed ? 'DONE' : 'PENDING'}
      </Typography>
    </Box>
  </Tooltip>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DailyReportPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);

  // Tab 0 Edit Dialog State
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false);
  const [editReportDialogId, setEditReportDialogId] = useState<number | ''>('');
  const [editReportDialogForm, setEditReportDialogForm] = useState(initialForm);

  // Tab 1 Edit Dialog State
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [editGoalDialogId, setEditGoalDialogId] = useState<number | ''>('');
  const [editGoalDialogForm, setEditGoalDialogForm] = useState({ date: '', goal: '', responsiblePerson: '' });

  // Tab 2 Edit Dialog State
  const [editAccDialogOpen, setEditAccDialogOpen] = useState(false);
  const [editAccDialogId, setEditAccDialogId] = useState<number | ''>('');
  const [editAccDialogForm, setEditAccDialogForm] = useState(blankAcc);

  // Tab 3 Edit Dialog State
  const [editPendingDialogOpen, setEditPendingDialogOpen] = useState(false);
  const [editPendingDialogId, setEditPendingDialogId] = useState<number | ''>('');
  const [editPendingDialogForm, setEditPendingDialogForm] = useState(blankPending);

  // Tab 4 Edit Dialog State
  const [editWeeklyDialogOpen, setEditWeeklyDialogOpen] = useState(false);
  const [editWeeklyDialogId, setEditWeeklyDialogId] = useState<number | ''>('');
  const [editWeeklyDialogForm, setEditWeeklyDialogForm] = useState(blankWeekly);

  // ── 100 Days Goal Form state ──
  const [goalForm, setGoalForm] = useState(blankGoal);
  const [goalErrors, setGoalErrors] = useState<Partial<typeof blankGoal>>({});

  // ── Accomplishment state ──
  const [accForm, setAccForm] = useState(blankAcc);
  const [accEntries, setAccEntries] = useState<AccomplishRow[]>([]);
  const [accErrors, setAccErrors] = useState<Partial<typeof blankAcc>>({});

  // ── Pending & Priority state ──
  const [pendingForm, setPendingForm] = useState(blankPending);
  const [pendingEntries, setPendingEntries] = useState<PendingRow[]>([]);
  const [pendingErrors, setPendingErrors] = useState<Partial<typeof blankPending>>({});

  // ── Weekly Plan state ──
  const [weekFrom, setWeekFrom] = useState('2026-06-01');
  const [weekTo,   setWeekTo]   = useState('2026-06-06');
  const [weeklyForm, setWeeklyForm]       = useState(blankWeekly);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyPlanRow[]>([]);
  const [weeklyErrors, setWeeklyErrors]   = useState<Partial<typeof blankWeekly>>({});

  // ── API Fetch Handlers ──
  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/reports');
      // map to row with local Sl.No.
      const mapped = data.map((r, index) => ({
        id: r.id,
        slNo: index + 1,
        date: r.date,
        area: r.area,
        report: r.report,
        completed: r.completed,
      }));
      setRows(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/goals');
      const mapped = data.map((g) => ({
        id: g.id,
        day: g.day,
        date: g.date,
        goal: g.goal,
        completed: g.completed,
        responsiblePerson: g.responsible_person || 'Self',
      }));
      setGoals(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccomplishments = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/accomplishments');
      const mapped = data.map((a) => ({
        id: a.id,
        area: a.area,
        work: a.work,
        dateStart: a.date_start,
        dateEnd: a.date_end,
        completed: a.completed ?? true,
      }));
      setAccEntries(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccomplishment = async (id: number) => {
    try {
      await apiRequest(`/api/accomplishments/${id}/toggle`, { method: 'PATCH' });
      fetchAccomplishments();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to toggle accomplishment', severity: 'error' });
    }
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/pending');
      const mapped = data.map((p) => ({
        id: p.id,
        areas: p.areas,
        particulars: p.particulars,
        responsiblePerson: p.responsible_person || '',
        dateStart: p.date_start,
        dateEnd: p.date_end || '',
        statusDate: p.status_date || '',
        remarks: p.remarks || '',
        completed: p.completed ?? false,
      }));
      setPendingEntries(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePending = async (id: number) => {
    try {
      await apiRequest(`/api/pending/${id}/toggle`, { method: 'PATCH' });
      fetchPending();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to toggle pending item', severity: 'error' });
    }
  };

  const fetchWeekly = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/weekly');
      const mapped = data.map((w) => ({
        id: w.id,
        date: w.date,
        work: w.work,
        responsiblePerson: w.responsible_person || 'Self',
        completed: w.completed ?? false,
      }));
      setWeeklyEntries(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeekly = async (id: number) => {
    try {
      await apiRequest(`/api/weekly/${id}/toggle`, { method: 'PATCH' });
      fetchWeekly();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to toggle weekly plan', severity: 'error' });
    }
  };

  // Load data depending on selected Tab
  useEffect(() => {
    if (!user) return;
    if (tab === 0) fetchReports();
    if (tab === 1) fetchGoals();
    if (tab === 2) fetchAccomplishments();
    if (tab === 3) fetchPending();
    if (tab === 4) fetchWeekly();
  }, [tab, user]);

  // ── Tab 1 Goals Logic ──
  const validateGoal = () => {
    const e: Partial<typeof blankGoal> = {};
    if (!goalForm.day.trim() || isNaN(Number(goalForm.day))) e.day = 'Valid Sl. No. / Day is required';
    if (!goalForm.date)                                      e.date = 'Date is required';
    if (!goalForm.goal.trim())                               e.goal = 'Work / Goal description is required';
    setGoalErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddGoal = async () => {
    if (!validateGoal()) return;
    const newDay = Number(goalForm.day);
    if (goals.some((g) => g.day === newDay)) {
      setGoalErrors({ day: 'A goal for this Sl. No. already exists' });
      return;
    }
    try {
      await apiRequest('/api/goals', {
        method: 'POST',
        bodyData: {
          day: newDay,
          date: goalForm.date,
          goal: goalForm.goal,
          responsible_person: goalForm.responsiblePerson.trim() || 'Self',
          completed: false
        }
      });
      setSnack({ open: true, msg: `Goal added for Sl. No. ${newDay}!`, severity: 'success' });
      setGoalForm(blankGoal);
      setGoalErrors({});
      fetchGoals();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to add goal', severity: 'error' });
    }
  };

  const handleSaveEditGoal = async () => {
    if (editGoalDialogId !== '') {
      try {
        await apiRequest(`/api/goals/${editGoalDialogId}`, {
          method: 'PUT',
          bodyData: {
            day: Number(editGoalDialogId), // Keep same day or get from form if editable
            date: editGoalDialogForm.date,
            goal: editGoalDialogForm.goal,
            responsible_person: editGoalDialogForm.responsiblePerson || 'Self',
            completed: false
          }
        });
        setEditGoalDialogOpen(false);
        setEditGoalDialogId('');
        setSnack({ open: true, msg: 'Goal updated successfully!', severity: 'success' });
        fetchGoals();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update goal', severity: 'error' });
      }
    }
  };

  const toggleGoal = async (id: number) => {
    try {
      await apiRequest(`/api/goals/${id}/toggle`, { method: 'PATCH' });
      fetchGoals();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to toggle goal', severity: 'error' });
    }
  };

  // ── Tab 2 Accomplishments Logic ──
  const validateAcc = () => {
    const e: Partial<typeof blankAcc> = {};
    if (!accForm.area.trim())  e.area = 'Area is required';
    if (!accForm.work.trim())  e.work = 'Work is required';
    if (!accForm.dateStart)    e.dateStart = 'Required';
    if (!accForm.dateEnd)      e.dateEnd = 'Required';
    setAccErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddAccomplishment = async () => {
    if (!validateAcc()) return;
    try {
      await apiRequest('/api/accomplishments', {
        method: 'POST',
        bodyData: {
          area: accForm.area,
          work: accForm.work,
          date_start: accForm.dateStart,
          date_end: accForm.dateEnd
        }
      });
      setSnack({ open: true, msg: 'Accomplishment added!', severity: 'success' });
      setAccForm(blankAcc);
      setAccErrors({});
      fetchAccomplishments();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to add', severity: 'error' });
    }
  };

  const handleSaveEditAcc = async () => {
    if (editAccDialogId !== '') {
      try {
        await apiRequest(`/api/accomplishments/${editAccDialogId}`, {
          method: 'PUT',
          bodyData: {
            area: editAccDialogForm.area,
            work: editAccDialogForm.work,
            date_start: editAccDialogForm.dateStart,
            date_end: editAccDialogForm.dateEnd
          }
        });
        setEditAccDialogOpen(false);
        setEditAccDialogId('');
        setSnack({ open: true, msg: 'Accomplishment updated successfully!', severity: 'success' });
        fetchAccomplishments();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update', severity: 'error' });
      }
    }
  };

  // ── Tab 3 Pending Work Logic ──
  const validatePending = () => {
    const e: Partial<typeof blankPending> = {};
    if (!pendingForm.areas.trim())       e.areas = 'Required';
    if (!pendingForm.particulars.trim()) e.particulars = 'Required';
    if (!pendingForm.dateStart)          e.dateStart = 'Required';
    setPendingErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddPending = async () => {
    if (!validatePending()) return;
    try {
      await apiRequest('/api/pending', {
        method: 'POST',
        bodyData: {
          areas: pendingForm.areas,
          particulars: pendingForm.particulars,
          responsible_person: pendingForm.responsiblePerson,
          date_start: pendingForm.dateStart,
          date_end: pendingForm.dateEnd || null,
          status_date: pendingForm.statusDate || null,
          remarks: pendingForm.remarks
        }
      });
      setSnack({ open: true, msg: 'Pending work added!', severity: 'success' });
      setPendingForm(blankPending);
      setPendingErrors({});
      fetchPending();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to add pending item', severity: 'error' });
    }
  };

  const handleSaveEditPending = async () => {
    if (editPendingDialogId !== '') {
      try {
        await apiRequest(`/api/pending/${editPendingDialogId}`, {
          method: 'PUT',
          bodyData: {
            areas: editPendingDialogForm.areas,
            particulars: editPendingDialogForm.particulars,
            responsible_person: editPendingDialogForm.responsiblePerson,
            date_start: editPendingDialogForm.dateStart,
            date_end: editPendingDialogForm.dateEnd || null,
            status_date: editPendingDialogForm.statusDate || null,
            remarks: editPendingDialogForm.remarks
          }
        });
        setEditPendingDialogOpen(false);
        setEditPendingDialogId('');
        setSnack({ open: true, msg: 'Pending work updated successfully!', severity: 'success' });
        fetchPending();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update', severity: 'error' });
      }
    }
  };

  // ── Tab 4 Weekly Plan Logic ──
  const validateWeekly = () => {
    const e: Partial<typeof blankWeekly> = {};
    if (!weeklyForm.date)           e.date = 'Required';
    if (!weeklyForm.work.trim())    e.work = 'Required';
    setWeeklyErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddWeekly = async () => {
    if (!validateWeekly()) return;
    try {
      await apiRequest('/api/weekly', {
        method: 'POST',
        bodyData: {
          date: weeklyForm.date,
          work: weeklyForm.work,
          responsible_person: weeklyForm.responsiblePerson || 'Self'
        }
      });
      setSnack({ open: true, msg: 'Weekly plan entry added!', severity: 'success' });
      setWeeklyForm(blankWeekly);
      setWeeklyErrors({});
      fetchWeekly();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to add weekly plan', severity: 'error' });
    }
  };

  const handleSaveEditWeekly = async () => {
    if (editWeeklyDialogId !== '') {
      try {
        await apiRequest(`/api/weekly/${editWeeklyDialogId}`, {
          method: 'PUT',
          bodyData: {
            date: editWeeklyDialogForm.date,
            work: editWeeklyDialogForm.work,
            responsible_person: editWeeklyDialogForm.responsiblePerson || 'Self'
          }
        });
        setEditWeeklyDialogOpen(false);
        setEditWeeklyDialogId('');
        setSnack({ open: true, msg: 'Weekly Plan updated successfully!', severity: 'success' });
        fetchWeekly();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update weekly plan', severity: 'error' });
      }
    }
  };

  const fmtDispDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Tab 0 Daily Report logic ──
  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
  };

  const handleSubmit = async () => {
    const e: Partial<typeof form> = {};
    if (!form.area.trim()) e.area = 'Area is required';
    if (!form.report.trim()) e.report = 'Report is required';
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        bodyData: {
          date: form.date || new Date().toISOString().split('T')[0],
          area: form.area,
          report: form.report,
          completed: false
        }
      });
      setSnack({ open: true, msg: 'Daily Report submitted!', severity: 'success' });
      setForm(initialForm);
      setErrors({});
      fetchReports();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to submit report', severity: 'error' });
    }
  };

  const handleSaveEditReport = async () => {
    if (editReportDialogId !== '') {
      try {
        await apiRequest(`/api/reports/${editReportDialogId}`, {
          method: 'PUT',
          bodyData: {
            date: editReportDialogForm.date,
            area: editReportDialogForm.area,
            report: editReportDialogForm.report,
            completed: false
          }
        });
        setEditReportDialogOpen(false);
        setEditReportDialogId('');
        setSnack({ open: true, msg: 'Daily Report updated successfully!', severity: 'success' });
        fetchReports();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update report', severity: 'error' });
      }
    }
  };

  const toggleReport = async (id: number) => {
    try {
      await apiRequest(`/api/reports/${id}/toggle`, { method: 'PATCH' });
      fetchReports();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to toggle status', severity: 'error' });
    }
  };

  // ── Daily Report columns ──
  const reportColumns: GridColDef[] = [
    {
      field: 'slNo', headerName: 'SI.NO', flex: 0.4, minWidth: 60,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, background: alpha(theme.palette.primary.main, 0.1), borderRadius: '8px', px: 1.5, py: 0.25, fontSize: 12 }}>
          {String(p.value as number).padStart(2, '0')}
        </Typography>
      ),
    },
    {
      field: 'date', headerName: 'Date', flex: 0.8, minWidth: 110,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {new Date(p.value as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'area', headerName: 'Area', flex: 1, minWidth: 130,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value as string} size="small" sx={{ fontSize: 11, fontWeight: 600, background: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.main }} />
      ),
    },
    {
      field: 'report', headerName: 'Report', flex: 2, minWidth: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" title={p.value as string} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.palette.text.secondary, fontSize: 13 }}>
          {p.value as string}
        </Typography>
      ),
    },
    {
      field: 'completed', headerName: 'Status', flex: 0.5, minWidth: 80, sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <FlagCell completed={p.value as boolean} onToggle={() => toggleReport(p.row.id as number)} />
      ),
    },
  ];

  // ── 100 Days columns ──
  const goalColumns: GridColDef[] = [
    {
      field: 'day', headerName: 'Sl. No.', flex: 0.4, minWidth: 60,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#6366f1', background: alpha('#6366f1', 0.1), borderRadius: '8px', px: 1.5, py: 0.25, fontSize: 12 }}>
          {String(p.value as number).padStart(3, '0')}
        </Typography>
      ),
    },
    {
      field: 'date', headerName: 'Date', flex: 0.8, minWidth: 110,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {new Date(p.value as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'goal', headerName: 'Work', flex: 2, minWidth: 180,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" title={p.value as string} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.palette.text.secondary, fontSize: 13 }}>
          {p.value as string}
        </Typography>
      ),
    },
    {
      field: 'responsiblePerson', headerName: 'Responsible Person', flex: 1, minWidth: 130,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value as string || 'Self'} size="small" color="primary" variant="outlined" sx={{ fontSize: 11, fontWeight: 600 }} />
      ),
    },
    {
      field: 'completed', headerName: 'Status', flex: 0.5, minWidth: 80, sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <FlagCell completed={p.value as boolean} onToggle={() => toggleGoal(p.row.id as number)} />
      ),
    },
  ];

  const completedGoals = goals.filter((g) => g.completed).length;
  const progressPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
  const completedReports = rows.filter((r) => r.completed).length;
  const gridSx = {
    border: 'none',
    '& .MuiDataGrid-columnHeaders': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', borderBottom: `1px solid ${theme.palette.divider}` },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    '& .MuiDataGrid-row:hover': { background: alpha(theme.palette.primary.main, 0.04) },
    '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}`, alignItems: 'center', display: 'flex' },
    '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'center' },
  };

  return (
    <Layout pageTitle="Daily Reports">
      <Fade in timeout={500}>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: 14, textTransform: 'none', minWidth: 100, py: 2 } }}>
              <Tab icon={<CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Daily Report" />
              <Tab icon={<EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="100 Days Goals" />
              <Tab icon={<EmojiObjectsRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Accomplishment Report" />
              <Tab icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Pending & Priority Work" />
              <Tab icon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Weekly Plan" />
            </Tabs>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <Box>
              {/* ══════════════════════════════════════════════════
                  TAB 0 — Daily Report
              ══════════════════════════════════════════════════ */}
              {tab === 0 && (
                <Box>
                  {/* Form */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>📝 Submit Daily Report</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Log your daily activities and sync it to the cloud.</Typography>
                        </Box>
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Employee Information
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {[
                          { label: 'Name', value: user?.name },
                          { label: 'Designation', value: user?.designation },
                          { label: 'Institution / Unit', value: user?.institution },
                        ].map((f) => (
                          <Grid item xs={12} sm={4} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              InputProps={{ readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> }}
                              sx={{ '& .MuiOutlinedInput-root': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '& fieldset': { borderStyle: 'dashed' } } }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      <Divider sx={{ mb: 3 }} />

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Report Fields
                      </Typography>
                      <TextField fullWidth label="Date" type="date" value={form.date} error={!!errors.date} helperText={errors.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mb: 2.5 }} />

                      {/* Compose layout */}
                      <Box sx={{
                        border: `1px solid ${errors.area || errors.report ? '#ef4444' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        background: theme.palette.mode === 'dark' ? '#1e1e2e' : '#fff',
                        overflow: 'hidden',
                      }}>
                        <Box component="label" sx={{ display: 'block', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8e8e8'}`, cursor: 'text' }}>
                          <Box component="input" placeholder="Subject / Area" value={form.area} error={!!errors.area}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, area: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', px: 2, py: 1.5, fontSize: 15, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? '#7986cb' : '#4a90a4', opacity: 1 } }}
                          />
                        </Box>
                        <Box component="label" sx={{ display: 'block', cursor: 'text' }}>
                          <Box component="textarea" placeholder="Report details..." value={form.report} error={!!errors.report} rows={6}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, report: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', resize: 'none', px: 2, pt: 1.5, pb: 2, fontSize: 14, lineHeight: 1.85, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c0c0c0', opacity: 1 } }}
                          />
                        </Box>
                        <Box sx={{ px: 2, py: 0.75, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', background: theme.palette.mode === 'dark' ? 'transparent' : '#fafafa' }}>
                          {(errors.area || errors.report) && <Typography sx={{ fontSize: 11, color: '#ef4444' }}>{errors.area || errors.report}</Typography>}
                          <Typography sx={{ fontSize: 11, color: '#c0c0c0', ml: 'auto' }}>{form.report.length} characters</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleSubmit} sx={{ px: 3 }}>
                          Submit Report
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditReportDialogOpen(true)} sx={{ px: 3 }}>
                          Edit Data
                        </Button>
                        <Button variant="text" startIcon={<CancelRoundedIcon />} onClick={handleReset} color="inherit" sx={{ px: 3, color: theme.palette.text.secondary }}>Cancel</Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Grid */}
                  <Card sx={{ borderRadius: '20px' }}>
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Report History</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{rows.length} total records</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${completedReports} Done`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600 }} />
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#ef4444 !important', fontSize: 14 }} />} label={`${rows.length - completedReports} Pending`} size="small" sx={{ background: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600 }} />
                      </Box>
                    </Box>
                    <Box sx={{ borderRadius: '0 0 20px 20px' }}>
                      <DataGrid rows={rows} columns={reportColumns} autoHeight pageSizeOptions={[5, 10, 20]}
                        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                        disableRowSelectionOnClick sx={gridSx} />
                    </Box>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 1 — 100 Days Goals
              ══════════════════════════════════════════════════ */}
              {tab === 1 && (
                <Box>
                  {/* Employee Info */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Information
                      </Typography>
                      <Grid container spacing={2.5}>
                        {[
                          { label: 'Name', value: user?.name },
                          { label: 'Designation', value: user?.designation },
                          { label: 'Institution / Unit', value: user?.institution },
                        ].map((f) => (
                          <Grid item xs={12} sm={4} key={f.label}>
                            <TextField
                              fullWidth label={f.label} value={f.value ?? ''}
                              InputProps={{ readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> }}
                              sx={{ '& .MuiOutlinedInput-root': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '& fieldset': { borderStyle: 'dashed' } } }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* ── Goal Input Form ── */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>🎯 100 Days Goal Setup</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Enter goal details and click Submit to record it on your tracker.</Typography>
                        </Box>
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Add Goal / Task
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label="Sl. No. / Day" type="number" placeholder="e.g. 44"
                            value={goalForm.day} error={!!goalErrors.day} helperText={goalErrors.day}
                            onChange={(e) => setGoalForm((p) => ({ ...p, day: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label="Date" type="date"
                            value={goalForm.date} error={!!goalErrors.date} helperText={goalErrors.date}
                            onChange={(e) => setGoalForm((p) => ({ ...p, date: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label="Responsible Person" placeholder="Name or 'Self'"
                            value={goalForm.responsiblePerson} error={!!goalErrors.responsiblePerson} helperText={goalErrors.responsiblePerson}
                            onChange={(e) => setGoalForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
                        </Grid>
                      </Grid>

                      <Box sx={{
                        border: `1px solid ${goalErrors.goal ? '#ef4444' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        background: theme.palette.mode === 'dark' ? '#1e1e2e' : '#fff',
                        overflow: 'hidden',
                      }}>
                        <Box component="label" sx={{ display: 'block', cursor: 'text' }}>
                          <Box component="textarea" placeholder="Work / Goal Description" value={goalForm.goal} rows={4}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoalForm((p) => ({ ...p, goal: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', resize: 'none', px: 2, pt: 1.5, pb: 2, fontSize: 14, lineHeight: 1.85, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c0c0c0', opacity: 1 } }}
                          />
                        </Box>
                        <Box sx={{ px: 2, py: 0.75, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', background: theme.palette.mode === 'dark' ? 'transparent' : '#fafafa' }}>
                          {goalErrors.goal && <Typography sx={{ fontSize: 11, color: '#ef4444' }}>{goalErrors.goal}</Typography>}
                          <Typography sx={{ fontSize: 11, color: '#c0c0c0', ml: 'auto' }}>{goalForm.goal.length} characters</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddGoal} sx={{ px: 3 }}>
                          Submit Goal
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditGoalDialogOpen(true)} sx={{ px: 3 }}>
                          Edit Goals
                        </Button>
                        <Button variant="text" startIcon={<CancelRoundedIcon />} onClick={() => { setGoalForm(blankGoal); setGoalErrors({}); }} color="inherit" sx={{ px: 3, color: theme.palette.text.secondary }}>Cancel</Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Hero Banner */}
                  <Box sx={{
                    mb: 3, p: { xs: 2.5, sm: 3.5 }, borderRadius: '20px',
                    background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#06b6d4 100%)',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                  }}>
                    {[{ s: 160, t: -40, r: 40 }, { s: 100, t: 20, r: 180 }].map((c, i) => (
                      <Box key={i} sx={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', top: c.t, right: c.r, opacity: 0.2 }} />
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EmojiEventsRoundedIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 18, sm: 22 } }}>
                          100 Days GOALS 🎯
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {fmtDate(GOAL_START)} &nbsp;→&nbsp; {fmtDate(GOAL_END)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                          Overall Progress
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 800 }}>
                          {completedGoals} / {goals.length} days ({progressPct}%)
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={progressPct} sx={{
                        height: 10, borderRadius: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': { borderRadius: '10px', background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' },
                      }} />
                    </Box>

                    {/* Stat Pills */}
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Completed', val: completedGoals, color: '#22c55e' },
                        { label: 'Remaining', val: goals.length - completedGoals, color: '#ef4444' },
                        { label: 'Days Elapsed', val: Math.min(Math.floor((Date.now() - GOAL_START.getTime()) / 86400000), 100), color: '#fbbf24' },
                      ].map((s) => (
                        <Box key={s.label} sx={{ px: 2, py: 0.75, borderRadius: '10px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>{s.label}</Typography>
                          <Typography variant="subtitle1" sx={{ color: s.color, fontWeight: 800, lineHeight: 1.2 }}>{s.val}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* 100 Days Grid */}
                  <Card sx={{ borderRadius: '20px' }}>
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TrackChangesRoundedIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>100 Days Task Tracker</Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Click any flag to toggle completion status
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} size="small" onClick={() => setEditGoalDialogOpen(true)} sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>
                          Edit Goals
                        </Button>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${completedGoals} Done`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600 }} />
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#ef4444 !important', fontSize: 14 }} />} label={`${goals.length - completedGoals} Pending`} size="small" sx={{ background: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600 }} />
                      </Box>
                    </Box>
                    <Box sx={{ borderRadius: '0 0 20px 20px' }}>
                      <DataGrid rows={goals} columns={goalColumns} autoHeight pageSizeOptions={[10, 25, 50, 100]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        disableRowSelectionOnClick sx={gridSx} />
                    </Box>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 2 — Accomplishment Report
              ══════════════════════════════════════════════════ */}
              {tab === 2 && (
                <Box>
                  {/* ── Input Form Card ── */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>📋 Accomplishment Report</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Fill in the details and click Submit to add to the table.</Typography>
                        </Box>
                      </Box>

                      {/* Employee Info */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Employee Information
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {[
                          { label: 'Name', value: user?.name },
                          { label: 'Designation', value: user?.designation },
                          { label: 'Institution / Unit', value: user?.institution },
                        ].map((f) => (
                          <Grid item xs={12} sm={4} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              InputProps={{ readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> }}
                              sx={{ '& .MuiOutlinedInput-root': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '& fieldset': { borderStyle: 'dashed' } } }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      <Divider sx={{ mb: 3 }} />

                      {/* Form Fields */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Add Accomplishment
                      </Typography>
                      {/* Date row */}
                      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date of Commencement" type="date"
                            value={accForm.dateStart} error={!!accErrors.dateStart} helperText={accErrors.dateStart}
                            onChange={(e) => setAccForm((p) => ({ ...p, dateStart: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date of Completion" type="date"
                            value={accForm.dateEnd} error={!!accErrors.dateEnd} helperText={accErrors.dateEnd}
                            onChange={(e) => setAccForm((p) => ({ ...p, dateEnd: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                      </Grid>

                      {/* Compose panel */}
                      <Box sx={{
                        border: `1px solid ${accErrors.area || accErrors.work ? '#ef4444' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        background: theme.palette.mode === 'dark' ? '#1e1e2e' : '#fff',
                        overflow: 'hidden',
                      }}>
                        <Box component="label" sx={{ display: 'block', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8e8e8'}`, cursor: 'text' }}>
                          <Box component="input" placeholder="Area" value={accForm.area}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccForm((p) => ({ ...p, area: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', px: 2, py: 1.5, fontSize: 15, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? '#7986cb' : '#4a90a4', opacity: 1 } }}
                          />
                        </Box>
                        <Box component="label" sx={{ display: 'block', cursor: 'text' }}>
                          <Box component="textarea" placeholder="Work" value={accForm.work} rows={5}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAccForm((p) => ({ ...p, work: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', resize: 'none', px: 2, pt: 1.5, pb: 2, fontSize: 14, lineHeight: 1.85, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c0c0c0', opacity: 1 } }}
                          />
                        </Box>
                        <Box sx={{ px: 2, py: 0.75, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', background: theme.palette.mode === 'dark' ? 'transparent' : '#fafafa' }}>
                          {(accErrors.area || accErrors.work) && <Typography sx={{ fontSize: 11, color: '#ef4444' }}>{accErrors.area || accErrors.work}</Typography>}
                          <Typography sx={{ fontSize: 11, color: '#c0c0c0', ml: 'auto' }}>{accForm.work.length} characters</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddAccomplishment} sx={{ px: 3 }}>
                          Submit
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditAccDialogOpen(true)} sx={{ px: 3 }}>
                          Edit Data
                        </Button>
                        <Button variant="text" startIcon={<CancelRoundedIcon />} onClick={() => { setAccForm(blankAcc); setAccErrors({}); }} color="inherit" sx={{ px: 3, color: theme.palette.text.secondary }}>Cancel</Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* ── Accomplishment Table ── */}
                  <Card sx={{ borderRadius: '20px' }}>
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <EmojiObjectsRoundedIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>ACCOMPLISHMENT FOR THE PERIOD</Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {accEntries.length} {accEntries.length === 1 ? 'entry' : 'entries'} recorded
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${accEntries.filter(a => a.completed).length} Done`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600 }} />
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#ef4444 !important', fontSize: 14 }} />} label={`${accEntries.filter(a => !a.completed).length} Pending`} size="small" sx={{ background: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600 }} />
                      </Box>
                    </Box>

                    <Box>
                      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                          <col style={{ width: '8%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '30%' }} />
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '11%' }} />
                        </colgroup>
                        <TableHead>
                          <TableRow sx={{ background: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.06)' }}>
                            {['Sl. No.', 'Area', 'Work', 'Date of Commencement', 'Date of Completion', 'Status'].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.75, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4, borderBottom: `2px solid ${theme.palette.primary.main}` }}>
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {accEntries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: theme.palette.text.secondary }}>
                                <EmojiObjectsRoundedIcon sx={{ fontSize: 40, opacity: 0.25, display: 'block', mx: 'auto', mb: 1 }} />
                                No accomplishments yet. Fill the form above and click Submit.
                              </TableCell>
                            </TableRow>
                          ) : (
                            accEntries.map((row, idx) => (
                              <TableRow key={row.id} sx={{ '&:hover': { background: alpha(theme.palette.primary.main, 0.04) }, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <TableCell sx={{ width: 80 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, background: alpha(theme.palette.primary.main, 0.1), borderRadius: '8px', px: 1.5, py: 0.3, fontSize: 12, textAlign: 'center', display: 'inline-block' }}>
                                    {String(idx + 1).padStart(2, '0')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={row.area} size="small" sx={{ fontSize: 11, fontWeight: 600, background: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.main }} />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 280 }}>
                                  <Typography variant="body2" sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{row.work}</Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <CalendarMonthRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                                      {row.dateStart ? fmtDispDate(row.dateStart) : '—'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <CalendarMonthRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                                      {row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <FlagCell completed={row.completed} onToggle={() => toggleAccomplishment(row.id)} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 3 — Pending & Priority Work
              ══════════════════════════════════════════════════ */}
              {tab === 3 && (
                <Box>
                  {/* Form Card */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>⚠️ Pending & Priority Work</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Fill in the details and click Submit to add to the priority table.</Typography>
                        </Box>
                      </Box>

                      {/* Employee Info */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Employee Information
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {[
                          { label: 'Name', value: user?.name },
                          { label: 'Designation', value: user?.designation },
                          { label: 'Institution / Unit', value: user?.institution },
                        ].map((f) => (
                          <Grid item xs={12} sm={4} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              InputProps={{ readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> }}
                              sx={{ '& .MuiOutlinedInput-root': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '& fieldset': { borderStyle: 'dashed' } } }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      <Divider sx={{ mb: 3 }} />

                      {/* Form Fields */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Add Pending / Priority Work
                      </Typography>
                      {/* Date + person row */}
                      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Responsible Person" placeholder="Name of responsible person"
                            value={pendingForm.responsiblePerson}
                            onChange={(e) => setPendingForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Status as on (Date)" type="date"
                            value={pendingForm.statusDate}
                            onChange={(e) => setPendingForm((p) => ({ ...p, statusDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date of Commencement" type="date"
                            value={pendingForm.dateStart} error={!!pendingErrors.dateStart} helperText={pendingErrors.dateStart}
                            onChange={(e) => setPendingForm((p) => ({ ...p, dateStart: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date of Completion" type="date"
                            value={pendingForm.dateEnd}
                            onChange={(e) => setPendingForm((p) => ({ ...p, dateEnd: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                      </Grid>

                      {/* Compose panel */}
                      <Box sx={{
                        border: `1px solid ${pendingErrors.areas || pendingErrors.particulars ? '#ef4444' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        background: theme.palette.mode === 'dark' ? '#1e1e2e' : '#fff',
                        overflow: 'hidden',
                      }}>
                        <Box component="label" sx={{ display: 'block', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8e8e8'}`, cursor: 'text' }}>
                          <Box component="input" placeholder="Areas" value={pendingForm.areas}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingForm((p) => ({ ...p, areas: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', px: 2, py: 1.5, fontSize: 15, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? '#7986cb' : '#4a90a4', opacity: 1 } }}
                          />
                        </Box>
                        <Box component="label" sx={{ display: 'block', cursor: 'text' }}>
                          <Box component="textarea" placeholder="Particulars" value={pendingForm.particulars} rows={5}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPendingForm((p) => ({ ...p, particulars: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', resize: 'none', px: 2, pt: 1.5, pb: 2, fontSize: 14, lineHeight: 1.85, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c0c0c0', opacity: 1 } }}
                          />
                        </Box>
                        <Box sx={{ px: 2, py: 0.75, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', background: theme.palette.mode === 'dark' ? 'transparent' : '#fafafa' }}>
                          {pendingForm.particulars.length > 0 && <Typography sx={{ fontSize: 11, color: '#c0c0c0', ml: 'auto' }}>{pendingForm.particulars.length} characters</Typography>}
                        </Box>
                      </Box>
                      <TextField fullWidth label="Remarks" placeholder="E.g., Awaiting response from unit lead"
                        value={pendingForm.remarks} sx={{ mt: 2.5 }}
                        onChange={(e) => setPendingForm((p) => ({ ...p, remarks: e.target.value }))} />

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddPending} sx={{ px: 3 }}>
                          Submit
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditPendingDialogOpen(true)} sx={{ px: 3 }}>
                          Edit Data
                        </Button>
                        <Button variant="text" startIcon={<CancelRoundedIcon />} onClick={() => { setPendingForm(blankPending); setPendingErrors({}); }} color="inherit" sx={{ px: 3, color: theme.palette.text.secondary }}>Cancel</Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Table */}
                  <Card sx={{ borderRadius: '20px' }}>
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <WarningAmberRoundedIcon sx={{ color: '#f59e0b', fontSize: 22 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>PENDING & PRIORITY WORK LIST</Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {pendingEntries.length} items logged
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${pendingEntries.filter(p => p.completed).length} Done`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600 }} />
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#ef4444 !important', fontSize: 14 }} />} label={`${pendingEntries.filter(p => !p.completed).length} Pending`} size="small" sx={{ background: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600 }} />
                      </Box>
                    </Box>

                    <Box>
                      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                          <TableRow sx={{ background: theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.06)' }}>
                            {['Sl. No.', 'Areas', 'Particulars', 'Responsible Person', 'Date of Commencement', 'Date of Completion', 'Status as on (Date)', 'Remarks', 'Status'].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.75, whiteSpace: 'nowrap', borderBottom: `2px solid #f59e0b` }}>
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingEntries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: theme.palette.text.secondary }}>
                                <WarningAmberRoundedIcon sx={{ fontSize: 40, opacity: 0.25, display: 'block', mx: 'auto', mb: 1 }} />
                                No pending work records. Fill the form above and click Submit.
                              </TableCell>
                            </TableRow>
                          ) : (
                            pendingEntries.map((row, idx) => (
                              <TableRow key={row.id} sx={{ '&:hover': { background: alpha('#f59e0b', 0.04) }, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b', background: alpha('#f59e0b', 0.1), borderRadius: '8px', px: 1.5, py: 0.3, fontSize: 12, textAlign: 'center', display: 'inline-block' }}>
                                    {String(idx + 1).padStart(2, '0')}
                                  </Typography>
                                </TableCell>
                                <TableCell><Chip label={row.areas} size="small" sx={{ fontSize: 11, fontWeight: 600, background: alpha('#f59e0b', 0.15), color: '#d97706' }} /></TableCell>
                                <TableCell sx={{ maxWidth: 220 }}><Typography variant="body2" sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{row.particulars}</Typography></TableCell>
                                <TableCell><Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>{row.responsiblePerson || '—'}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2" sx={{ fontSize: 13 }}>{row.dateStart ? fmtDispDate(row.dateStart) : '—'}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2" sx={{ fontSize: 13 }}>{row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2" sx={{ fontSize: 13 }}>{row.statusDate ? fmtDispDate(row.statusDate) : '—'}</Typography></TableCell>
                                <TableCell sx={{ minWidth: 150 }}><Typography variant="body2" sx={{ fontSize: 13, color: '#787878' }}>{row.remarks || '—'}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <FlagCell completed={row.completed} onToggle={() => togglePending(row.id)} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 4 — Weekly Plan
              ══════════════════════════════════════════════════ */}
              {tab === 4 && (
                <Box>
                  {/* Form */}
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>📅 Weekly Plan</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Define work allocations and schedules for the week.</Typography>
                        </Box>
                      </Box>

                      {/* Employee Info */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Employee Information
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {[
                          { label: 'Name', value: user?.name },
                          { label: 'Designation', value: user?.designation },
                          { label: 'Institution / Unit', value: user?.institution },
                        ].map((f) => (
                          <Grid item xs={12} sm={4} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              InputProps={{ readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> }}
                              sx={{ '& .MuiOutlinedInput-root': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', '& fieldset': { borderStyle: 'dashed' } } }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      <Divider sx={{ mb: 3 }} />

                      {/* Form Fields */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Add Weekly Allocation
                      </Typography>
                      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date" type="date"
                            value={weeklyForm.date} error={!!weeklyErrors.date} helperText={weeklyErrors.date}
                            onChange={(e) => setWeeklyForm((p) => ({ ...p, date: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Responsible Person" placeholder="Name or 'Self'"
                            value={weeklyForm.responsiblePerson}
                            onChange={(e) => setWeeklyForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
                        </Grid>
                      </Grid>

                      {/* Compose panel */}
                      <Box sx={{
                        border: `1px solid ${weeklyErrors.work ? '#ef4444' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        background: theme.palette.mode === 'dark' ? '#1e1e2e' : '#fff',
                        overflow: 'hidden',
                      }}>
                        <Box component="label" sx={{ display: 'block', cursor: 'text' }}>
                          <Box component="textarea" placeholder="Planned Work Details..." value={weeklyForm.work} rows={5}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWeeklyForm((p) => ({ ...p, work: e.target.value }))}
                            sx={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', resize: 'none', px: 2, pt: 1.5, pb: 2, fontSize: 14, lineHeight: 1.85, fontFamily: 'inherit', color: theme.palette.text.primary, '&::placeholder': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c0c0c0', opacity: 1 } }}
                          />
                        </Box>
                        <Box sx={{ px: 2, py: 0.75, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', background: theme.palette.mode === 'dark' ? 'transparent' : '#fafafa' }}>
                          {weeklyForm.work.length > 0 && <Typography sx={{ fontSize: 11, color: '#c0c0c0', ml: 'auto' }}>{weeklyForm.work.length} characters</Typography>}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddWeekly} sx={{ px: 3 }}>
                          Submit
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditWeeklyDialogOpen(true)} sx={{ px: 3 }}>
                          Edit Data
                        </Button>
                        <Button variant="text" startIcon={<CancelRoundedIcon />} onClick={() => { setWeeklyForm(blankWeekly); setWeeklyErrors({}); }} color="inherit" sx={{ px: 3, color: theme.palette.text.secondary }}>Cancel</Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Table */}
                  <Card sx={{ borderRadius: '20px' }}>
                    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CalendarMonthRoundedIcon sx={{ color: '#06b6d4', fontSize: 22 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>WEEKLY WORK ALLOCATION PLAN</Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {weeklyEntries.length} entries scheduled
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${weeklyEntries.filter(w => w.completed).length} Done`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 600 }} />
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#ef4444 !important', fontSize: 14 }} />} label={`${weeklyEntries.filter(w => !w.completed).length} Pending`} size="small" sx={{ background: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 600 }} />
                      </Box>
                    </Box>

                    <Box>
                      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                          <TableRow sx={{ background: theme.palette.mode === 'dark' ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.06)' }}>
                            {['Sl. No.', 'Date', 'Work Details', 'Responsible Person', 'Status'].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.75, whiteSpace: 'nowrap', borderBottom: `2px solid #06b6d4` }}>
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {weeklyEntries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5, color: theme.palette.text.secondary }}>
                                <CalendarMonthRoundedIcon sx={{ fontSize: 40, opacity: 0.25, display: 'block', mx: 'auto', mb: 1 }} />
                                No weekly plans yet. Fill the form above and click Submit.
                              </TableCell>
                            </TableRow>
                          ) : (
                            weeklyEntries.map((row, idx) => (
                              <TableRow key={row.id} sx={{ '&:hover': { background: alpha('#06b6d4', 0.04) }, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0891b2', background: alpha('#06b6d4', 0.1), borderRadius: '8px', px: 1.5, py: 0.3, fontSize: 12, textAlign: 'center', display: 'inline-block' }}>
                                    {String(idx + 1).padStart(2, '0')}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <CalendarTodayRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                                      {row.date ? fmtDispDate(row.date) : '—'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ maxWidth: 350 }}><Typography variant="body2" sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{row.work}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={row.responsiblePerson} size="small" color="info" sx={{ fontSize: 11, fontWeight: 600 }} /></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <FlagCell completed={row.completed} onToggle={() => toggleWeekly(row.id)} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>
                </Box>
              )}
            </Box>
          )}

        </Box>
      </Fade>

      {/* ── Dialogs for Editing ── */}
      {/* Tab 0: Daily Report Edit Dialog */}
      <Dialog open={editReportDialogOpen} onClose={() => { setEditReportDialogOpen(false); setEditReportDialogId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Daily Report</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-report-select-label">Select Report to Edit</InputLabel>
            <Select
              labelId="edit-report-select-label"
              value={editReportDialogId}
              label="Select Report to Edit"
              onChange={(e) => {
                const id = e.target.value as number;
                setEditReportDialogId(id);
                const row = rows.find(r => r.id === id);
                if (row) {
                  setEditReportDialogForm({ date: row.date, area: row.area, report: row.report });
                }
              }}
            >
              {rows.map((row) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. {String(row.slNo).padStart(2, '0')} - {row.area} ({new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editReportDialogId !== '' && (
            <>
              <TextField label="Area / Work Area" fullWidth value={editReportDialogForm.area} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, area: e.target.value }))} />
              <TextField label="Report / Activities" fullWidth multiline rows={6} value={editReportDialogForm.report} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, report: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditReportDialogOpen(false); setEditReportDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveEditReport} disabled={editReportDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 1: 100 Days Goal Edit Dialog */}
      <Dialog open={editGoalDialogOpen} onClose={() => { setEditGoalDialogOpen(false); setEditGoalDialogId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit 100 Days Goal</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-goal-select-label">Select Day to Edit</InputLabel>
            <Select
              labelId="edit-goal-select-label"
              value={editGoalDialogId}
              label="Select Day to Edit"
              onChange={(e) => {
                const id = e.target.value as number;
                setEditGoalDialogId(id);
                const row = goals.find(r => r.id === id);
                if (row) {
                  setEditGoalDialogForm({ date: row.date, goal: row.goal, responsiblePerson: row.responsiblePerson || '' });
                }
              }}
            >
              {goals.map((row) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. No. {String(row.day).padStart(3, '0')} - {row.goal.substring(0, 45)}...
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editGoalDialogId !== '' && (
            <>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editGoalDialogForm.date} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, date: e.target.value }))} />
              <TextField label="Work" fullWidth multiline rows={4} value={editGoalDialogForm.goal} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, goal: e.target.value }))} />
              <TextField label="Responsible Person" fullWidth value={editGoalDialogForm.responsiblePerson} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditGoalDialogOpen(false); setEditGoalDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }} onClick={handleSaveEditGoal} disabled={editGoalDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 2: Accomplishment Edit Dialog */}
      <Dialog open={editAccDialogOpen} onClose={() => { setEditAccDialogOpen(false); setEditAccDialogId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Accomplishment</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-acc-select-label">Select Accomplishment to Edit</InputLabel>
            <Select
              labelId="edit-acc-select-label"
              value={editAccDialogId}
              label="Select Accomplishment to Edit"
              onChange={(e) => {
                const id = e.target.value as number;
                setEditAccDialogId(id);
                const row = accEntries.find(r => r.id === id);
                if (row) {
                  setEditAccDialogForm({ area: row.area, work: row.work, dateStart: row.dateStart, dateEnd: row.dateEnd });
                }
              }}
            >
              {accEntries.map((row, idx) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. {String(idx + 1).padStart(2, '0')} - {row.area} ({row.work.substring(0, 30)}...)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editAccDialogId !== '' && (
            <>
              <TextField label="Area" fullWidth value={editAccDialogForm.area} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, area: e.target.value }))} />
              <TextField label="Work" fullWidth value={editAccDialogForm.work} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, work: e.target.value }))} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editAccDialogForm.dateStart} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, dateStart: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editAccDialogForm.dateEnd} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditAccDialogOpen(false); setEditAccDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveEditAcc} disabled={editAccDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 3: Pending Work Edit Dialog */}
      <Dialog open={editPendingDialogOpen} onClose={() => { setEditPendingDialogOpen(false); setEditPendingDialogId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Pending & Priority Work</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-pending-select-label">Select Pending Work to Edit</InputLabel>
            <Select
              labelId="edit-pending-select-label"
              value={editPendingDialogId}
              label="Select Pending Work to Edit"
              onChange={(e) => {
                const id = e.target.value as number;
                setEditPendingDialogId(id);
                const row = pendingEntries.find(r => r.id === id);
                if (row) {
                  setEditPendingDialogForm({ areas: row.areas, particulars: row.particulars, responsiblePerson: row.responsiblePerson, dateStart: row.dateStart, dateEnd: row.dateEnd, statusDate: row.statusDate, remarks: row.remarks });
                }
              }}
            >
              {pendingEntries.map((row, idx) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. {String(idx + 1).padStart(2, '0')} - {row.areas} ({row.particulars.substring(0, 30)}...)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editPendingDialogId !== '' && (
            <>
              <TextField label="Areas" fullWidth value={editPendingDialogForm.areas} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, areas: e.target.value }))} />
              <TextField label="Particulars" fullWidth value={editPendingDialogForm.particulars} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, particulars: e.target.value }))} />
              <TextField label="Responsible Person" fullWidth value={editPendingDialogForm.responsiblePerson} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}><TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.dateStart} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateStart: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.dateEnd} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Status Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.statusDate} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, statusDate: e.target.value }))} /></Grid>
              </Grid>
              <TextField label="Remarks" fullWidth value={editPendingDialogForm.remarks} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, remarks: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditPendingDialogOpen(false); setEditPendingDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" sx={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }} onClick={handleSaveEditPending} disabled={editPendingDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 4: Weekly Plan Edit Dialog */}
      <Dialog open={editWeeklyDialogOpen} onClose={() => { setEditWeeklyDialogOpen(false); setEditWeeklyDialogId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Weekly Plan</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-weekly-select-label">Select Plan to Edit</InputLabel>
            <Select
              labelId="edit-weekly-select-label"
              value={editWeeklyDialogId}
              label="Select Plan to Edit"
              onChange={(e) => {
                const id = e.target.value as number;
                setEditWeeklyDialogId(id);
                const row = weeklyEntries.find(r => r.id === id);
                if (row) {
                  setEditWeeklyDialogForm({ date: row.date, work: row.work, responsiblePerson: row.responsiblePerson });
                }
              }}
            >
              {weeklyEntries.map((row, idx) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. {String(idx + 1).padStart(2, '0')} - {row.responsiblePerson || 'Unassigned'} ({row.work.substring(0, 30)}...)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editWeeklyDialogId !== '' && (
            <>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editWeeklyDialogForm.date} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, date: e.target.value }))} />
              <TextField label="Work" fullWidth value={editWeeklyDialogForm.work} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, work: e.target.value }))} />
              <TextField label="Responsible Person" fullWidth value={editWeeklyDialogForm.responsiblePerson} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, responsiblePerson: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditWeeklyDialogOpen(false); setEditWeeklyDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" sx={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)' }} onClick={handleSaveEditWeekly} disabled={editWeeklyDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default DailyReportPage;
