import { useState }   from 'react';
import { Users, Clock, CheckCircle, Timer, ThumbsUp, ThumbsDown, Calendar, MapPin, Image } from 'lucide-react';
import toast          from 'react-hot-toast';
import { useSelector } from 'react-redux';

import Navbar     from '../../components/Navbar.jsx';
import StatCard   from '../../components/StatCard.jsx';
import Loader     from '../../components/Loader.jsx';
import PunchModal from '../../components/PunchModal.jsx';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetTeamAttendanceQuery,
  useGetPendingOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
  useGetTodayAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../../store/apiSlice';

const fmtMins = (m = 0) => `${Math.floor(m/60)}h ${m%60}m`;
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const STATUS_CLS = { completed: 'badge-green', incomplete: 'badge-yellow', present: 'badge-blue', absent: 'badge-gray' };

export default function ManagerDashboard() {
  const user  = useSelector(selectCurrentUser);
  const today = new Date().toISOString().slice(0, 10);

  const [dateFilter, setDate]     = useState(today);
  const [punchModal, setPunchModal] = useState(null);
  const [selfieView, setSelfieView] = useState(null);

 
  const { data: teamData,    isLoading: loadingTeam  } = useGetTeamAttendanceQuery({ date: dateFilter }, { pollingInterval: 30000 });
  
  const { data: otData,      isLoading: loadingOT    } = useGetPendingOvertimeRequestsQuery(undefined, { pollingInterval: 30000 });
  const { data: myTodayData, isLoading: loadingMyToday } = useGetTodayAttendanceQuery();

  

  const [reviewOT, { isLoading: reviewing }] = useReviewOvertimeRequestMutation();
  const [punchIn,  { isLoading: punchingIn  }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const teamRecords = teamData?.records || [];
  const pendingOT   = otData?.requests  || [];
  const myToday     = myTodayData?.attendance;

  const presentCount = teamRecords.filter(r => r.status !== 'absent').length;
  const punchPercent = myToday ? Math.min(Math.round((myToday.totalWorkingMinutes / 480) * 100), 100) : 0;

  const handleReview = async (id, status) => {
    try {
      await reviewOT({ id, status, reviewRemarks: '' }).unwrap();
      toast.success(`Request ${status}!`);
     
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const handlePunchIn = async (selfie, location) => {
    try {
      await punchIn({ selfie, location }).unwrap();
      toast.success('Punched in successfully!');
      setPunchModal(null);
   
    } catch (err) {
      toast.error(err?.data?.message || 'Punch-in failed');
    }
  };

  const handlePunchOut = async (selfie, location) => {
    try {
      await punchOut({ selfie, location }).unwrap();
      toast.success('Punched out successfully!');
      setPunchModal(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Punch-out failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 animate-fade-in">
          <h2 className="font-display font-bold text-2xl text-white">
            Good day, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-400 mt-1">Manager Dashboard — Monitor team and track your own hours</p>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}       label="Team Size"      value={teamData?.teamSize || 0}   color="brand" />
          <StatCard icon={CheckCircle} label="Team Present"   value={presentCount}              color="green" />
          <StatCard icon={Clock}       label="My Hours Today" value={myToday ? fmtMins(myToday.totalWorkingMinutes) : '0h 0m'} color="brand" />
          <StatCard icon={Timer}       label="OT Approvals"   value={pendingOT.length}          color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          
          <div className="lg:col-span-1 card animate-slide-up">
            <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <Calendar size={18} className="text-brand-400" /> My Attendance
            </h3>
            {loadingMyToday ? <Loader /> : (
              <div className="space-y-4">
                <InfoRow label="Punch In"  value={fmtTime(myToday?.punchIn?.time)} />
                <InfoRow label="Punch Out" value={fmtTime(myToday?.punchOut?.time)} />
                <InfoRow label="Status"    value={
                  <span className={`badge ${STATUS_CLS[myToday?.status] || 'badge-gray'}`}>
                    {myToday?.status || 'Absent'}
                  </span>
                } />
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Shift Progress</span><span>{punchPercent}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      punchPercent >= 100 ? 'bg-emerald-500' :
                      punchPercent >= 50  ? 'bg-brand-500'   : 'bg-amber-500'
                    }`} style={{ width: `${punchPercent}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">8 hours = full shift</p>
                </div>
                <div className="pt-2 space-y-2">
                  {!myToday?.punchIn?.time && (
                    <button onClick={() => setPunchModal('in')} className="btn-primary w-full">
                      <Clock size={16} /> Punch In
                    </button>
                  )}
                  {myToday?.punchIn?.time && !myToday?.punchOut?.time && (
                    <button onClick={() => setPunchModal('out')}
                      className="w-full flex items-center justify-center gap-2 font-medium
                                 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
                      <Clock size={16} /> Punch Out
                    </button>
                  )}
                  {myToday?.punchIn?.time && myToday?.punchOut?.time && (
                    <p className="text-center text-sm text-emerald-400 font-medium py-1">
                      ✅ Shift completed — {fmtMins(myToday.totalWorkingMinutes)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

         
          <div className="lg:col-span-2 card animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="font-display font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-400" /> Team Attendance
              </h3>
              <input type="date" value={dateFilter} onChange={(e) => setDate(e.target.value)}
                max={today} className="input-field w-auto text-sm py-2" />
            </div>

            {loadingTeam ? <Loader /> : teamRecords.length === 0 ? (
              <EmptyState text="No team members assigned yet. Ask admin to assign you as manager." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 text-left">
                      <th className="pb-3 font-medium">Employee</th>
                      <th className="pb-3 font-medium">Selfie</th>
                      <th className="pb-3 font-medium">In / Out</th>
                      <th className="pb-3 font-medium">Hours</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {teamRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-3">
                          <p className="text-white font-medium">{rec.userId?.name || '—'}</p>
                          <p className="text-slate-500 text-xs">{rec.userId?.department}</p>
                        </td>
                        <td className="py-3">
                          {rec.punchIn?.selfie ? (
                            <button onClick={() => setSelfieView(rec.punchIn.selfie)}
                              className="flex items-center gap-1 text-xs text-brand-400
                                         bg-brand-500/10 px-2 py-1 rounded hover:bg-brand-500/20">
                              <Image size={14} /> View
                            </button>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 text-slate-300 text-xs">
                          {fmtTime(rec.punchIn?.time)}<br/>{fmtTime(rec.punchOut?.time)}
                        </td>
                        <td className="py-3 text-slate-300">{fmtMins(rec.totalWorkingMinutes)}</td>
                        <td className="py-3">
                          <span className={`badge ${STATUS_CLS[rec.status] || 'badge-gray'}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        
        <div className="card mt-6 animate-slide-up">
          <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
            <Timer size={18} className="text-brand-400" />
            Pending Overtime Requests
            {pendingOT.length > 0 && (
              <span className="badge badge-yellow ml-1">{pendingOT.length}</span>
            )}
          </h3>

          {loadingOT ? <Loader /> : pendingOT.length === 0 ? (
            <EmptyState text="No pending overtime requests from your team." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 text-left">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Requested</th>
                    <th className="pb-3 font-medium">Reason</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pendingOT.map((ot) => (
                    <tr key={ot._id} className="hover:bg-surface-hover transition-colors">
                      <td className="py-4">
                        <p className="text-white font-medium">{ot.employeeId?.name || '—'}</p>
                        <p className="text-slate-500 text-xs">{ot.employeeId?.department}</p>
                      </td>
                      <td className="py-4 text-slate-300">{ot.date}</td>
                      <td className="py-4">
                        <span className="badge badge-yellow">+{fmtMins(ot.requestedMinutes)}</span>
                      </td>
                      <td className="py-4 text-slate-400 max-w-xs">
                        <p className="truncate" title={ot.reason}>{ot.reason}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleReview(ot._id, 'approved')} disabled={reviewing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                       bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400
                                       border border-emerald-500/20 text-xs font-medium transition-colors">
                            <ThumbsUp size={12} /> Approve
                          </button>
                          <button onClick={() => handleReview(ot._id, 'rejected')} disabled={reviewing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                       bg-rose-500/10 hover:bg-rose-500/20 text-rose-400
                                       border border-rose-500/20 text-xs font-medium transition-colors">
                            <ThumbsDown size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {punchModal && (
        <PunchModal type={punchModal} onClose={() => setPunchModal(null)}
          onConfirm={punchModal === 'in' ? handlePunchIn : handlePunchOut}
          isLoading={punchModal === 'in' ? punchingIn : punchingOut} />
      )}

      {selfieView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
             onClick={() => setSelfieView(null)}>
          <div className="relative max-w-sm w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <img src={selfieView} alt="Selfie" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setSelfieView(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60
                         flex items-center justify-center text-white hover:bg-black/80">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-surface-border/50">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  );
}
function EmptyState({ text }) {
  return <div className="text-center py-10 text-slate-500 text-sm">{text}</div>;
}
