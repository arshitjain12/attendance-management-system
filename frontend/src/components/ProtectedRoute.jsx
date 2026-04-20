import { Navigate, Outlet } from 'react-router-dom';
import { useSelector }      from 'react-redux';
import { selectIsAuth, selectUserRole } from '../store/authSlice';


export default function ProtectedRoute({ allowedRoles = [] }) {
  const isAuth = useSelector(selectIsAuth);
  const role   = useSelector(selectUserRole);


  if (!isAuth) return <Navigate to="/login" replace />;

 
  if (allowedRoles.length && !allowedRoles.includes(role)) {
    if (role === 'admin')   return <Navigate to="/admin"    replace />;
    if (role === 'manager') return <Navigate to="/manager"  replace />;
    return                         <Navigate to="/employee" replace />;
  }

  return <Outlet />;
}
