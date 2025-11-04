import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

function ProtectedRoute() {
  const auth = useAuth();
  const user = auth.isUserLoggedIn();
  if (!user) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
}

export default ProtectedRoute;