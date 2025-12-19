import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin/manager role
  if (user.role !== 'admin' && user.role !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang quản trị.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
