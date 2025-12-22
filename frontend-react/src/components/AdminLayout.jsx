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
  Building2,
  Tags,
  Armchair,
  Ticket,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

// Menu items with role restrictions
const allMenuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager'] },
  { path: '/movies', icon: Film, label: 'Quản lý Phim', roles: ['admin'] },
  { path: '/genres', icon: Tags, label: 'Thể loại Phim', roles: ['admin'] },
  { path: '/theaters', icon: Building2, label: 'Quản lý Rạp', roles: ['admin'] },
  { path: '/showtimes', icon: Calendar, label: 'Suất chiếu', roles: ['admin', 'manager'] },
  { path: '/seat-prices', icon: Armchair, label: 'Giá ghế', roles: ['admin'] },
  { path: '/orders', icon: ShoppingCart, label: 'Đơn hàng', roles: ['admin', 'manager'] },
  { path: '/group-bookings', icon: Users, label: 'Đặt vé nhóm', roles: ['admin', 'manager'] },
  { path: '/combos', icon: Popcorn, label: 'Combo', roles: ['admin'] },
  { path: '/vouchers', icon: Ticket, label: 'Voucher', roles: ['admin'] },
  { path: '/loyalty', icon: Crown, label: 'Thành viên', roles: ['admin'] },
  { path: '/news', icon: Newspaper, label: 'Tin tức & Banner', roles: ['admin'] },
  { path: '/managers', icon: UserCog, label: 'Quản lý Managers', roles: ['admin'] },
  { path: '/reports', icon: BarChart3, label: 'Báo cáo', roles: ['admin'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter menu items by user role
  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

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
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
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
            <p className="text-xs text-gray-400">
              {user?.role === 'manager' ? 'Manager Panel' : 'Admin Panel'}
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto">
            <X size={20} />
          </button>
        </div>

        {/* Show managed theaters for manager */}
        {user?.role === 'manager' && user?.managedTheaters?.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Rạp được quản lý:</p>
            <div className="space-y-1">
              {user.managedTheaters.map(theater => (
                <div key={theater.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <Building2 size={14} className="text-red-500" />
                  <span className="truncate">{theater.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => (
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
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 mb-2 rounded-lg transition-colors ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`
            }
          >
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.charAt(0) || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </NavLink>
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
  const { user } = useAuth();

  // Check if manager has no assigned theaters
  const isManagerWithoutTheaters = user?.role === 'manager' && (!user?.managedTheaters || user.managedTheaters.length === 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">
          {isManagerWithoutTheaters ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Chưa được cấp quyền quản lý
                </h2>
                <p className="text-gray-600 mb-6">
                  Tài khoản của bạn chưa được gán rạp nào để quản lý. 
                  Vui lòng liên hệ với Admin để được cấp quyền.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                  <p className="font-medium text-gray-700 mb-1">Liên hệ hỗ trợ:</p>
                  <p>Email: admin@absolutecinema.vn</p>
                  <p>Hotline: 1900 1234</p>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
