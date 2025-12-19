import { NavLink, useNavigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Film,
  Calendar,
  ShoppingCart,
  Users,
  Popcorn,
  Newspaper,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/movies', icon: Film, label: 'Quản lý Phim' },
  { path: '/showtimes', icon: Calendar, label: 'Suất chiếu' },
  { path: '/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { path: '/group-bookings', icon: Users, label: 'Đặt vé nhóm' },
  { path: '/combos', icon: Popcorn, label: 'Combo' },
  { path: '/news', icon: Newspaper, label: 'Tin tức' },
  { path: '/managers', icon: UserCog, label: 'Quản lý Managers', adminOnly: true },
  { path: '/reports', icon: BarChart3, label: 'Báo cáo' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold">Absolute Cinema</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto">
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 lg:flex-none" />

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Xin chào, <span className="font-medium">{user?.full_name}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
