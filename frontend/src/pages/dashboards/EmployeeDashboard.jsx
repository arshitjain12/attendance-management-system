import { useState }   from 'react';
import { Clock, Calendar, CheckCircle, TrendingUp, Timer, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast           from 'react-hot-toast';

import Navbar        from '../../components/Navbar.jsx';
import StatCard      from '../../components/StatCard.jsx';
import Loader        from '../../components/Loader.jsx';
import PunchModal    from '../../components/PunchModal.jsx';
import OvertimeModal from '../../components/OvertimeModal.jsx';
import { selectCurrentUser }      from '../../store/authSlice';
import {
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetMyOvertimeRequestsQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../../store/apiSlice';

const fmtMins = (mins = 0) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_MAP = {
  completed:  { cls: 'badge-green',  label: 'Completed'  },
  incomplete: { cls: 'badge-yellow', label: 'Incomplete' },
  present:    { cls: 'badge-blue',   label: 'Present'    },
  absent:     { cls: 'badge-gray',   label: 'Absent'     },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function EmployeeDashboard() {
  const user = useSelector(selectCurrentUser);

  const [punchModal,  setPunchModal]  = useState(null); 
  const [showOTModal, setShowOTModal] = useState(false);



const { data: todayData, isLoading: loadingToday, refetch: refetchToday } = useGetTodayAttendanceQuery(
  undefined,
  { pollingInterval: 60000 } 
);
  const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useGetMyAttendanceQuery({ limit: 10 });
  const { data: otData,      refetch: refetchOT }                                  = useGetMyOvertimeRequestsQuery();

  const [punchIn,  { isLoading: punchingIn  }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const today     = todayData?.attendance;
  const history   = historyData?.records    || [];
  const otList    = otData?.requests        || [];
  const pendingOT = otList.filter((r) => r.status === 'pending').length;

  const punchPercent = today
    ? Math.min(Math.round((today.totalWorkingMinutes / 480) * 100), 100)
    : 0;


  const handlePunchIn = async (selfie, location) => {
    try {
      await punchIn({ selfie, location }).unwrap();
      toast.success('Punched in! Have a great day 🎉');
      setPunchModal(null);
      refetchHistory();
    } catch (err) {
      toast.error(err?.data?.message || 'Punch-in failed');
    }
  };

  const handlePunchOut = async (selfie, location) => {
    try {
      const res = await punchOut({ selfie, location }).unwrap();
      toast.success(`Punched out! Total: ${fmtMins(res.attendance?.totalWorkingMinutes)} 👍`);
      setPunchModal(null);
      
      refetchHistory();
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
            Good {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
          </h2>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

      
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock}       label="Today's Hours"  value={today ? fmtMins(today.totalWorkingMinutes) : '0h 0m'} sub="Standard: 8h" color="brand" />
          <StatCard icon={CheckCircle} label="Status"         value={today ? (STATUS_MAP[today.status]?.label || '—') : 'Not Punched In'} sub={today?.punchIn?.time ? `In: ${fmtTime(today.punchIn.time)}` : 'Punch in to start'} color={today?.status === 'completed' ? 'green' : 'amber'} />
          <StatCard icon={TrendingUp}  label="This Month"     value={`${historyData?.totalPresent || 0} days`} sub="Present days" color="green" />
          <StatCard icon={Timer}       label="OT Pending"     value={pendingOT} sub="Overtime requests" color={pendingOT > 0 ? 'amber' : 'brand'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
          <div className="lg:col-span-1 card animate-slide-up">
            <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <Calendar size={18} className="text-brand-400" />
              Today's Attendance
            </h3>

            {loadingToday ? <Loader text="Loading..." /> : (
              <div className="space-y-4">
                <InfoRow label="Date"          value={new Date().toISOString().slice(0,10)} />
                <InfoRow label="Punch In"      value={fmtTime(today?.punchIn?.time)} />
                <InfoRow label="Punch Out"     value={fmtTime(today?.punchOut?.time)} />
                <InfoRow label="Working Hours" value={today ? fmtMins(today.totalWorkingMinutes) : '—'} />
                <InfoRow label="Status"        value={
                  <span className={`badge ${STATUS_MAP[today?.status || 'absent']?.cls}`}>
                    {STATUS_MAP[today?.status || 'absent']?.label}
                  </span>
                } />

                

          
                {today?.punchIn?.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="text-brand-400 shrink-0" />
                    {today.punchIn.location.latitude.toFixed(4)},&nbsp;
                    {today.punchIn.location.longitude.toFixed(4)}
                  </div>
                )}

            
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Shift Progress</span>
                    <span>{punchPercent}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        punchPercent >= 100 ? 'bg-emerald-500' :
                        punchPercent >= 50  ? 'bg-brand-500'   : 'bg-amber-500'
                      }`}
                      style={{ width: `${punchPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">8 hours = full shift</p>
                </div>

              
                <div className="pt-1 space-y-2">
                  {!today?.punchIn?.time && (
                    <button onClick={() => setPunchModal('in')} className="btn-primary w-full">
                      <Clock size={16} /> Punch In
                    </button>
                  )}
                  {today?.punchIn?.time && !today?.punchOut?.time && (
                    <>
                      <button
                        onClick={() => setPunchModal('out')}
                        className="w-full flex items-center justify-center gap-2 font-medium
                                   px-5 py-2.5 rounded-xl transition-all duration-200
                                   bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <Clock size={16} /> Punch Out
                      </button>
                 
                      {!today.overtimeRequested && (
                        <button onClick={() => setShowOTModal(true)} className="btn-ghost w-full text-amber-400 border-amber-500/30">
                          <Timer size={16} /> Request Overtime
                        </button>
                      )}
                      {today.overtimeRequested && (
                        <p className="text-center text-xs text-amber-400 py-1">
                          ⏳ OT request: <span className="font-medium">{today.overtimeStatus}</span>
                        </p>
                      )}
                    </>
                  )}
                  {today?.punchIn?.time && today?.punchOut?.time && (
                    <p className="text-center text-sm text-emerald-400 font-medium py-1">
                       Shift completed — {fmtMins(today.totalWorkingMinutes)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

        
          <div className="lg:col-span-2 card animate-slide-up">
            <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" />
              Recent Attendance
            </h3>

            {loadingHistory ? <Loader text="Loading history..." /> :
             history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-surface border border-surface-border
                                flex items-center justify-center">
                  <Calendar size={20} className="text-slate-500" />
                </div>
                <p className="text-slate-500 text-sm">No attendance records yet.</p>
                <p className="text-slate-600 text-xs">Punch in to create your first record.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 text-left">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">In</th>
                      <th className="pb-3 font-medium">Out</th>
                      <th className="pb-3 font-medium">Hours</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">OT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {history.map((rec) => (
                      <tr key={rec._id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 text-slate-300">{rec.date}</td>
                        <td className="py-3 text-slate-300">{fmtTime(rec.punchIn?.time)}</td>
                        <td className="py-3 text-slate-300">{fmtTime(rec.punchOut?.time)}</td>
                        <td className="py-3 text-slate-300">{fmtMins(rec.totalWorkingMinutes)}</td>
                        <td className="py-3">
                          <span className={`badge ${STATUS_MAP[rec.status]?.cls || 'badge-gray'}`}>
                            {STATUS_MAP[rec.status]?.label || rec.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {rec.overtimeRequested ? (
                            <span className={`badge ${
                              rec.overtimeStatus === 'approved' ? 'badge-green' :
                              rec.overtimeStatus === 'rejected' ? 'badge-red'  : 'badge-yellow'
                            }`}>{rec.overtimeStatus}</span>
                          ) : <span className="text-slate-600 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

     
        {otList.length > 0 && (
          <div className="card mt-6 animate-slide-up">
            <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <Timer size={18} className="text-brand-400" />
              My Overtime Requests
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 text-left">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Requested</th>
                    <th className="pb-3 font-medium">Reason</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {otList.map((ot) => (
                    <tr key={ot._id} className="hover:bg-surface-hover transition-colors">
                      <td className="py-3 text-slate-300">{ot.date}</td>
                      <td className="py-3 text-slate-300">{fmtMins(ot.requestedMinutes)}</td>
                      <td className="py-3 text-slate-400 max-w-xs truncate">{ot.reason}</td>
                      <td className="py-3">
                        <span className={`badge ${
                          ot.status === 'approved' ? 'badge-green' :
                          ot.status === 'rejected' ? 'badge-red'   : 'badge-yellow'
                        }`}>{ot.status}</span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">{ot.reviewRemarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

     
      {punchModal && (
        <PunchModal
          type={punchModal}
          onClose={() => setPunchModal(null)}
          onConfirm={punchModal === 'in' ? handlePunchIn : handlePunchOut}
          isLoading={punchModal === 'in' ? punchingIn : punchingOut}
        />
      )}

     
      {showOTModal && (
        <OvertimeModal
          onClose={() => setShowOTModal(false)}
          onSuccess={() => { refetchToday(); refetchOT(); }}
        />
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
