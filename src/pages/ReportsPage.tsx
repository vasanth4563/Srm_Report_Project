import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Chip, alpha, useTheme, Fade, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import Layout from '../components/Layout.tsx';
import { apiRequest } from '../utils/api.ts';

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiRequest<any[]>('/api/reports');
        const formatted = (data || []).map((r, index) => ({
          ...r,
          slNo: index + 1,
        }));
        setReports(formatted);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const areas = ['All', ...Array.from(new Set(reports.map((r) => r.area)))];

  const filtered = reports.filter((r) => {
    const matchSearch = (r.area || '').toLowerCase().includes(search.toLowerCase()) || 
                        (r.report || '').toLowerCase().includes(search.toLowerCase()) || 
                        (r.date || '').includes(search);
    const matchArea = areaFilter === 'All' || r.area === areaFilter;
    return matchSearch && matchArea;
  });

  const columns: GridColDef[] = [
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
        <Typography variant="body2" title={p.value as string} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.palette.text.secondary, fontSize: 13 }}>
          {p.value as string}
        </Typography>
      ),
    },
    {
      field: 'completed', headerName: 'Status', flex: 0.5, minWidth: 80, align: 'center', headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value ? 'Completed' : 'Pending'} size="small" sx={{ bgcolor: p.value ? alpha('#22c55e', 0.1) : alpha('#ef4444', 0.1), color: p.value ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 11 }} />
      ),
    },
  ];

  return (
    <Layout pageTitle="Reports">
      <Fade in timeout={500}>
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>All Reports</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Browse and search through all submitted daily activity reports.</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
            <TextField placeholder="Search by area, report, or date..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1, minWidth: 220 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} /></InputAdornment> } }} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Area</InputLabel>
              <Select value={areaFilter} label="Filter by Area" onChange={(e) => setAreaFilter(e.target.value)}>
                {areas.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Report Log</Typography>
              <Chip label={`${filtered.length} Records`} size="small" sx={{ background: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 600 }} />
            </Box>
            <Box>
              <DataGrid rows={filtered} columns={columns} autoHeight pageSizeOptions={[5, 10, 20]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                disableRowSelectionOnClick
                loading={loading}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', borderBottom: `1px solid ${theme.palette.divider}` },
                  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
                  '& .MuiDataGrid-row:hover': { background: alpha(theme.palette.primary.main, 0.04) },
                  '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}`, alignItems: 'center', display: 'flex' },
                  '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'center' },
                }}
              />
            </Box>
          </Card>
        </Box>
      </Fade>
    </Layout>
  );
};

export default ReportsPage;
