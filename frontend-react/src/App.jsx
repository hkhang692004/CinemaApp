import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MoviesPage from './pages/MoviesPage';
import ReportsPage from './pages/ReportsPage';
import ManagersPage from './pages/ManagersPage';

// Placeholder pages
const ShowtimesPage = () => <PlaceholderPage title="Quản lý Suất chiếu" />;
const OrdersPage = () => <PlaceholderPage title="Quản lý Đơn hàng" />;
const GroupBookingsPage = () => <PlaceholderPage title="Quản lý Đặt vé nhóm" />;
const CombosPage = () => <PlaceholderPage title="Quản lý Combo" />;
const NewsPage = () => <PlaceholderPage title="Quản lý Tin tức" />;

const PlaceholderPage = ({ title }) => (
  <div className="bg-white rounded-xl p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
    <p className="text-gray-500">Trang này đang được phát triển...</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="movies" element={<MoviesPage />} />
                <Route path="showtimes" element={<ShowtimesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="group-bookings" element={<GroupBookingsPage />} />
                <Route path="combos" element={<CombosPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="managers" element={<ManagersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
