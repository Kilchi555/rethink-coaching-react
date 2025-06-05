import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) return <div>Lade...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
