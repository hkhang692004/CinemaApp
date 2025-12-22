import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Ticket,
  Film,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  RefreshCw,
  Bell,
  UsersRound,
  Building2,
} from 'lucide-react';
import api from '../config/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { socket, connectSocket, disconnectSocket, SOCKET_EVENTS } from '../config/socket';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, subValue, change, changeType, icon: Icon, color, loading }) => {
  const colors = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {change !== undefined && change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm ${
              changeType === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {changeType === 'up' ? (
              <ArrowUpRight size={16} />
            ) : (
              <ArrowDownRight size={16} />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          {subValue && <p className="text-sm text-gray-400 mt-0.5">{subValue}</p>}
        </>
      )}
      <p className="text-gray-500 text-sm mt-1">{title}</p>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    todayTickets: 0,
    totalMoviesShowing: 0,
    totalCustomers: 0,
    revenueChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, ordersRes, moviesRes, chartRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-orders?limit=5'),
        api.get('/dashboard/top-movies?limit=5'),
        api.get('/dashboard/revenue-chart?days=7'),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders || []);
      setTopMovies(moviesRes.data.movies || []);
      setRevenueChart(chartRes.data.chart || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // Connect WebSocket
    console.log('🔌 Attempting to connect socket...');
    connectSocket();
    
    const onConnect = () => {
      setIsConnected(true);
      console.log('🔌 Socket connected, id:', socket.id);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    };

    const onConnectError = (error) => {
      console.error('❌ Socket connection error:', error.message);
    };
    
    const onOrderPaid = (data) => {
      console.log('💰 New order paid:', data);
      toast.success(`Đơn hàng mới: ${data.orderCode}`, {
        description: `${data.customer} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.amount)}`,
        icon: <Bell className="text-green-500" />,
      });
      // Reload dashboard data
      loadDashboardData(true);
    };

    const onStatsUpdated = (data) => {
      console.log('📊 Stats updated:', data);
      // Reload dashboard data silently
      loadDashboardData(true);
    };
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.ORDER_PAID, onOrderPaid);
    socket.on(SOCKET_EVENTS.STATS_UPDATED, onStatsUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SOCKET_EVENTS.ORDER_PAID, onOrderPaid);
      socket.off(SOCKET_EVENTS.STATS_UPDATED, onStatsUpdated);
      disconnectSocket();
    };
  }, [loadDashboardData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Paid': { label: 'Đã thanh toán', class: 'bg-green-100 text-green-700' },
      'Pending': { label: 'Chờ thanh toán', class: 'bg-yellow-100 text-yellow-700' },
      'Cancelled': { label: 'Đã hủy', class: 'bg-red-100 text-red-700' },
      'Refunded': { label: 'Đã hoàn tiền', class: 'bg-gray-100 text-gray-700' },
    };
    const info = statusMap[status] || statusMap['Pending'];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${info.class}`}>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">
            {user?.role === 'manager' 
              ? `Tổng quan hoạt động - ${user?.managedTheaters?.map(t => t.name).join(', ') || 'Các rạp được quản lý'}`
              : 'Tổng quan hoạt động hôm nay'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className={isConnected ? 'text-green-600' : 'text-gray-400'}>
              {isConnected ? 'Realtime' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Manager theater info banner */}
      {user?.role === 'manager' && user?.managedTheaters?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-600" size={20} />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Bạn đang quản lý {user.managedTheaters.length} rạp
              </p>
              <p className="text-xs text-blue-600">
                {user.managedTheaters.map(t => t.name).join(' • ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          change={stats.revenueChange}
          changeType={stats.revenueChange >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Doanh thu đặt vé"
          value={formatCurrency(stats.todayOrderRevenue || 0)}
          icon={Ticket}
          color="blue"
        />
        <StatCard
          title="Doanh thu đặt nhóm"
          value={formatCurrency(stats.todayGroupRevenue || 0)}
          subValue={stats.todayGroupBookings ? `${stats.todayGroupBookings} đơn` : null}
          icon={UsersRound}
          color="amber"
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Vé đã bán"
          value={stats.todayTickets}
          icon={Film}
          color="red"
        />
        <StatCard
          title="Tổng khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Doanh thu 7 ngày qua</h2>
          </div>
          <div className="text-sm text-gray-500">
            Tổng: {formatCurrency(revenueChart.reduce((sum, item) => sum + item.revenue, 0))}
          </div>
        </div>
        
        {revenueChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chưa có dữ liệu doanh thu
          </div>
        ) : (
          <div className="h-64">
            {/* Chart */}
            <div className="flex items-end justify-between h-52 gap-2">
              {revenueChart.map((item, index) => {
                const maxRevenue = Math.max(...revenueChart.map(r => r.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const date = new Date(item.date);
                const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                const dayNum = date.getDate();
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-44">
                      <span className="text-xs text-gray-600 mb-1 font-medium">
                        {item.revenue > 0 ? formatCurrency(item.revenue).replace('₫', '').trim() : ''}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-600 hover:to-red-500 cursor-pointer min-h-[4px]"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${formatCurrency(item.revenue)}`}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-700">{dayNum}</div>
                      <div className="text-xs text-gray-400">{dayName}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {order.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Movies */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Phim bán chạy</h2>
          </div>
          <div className="p-4 space-y-4">
            {topMovies.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
            ) : (
              topMovies.map((movie, index) => (
                <div key={movie.id} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-400 w-6">
                    {index + 1}
                  </span>
                  <img
                    src={movie.poster_url || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{movie.title}</h3>
                    <p className="text-sm text-gray-500">
                      {movie.ticketsSold} vé • {formatCurrency(movie.revenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
