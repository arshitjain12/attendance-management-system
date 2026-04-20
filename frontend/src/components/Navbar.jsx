import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink }     from 'react-router-dom';
import { LogOut, User, Shield, Users, BarChart2 } from 'lucide-react';
import { logout, selectCurrentUser }   from '../store/authSlice';
import { apiSlice }                    from '../store/apiSlice';
import toast                           from 'react-hot-toast';

const ROLE_COLORS = { admin: 'badge-red', manager: 'badge-blue', employee: 'badge-green' };
const ROLE_ICONS  = { admin: Shield, manager: Users, employee: User };
const ROLE_HOME   = { admin: '/admin', manager: '/manager', employee: '/employee' };

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const RoleIcon = ROLE_ICONS[user?.role] || User;
  const homeLink = ROLE_HOME[user?.role]  || '/employee';

  const navLinkCls = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-500/15 text-brand-400'
        : 'text-slate-400 hover:text-white hover:bg-surface-hover'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <NavLink to={homeLink} className="flex items-center gap-2.5 shrink-0">
          
            <span className="font-display font-bold text-white text-lg tracking-tight hidden sm:block">
             D Table Analytics
            </span>
          </NavLink>

          <nav className="flex items-center gap-1">
            <NavLink to={homeLink} className={navLinkCls}>Dashboard</NavLink>
            <NavLink to="/reports" className={navLinkCls}>
              <BarChart2 size={14} /> Reports
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <span className={`badge ${ROLE_COLORS[user?.role]}`}>
                <RoleIcon size={11} />{user?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-2" title="Logout">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
