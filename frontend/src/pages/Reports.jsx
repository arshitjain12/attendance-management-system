import { useState }       from 'react';
import { useSelector }    from 'react-redux';
import {
  FileText, FileSpreadsheet, Download,
  Calendar, Filter, Loader2, AlertCircle,
} from 'lucide-react';
import toast              from 'react-hot-toast';

import Navbar             from '../components/Navbar.jsx';
import Loader             from '../components/Loader.jsx';
import { selectCurrentUser } from '../store/authSlice';
import { useGetAllUsersQuery, useGetAttendanceReportQuery } from '../store/apiSlice';

const fmtMins = (m = 0) => `${Math.floor(m / 60)}h ${m % 60}m`;
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CLS = {
  completed:  'badge-green',
  incomplete: 'badge-yellow',
  present:    'badge-blue',
  absent:     'badge-gray',
};

export default function Reports() {
  const user    = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';
  const isMgr   = user?.role === 'manager';

 
  const today     = new Date().toISOString().slice(0, 10);
  const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [startDate,    setStartDate]    = useState(weekAgo);
  const [endDate,      setEndDate]      = useState(today);
  const [filterUserId, setFilterUserId] = useState('');
  const [downloading,  setDownloading]  = useState(null); // 'pdf' | 'excel' | null

  
  const { data: usersData } = useGetAllUsersQuery(undefined, { skip: !isAdmin });

 
 
  const { data: reportData, isFetching: previewLoading } = useGetAttendanceReportQuery(
  { startDate, endDate, userId: filterUserId || undefined },
  { skip: !startDate || !endDate }
);
const previewRecords = reportData?.records || [];

  

  

  
  const handleDownload = async (type) => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setDownloading(type);
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams({ startDate, endDate });
      if (filterUserId) params.set('userId', filterUserId);

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url     = `${apiBase}/reports/${type}?${params}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Download failed');
      }

      // Stream blob → trigger browser download
      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      const anchor   = document.createElement('a');
      anchor.href    = blobUrl;
      anchor.download = `attendance_${startDate}_to_${endDate}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);

      toast.success(`${type.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      toast.error(err.message || `Failed to download ${type}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <FileText size={22} className="text-brand-400" />
            Reports & Export
          </h2>
          <p className="text-slate-400 mt-1">
            Download attendance reports as PDF or Excel
            {user?.role === 'employee' && ' — showing your own data'}
          </p>
        </div>

      
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
            <Filter size={16} className="text-brand-400" />
            Filters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

           
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                className="input-field"
              />
            </div>

      
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={today}
                className="input-field"
              />
            </div>

         
            {isAdmin && (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Filter by User</label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Users</option>
                  {(usersData?.users || []).map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}

         
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Quick Range</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '7D',  days: 7  },
                  { label: '30D', days: 30 },
                  { label: '90D', days: 90 },
                ].map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => {
                      setEndDate(today);
                      setStartDate(new Date(Date.now() - days * 86400000).toISOString().slice(0, 10));
                    }}
                    className="py-2 text-xs font-medium rounded-lg border border-surface-border
                               text-slate-400 hover:text-white hover:border-brand-500/50
                               transition-colors bg-surface"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

  
          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-surface-border">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={!!downloading}
              className="btn-primary bg-rose-600 hover:bg-rose-700 px-6"
            >
              {downloading === 'pdf'
                ? <Loader2 size={16} className="animate-spin" />
                : <FileText size={16} />}
              Download PDF
            </button>

            <button
              onClick={() => handleDownload('excel')}
              disabled={!!downloading}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 px-6"
            >
              {downloading === 'excel'
                ? <Loader2 size={16} className="animate-spin" />
                : <FileSpreadsheet size={16} />}
              Download Excel
            </button>

            {downloading && (
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin text-brand-400" />
                Generating {downloading.toUpperCase()}...
              </p>
            )}
          </div>
        </div>

      
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" />
              Preview — Today's Records
            </h3>
            <span className="badge badge-blue">{previewRecords.length} records</span>
          </div>

          {previewLoading ? (
            <Loader text="Loading records..." />
          ) : previewRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle size={32} className="text-slate-500" />
              <p className="text-slate-500 text-sm">No records for today.</p>
              <p className="text-slate-600 text-xs">Use date filters above and download report.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 text-left">
                    {(isAdmin || isMgr) && <th className="pb-3 font-medium">Employee</th>}
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Punch In</th>
                    <th className="pb-3 font-medium">Punch Out</th>
                    <th className="pb-3 font-medium">Hours</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {previewRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-surface-hover transition-colors">
                      {(isAdmin || isMgr) && (
                        <td className="py-3">
                          <p className="text-white font-medium">{rec.userId?.name || user?.name}</p>
                          <p className="text-slate-500 text-xs">{rec.userId?.department || user?.department}</p>
                        </td>
                      )}
                      <td className="py-3 text-slate-300">{rec.date}</td>
                      <td className="py-3 text-slate-300">{fmtTime(rec.punchIn?.time)}</td>
                      <td className="py-3 text-slate-300">{fmtTime(rec.punchOut?.time)}</td>
                      <td className="py-3 text-slate-300 font-medium">{fmtMins(rec.totalWorkingMinutes)}</td>
                      <td className="py-3">
                        <span className={`badge ${STATUS_CLS[rec.status] || 'badge-gray'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {rec.punchIn?.location
                          ? `${rec.punchIn.location.latitude?.toFixed(3)}, ${rec.punchIn.location.longitude?.toFixed(3)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
