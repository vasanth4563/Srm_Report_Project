import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Grid, Chip,
  Divider, Tooltip, Fade, Alert, Snackbar, alpha, useTheme,
  Tab, Tabs, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, TablePagination, InputBase
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import EmojiObjectsRoundedIcon from '@mui/icons-material/EmojiObjectsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import Layout from '../components/Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../utils/api.ts';

// ─── Types ───────────────────────────────────────────────────────────────────
type ReportRow = {
  id: number; slNo: number; date: string;
  area: string; report: string; completed: boolean;
  edited_once?: boolean;
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
  status: string;
  remarks: string;
  completed: boolean;
};

type WeeklyPlanRow = {
  id: number;
  date: string;
  date_end?: string;
  dateEnd?: string;
  work: string;
  responsiblePerson: string;
  completed: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

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
const blankAcc = { area: '', work: '', dateStart: '', dateEnd: '' };
const blankPending = { areas: '', particulars: '', responsiblePerson: '', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' };
const blankWeekly = { date: '', dateEnd: '', work: '', responsiblePerson: '' };



const addDaysToDate = (baseDateISO: string, daysToAdd: number): string => {
  if (!baseDateISO) return '';
  const d = new Date(baseDateISO);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

const toYYYYMMDD = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const isPastEditDeadline = (reportDateStr: string): boolean => {
  if (!reportDateStr) return false;
  
  const reportParts = reportDateStr.split('-');
  if (reportParts.length !== 3) return false;
  
  const reportYear = parseInt(reportParts[0], 10);
  const reportMonth = parseInt(reportParts[1], 10) - 1;
  const reportDay = parseInt(reportParts[2], 10);
  
  const rDate = new Date(reportYear, reportMonth, reportDay);
  rDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return rDate.getTime() < yesterday.getTime();
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
  const isPrevReportMissing = user?.role === 'user' && !isSundayOrSaturday && rows.length > 0 && !rows.some((r) => r.date === prevWorkingDay);

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
    return [
      { day: '1', date: '', dateEnd: '', goal: '' },
      { day: '2', date: '', dateEnd: '', goal: '' },
      { day: '3', date: '', dateEnd: '', goal: '' },
      { day: '4', date: '', dateEnd: '', goal: '' },
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

    while (grid.length < 4) {
      const nextDay = grid.length + 1;
      grid.push({ day: String(nextDay), date: '', dateEnd: '', goal: '' });
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
      const stored = localStorage.getItem(`edited_dates_${user?.id || 'default'}`);
      return stored ? JSON.parse(stored) : { goals: [], accomplishments: [], pending: [] };
    } catch {
      return { goals: [], accomplishments: [], pending: [] };
    }
  });

  // Tab 0 Edit Dialog State
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false);
  const [editReportDialogId, setEditReportDialogId] = useState<number | ''>('');
  const [editReportDialogForm, setEditReportDialogForm] = useState(initialForm);
  const [directEditAllowed, setDirectEditAllowed] = useState(true);

  // Tab 1 Edit Dialog State
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [editGoalDialogId, setEditGoalDialogId] = useState<number | ''>('');
  const [editGoalDialogForm, setEditGoalDialogForm] = useState({ date: '', dateEnd: '', goal: '', responsiblePerson: '' });

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
    status: '',
    work: ''
  });



  // Tab 4 Edit Dialog State
  const [editWeeklyDialogOpen, setEditWeeklyDialogOpen] = useState(false);
  const [editWeeklyDialogId, setEditWeeklyDialogId] = useState<number | ''>('');
  const [editWeeklyDialogForm, setEditWeeklyDialogForm] = useState(blankWeekly);




  const [accEntries, setAccEntries] = useState<AccomplishRow[]>([]);
  const [weeklyAccEntries, setWeeklyAccEntries] = useState<any[]>([]);
  const [weeklyPage, setWeeklyPage] = useState(0);
  const [weeklyRowsPerPage, setWeeklyRowsPerPage] = useState(10);

  // ── Pending & Priority state ──
  const [pendingEntries, setPendingEntries] = useState<PendingRow[]>([]);

  type PendingGridRow = {
    id?: number;
    areas: string;
    particulars: string;
    responsiblePerson: string;
    dateStart: string;
    dateEnd: string;
    status: string;
    completed: boolean;
    remarks: string;
  };

  const [pendingGrid, setPendingGrid] = useState<PendingGridRow[]>(() => {
    return [
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' }
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
      status: p.status || '',
      completed: p.completed,
      remarks: p.remarks || '',
    }));

    while (grid.length < 4) {
      grid.push({ areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' });
    }

    setPendingGrid(grid);
  };

  const handleAddPendingRows = () => {
    setPendingGrid((prev) => [
      ...prev,
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' },
      { areas: '', particulars: '', responsiblePerson: 'Self', dateStart: '', dateEnd: '', status: '', completed: false, remarks: '' }
    ]);
  };


  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyPlanRow[]>([]);
  const [weeklyErrors, setWeeklyErrors]   = useState<Partial<typeof blankWeekly>>({});

  type WeeklyGridRow = { id?: number; date: string; dateEnd: string; work: string };

  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGridRow[]>([]);

  const handleWeeklyGridDateChange = (idx: number, field: 'date' | 'dateEnd', newDate: string) => {
    setWeeklyGrid((prev) => {
      const updated = [...prev];
      const firstUnsavedIdx = updated.findIndex(r => !r.id);

      if (idx === firstUnsavedIdx && field === 'date') {
        // When first unsaved row's Starting Date changes, propagate it to all unsaved rows
        const start = newDate;
        const end = addDaysToDate(start, 6);
        for (let i = 0; i < updated.length; i++) {
          if (!updated[i].id) { // Only update unsaved rows
            updated[i] = { ...updated[i], date: start, dateEnd: end };
          }
        }
      } else if (field === 'date') {
        // When Starting Date changes for other rows, set its Ending Date to +6 days
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
    // Sort all weekly plans chronologically by start date
    const sorted = [...allWeekly].sort((a, b) => {
      const ad = toYYYYMMDD(a.date);
      const bd = toYYYYMMDD(b.date);
      return ad.localeCompare(bd);
    });

    const grid: WeeklyGridRow[] = sorted.map((m) => ({
      id: m.id,
      date: m.date,
      dateEnd: m.dateEnd || m.date_end || addDaysToDate(m.date, 6),
      work: m.work,
    }));

    // Pad with 4 empty rows at the bottom for new entries
    for (let i = 0; i < 4; i++) {
      grid.push({ date: '', dateEnd: '', work: '' });
    }

    setWeeklyGrid(grid);
  };

  const handleAddWeeklyRows = () => {
    setWeeklyGrid((prev) => [
      ...prev,
      { date: '', dateEnd: '', work: '' },
      { date: '', dateEnd: '', work: '' }
    ]);
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
        edited_once: r.edited_once ?? false,
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
        .filter((r) => r.completed)
        .map((r) => ({
          id: r.id,
          area: r.area,
          work: r.report,
          dateStart: r.date,
          dateEnd: r.date,
          completed: true
        }));

      const directAccs = accData
        .filter((a) => a.completed === true || a.completed === undefined)
        .map((a) => ({
          id: a.id,
          area: a.area,
          work: a.work,
          dateStart: a.date_start,
          dateEnd: a.date_end || a.date_start,
          completed: true
        }));

      const allDaily: AccomplishRow[] = [...dailyFromReports, ...directAccs];
      allDaily.sort((a, b) => (b.dateStart || '').localeCompare(a.dateStart || ''));

      const weeklyMapped = weeklyData
        .map((w) => ({
          id: w.id,
          dateStart: w.date,
          dateEnd: w.date_end || addDaysToDate(w.date, 6),
          work: w.work,
          completed: true
        }));
      weeklyMapped.sort((a, b) => (b.dateStart || '').localeCompare(a.dateStart || ''));

      setWeeklyAccEntries(weeklyMapped);
      setAccEntries(allDaily);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        status: p.status || '',
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


  const fetchWeekly = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/weekly');
      const mapped = data.map((w) => ({
        id: w.id,
        date: w.date,
        date_end: w.date_end,
        dateEnd: w.date_end,
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


  // Load data depending on selected Tab
  useEffect(() => {
    if (!user) return;
    if (tab === 0) fetchReports();
    if (tab === 1) fetchGoals();
    if (tab === 2) fetchAccomplishments();
    if (tab === 3) fetchPending();
    if (tab === 4) fetchWeekly();
  }, [tab, user]);

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
              bodyData: { missed_date_formatted: prevWorkingDayFormatted }
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



  const handleAddGoalGrid = async () => {
    const newEntries = goalGrid.filter((row) => !row.id && row.goal.trim().length > 0);
    if (newEntries.length === 0) {
      setSnack({ open: true, msg: 'Please enter goal details in at least one row before submitting.', severity: 'warning' });
      return;
    }
    const hasMissingDate = newEntries.some((row) => !row.date);
    if (hasMissingDate) {
      setSnack({ open: true, msg: 'Please select Date of Commencement for all rows being submitted.', severity: 'warning' });
      return;
    }
    try {
      for (const item of newEntries) {
        await apiRequest('/api/goals', {
          method: 'POST',
          bodyData: {
            day: Number(item.day || 1),
            date: item.date,
            date_end: item.dateEnd || item.date,
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
    setGoalGrid((prev) => [
      ...prev,
      { day: String(prev.length + 1), date: '', dateEnd: '', goal: '' },
      { day: String(prev.length + 2), date: '', dateEnd: '', goal: '' },
    ]);
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
        localStorage.setItem(`edited_dates_${user?.id}`, JSON.stringify(updatedEdited));

        setEditGoalDialogOpen(false);
        setEditGoalDialogId('');
        setSnack({ open: true, msg: 'Goal updated successfully!', severity: 'success' });
        fetchGoals();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update goal', severity: 'error' });
      }
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
            status: row.status || null,
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
            status: editPendingDialogForm.status || null,
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
            status: row.status || null,
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
        localStorage.setItem(`edited_dates_${user?.id}`, JSON.stringify(updatedEdited));

        setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', status: '', work: '' });
        setSnack({ open: true, msg: 'Dates updated successfully!', severity: 'success' });
        fetchPending();
      } catch (err: any) {
        setSnack({ open: true, msg: err.message || 'Failed to update dates', severity: 'error' });
      }
    }
  };






  const handleAddWeekly = async () => {
    const todayStr = getReportDateBounds().todayStr;
    const newFilledRows = weeklyGrid.filter(r => !r.id && r.work.trim());

    if (newFilledRows.length === 0) {
      setWeeklyErrors({ work: 'Please enter at least one new Work detail in the empty rows below.' });
      return;
    }

    try {
      // Find the first new row's date or fall back to today
      const firstRowDate = newFilledRows[0]?.date || todayStr;
      const firstRowEndDate = newFilledRows[0]?.dateEnd || addDaysToDate(firstRowDate, 6);

      for (const row of newFilledRows) {
        const rowDate = row.date || firstRowDate;
        const rowEndDate = row.dateEnd || firstRowEndDate;

        await apiRequest('/api/weekly', {
          method: 'POST',
          bodyData: {
            date: rowDate,
            date_end: rowEndDate || null,
            work: row.work.trim(),
            responsible_person: 'Self'
          }
        });
      }
      setSnack({ open: true, msg: `${newFilledRows.length} Weekly Plan entry row(s) saved successfully!`, severity: 'success' });
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
            date_end: editWeeklyDialogForm.dateEnd || null,
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
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
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


  const handleSubmit = async () => {
    const { todayStr } = getReportDateBounds();
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
                          <Grid size={{ xs: 12, sm: 4 }} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              slotProps={{ input: { readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> } }}
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
                            slotProps={{
                              htmlInput: {
                                min: bounds.minDateStr,
                                max: bounds.maxDateStr,
                              },
                              inputLabel: { shrink: true }
                            }}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setForm((p) => ({ ...p, date: newDate }));
                              syncGridWithReports(rows, newDate);
                            }}
                            sx={{ mb: 2.5 }}
                          />
                        );
                      })()}

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                          Area & Work Details ({reportGrid.length} Rows)
                        </Typography>
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflowX: 'auto', mb: 2.5 }}>
                        <Table size="small" sx={{ minWidth: 800 }}>
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
                          + Add Rows
                        </Button>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => { setEditReportDialogOpen(true); setEditReportDialogId(''); setEditReportDialogForm(initialForm); setDirectEditAllowed(true); }} sx={{ px: 3 }}>
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
                          <Grid size={{ xs: 12, sm: 4 }} key={f.label}>
                            <TextField
                              fullWidth label={f.label} value={f.value ?? ''}
                              slotProps={{ input: { readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> } }}
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

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflowX: 'auto', mb: 2.5 }}>
                        <Table size="small" sx={{ minWidth: 800 }}>
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
                                      value={row.date}
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
                                      value={row.dateEnd}
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
                          + Add Rows
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

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflowX: 'auto', mb: 2.5 }}>
                      <Table sx={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}>
                        <colgroup>
                          <col style={{ width: '60px' }} />
                          <col style={{ width: '25%' }} />
                          <col style={{ width: '50%' }} />
                          <col style={{ width: '25%' }} />
                        </colgroup>
                        <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                          <TableRow>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>
                              Sl. No.
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5, textAlign: 'center' }}>
                              Date of Commencement
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>
                              Planned Work Details
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
                                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', py: 1, px: 1.5, borderRight: '1px solid #cbd5e1', verticalAlign: 'middle' }}>
                                      <Typography variant="body2" sx={{ fontSize: 14.5, fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.5 }}>{row.work}</Typography>
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
                          <Grid size={{ xs: 12, sm: 4 }} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              slotProps={{ input: { readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> } }}
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

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflowX: 'auto', mb: 2.5 }}>
                        <Table size="small" sx={{ minWidth: 1050 }}>
                          <TableHead sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #107c41, #0e6b37)' }}>
                            <TableRow>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Sl. No.</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Areas</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Particulars</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Date of Commencement</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Status</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '180px', borderRight: '1px solid rgba(255,255,255,0.2)', py: 1.25, fontSize: 13.5 }}>Remarks</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 800, width: '150px', py: 1.25, fontSize: 13.5 }}>Date of Completion</TableCell>
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

                                {/* 1. Date of Commencement */}
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
                                                status: row.status || '',
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

                                {/* 2. Status as on */}
                                 <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                   <Box component="textarea" rows={2} value={row.status}
                                    autoComplete="off"
                                    name="status_text"
                                    onChange={(e: any) => {
                                      const updated = [...pendingGrid];
                                      updated[idx].status = e.target.value;
                                      setPendingGrid(updated);
                                    }}
                                    onBlur={async () => {
                                      if (row.id) {
                                        try {
                                          await apiRequest(`/api/pending/${row.id}`, {
                                            method: 'PUT',
                                            bodyData: {
                                              areas: row.areas,
                                              particulars: row.particulars,
                                              responsible_person: row.responsiblePerson || 'Self',
                                              date_start: row.dateStart,
                                              date_end: row.dateEnd || null,
                                              status: row.status || null,
                                              remarks: row.remarks,
                                              completed: row.completed
                                            }
                                          });
                                          setSnack({ open: true, msg: 'Status updated successfully!', severity: 'success' });
                                          fetchPending();
                                        } catch (err: any) {
                                          setSnack({ open: true, msg: err.message || 'Failed to save status', severity: 'error' });
                                          fetchPending();
                                        }
                                      }
                                    }}
                                    sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', minHeight: 46, px: 1.5, py: 1, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary, boxSizing: 'border-box' }}
                                  />
                                </TableCell>

                                {/* 3. Remarks */}
                                <TableCell sx={{ p: 0, borderRight: '1px solid #cbd5e1', verticalAlign: 'top', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
                                  <Box component="textarea" rows={2} readOnly={!!row.id} disabled={!!row.id} value={row.remarks}
                                    onChange={(e: any) => {
                                      const updated = [...pendingGrid];
                                      updated[idx].remarks = e.target.value;
                                      setPendingGrid(updated);
                                    }}
                                    sx={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', minHeight: 46, px: 1.5, py: 1, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: row.id ? theme.palette.text.secondary : theme.palette.text.primary, boxSizing: 'border-box' }}
                                  />
                                </TableCell>

                                {/* 4. Date of Completion */}
                                <TableCell sx={{ p: 0, verticalAlign: 'middle', bgcolor: row.id ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)') : 'transparent' }}>
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
                                                status: row.status || '',
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
                          + Add Rows
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
                          <Grid size={{ xs: 12, sm: 4 }} key={f.label}>
                            <TextField fullWidth label={f.label} value={f.value ?? ''}
                              slotProps={{ input: { readOnly: true, endAdornment: <LockRoundedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} /> } }}
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

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflowX: 'auto', mb: 2.5 }}>
                        <Table size="small" sx={{ minWidth: 800 }}>
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
                                  {row.id ? (
                                    <Typography sx={{
                                      px: 2, py: 1.5, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit',
                                      color: theme.palette.text.primary, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                      lineHeight: 1.7, minHeight: 46
                                    }}>
                                      {row.work}
                                    </Typography>
                                  ) : (
                                    <InputBase
                                      multiline
                                      fullWidth
                                      value={row.work || ''}
                                      placeholder="Enter work details..."
                                      onChange={(e) => {
                                        const updated = [...weeklyGrid];
                                        updated[idx].work = e.target.value;
                                        setWeeklyGrid(updated);
                                      }}
                                      sx={{
                                        width: '100%',
                                        minHeight: 46,
                                        px: 2, py: 1.5, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit',
                                        color: theme.palette.text.primary,
                                        lineHeight: 1.7,
                                        '& .MuiInputBase-input': {
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-word'
                                        },
                                        '&:focus-within': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16,124,65,0.18)' : 'rgba(16,124,65,0.08)' }
                                      }}
                                    />
                                  )}
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
                          + Add Rows
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
                  if (user?.role === 'admin' || user?.role === 'chairman' || (!isPastEditDeadline(row.date) && !row.edited_once)) {
                    setEditReportDialogForm({ date: row.date, area: row.area, report: row.report });
                    setDirectEditAllowed(true);
                  } else {
                    setDirectEditAllowed(false);
                    handleCheckAndOpenEdit('reports', row.id, `${row.area} (${row.date})`, () => {
                      setEditReportDialogForm({ date: row.date, area: row.area, report: row.report });
                      setDirectEditAllowed(true);
                    });
                  }
                }
              }}
            >
              {rows
                .filter((row) => user?.role === 'admin' || user?.role === 'chairman' || !isPastEditDeadline(row.date))
                .map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    Sl. {String(row.slNo).padStart(2, '0')} - {row.area} ({new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {editReportDialogId !== '' && !directEditAllowed && (
            <Alert severity="warning" sx={{ mb: 1, borderRadius: '8px' }}>
              {rows.find(r => r.id === editReportDialogId)?.edited_once 
                ? "🔒 This report has already been edited once. Request Admin approval to edit it again." 
                : "⏰ Edit window has closed. You can only edit daily reports for today and yesterday. Request Admin approval to edit this report."}
            </Alert>
          )}

          {editReportDialogId !== '' && (
            <>
              <TextField label="Area" fullWidth disabled={!directEditAllowed} value={editReportDialogForm.area} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, area: e.target.value }))} />
              <TextField label="Work" fullWidth multiline rows={6} disabled={!directEditAllowed} value={editReportDialogForm.report} onChange={(e) => setEditReportDialogForm((p) => ({ ...p, report: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditReportDialogOpen(false); setEditReportDialogId(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveEditReport} disabled={editReportDialogId === '' || !directEditAllowed}>Save Changes</Button>
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Date of Commencement" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editGoalDialogForm.date} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, date: e.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Date of Completion" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editGoalDialogForm.dateEnd} onChange={(e) => setEditGoalDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} />
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Start Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editAccDialogForm.dateStart} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, dateStart: e.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="End Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editAccDialogForm.dateEnd} onChange={(e) => setEditAccDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} />
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
                  setEditPendingDialogForm({ areas: row.areas, particulars: row.particulars, responsiblePerson: row.responsiblePerson || 'Self', dateStart: row.dateStart, dateEnd: row.dateEnd, status: row.status || '', completed: row.completed, remarks: row.remarks });
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
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Commencement" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editPendingDialogForm.dateStart} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateStart: e.target.value }))} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Completion" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editPendingDialogForm.dateEnd} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, dateEnd: e.target.value }))} /></Grid>
              </Grid>
              <TextField label="Status" fullWidth slotProps={{ htmlInput: { autoComplete: 'off', name: 'status_text' } }} value={editPendingDialogForm.status} onChange={(e) => setEditPendingDialogForm((p) => ({ ...p, status: e.target.value }))} />
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
                  setEditWeeklyDialogForm({ date: row.date, dateEnd: row.date_end || row.dateEnd || '', work: row.work, responsiblePerson: '' });
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
              <TextField label="Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editWeeklyDialogForm.date} onChange={(e) => setEditWeeklyDialogForm((p) => ({ ...p, date: e.target.value }))} />
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Commencement"
                type="date"
                value={editAccDateDialog.dateStart}
                onChange={(e) => setEditAccDateDialog((p) => ({ ...p, dateStart: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Completion"
                type="date"
                value={editAccDateDialog.dateEnd}
                onChange={(e) => setEditAccDateDialog((p) => ({ ...p, dateEnd: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
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
            onClick={async () => {
              try {
                if (typeof editAccDateDialog.rowId === 'number') {
                  await apiRequest(`/api/weekly/${editAccDateDialog.rowId}`, {
                    method: 'PUT',
                    bodyData: {
                      date: editAccDateDialog.dateStart,
                      date_end: editAccDateDialog.dateEnd || null,
                      work: editAccDateDialog.work,
                      responsible_person: 'Self'
                    }
                  });
                }

                // Add to editedDates to enforce one-time edit limit
                const updatedEdited = {
                  ...editedDates,
                  accomplishments: [...(editedDates.accomplishments || []), editAccDateDialog.rowId]
                };
                setEditedDates(updatedEdited);
                localStorage.setItem(`edited_dates_${user?.id}`, JSON.stringify(updatedEdited));

                setSnack({ open: true, msg: 'Accomplishment dates updated successfully!', severity: 'success' });
                setEditAccDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', work: '' });
                fetchAccomplishments();
                fetchWeekly();
              } catch (err: any) {
                setSnack({ open: true, msg: err.message || 'Failed to update dates', severity: 'error' });
              }
            }}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
          >
            Update Dates
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 3: Edit Pending Dates Dialog */}
      <Dialog open={editPendingDateDialog.open} onClose={() => setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', status: '', work: '' })} maxWidth="sm" fullWidth>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Commencement"
                type="date"
                value={editPendingDateDialog.dateStart}
                onChange={(e) => setEditPendingDateDialog((p) => ({ ...p, dateStart: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Completion"
                type="date"
                value={editPendingDateDialog.dateEnd}
                onChange={(e) => setEditPendingDateDialog((p) => ({ ...p, dateEnd: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditPendingDateDialog({ open: false, rowId: '', dateStart: '', dateEnd: '', status: '', work: '' })} color="inherit">
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
