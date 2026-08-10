import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Grid, Chip,
  Divider, Tooltip, Fade, Alert, Snackbar, alpha, useTheme,
  Tab, Tabs, LinearProgress, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, TablePagination
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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
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
  dateEnd?: string;
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

const getReportDateBounds = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const yesterdayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yYear = yesterdayObj.getFullYear();
  const yMonth = String(yesterdayObj.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayObj.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  const isAfter6PM = now.getHours() >= 18;
  const minDateStr = isAfter6PM ? todayStr : yesterdayStr;
  const maxDateStr = todayStr;

  return { minDateStr, maxDateStr, todayStr, yesterdayStr, isAfter6PM };
};

const initialForm = { date: '', area: '', report: '' };
const blankGoal = { day: '', date: '', goal: '', responsiblePerson: '' };
const blankAcc = { area: '', work: '', dateStart: '', dateEnd: '' };
const blankPending = { areas: '', particulars: '', responsiblePerson: '', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' };
const blankWeekly = { date: '', work: '', responsiblePerson: '' };

// ─── Flag Cell ───────────────────────────────────────────────────────────────
const FlagCell: React.FC<{ completed: boolean; onToggle?: () => void }> = ({ completed, onToggle }) => (
  <Tooltip title={completed ? 'Completed' : 'Pending'} arrow>
    <Box 
      onClick={onToggle}
      sx={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        cursor: onToggle ? 'pointer' : 'default', gap: 0.75,
      }}
    >
      <FlagRoundedIcon sx={{
        fontSize: 22,
        color: completed ? '#22c55e' : '#ef4444',
        filter: completed ? 'drop-shadow(0 0 5px rgba(34,197,94,0.6))' : 'drop-shadow(0 0 5px rgba(239,68,68,0.6))',
        transition: 'all 0.3s',
      }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: completed ? '#22c55e' : '#ef4444', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {completed ? 'COMPLETED' : 'PENDING'}
      </Typography>
    </Box>
  </Tooltip>
);

const addDaysToDate = (baseDateISO: string, daysToAdd: number): string => {
  if (!baseDateISO) return '';
  const d = new Date(baseDateISO);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DailyReportPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(initialForm);
  type ExcelGridRow = { id?: number; date: string; area: string; work: string };
  const [reportGrid, setReportGrid] = useState<ExcelGridRow[]>([
    { date: '', area: '', work: '' },
    { date: '', area: '', work: '' },
    { date: '', area: '', work: '' },
    { date: '', area: '', work: '' }
  ]);
  const [rows, setRows] = useState<ReportRow[]>([]);

  const syncGridWithReports = (allReports: ReportRow[], targetDate: string) => {
    const matching = allReports.filter((r) => r.date === targetDate);
    const grid: ExcelGridRow[] = matching.map((m) => ({
      id: m.id,
      date: m.date,
      area: m.area,
      work: m.report,
    }));

    while (grid.length < 4) {
      grid.push({ date: targetDate, area: '', work: '' });
    }

    setReportGrid(grid);
  };
  const [goals, setGoals] = useState<GoalRow[]>([]);

  type GoalGridRow = { id?: number; day: string; date: string; dateEnd: string; goal: string };
  const [goalGrid, setGoalGrid] = useState<GoalGridRow[]>(() => {
    const today = getReportDateBounds().todayStr;
    return [
      { day: '1', date: today, dateEnd: today, goal: '' },
      { day: '2', date: addDaysToDate(today, 1), dateEnd: addDaysToDate(today, 1), goal: '' },
      { day: '3', date: addDaysToDate(today, 2), dateEnd: addDaysToDate(today, 2), goal: '' },
      { day: '4', date: addDaysToDate(today, 3), dateEnd: addDaysToDate(today, 3), goal: '' },
    ];
  });

  const syncGridWithGoals = (allGoals: GoalRow[]) => {
    const grid: GoalGridRow[] = allGoals.map((g, idx) => ({
      id: g.id,
      day: String(g.day || idx + 1),
      date: g.date,
      dateEnd: g.dateEnd || g.date,
      goal: g.goal,
    }));

    const today = getReportDateBounds().todayStr;
    let lastDate = grid.length > 0 ? grid[grid.length - 1].date : today;

    while (grid.length < 4) {
      const nextDay = grid.length + 1;
      lastDate = grid.length > 0 ? addDaysToDate(lastDate, 1) : today;
      grid.push({ day: String(nextDay), date: lastDate, dateEnd: lastDate, goal: '' });
    }

    setGoalGrid(grid);
  };
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);

  // Request Access State
  const [requestAccessDialogOpen, setRequestAccessDialogOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<{ module: string; itemId: number; title: string } | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const handleCheckAndOpenEdit = async (module: string, itemId: number, title: string, openEditDialog: () => void) => {
    if (user?.role === 'admin' || user?.role === 'chairman') {
      openEditDialog();
      return;
    }

    try {
      const res = await apiRequest<any>(`/api/edit-requests/check-permission?module=${module}&item_id=${itemId}`);
      if (res?.can_edit) {
        setSnack({
          open: true,
          msg: `Edit Access Granted by Admin! (Active 24h Pass)`,
          severity: 'success'
        });
        openEditDialog();
      } else if (res?.status === 'pending') {
        setSnack({
          open: true,
          msg: 'Your edit request is pending Admin approval. Please wait for Admin to approve.',
          severity: 'warning'
        });
      } else {
        setRequestTarget({ module, itemId, title });
        setRequestReason('');
        setRequestAccessDialogOpen(true);
      }
    } catch (err) {
      setRequestTarget({ module, itemId, title });
      setRequestReason('');
      setRequestAccessDialogOpen(true);
    }
  };

  const handleSendEditRequest = async () => {
    if (!requestTarget) return;
    setSubmittingRequest(true);
    try {
      await apiRequest('/api/edit-requests', {
        method: 'POST',
        bodyData: {
          module: requestTarget.module,
          item_id: requestTarget.itemId,
          item_title: requestTarget.title,
          reason: requestReason.trim() || 'Requesting edit access for submitted entry.'
        }
      });
      setRequestAccessDialogOpen(false);
      setSnack({
        open: true,
        msg: 'Edit request sent to Admin! Admin has to accept your request for 24-hour edit access.',
        severity: 'info'
      });
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to send edit request', severity: 'error' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Track which row IDs have already been edited for their dates (one-time edit enforcement)
  const [editedDates, setEditedDates] = useState<Record<string, (string | number)[]>>(() => {
    try {
      const stored = localStorage.getItem(`edited_dates_${user?.empId || 'default'}`);
      return stored ? JSON.parse(stored) : { goals: [], accomplishments: [], pending: [] };
    } catch {
      return { goals: [], accomplishments: [], pending: [] };
    }
  });

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
  const [editAccDateDialog, setEditAccDateDialog] = useState<{ open: boolean; rowId: string | number; dateStart: string; dateEnd: string; work: string }>({
    open: false,
    rowId: '',
    dateStart: '',
    dateEnd: '',
    work: '',
  });


  // Tab 3 Edit Dialog State
  const [editPendingDialogOpen, setEditPendingDialogOpen] = useState(false);
  const [editPendingDialogId, setEditPendingDialogId] = useState<number | ''>('');
  const [editPendingDialogForm, setEditPendingDialogForm] = useState(blankPending);
  const [editPendingDateDialog, setEditPendingDateDialog] = useState({
    open: false,
    rowId: '' as string | number,
    dateStart: '',
    dateEnd: '',
    statusDate: '',
    work: ''
  });


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
  const [dailyAccEntries, setDailyAccEntries] = useState<any[]>([]);
  const [weeklyAccEntries, setWeeklyAccEntries] = useState<any[]>([]);
  const [dailyPage, setDailyPage] = useState(0);
  const [dailyRowsPerPage, setDailyRowsPerPage] = useState(10);
  const [weeklyPage, setWeeklyPage] = useState(0);
  const [weeklyRowsPerPage, setWeeklyRowsPerPage] = useState(10);
  const [accErrors, setAccErrors] = useState<Partial<typeof blankAcc>>({});

  // ── Pending & Priority state ──
  const [pendingForm, setPendingForm] = useState(blankPending);
  const [pendingEntries, setPendingEntries] = useState<PendingRow[]>([]);
  const [pendingErrors, setPendingErrors] = useState<Partial<typeof blankPending>>({});

  type PendingGridRow = {
    id?: number;
    areas: string;
    particulars: string;
    responsiblePerson: string;
    dateStart: string;
    dateEnd: string;
    statusDate: string;
    completed: boolean;
    remarks: string;
  };

  const [pendingGrid, setPendingGrid] = useState<PendingGridRow[]>(() => {
    return [
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' }
    ];
  });

  const syncGridWithPending = (allPending: PendingRow[]) => {
    const grid: PendingGridRow[] = allPending.map((p) => ({
      id: p.id,
      areas: p.areas,
      particulars: p.particulars,
      responsiblePerson: p.responsiblePerson || 'Self',
      dateStart: p.dateStart,
      dateEnd: p.dateEnd || '',
      statusDate: p.statusDate || '',
      completed: p.completed,
      remarks: p.remarks || '',
    }));

    while (grid.length < 4) {
      grid.push({ areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' });
    }

    setPendingGrid(grid);
  };

  const handleAddPendingRows = () => {
    setPendingGrid((prev) => [
      ...prev,
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', statusDate: '', completed: false, remarks: '' }
    ]);
  };

  // ── Weekly Plan state ──
  const [weekFrom, setWeekFrom] = useState(() => getReportDateBounds().todayStr);
  const [weekTo,   setWeekTo]   = useState(() => addDaysToDate(getReportDateBounds().todayStr, 6));
  const [weeklyForm, setWeeklyForm]       = useState(blankWeekly);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyPlanRow[]>([]);
  const [weeklyErrors, setWeeklyErrors]   = useState<Partial<typeof blankWeekly>>({});

  type WeeklyGridRow = { id?: number; date: string; dateEnd: string; work: string };

  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGridRow[]>([]);

  const handleWeeklyGridDateChange = (idx: number, field: 'date' | 'dateEnd', newDate: string) => {
    setWeeklyGrid((prev) => {
      const updated = [...prev];
      if (field === 'date') {
        // When Starting Date changes, auto-set Ending Date to +6 days
        const start = newDate;
        const end = addDaysToDate(start, 6);
        updated[idx] = { ...updated[idx], date: start, dateEnd: end };
      } else {
        // When Ending Date changes, just update it (UI constrains to within 7 days)
        updated[idx] = { ...updated[idx], dateEnd: newDate };
      }
      return updated;
    });
  };

  const syncGridWithWeekly = (allWeekly: WeeklyPlanRow[]) => {
    const todayStr = getReportDateBounds().todayStr;

    // Filter: only keep entries whose 7-day period hasn't ended yet
    const activeEntries = allWeekly.filter((m) => {
      const endDate = addDaysToDate(m.date, 6);
      return endDate >= todayStr; // keep if ending date is today or in the future
    });

    if (activeEntries.length === 0) {
      // All entries expired or no entries — show empty table for new week
      const grid: WeeklyGridRow[] = [];
      for (let i = 0; i < 4; i++) {
        grid.push({ date: '', dateEnd: '', work: '' });
      }
      setWeeklyGrid(grid);
      return;
    }

    const grid: WeeklyGridRow[] = activeEntries.map((m) => ({
      id: m.id,
      date: m.date,
      dateEnd: addDaysToDate(m.date, 6),
      work: m.work,
    }));

    // Pad with empty rows if less than 4
    while (grid.length < 4) {
      grid.push({ date: '', dateEnd: '', work: '' });
    }

    setWeeklyGrid(grid);
  };

  const handleAddWeeklyRows = () => {
    const todayStr = getReportDateBounds().todayStr;
    setWeeklyGrid((prev) => {
      const lastRow = prev[prev.length - 1];
      const lastEnd = lastRow?.dateEnd || (lastRow?.date ? addDaysToDate(lastRow.date, 6) : todayStr);

      const week1Start = addDaysToDate(lastEnd, 1);
      const week1End = addDaysToDate(week1Start, 6);

      const week2Start = addDaysToDate(week1End, 1);
      const week2End = addDaysToDate(week2Start, 6);

      return [
        ...prev,
        { date: week1Start, dateEnd: week1End, work: '' },
        { date: week2Start, dateEnd: week2End, work: '' }
      ];
    });
  };

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
        completed: r.completed ?? true,
      }));
      setRows(mapped);
      syncGridWithReports(mapped, form.date || getReportDateBounds().todayStr);
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
        dateEnd: g.date_end || g.date,
        goal: g.goal,
        completed: g.completed ?? true,
        responsiblePerson: g.responsible_person || 'Self',
      }));
      setGoals(mapped);
      syncGridWithGoals(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccomplishments = async () => {
    setLoading(true);
    try {
      const [reportsData, weeklyData, accData] = await Promise.all([
        apiRequest<any[]>('/api/reports'),
        apiRequest<any[]>('/api/weekly'),
        apiRequest<any[]>('/api/accomplishments')
      ]);

      const dailyFromReports = reportsData
        .filter((r) => r.completed === true || r.completed === undefined)
        .map((r) => ({
          id: r.id,
          area: r.area,
          work: r.report,
          date: r.date,
          completed: true
        }));

      const directAccs = accData
        .filter((a) => a.completed === true || a.completed === undefined)
        .map((a) => ({
          id: a.id,
          area: a.area,
          work: a.work,
          date: a.date_start,
          completed: true
        }));

      const allDaily = [...dailyFromReports, ...directAccs];
      allDaily.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const weeklyMapped = weeklyData
        .map((w) => ({
          id: w.id,
          dateStart: w.date,
          dateEnd: addDaysToDate(w.date, 6),
          work: w.work,
          completed: true
        }));
      weeklyMapped.sort((a, b) => (b.dateStart || '').localeCompare(a.dateStart || ''));

      setDailyAccEntries(allDaily);
      setWeeklyAccEntries(weeklyMapped);
      setAccEntries(allDaily);
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
        completed: p.completed ?? true,
      }));
      setPendingEntries(mapped);
      syncGridWithPending(mapped);
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
        completed: w.completed ?? true,
      }));
      setWeeklyEntries(mapped);
      syncGridWithWeekly(mapped);
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

  const handleAddGoalGrid = async () => {
    const newEntries = goalGrid.filter((row) => !row.id && row.goal.trim().length > 0);
    if (newEntries.length === 0) {
      setSnack({ open: true, msg: 'Please enter goal details in at least one row before submitting.', severity: 'warning' });
      return;
    }
    try {
      for (const item of newEntries) {
        await apiRequest('/api/goals', {
          method: 'POST',
          bodyData: {
            day: Number(item.day || 1),
            date: item.date || getReportDateBounds().todayStr,
            date_end: item.dateEnd || item.date || getReportDateBounds().todayStr,
            goal: item.goal.trim(),
            responsible_person: 'Self',
            completed: true,
          },
        });
      }
      setSnack({ open: true, msg: `Successfully submitted ${newEntries.length} 100 Days Goal ${newEntries.length === 1 ? 'entry' : 'entries'}!`, severity: 'success' });
      fetchGoals();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to submit goals', severity: 'error' });
    }
  };

  const handleAddGoalRows = () => {
    setGoalGrid((prev) => {
      const lastDate = prev.length > 0 && prev[prev.length - 1].date ? prev[prev.length - 1].date : getReportDateBounds().todayStr;
      const d1 = addDaysToDate(lastDate, 1);
      const d2 = addDaysToDate(lastDate, 2);
      return [
        ...prev,
        { day: String(prev.length + 1), date: d1, dateEnd: d1, goal: '' },
        { day: String(prev.length + 2), date: d2, dateEnd: d2, goal: '' },
      ];
    });
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
          completed: true
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
            completed: true
          }
        });
        // Add to editedDates to enforce one-time edit limit
        const updatedEdited = {
          ...editedDates,
          goals: [...(editedDates.goals || []), editGoalDialogId]
        };
        setEditedDates(updatedEdited);
        localStorage.setItem(`edited_dates_${user?.empId}`, JSON.stringify(updatedEdited));

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
  const handleSubmitPendingGrid = async () => {
    const newEntries = pendingGrid.filter((row) => !row.id && (row.areas.trim().length > 0 || row.particulars.trim().length > 0));
    if (newEntries.length === 0) {
      setSnack({ open: true, msg: 'Please enter details in at least one row before submitting.', severity: 'warning' });
      return;
    }

    const hasMissingDate = newEntries.some((row) => !row.dateStart);
    if (hasMissingDate) {
      setSnack({ open: true, msg: 'Please select Date of Commencement for all rows being submitted.', severity: 'warning' });
      return;
    }

    try {
      for (const row of newEntries) {
        await apiRequest('/api/pending', {
          method: 'POST',
          bodyData: {
            areas: row.areas.trim() || 'General',
            particulars: row.particulars.trim() || 'Pending Work Details',
            responsible_person: row.responsiblePerson || 'Self',
            date_start: row.dateStart,
            date_end: row.dateEnd || null,
            status_date: row.statusDate || null,
            remarks: row.remarks || '',
            completed: row.completed
          }
        });
      }
      setSnack({ open: true, msg: 'Pending & Priority entries saved successfully!', severity: 'success' });
      fetchPending();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to submit entries', severity: 'error' });
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
            remarks: editPendingDialogForm.remarks,
            completed: editPendingDialogForm.completed
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

  const handleSavePendingDates = async () => {
    if (editPendingDateDialog.rowId !== '') {
      try {
        const row = pendingEntries.find(r => r.id === editPendingDateDialog.rowId);
        if (!row) return;
        await apiRequest(`/api/pending/${editPendingDateDialog.rowId}`, {
          method: 'PUT',
          bodyData: {
            areas: row.areas,
            particulars: row.particulars,
            responsible_person: row.responsiblePerson || 'Self',
            date_start: editPendingDateDialog.dateStart,
            date_end: editPendingDateDialog.dateEnd || null,
            status_date: editPendingDateDialog.statusDate || null,
            remarks: row.remarks,
            completed: row.completed
          }
        });
        // Add to editedDates to enforce one-time edit limit
        const updatedEdited = {
          ...editedDates,
          pending: [...(editedDates.pending || []), editPendingDateDialog.rowId]
        };
        setEditedDates(updatedEdited);
        localStorage.setItem(`edited_dates_${user?.empId}`, JSON.stringify(updatedEdited));

        setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', statusDate: '', work: '' });
        setSnack({ open: true, msg: 'Dates updated successfully!', severity: 'success' });
        fetchPending();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update dates', severity: 'error' });
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
    const todayStr = getReportDateBounds().todayStr;
    const filledRows = weeklyGrid.filter(r => r.work.trim());

    if (filledRows.length === 0) {
      setWeeklyErrors({ work: 'Please enter at least one Work detail in the Excel grid below.' });
      return;
    }

    try {
      for (const row of filledRows) {
        const rowDate = row.date || todayStr;
        if (row.id) {
          await apiRequest(`/api/weekly/${row.id}`, {
            method: 'PUT',
            bodyData: {
              date: rowDate,
              work: row.work.trim(),
              responsible_person: 'Self'
            }
          });
        } else {
          await apiRequest('/api/weekly', {
            method: 'POST',
            bodyData: {
              date: rowDate,
              work: row.work.trim(),
              responsible_person: 'Self'
            }
          });
        }
      }
      setSnack({ open: true, msg: `${filledRows.length} Weekly Plan entry row(s) saved successfully!`, severity: 'success' });
      setWeeklyErrors({});
      fetchWeekly();
      fetchAccomplishments();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message || 'Failed to save weekly plan', severity: 'error' });
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
  const handleAddRows = () => {
    const defaultDate = form.date || getReportDateBounds().todayStr;
    setReportGrid((prev) => [
      ...prev,
      { date: defaultDate, area: '', work: '' },
      { date: defaultDate, area: '', work: '' }
    ]);
  };

  const handleReset = () => {
    setForm(initialForm);
    const todayStr = getReportDateBounds().todayStr;
    setReportGrid([
      { date: todayStr, area: '', work: '' },
      { date: todayStr, area: '', work: '' },
      { date: todayStr, area: '', work: '' },
      { date: todayStr, area: '', work: '' }
    ]);
    setErrors({});
  };

  const handleSubmit = async () => {
    const { minDateStr, maxDateStr, todayStr } = getReportDateBounds();
    const defaultDate = form.date || todayStr;
    const e: Partial<typeof form> = {};

    const filledRows = reportGrid.filter(r => r.area.trim() || r.work.trim());
    if (filledRows.length === 0) {
      e.report = 'Please enter at least one Area and Work row in the Excel grid below.';
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    try {
      for (const row of filledRows) {
        const rowDate = row.date || defaultDate;
        if (row.id) {
          await apiRequest(`/api/reports/${row.id}`, {
            method: 'PUT',
            bodyData: {
              date: rowDate,
              area: row.area.trim() || 'General',
              report: row.work.trim() || 'Work Completed',
              completed: true
            }
          });
        } else {
          await apiRequest('/api/reports', {
            method: 'POST',
            bodyData: {
              date: rowDate,
              area: row.area.trim() || 'General',
              report: row.work.trim() || 'Work Completed',
              completed: true
            }
          });
        }
      }
      setSnack({ open: true, msg: `Daily Report entries saved successfully!`, severity: 'success' });
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
            completed: true
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
      field: 'report', headerName: 'Work', flex: 2, minWidth: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" title={p.value as string} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: theme.palette.text.secondary, fontSize: 13, py: 0.5, lineHeight: 1.5 }}>
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
      field: 'day', headerName: 'Sl. No.', flex: 0.4, minWidth: 65,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#6366f1', background: alpha('#6366f1', 0.12), borderRadius: '8px', px: 1.2, py: 0.3, fontSize: 13 }}>
          {String(p.value as number).padStart(3, '0')}
        </Typography>
      ),
    },
    {
      field: 'date', headerName: 'Date', flex: 0.8, minWidth: 120,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 700 }}>
            {new Date(p.value as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'goal', headerName: 'Work', flex: 2, minWidth: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" title={p.value as string} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.palette.text.primary, fontSize: 14.5, fontWeight: 600 }}>
          {p.value as string}
        </Typography>
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
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 800, fontSize: 13.5, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
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
                      {(() => {
                        const bounds = getReportDateBounds();
                        return (
                          <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={form.date || bounds.todayStr}
                            error={!!errors.date}
                            helperText={
                              errors.date ||
                              (bounds.isAfter6PM
                                ? "⏰ Submission for yesterday closed at 6:00 PM today. Previous dates are disabled."
                                : "⏰ Submissions allowed until 6:00 PM of the next day. Older dates are disabled.")
                            }
                            inputProps={{
                              min: bounds.minDateStr,
                              max: bounds.maxDateStr,
                            }}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setForm((p) => ({ ...p, date: newDate }));
                              syncGridWithReports(rows, newDate);
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 2.5 }}
                          />
                        );
                      })()}

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          Area & Work Details ({reportGrid.length} Rows)
                        </Typography>i q
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 2.5 }}>
                        <Table size="small">
                          <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Sl. No.</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '22%', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '28%', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Area</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, py: 1.25, fontSize: 13.5 }}>Work Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportGrid.map((row, idx) => (
                              <TableRow key={idx} sx={{ bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (idx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') }}>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: row.id ? (theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0') : (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'), color: theme.palette.text.secondary, borderRight: '1px solid #cbd5e1', fontSize: 13, verticalAlign: 'middle' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </TableCell>
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="input"
                                    type="date"
                                    readOnly={!!row.id}
                                    disabled={!!row.id}
                                    value={row.date || form.date || getReportDateBounds().todayStr}
                                    min={getReportDateBounds().minDateStr}
                                    max={getReportDateBounds().maxDateStr}
                                    onChange={(e: any) => {
                                      if (row.id) return;
                                      const updated = [...reportGrid];
                                      updated[idx].date = e.target.value;
                                      setReportGrid(updated);
                                    }}
                                    sx={{
                                      width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                      px: 1.5, py: 1.4, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary,
                                      boxSizing: 'border-box', cursor: row.id ? 'not-allowed' : 'text',
                                      '&:focus': { bgcolor: row.id ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)') }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea"
                                    rows={2}
                                    readOnly={!!row.id}
                                    disabled={!!row.id}
                                    value={row.area}
                                    onChange={(e: any) => {
                                      if (row.id) return;
                                      const updated = [...reportGrid];
                                      updated[idx].area = e.target.value;
                                      setReportGrid(updated);
                                    }}
                                    sx={{
                                      width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                      resize: 'vertical', minHeight: 46,
                                      px: 1.5, py: 1, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary,
                                      boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: row.id ? 'not-allowed' : 'text',
                                      '&:focus': { bgcolor: row.id ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)') }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ p: 0, verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea"
                                    rows={2}
                                    readOnly={!!row.id}
                                    disabled={!!row.id}
                                    value={row.work}
                                    onChange={(e: any) => {
                                      if (row.id) return;
                                      const updated = [...reportGrid];
                                      updated[idx].work = e.target.value;
                                      setReportGrid(updated);
                                    }}
                                    sx={{
                                      width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                      resize: 'vertical', minHeight: 46,
                                      px: 1.5, py: 1, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary,
                                      boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: row.id ? 'not-allowed' : 'text',
                                      '&:focus': { bgcolor: row.id ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)') }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {errors.report && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{errors.report}</Alert>}

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleSubmit} sx={{ px: 3 }}>
                          Submit Report
                        </Button>
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddRows} sx={{ px: 2.5, color: '#107c41', borderColor: '#107c41', fontWeight: 700, '&:hover': { borderColor: '#0e6b37', bgcolor: 'rgba(16,124,65,0.08)' } }}>
                          + Add 2 Rows
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => handleCheckAndOpenEdit('reports', rows[0]?.id || 1, rows[0]?.area || 'Daily Report', () => setEditReportDialogOpen(true))} sx={{ px: 3 }}>
                          Edit Data
                        </Button>
                      </Box>
                    </CardContent>
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
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Enter goal details in rows and columns below.</Typography>
                        </Box>
                      </Box>

                      {/* 100 Days Goals Excel UI Grid Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          Goal Setup Grid ({goalGrid.length} Rows)
                        </Typography>
                        <Chip
                          icon={<CalendarMonthRoundedIcon sx={{ color: '#107c41 !important', fontSize: 15 }} />}
                          label={`Today: ${fmtDispDate(getReportDateBounds().todayStr)}`}
                          sx={{ background: alpha('#107c41', 0.1), color: '#107c41', fontWeight: 800, fontSize: 12.5 }}
                        />
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 2.5 }}>
                        <Table size="small">
                          <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Sl. No.</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date of Commencement</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date of Completion</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, py: 1.25, fontSize: 13.5 }}>Work Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {goalGrid.map((row, idx) => (
                              <TableRow key={idx} sx={{ bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (idx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') }}>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: row.id ? (theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0') : (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'), color: theme.palette.text.secondary, borderRight: '1px solid #cbd5e1', fontSize: 13, verticalAlign: 'middle' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </TableCell>
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 1, px: 1 }}>
                                      <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                      <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.date ? fmtDispDate(row.date) : '—'}
                                      </Typography>
                                      {!editedDates.goals?.includes(row.id as number) && (
                                        <Tooltip title="Edit Date of Commencement">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setEditGoalDialogId(row.id as number);
                                              setEditGoalDialogForm({ date: row.date, dateEnd: row.dateEnd || row.date, goal: row.goal, responsiblePerson: 'Self' });
                                              setEditGoalDialogOpen(true);
                                            }}
                                            sx={{
                                              color: '#107c41',
                                              p: 0.4,
                                              ml: 0.5,
                                              background: alpha('#107c41', 0.08),
                                              '&:hover': { background: alpha('#107c41', 0.2) },
                                            }}
                                          >
                                            <EditRoundedIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box component="input"
                                      type="date"
                                      value={row.date || getReportDateBounds().todayStr}
                                      onChange={(e: any) => {
                                        const newDate = e.target.value;
                                        const updated = [...goalGrid];
                                        updated[idx].date = newDate;
                                        let curDate = newDate;
                                        for (let i = idx + 1; i < updated.length; i++) {
                                          if (!updated[i].id) {
                                            curDate = addDaysToDate(curDate, 1);
                                            updated[i].date = curDate;
                                            updated[i].dateEnd = curDate;
                                          }
                                        }
                                        setGoalGrid(updated);
                                      }}
                                      sx={{
                                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                        px: 1.5, py: 1.4, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary,
                                        boxSizing: 'border-box', cursor: 'text',
                                        '&:focus': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)' }
                                      }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 1, px: 1 }}>
                                      <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                      <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}
                                      </Typography>
                                      {!editedDates.goals?.includes(row.id as number) && (
                                        <Tooltip title="Edit Date of Completion">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setEditGoalDialogId(row.id as number);
                                              setEditGoalDialogForm({ date: row.date, dateEnd: row.dateEnd || row.date, goal: row.goal, responsiblePerson: 'Self' });
                                              setEditGoalDialogOpen(true);
                                            }}
                                            sx={{
                                              color: '#107c41',
                                              p: 0.4,
                                              ml: 0.5,
                                              background: alpha('#107c41', 0.08),
                                              '&:hover': { background: alpha('#107c41', 0.2) },
                                            }}
                                          >
                                            <EditRoundedIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box component="input"
                                      type="date"
                                      value={row.dateEnd || row.date || getReportDateBounds().todayStr}
                                      onChange={(e: any) => {
                                        const updated = [...goalGrid];
                                        updated[idx].dateEnd = e.target.value;
                                        setGoalGrid(updated);
                                      }}
                                      sx={{
                                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                        px: 1.5, py: 1.4, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary,
                                        boxSizing: 'border-box', cursor: 'text',
                                        '&:focus': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)' }
                                      }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell sx={{ p: 0, verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea"
                                    rows={2}
                                    readOnly={!!row.id}
                                    disabled={!!row.id}
                                    value={row.goal}
                                    onChange={(e: any) => {
                                      if (row.id) return;
                                      const updated = [...goalGrid];
                                      updated[idx].goal = e.target.value;
                                      setGoalGrid(updated);
                                    }}
                                    sx={{
                                      width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                      resize: 'vertical', minHeight: 46,
                                      px: 1.5, py: 1, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary,
                                      boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: row.id ? 'not-allowed' : 'text',
                                      '&:focus': { bgcolor: row.id ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)') }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddGoalGrid} sx={{ px: 3, background: 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                          Submit Goals
                        </Button>
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddGoalRows} sx={{ px: 2.5, color: '#107c41', borderColor: '#107c41', fontWeight: 700, '&:hover': { borderColor: '#0e6b37', bgcolor: 'rgba(16,124,65,0.08)' } }}>
                          + Add 2 Rows
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 2 — Accomplishment Report
              ══════════════════════════════════════════════════ */}
              {tab === 2 && (
                <Box>
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>📅 WEEKLY ALLOCATION ACCOMPLISHMENTS REPORT</Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {weeklyAccEntries.length} completed weekly plan {weeklyAccEntries.length === 1 ? 'entry' : 'entries'}
                          </Typography>
                        </Box>
                        <Chip icon={<FlagRoundedIcon sx={{ color: '#22c55e !important', fontSize: 14 }} />} label={`${weeklyAccEntries.length} Completed`} size="small" sx={{ background: alpha('#22c55e', 0.1), color: '#22c55e', fontWeight: 700 }} />
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 2.5 }}>
                      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                          <col style={{ width: '60px' }} />
                          <col style={{ width: '45%' }} />
                          <col style={{ width: '25%' }} />
                          <col style={{ width: '25%' }} />
                        </colgroup>
                        <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                          <TableRow>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>
                              Sl. No.
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>
                              Planned Work Details
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5, textAlign: 'center' }}>
                              Date of Commencement
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, py: 1.25, fontSize: 13.5, textAlign: 'center' }}>
                              Date of Completion
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {weeklyAccEntries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                                <CalendarTodayRoundedIcon sx={{ fontSize: 36, opacity: 0.25, display: 'block', mx: 'auto', mb: 1 }} />
                                No weekly accomplishments yet. Submit a Weekly Plan to see it here.
                              </TableCell>
                            </TableRow>
                          ) : (
                            weeklyAccEntries
                              .slice(weeklyPage * weeklyRowsPerPage, weeklyPage * weeklyRowsPerPage + weeklyRowsPerPage)
                              .map((row, idx) => {
                                const globalIdx = weeklyPage * weeklyRowsPerPage + idx;
                                return (
                                  <TableRow key={row.id || globalIdx} sx={{ bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (globalIdx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc'), '&:hover': { background: alpha('#107c41', 0.04) }, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                    <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: row.id ? (theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0') : (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'), color: theme.palette.text.secondary, borderRight: '1px solid #cbd5e1', fontSize: 13, verticalAlign: 'middle', py: 1, px: 1.5 }}>
                                      {String(globalIdx + 1).padStart(2, '0')}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', py: 1, px: 1.5, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle' }}>
                                      <Typography variant="body2" sx={{ fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.work}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 1.5, textAlign: 'center', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                        <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                        <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                                          {row.dateStart ? fmtDispDate(row.dateStart) : '—'}
                                        </Typography>
                                        {!editedDates.accomplishments?.includes(row.id || globalIdx) && (
                                          <Tooltip title="Edit Date of Commencement">
                                            <IconButton
                                              size="small"
                                              onClick={() => setEditAccDateDialog({ open: true, rowId: row.id || globalIdx, dateStart: row.dateStart || '', dateEnd: row.dateEnd || '', work: row.work })}
                                              sx={{
                                                color: '#107c41',
                                                p: 0.4,
                                                ml: 0.5,
                                                background: alpha('#107c41', 0.08),
                                                '&:hover': { background: alpha('#107c41', 0.2) },
                                              }}
                                            >
                                              <EditRoundedIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 1.5, textAlign: 'center', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                        <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                        <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.text.primary }}>
                                          {row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}
                                        </Typography>
                                        {!editedDates.accomplishments?.includes(row.id || globalIdx) && (
                                          <Tooltip title="Edit Date of Completion">
                                            <IconButton
                                              size="small"
                                              onClick={() => setEditAccDateDialog({ open: true, rowId: row.id || globalIdx, dateStart: row.dateStart || '', dateEnd: row.dateEnd || '', work: row.work })}
                                              sx={{
                                                color: '#107c41',
                                                p: 0.4,
                                                ml: 0.5,
                                                background: alpha('#107c41', 0.08),
                                                '&:hover': { background: alpha('#107c41', 0.2) },
                                              }}
                                            >
                                              <EditRoundedIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                      <TablePagination
                        component="div"
                        count={weeklyAccEntries.length}
                        page={weeklyPage}
                        onPageChange={(_, newPage) => setWeeklyPage(newPage)}
                        rowsPerPage={weeklyRowsPerPage}
                        onRowsPerPageChange={(e) => {
                          setWeeklyRowsPerPage(parseInt(e.target.value, 10));
                          setWeeklyPage(0);
                        }}
                        rowsPerPageOptions={[10, 20, 50]}
                      />
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 3 — Pending & Priority Work
              ══════════════════════════════════════════════════ */}
              {tab === 3 && (
                <Box>
                  <Card sx={{ mb: 3, borderRadius: '20px' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>⚠️ Pending & Priority Work</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Log your pending & priority tasks in the spreadsheet below.</Typography>
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

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          Pending & Priority Details ({pendingGrid.length} Rows)
                        </Typography>
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 2.5 }}>
                        <Table size="small">
                          <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Sl. No.</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Areas</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Particulars</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date of Commencement</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date of Completion</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Status as on</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', py: 1.25, fontSize: 13.5 }}>Remarks</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pendingGrid.map((row, idx) => (
                              <TableRow key={idx} sx={{ bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (idx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') }}>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: row.id ? (theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0') : (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'), color: theme.palette.text.secondary, borderRight: '1px solid #cbd5e1', fontSize: 13, verticalAlign: 'middle' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </TableCell>

                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea" rows={2} readOnly={!!row.id} disabled={!!row.id} value={row.areas}
                                    onChange={(e: any) => {
                                      const updated = [...pendingGrid];
                                      updated[idx].areas = e.target.value;
                                      setPendingGrid(updated);
                                    }}
                                    sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', minHeight: 46, px: 1.5, py: 1, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary, boxSizing: 'border-box' }}
                                  />
                                </TableCell>

                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea" rows={2} readOnly={!!row.id} disabled={!!row.id} value={row.particulars}
                                    onChange={(e: any) => {
                                      const updated = [...pendingGrid];
                                      updated[idx].particulars = e.target.value;
                                      setPendingGrid(updated);
                                    }}
                                    sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', minHeight: 46, px: 1.5, py: 1, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary, boxSizing: 'border-box' }}
                                  />
                                </TableCell>


                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1, px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.dateStart ? fmtDispDate(row.dateStart) : '—'}
                                      </Typography>
                                      {!editedDates.pending?.includes(row.id as number) && (
                                        <Tooltip title="Edit Date of Commencement">
                                          <IconButton size="small"
                                            onClick={() => {
                                              setEditPendingDateDialog({
                                                open: true,
                                                rowId: row.id as number,
                                                dateStart: row.dateStart,
                                                dateEnd: row.dateEnd || '',
                                                statusDate: row.statusDate || '',
                                                work: row.particulars
                                              });
                                            }}
                                            sx={{ color: '#107c41', p: 0.3, background: alpha('#107c41', 0.08), '&:hover': { background: alpha('#107c41', 0.2) } }}
                                          >
                                            <EditRoundedIcon sx={{ fontSize: 13 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box component="input" type="date" value={row.dateStart}
                                      onChange={(e: any) => {
                                        const updated = [...pendingGrid];
                                        updated[idx].dateStart = e.target.value;
                                        setPendingGrid(updated);
                                      }}
                                      sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', px: 1, py: 1.4, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary, boxSizing: 'border-box' }}
                                    />
                                  )}
                                </TableCell>

                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1, px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}
                                      </Typography>
                                      {!editedDates.pending?.includes(row.id as number) && (
                                        <Tooltip title="Edit Date of Completion">
                                          <IconButton size="small"
                                            onClick={() => {
                                              setEditPendingDateDialog({
                                                open: true,
                                                rowId: row.id as number,
                                                dateStart: row.dateStart,
                                                dateEnd: row.dateEnd || '',
                                                statusDate: row.statusDate || '',
                                                work: row.particulars
                                              });
                                            }}
                                            sx={{ color: '#107c41', p: 0.3, background: alpha('#107c41', 0.08), '&:hover': { background: alpha('#107c41', 0.2) } }}
                                          >
                                            <EditRoundedIcon sx={{ fontSize: 13 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box component="input" type="date" value={row.dateEnd}
                                      onChange={(e: any) => {
                                        const updated = [...pendingGrid];
                                        updated[idx].dateEnd = e.target.value;
                                        setPendingGrid(updated);
                                      }}
                                      sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', px: 1, py: 1.4, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary, boxSizing: 'border-box' }}
                                    />
                                  )}
                                </TableCell>

                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1, px: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.statusDate ? fmtDispDate(row.statusDate) : '—'}
                                      </Typography>
                                      {!editedDates.pending?.includes(row.id as number) && (
                                        <Tooltip title="Edit Status as on">
                                          <IconButton size="small"
                                            onClick={() => {
                                              setEditPendingDateDialog({
                                                open: true,
                                                rowId: row.id as number,
                                                dateStart: row.dateStart,
                                                dateEnd: row.dateEnd || '',
                                                statusDate: row.statusDate || '',
                                                work: row.particulars
                                              });
                                            }}
                                            sx={{ color: '#107c41', p: 0.3, background: alpha('#107c41', 0.08), '&:hover': { background: alpha('#107c41', 0.2) } }}
                                          >
                                            <EditRoundedIcon sx={{ fontSize: 13 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box component="input" type="date" value={row.statusDate}
                                      onChange={(e: any) => {
                                        const updated = [...pendingGrid];
                                        updated[idx].statusDate = e.target.value;
                                        setPendingGrid(updated);
                                      }}
                                      sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', px: 1, py: 1.4, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary, boxSizing: 'border-box' }}
                                    />
                                  )}
                                </TableCell>


                                <TableCell sx={{ p: 0, verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea" rows={2} readOnly={!!row.id} disabled={!!row.id} value={row.remarks}
                                    onChange={(e: any) => {
                                      const updated = [...pendingGrid];
                                      updated[idx].remarks = e.target.value;
                                      setPendingGrid(updated);
                                    }}
                                    sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', minHeight: 46, px: 1.5, py: 1, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary, boxSizing: 'border-box' }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<SendRoundedIcon />} onClick={handleSubmitPendingGrid} sx={{ px: 3, background: 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                          Submit Pending & Priority Work
                        </Button>
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddPendingRows} sx={{ px: 3, color: '#107c41', borderColor: '#107c41', '&:hover': { borderColor: '#0e6b37', background: 'rgba(16,124,65,0.04)' } }}>
                          + Add 2 Rows
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 4 — Weekly Work Allocation Plan
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

                      {/* Weekly Reports Excel UI Grid Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          Weekly Work Allocation Plans ({weeklyGrid.length} Rows)
                        </Typography>
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 2.5 }}>
                        <Table size="small">
                          <colgroup>
                            <col style={{ width: '60px' }} />
                            <col style={{ width: '180px' }} />
                            <col style={{ width: '180px' }} />
                            <col style={{ width: 'auto' }} />
                          </colgroup>
                          <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>SI.NO</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Starting Date</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Ending Date</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, py: 1.25, fontSize: 13.5 }}>Planned Work Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {weeklyGrid.map((row, idx) => (
                              <TableRow key={idx} sx={{ bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (idx % 2 === 0 ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc'), borderBottom: `1px solid ${theme.palette.divider}` }}>
                                {/* SI.NO */}
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: row.id ? (theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0') : (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'), color: theme.palette.text.secondary, borderRight: '1px solid #cbd5e1', fontSize: 13, verticalAlign: 'middle' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </TableCell>

                                {/* Starting Date */}
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 1, px: 1 }}>
                                      <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                      <Typography variant="body2" sx={{ fontSize: 13.5, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.date ? fmtDispDate(row.date) : '—'}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box component="input"
                                      type="date"
                                      value={row.date}
                                      onChange={(e: any) => handleWeeklyGridDateChange(idx, 'date', e.target.value)}
                                      sx={{
                                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                        px: 1.5, py: 1.4, fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary,
                                        boxSizing: 'border-box',
                                        '&:focus': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)' }
                                      }}
                                    />
                                  )}
                                </TableCell>

                                {/* Ending Date (user-selectable, constrained within 7 days of Starting Date) */}
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  {row.id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 1, px: 1 }}>
                                      <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: '#107c41' }} />
                                      <Typography variant="body2" sx={{ fontSize: 13.5, fontWeight: 700, color: theme.palette.text.primary }}>
                                        {row.dateEnd ? fmtDispDate(row.dateEnd) : '—'}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box component="input"
                                      type="date"
                                      value={row.dateEnd}
                                      min={row.date || undefined}
                                      max={row.date ? addDaysToDate(row.date, 6) : undefined}
                                      disabled={!row.date}
                                      onChange={(e: any) => handleWeeklyGridDateChange(idx, 'dateEnd', e.target.value)}
                                      sx={{
                                        width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                        px: 1.5, py: 1.4, fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', color: theme.palette.text.primary,
                                        boxSizing: 'border-box', cursor: !row.date ? 'not-allowed' : 'text',
                                        '&:focus': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)' }
                                      }}
                                    />
                                  )}
                                </TableCell>

                                {/* Planned Work Details */}
                                <TableCell sx={{ p: 0, verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea"
                                    rows={2}
                                    readOnly={!!row.id}
                                    disabled={!!row.id}
                                    value={row.work}
                                    onChange={(e: any) => {
                                      if (row.id) return;
                                      const updated = [...weeklyGrid];
                                      updated[idx].work = e.target.value;
                                      setWeeklyGrid(updated);
                                    }}
                                    sx={{
                                      width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                      resize: 'vertical', minHeight: 46,
                                      px: 2, py: 1, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary,
                                      boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: row.id ? 'not-allowed' : 'text',
                                      '&:focus': { bgcolor: row.id ? 'transparent' : (theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)') }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {weeklyErrors.work && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{weeklyErrors.work}</Alert>}

                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddWeekly} sx={{ px: 3 }}>
                          Submit Weekly Plan
                        </Button>
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddWeeklyRows} sx={{ px: 2.5, color: '#107c41', borderColor: '#107c41', fontWeight: 700, '&:hover': { borderColor: '#0e6b37', bgcolor: 'rgba(16,124,65,0.08)' } }}>
                          + Add 2 Rows
                        </Button>
                      </Box>
                    </CardContent>
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
              <TextField label="Area" fullWidth value={editReportDialogForm.area} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, area: e.target.value }))} />
              <TextField label="Work" fullWidth multiline rows={6} value={editReportDialogForm.report} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, report: e.target.value }))} />
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
                  setEditGoalDialogForm({ date: row.date, dateEnd: row.dateEnd || row.date, goal: row.goal, responsiblePerson: row.responsiblePerson || '' });
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
              <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.12)' : 'rgba(16,124,65,0.06)', p: 1.5, borderRadius: '8px', border: '1px solid rgba(16,124,65,0.2)', mb: 2 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                  GOAL WORK DETAILS
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {editGoalDialogForm.goal}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Date of Commencement" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editGoalDialogForm.date} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, date: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Date of Completion" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editGoalDialogForm.dateEnd} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} />
                </Grid>
              </Grid>
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
                  setEditPendingDialogForm({ areas: row.areas, particulars: row.particulars, responsiblePerson: row.responsiblePerson || 'Self', dateStart: row.dateStart, dateEnd: row.dateEnd, statusDate: row.statusDate || '', remarks: row.remarks });
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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}><TextField label="Date of Commencement" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.dateStart} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateStart: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Date of Completion" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.dateEnd} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Status as on" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editPendingDialogForm.statusDate} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, statusDate: e.target.value }))} /></Grid>
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
                  setEditWeeklyDialogForm({ date: row.date, work: row.work, responsiblePerson: '' });
                }
              }}
            >
              {weeklyEntries.map((row, idx) => (
                <MenuItem key={row.id} value={row.id}>
                  Sl. {String(idx + 1).padStart(2, '0')} - {row.work.substring(0, 40)}...
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editWeeklyDialogId !== '' && (
            <>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editWeeklyDialogForm.date} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, date: e.target.value }))} />
              <TextField label="Work" fullWidth value={editWeeklyDialogForm.work} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, work: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditWeeklyDialogOpen(false); setEditWeeklyDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" sx={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)' }} onClick={handleSaveEditWeekly} disabled={editWeeklyDialogId === ''}>Save Changes</Button>
        </DialogActions>
      </Dialog>





      {/* Tab 2: Edit Accomplishment Dates Dialog */}
      <Dialog open={editAccDateDialog.open} onClose={() => setEditAccDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', work: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ color: '#0284c7' }} />
          Edit Accomplishment Dates
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(2,132,199,0.12)' : 'rgba(2,132,199,0.06)', p: 1.5, borderRadius: '8px', border: '1px solid rgba(2,132,199,0.2)' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
              PLANNED WORK DETAILS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {editAccDateDialog.work}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Commencement"
                type="date"
                value={editAccDateDialog.dateStart}
                onChange={(e) => setEditAccDateDialog((p) => ({ ...p, dateStart: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Completion"
                type="date"
                value={editAccDateDialog.dateEnd}
                onChange={(e) => setEditAccDateDialog((p) => ({ ...p, dateEnd: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditAccDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', work: '' })} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const updated = weeklyAccEntries.map((e, idx) => {
                if ((e.id && e.id === editAccDateDialog.rowId) || idx === editAccDateDialog.rowId) {
                  return { ...e, dateStart: editAccDateDialog.dateStart, dateEnd: editAccDateDialog.dateEnd };
                }
                return e;
              });
              setWeeklyAccEntries(updated);
              localStorage.setItem(`weekly_acc_entries_${user?.empId}`, JSON.stringify(updated));

              // Add to editedDates to enforce one-time edit limit
              const updatedEdited = {
                ...editedDates,
                accomplishments: [...(editedDates.accomplishments || []), editAccDateDialog.rowId]
              };
              setEditedDates(updatedEdited);
              localStorage.setItem(`edited_dates_${user?.empId}`, JSON.stringify(updatedEdited));

              setSnack({ open: true, msg: 'Accomplishment dates updated successfully!', severity: 'success' });
              setEditAccDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', work: '' });
            }}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
          >
            Update Dates
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 3: Edit Pending Dates Dialog */}
      <Dialog open={editPendingDateDialog.open} onClose={() => setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', statusDate: '', work: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ color: '#107c41' }} />
          Edit Pending Work Dates
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.12)' : 'rgba(16,124,65,0.06)', p: 1.5, borderRadius: '8px', border: '1px solid rgba(16,124,65,0.2)' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
              PENDING WORK DETAILS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {editPendingDateDialog.work}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Date of Commencement"
                type="date"
                value={editPendingDateDialog.dateStart}
                onChange={(e) => setEditPendingDateDialog((p) => ({ ...p, dateStart: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Date of Completion"
                type="date"
                value={editPendingDateDialog.dateEnd}
                onChange={(e) => setEditPendingDateDialog((p) => ({ ...p, dateEnd: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Status as on"
                type="date"
                value={editPendingDateDialog.statusDate}
                onChange={(e) => setEditPendingDateDialog((p) => ({ ...p, statusDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', statusDate: '', work: '' })} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePendingDates}
            sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0e6b37' } }}
          >
            Update Dates
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Request Edit Access Dialog */}
      <Dialog open={requestAccessDialogOpen} onClose={() => setRequestAccessDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Request Edit Access from Admin</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
            Submitted records require Admin authorization to modify. Once approved by Admin, you will be granted <strong>24 hours</strong> of edit access for this entry.
          </Typography>
          {requestTarget && (
            <Chip label={`${requestTarget.module.toUpperCase()}: ${requestTarget.title.substring(0, 30)}...`} size="small" color="primary" sx={{ mb: 2, fontWeight: 700 }} />
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Editing (Optional)"
            placeholder="e.g. Updating work progress details or fixing entry errors..."
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRequestAccessDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSendEditRequest} disabled={submittingRequest} sx={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            {submittingRequest ? 'Sending Request...' : 'Send Request to Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default DailyReportPage;
