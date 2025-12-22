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
import GenresPage from './pages/GenresPage';
import TheatersPage from './pages/TheatersPage';
import ShowtimesPage from './pages/ShowtimesPage';
import NewsPage from './pages/NewsPage';
import ReportsPage from './pages/ReportsPage';
import ManagersPage from './pages/ManagersPage';
import SeatPricesPage from './pages/SeatPricesPage';
import VouchersPage from './pages/VouchersPage';
import LoyaltyPage from './pages/LoyaltyPage';
import OrdersPage from './pages/OrdersPage';
import CombosPage from './pages/CombosPage';
import GroupBookingsPage from './pages/GroupBookingsPage';
import ProfilePage from './pages/ProfilePage';

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
                <Route path="genres" element={<GenresPage />} />
                <Route path="theaters" element={<TheatersPage />} />
                <Route path="showtimes" element={<ShowtimesPage />} />
                <Route path="seat-prices" element={<SeatPricesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="group-bookings" element={<GroupBookingsPage />} />
                <Route path="combos" element={<CombosPage />} />
                <Route path="vouchers" element={<VouchersPage />} />
                <Route path="loyalty" element={<LoyaltyPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="managers" element={<ManagersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
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
