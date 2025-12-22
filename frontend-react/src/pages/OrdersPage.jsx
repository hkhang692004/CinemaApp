import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Loader2, 
  Search,
  ShoppingCart,
  DollarSign,
  Calendar,
  Eye,
  X,
  Ban,
  RotateCcw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Ticket,
  MapPin,
  User,
  CreditCard,
  Popcorn
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import { socket, connectSocket, SOCKET_EVENTS } from '../config/socket';

// Fetch orders
const fetchOrders = async (filters) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.theaterId) params.append('theaterId', filters.theaterId);
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 20);
  const response = await api.get(`/orders?${params.toString()}`);
  return response.data;
};

// Fetch stats
const fetchStats = async () => {
  const response = await api.get('/orders/stats');
  return response.data.stats;
};

const statusConfig = {
  Pending: { 
    label: 'Chờ thanh toán', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock
  },
  Paid: { 
    label: 'Đã thanh toán', 
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle
  },
  Cancelled: { 
    label: 'Đã hủy', 
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle
  },
  Refunded: { 
    label: 'Đã hoàn tiền', 
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: RotateCcw
  }
};

const OrdersPage = () => {
  // Note: Backend already filters orders by manager's assigned theaters
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    theaterId: '',
    page: 1,
    limit: 20
  });
  const [searchInput, setSearchInput] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  // Queries
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    placeholderData: keepPreviousData
  });

  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: fetchStats
  });

  // Note: Backend already filters orders by manager's assigned theaters
  // so no need for theater filter dropdown in UI for manager role

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.success(response.data.message);
      setShowCancelModal(false);
      setCancellingOrder(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật đơn hàng');
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Socket realtime updates
  useEffect(() => {
    connectSocket();

    const handleOrderUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    };

    const handleOrderRefunded = (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      toast.info(`💸 Đơn hàng #${data.orderCode || data.order?.order_code || 'N/A'} đã hoàn tiền`, {
        duration: 5000
      });
    };

    socket.on(SOCKET_EVENTS.NEW_ORDER, handleOrderUpdate);
    socket.on(SOCKET_EVENTS.ORDER_PAID, handleOrderUpdate);
    socket.on(SOCKET_EVENTS.ORDER_CANCELLED, handleOrderUpdate);
    socket.on(SOCKET_EVENTS.ORDER_REFUNDED, handleOrderRefunded);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER, handleOrderUpdate);
      socket.off(SOCKET_EVENTS.ORDER_PAID, handleOrderUpdate);
      socket.off(SOCKET_EVENTS.ORDER_CANCELLED, handleOrderUpdate);
      socket.off(SOCKET_EVENTS.ORDER_REFUNDED, handleOrderRefunded);
    };
  }, [queryClient]);

  const loadOrderDetail = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch {
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const orders = data?.orders || [];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1">Theo dõi và quản lý các đơn đặt vé</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đơn hôm nay</p>
              <p className="text-xl font-bold text-gray-800">{stats?.today?.orders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats?.today?.revenue)}đ</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chờ thanh toán</p>
              <p className="text-xl font-bold text-yellow-600">{stats?.byStatus?.Pending?.count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đơn tháng này</p>
              <p className="text-xl font-bold text-purple-600">{stats?.thisMonth?.orders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, email, SĐT..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Cancelled">Đã hủy</option>
            <option value="Refunded">Đã hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Mã đơn</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phim / Suất chiếu</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ngày tạo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Không tìm thấy đơn hàng nào</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const statusConf = statusConfig[order.status];
                  const StatusIcon = statusConf?.icon || AlertCircle;
                  const firstTicket = order.Tickets?.[0];
                  const movie = firstTicket?.Showtime?.Movie;
                  const showtime = firstTicket?.Showtime;
                  const theater = firstTicket?.Showtime?.CinemaRoom?.Theater;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-800">{order.order_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{order.User?.full_name}</p>
                          <p className="text-sm text-gray-500">{order.User?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {movie ? (
                          <div className="flex items-center gap-3">
                            {movie.poster_url && (
                              <img 
                                src={movie.poster_url} 
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-800 line-clamp-1">{movie.title}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(showtime?.start_time)}
                              </p>
                              {theater && (
                                <p className="text-xs text-gray-400">{theater.name}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-gray-800">{formatCurrency(order.total_amount)}đ</p>
                        {parseFloat(order.discount_amount) > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(order.discount_amount)}đ</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${statusConf?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConf?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => loadOrderDetail(order.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setCancellingOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hủy đơn"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'Paid' && (
                            <button
                              onClick={() => {
                                setCancellingOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Hoàn tiền"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Trang {data.page} / {data.totalPages} (Tổng {data.total} đơn)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page <= 1}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {[...Array(Math.min(5, data.totalPages))].map((_, idx) => {
                const pageNum = Math.max(1, Math.min(data.page - 2, data.totalPages - 4)) + idx;
                if (pageNum > data.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === data.page 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Chi tiết đơn hàng</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedOrder.order_code}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status & Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    const conf = statusConfig[selectedOrder.status];
                    const Icon = conf?.icon || AlertCircle;
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border ${conf?.color}`}>
                        <Icon className="w-4 h-4" />
                        {conf?.label}
                      </span>
                    );
                  })()}
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">Thông tin khách hàng</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Họ tên</p>
                    <p className="font-medium">{selectedOrder.User?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.User?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium">{selectedOrder.User?.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Tickets */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">Vé đã đặt ({selectedOrder.Tickets?.length || 0} vé)</h3>
                </div>
                <div className="space-y-3">
                  {selectedOrder.Tickets?.map((ticket) => {
                    const showtime = ticket.Showtime;
                    const movie = showtime?.Movie;
                    const room = showtime?.CinemaRoom;
                    const theater = room?.Theater;
                    const seat = ticket.Seat;
                    
                    return (
                      <div key={ticket.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                        {movie?.poster_url && (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{movie?.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(showtime?.start_time)}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {theater?.name} - {room?.name}
                            </span>
                            <span className="font-medium text-gray-700">
                              Ghế {seat?.row_label}{seat?.seat_number}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-red-600 mt-1">
                            {formatCurrency(ticket.price)}đ
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ticket.status === 'CheckedIn' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'Paid' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status === 'CheckedIn' ? 'Đã sử dụng' :
                             ticket.status === 'Paid' ? 'Đã thanh toán' :
                             ticket.status === 'Cancelled' ? 'Đã hủy' :
                             ticket.status === 'Refunded' ? 'Đã hoàn tiền' :
                             ticket.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combos */}
              {selectedOrder.ComboOrders?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Popcorn className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800">Combo đã mua</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.ComboOrders.map(co => (
                      <div key={co.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {co.Combo?.image_url && (
                            <img 
                              src={co.Combo.image_url} 
                              alt={co.Combo.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{co.Combo?.name}</p>
                            <p className="text-sm text-gray-500">x{co.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-red-600">
                          {formatCurrency(co.unit_price * co.quantity)}đ
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">Thanh toán</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedOrder.promotion_code && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mã giảm giá</span>
                      <span className="font-mono">{selectedOrder.promotion_code}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Giảm giá voucher</span>
                      <span className="text-green-600">-{formatCurrency(selectedOrder.discount_amount)}đ</span>
                    </div>
                  )}
                  {selectedOrder.loyalty_points_used > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Điểm đã dùng ({selectedOrder.loyalty_points_used} điểm)</span>
                      <span className="text-green-600">-{formatCurrency(selectedOrder.loyalty_discount)}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phương thức</span>
                    <span>{selectedOrder.payment_method || 'VNPay'}</span>
                  </div>
                  {selectedOrder.Payments?.[0]?.paid_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Thanh toán lúc</span>
                      <span>{formatDate(selectedOrder.Payments[0].paid_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-red-600">{formatCurrency(selectedOrder.total_amount)}đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              {selectedOrder.status === 'Pending' && (
                <button
                  onClick={() => {
                    setCancellingOrder(selectedOrder);
                    setShowDetailModal(false);
                    setShowCancelModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Hủy đơn
                </button>
              )}
              {selectedOrder.status === 'Paid' && (
                <button
                  onClick={() => {
                    setCancellingOrder(selectedOrder);
                    setShowDetailModal(false);
                    setShowCancelModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hoàn tiền
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Refund Modal */}
      {showCancelModal && cancellingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${
                cancellingOrder.status === 'Pending' ? 'bg-red-100' : 'bg-purple-100'
              }`}>
                {cancellingOrder.status === 'Pending' ? (
                  <Ban className="w-6 h-6 text-red-600" />
                ) : (
                  <RotateCcw className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {cancellingOrder.status === 'Pending' ? 'Hủy đơn hàng' : 'Hoàn tiền đơn hàng'}
                </h3>
                <p className="text-sm text-gray-500">{cancellingOrder.order_code}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  {cancellingOrder.status === 'Pending' ? (
                    <p>Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.</p>
                  ) : (
                    <p>Bạn có chắc chắn muốn hoàn tiền đơn hàng này? Các vé sẽ bị hủy và ghế sẽ được mở lại.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium">{cancellingOrder.User?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold text-red-600">{formatCurrency(cancellingOrder.total_amount)}đ</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingOrder(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  cancelMutation.mutate({
                    id: cancellingOrder.id,
                    status: cancellingOrder.status === 'Pending' ? 'Cancelled' : 'Refunded'
                  });
                }}
                disabled={cancelMutation.isPending}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  cancellingOrder.status === 'Pending' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cancellingOrder.status === 'Pending' ? (
                  <>
                    <Ban className="w-4 h-4" />
                    Xác nhận hủy
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Xác nhận hoàn tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
