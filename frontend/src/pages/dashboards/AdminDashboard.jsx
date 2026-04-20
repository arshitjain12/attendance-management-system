import { useState }  from 'react';
import {
  Users, Shield, Clock, Timer, UserPlus, ToggleLeft,
  ToggleRight, Eye, EyeOff, ThumbsUp, ThumbsDown, Image
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar   from '../../components/Navbar.jsx';
import StatCard from '../../components/StatCard.jsx';
import Loader   from '../../components/Loader.jsx';
import {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useToggleUserStatusMutation,
  useUpdateUserMutation, 
  useGetAllAttendanceQuery,
  useGetPendingOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
} from '../../store/apiSlice';

const fmtMins = (m = 0) => `${Math.floor(m / 60)}h ${m % 60}m`;
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CLS = {
  completed:  'badge-green',
  incomplete: 'badge-yellow',
  present:    'badge-blue',
  absent:     'badge-gray',
};

const ROLE_CLS = {
  admin:    'badge-red',
  manager:  'badge-blue',
  employee: 'badge-green',
};

const TABS = ['Attendance', 'Users', 'Overtime'];

export default function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab]     = useState('Attendance');
  const [dateFilter, setDate]         = useState(today);
  const [showCreateForm, setShowForm] = useState(false);
  const [selfieView, setSelfieView]   = useState(null); 

  const { data: usersData,  isLoading: loadingUsers }  = useGetAllUsersQuery();
  const { data: attData,    isLoading: loadingAtt  }    = useGetAllAttendanceQuery({ date: dateFilter }, { pollingInterval: 30000 } );
  const { data: otData, isLoading: loadingOT } = useGetPendingOvertimeRequestsQuery(
  undefined,
  { pollingInterval: 30000 } 
);

  const [toggleStatus, { isLoading: toggling }]      = useToggleUserStatusMutation();
  const [updateUser]                                 = useUpdateUserMutation(); // <-- Naya mutation
  const [createUser,   { isLoading: creating }]      = useCreateUserMutation();
  const [reviewOT,     { isLoading: reviewing }]     = useReviewOvertimeRequestMutation();

  const users      = usersData?.users      || [];
  const records    = attData?.records      || [];
  const pendingOT  = otData?.requests      || [];

  const activeUsers = users.filter(u => u.isActive).length;
  const presentToday = records.filter(r => r.status !== 'absent').length;

  // Manager ki list filter kar rahe hain (Dropdown ke liye)
  const managersList = users.filter(u => u.role === 'manager' && u.isActive);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee', department: '',
  });
  const [showPass, setShowPass] = useState(false);

  const handleFormChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error('All required fields must be filled');
      return;
    }
    try {
      await createUser(form).unwrap();
      toast.success(`User "${form.name}" created successfully`);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create user');
    }
  };

  const handleToggle = async (userId, name, isActive) => {
    try {
      await toggleStatus(userId).unwrap();
      toast.success(`${name} ${isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignManager = async (userId, managerId) => {
    try {
      await updateUser({ id: userId, managerId }).unwrap();
      toast.success("Manager assigned successfully!");
    } catch (err) {
      toast.error("Failed to assign manager");
    }
  };

  const handleReview = async (id, status) => {
    try {
      await reviewOT({ id, status }).unwrap();
      toast.success(`Request ${status}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Shield size={22} className="text-brand-400" />
            Admin Dashboard
          </h2>
          <p className="text-slate-400 mt-1">System-wide attendance and user management</p>
        </div>

   
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}       label="Total Users"     value={users.length}      color="brand" />
          <StatCard icon={Shield}      label="Active Users"    value={activeUsers}       color="green" />
          <StatCard icon={Clock}       label="Present Today"   value={presentToday}      color="green" />
          <StatCard icon={Timer}       label="Pending OT"      value={pendingOT.length}  color="amber" />
        </div>

       
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 mb-6 w-fit animate-fade-in">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
              {tab === 'Overtime' && pendingOT.length > 0 && (
                <span className="ml-2 bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">{pendingOT.length}</span>
              )}
            </button>
          ))}
        </div>

    
        {activeTab === 'Attendance' && (
          <div className="card animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="font-display font-semibold text-white">All Attendance Records</h3>
              <input type="date" value={dateFilter} onChange={(e) => setDate(e.target.value)} max={today} className="input-field w-auto text-sm py-2" />
            </div>

            {loadingAtt ? <Loader /> : records.length === 0 ? <EmptyState text="No attendance records for this date." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 text-left">
                      <th className="pb-3 font-medium">Employee</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Selfie</th>
                      <th className="pb-3 font-medium">Punch In</th>
                      <th className="pb-3 font-medium">Punch Out</th>
                      <th className="pb-3 font-medium">Hours</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-3">
                          <p className="text-white font-medium">{rec.userId?.name || '—'}</p>
                          <p className="text-slate-500 text-xs">{rec.userId?.department}</p>
                        </td>
                        <td className="py-3"><span className={`badge ${ROLE_CLS[rec.userId?.role] || 'badge-gray'}`}>{rec.userId?.role}</span></td>
                        {/* Selfie View Button */}
                        <td className="py-3">
                          {rec.punchIn?.selfie ? (
                            <button onClick={() => setSelfieView(rec.punchIn.selfie)} className="flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded hover:bg-brand-500/20">
                              <Image size={14} /> View
                            </button>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 text-slate-300">{fmtTime(rec.punchIn?.time)}</td>
                        <td className="py-3 text-slate-300">{fmtTime(rec.punchOut?.time)}</td>
                        <td className="py-3 text-slate-300">{fmtMins(rec.totalWorkingMinutes)}</td>
                        <td className="py-3"><span className={`badge ${STATUS_CLS[rec.status] || 'badge-gray'}`}>{rec.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      
        {activeTab === 'Users' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex justify-end">
              <button onClick={() => setShowForm(!showCreateForm)} className="btn-primary text-sm">
                <UserPlus size={16} /> {showCreateForm ? 'Cancel' : 'Create User'}
              </button>
            </div>

          
         
            {showCreateForm && (
              <div className="card border-brand-500/20">
                <h3 className="font-display font-semibold text-white mb-5">Create New User</h3>
                <form onSubmit={handleCreateUser}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                      <input name="name" value={form.name} onChange={handleFormChange} placeholder="Full name" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">Email <span className="text-rose-400">*</span></label>
                      <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="user@company.com" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">Role <span className="text-rose-400">*</span></label>
                      <select name="role" value={form.role} onChange={handleFormChange} className="input-field">
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1.5">Department</label>
                      <input name="department" value={form.department} onChange={handleFormChange} placeholder="Engineering, HR..." className="input-field" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-300 mb-1.5">Password <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleFormChange} placeholder="Min 6 characters" className="input-field pr-12" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="btn-primary">
                    {creating ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><UserPlus size={16} /> Create User</>}
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <h3 className="font-display font-semibold text-white mb-5">All Users</h3>
              {loadingUsers ? <Loader /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border text-slate-400 text-left">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Assign Manager</th> 
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-surface-hover transition-colors">
                          <td className="py-3 text-white font-medium">{u.name}</td>
                          <td className="py-3 text-slate-400">{u.email}</td>
                          <td className="py-3"><span className={`badge ${ROLE_CLS[u.role]}`}>{u.role}</span></td>
                          
                        
                          <td className="py-3">
                            {u.role === 'employee' ? (
                              <select 
                                className="bg-surface border border-surface-border text-slate-300 rounded px-2 py-1 text-xs focus:ring-brand-500"
                                value={u.managerId?._id || u.managerId || ""}
                                onChange={(e) => handleAssignManager(u._id, e.target.value)}
                              >
                                <option value="">No Manager</option>
                                {managersList.map(m => (
                                  <option key={m._id} value={m._id}>{m.name}</option>
                                ))}
                              </select>
                            ) : <span className="text-slate-600 text-xs">N/A</span>}
                          </td>

                          <td className="py-3"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td className="py-3">
                            <button onClick={() => handleToggle(u._id, u.name, u.isActive)} disabled={toggling} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${u.isActive ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                              {u.isActive ? <><ToggleLeft size={14} /> Deactivate</> : <><ToggleRight size={14} /> Activate</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      
      {activeTab === 'Overtime' && (
          <div className="card animate-slide-up">
            <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <Timer size={18} className="text-brand-400" />
              Pending Overtime Requests
            </h3>

            {loadingOT ? (
              <Loader />
            ) : pendingOT.length === 0 ? (
              <EmptyState text="No pending overtime requests." />
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
                          <p className="text-slate-500 text-xs">{ot.employeeId?.role}</p>
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
                            <button onClick={() => handleReview(ot._id, 'approved')} disabled={reviewing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors">
                              <ThumbsUp size={12} /> Approve
                            </button>
                            <button onClick={() => handleReview(ot._id, 'rejected')} disabled={reviewing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors">
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
        )}

      </main>


      {selfieView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelfieView(null)}>
          <div className="relative max-w-sm w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <img src={selfieView} alt="Selfie" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setSelfieView(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="text-center py-12 text-slate-500 text-sm">{text}</div>;
}