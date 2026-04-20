import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector }             from 'react-redux';
import { selectIsAuth, selectUserRole } from './store/authSlice';

import Login             from './pages/Login.jsx';
import Signup            from './pages/Signup.jsx';
import Reports           from './pages/Reports.jsx';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard.jsx';
import ManagerDashboard  from './pages/dashboards/ManagerDashboard.jsx';
import AdminDashboard    from './pages/dashboards/AdminDashboard.jsx';
import ProtectedRoute    from './components/ProtectedRoute.jsx';

const RoleRedirect = () => {
  const role = useSelector(selectUserRole);
  if (role === 'admin')   return <Navigate to="/admin"    replace />;
  if (role === 'manager') return <Navigate to="/manager"  replace />;
  return                         <Navigate to="/employee" replace />;
};

export default function App() {
  const isAuth = useSelector(selectIsAuth);

  return (
    <Routes>

      <Route path="/login"  element={!isAuth ? <Login />  : <RoleRedirect />} />
      <Route path="/signup" element={!isAuth ? <Signup /> : <RoleRedirect />} />

      <Route element={<ProtectedRoute allowedRoles={['employee','manager','admin']} />}>
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/reports"  element={<Reports />} />
      </Route>

   
      <Route element={<ProtectedRoute allowedRoles={['manager','admin']} />}>
        <Route path="/manager" element={<ManagerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="/" element={isAuth ? <RoleRedirect /> : <Navigate to="/login" replace />} />
      <Route path="*" element={isAuth ? <RoleRedirect /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
