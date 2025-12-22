import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  X,
  Ticket,
  Percent,
  DollarSign,
  Calendar,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Gift,
  Users,
  ShoppingCart,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch promotions
const fetchPromotions = async (filters) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  const response = await api.get(`/promotions?${params.toString()}`);
  return response.data.promotions;
};

// Fetch stats
const fetchStats = async () => {
  const response = await api.get('/promotions/stats');
  return response.data.stats;
};

const VouchersPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', type: '' });
  const [searchInput, setSearchInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'Percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    usage_per_user: 1,
    valid_from: '',
    valid_to: '',
    applicable_to: 'All',
    is_active: true
  });

  // Queries
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers', filters],
    queryFn: () => fetchPromotions(filters)
  });

  const { data: stats } = useQuery({
    queryKey: ['voucher-stats'],
    queryFn: fetchStats
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/promotions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher-stats'] });
      toast.success('Đã tạo voucher');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi tạo voucher');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/promotions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Đã cập nhật voucher');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật voucher');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher-stats'] });
      toast.success('Đã xóa voucher');
      setShowDeleteModal(false);
      setDeletingVoucher(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa voucher');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/promotions/${id}/toggle`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher-stats'] });
      toast.success(response.data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi thay đổi trạng thái');
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setCurrentPage(1); // Reset page when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter vouchers by type (group booking vs normal)
  const filteredVouchers = vouchers.filter(voucher => {
    const isGroupBookingVoucher = voucher.code?.startsWith('ABS-') || voucher.name?.includes('Voucher DN');
    if (filters.type === 'group') return isGroupBookingVoucher;
    if (filters.type === 'normal') return !isGroupBookingVoucher;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.type]);

  const closeModal = () => {
    setShowModal(false);
    setEditingVoucher(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'Percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount: '',
      usage_limit: '',
      usage_per_user: 1,
      valid_from: '',
      valid_to: '',
      applicable_to: 'All',
      is_active: true
    });
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name || '',
      description: voucher.description || '',
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order_amount: voucher.min_order_amount || '',
      max_discount: voucher.max_discount || '',
      usage_limit: voucher.usage_limit || '',
      usage_per_user: voucher.usage_per_user || 1,
      valid_from: voucher.valid_from ? new Date(voucher.valid_from).toISOString().slice(0, 16) : '',
      valid_to: voucher.valid_to ? new Date(voucher.valid_to).toISOString().slice(0, 16) : '',
      applicable_to: voucher.applicable_to,
      is_active: voucher.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];
    
    if (!formData.code.trim()) {
      errors.push('Mã voucher');
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      errors.push('Giá trị giảm');
    }
    if (formData.discount_type === 'Percentage' && parseFloat(formData.discount_value) > 100) {
      toast.error('Giá trị giảm phần trăm không được vượt quá 100%');
      return;
    }
    if (!formData.valid_from) {
      errors.push('Ngày bắt đầu');
    }
    if (!formData.valid_to) {
      errors.push('Ngày kết thúc');
    }
    if (formData.valid_from && formData.valid_to && new Date(formData.valid_from) >= new Date(formData.valid_to)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    if (errors.length > 0) {
      toast.error(`Vui lòng nhập: ${errors.join(', ')}`);
      return;
    }

    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      usage_per_user: parseInt(formData.usage_per_user) || 1
    };

    if (editingVoucher) {
      updateMutation.mutate({ id: editingVoucher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.valid_from);
    const validTo = new Date(voucher.valid_to);

    if (!voucher.is_active) return { label: 'Tắt', color: 'bg-gray-100 text-gray-600' };
    if (now < validFrom) return { label: 'Sắp tới', color: 'bg-blue-100 text-blue-600' };
    if (now > validTo) return { label: 'Hết hạn', color: 'bg-red-100 text-red-600' };
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return { label: 'Hết lượt', color: 'bg-orange-100 text-orange-600' };
    }
    return { label: 'Hoạt động', color: 'bg-green-100 text-green-600' };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const discountTypeLabels = {
    'Percentage': 'Phần trăm (%)',
    'FixedAmount': 'Số tiền cố định',
    'BuyXGetY': 'Mua X tặng Y'
  };

  const applicableToLabels = {
    'All': 'Tất cả',
    'Tickets': 'Chỉ vé',
    'Combos': 'Chỉ combo'
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Voucher</h1>
          <p className="text-gray-500 mt-1">Tạo và quản lý mã khuyến mãi</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo Voucher
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng voucher</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang hoạt động</p>
                <p className="text-xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hết hạn</p>
                <p className="text-xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lượt sử dụng</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalUsed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Tất cả loại</option>
            <option value="normal">Voucher thường</option>
            <option value="group">Voucher đặt nhóm</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp tới</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>
        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          Hiển thị {paginatedVouchers.length} / {filteredVouchers.length} voucher
          {filters.type && ` (${filters.type === 'group' ? 'Đặt nhóm' : 'Thường'})`}
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có voucher nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảm giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Áp dụng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lượt dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hiệu lực</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedVouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  // Kiểm tra voucher từ đặt vé nhóm (có prefix ABS- hoặc name chứa 'Voucher DN')
                  const isGroupBookingVoucher = voucher.code?.startsWith('ABS-') || voucher.name?.includes('Voucher DN');
                  return (
                    <tr key={voucher.id} className={`hover:bg-gray-50 ${isGroupBookingVoucher ? 'bg-purple-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-600">{voucher.code}</span>
                          <button
                            onClick={() => copyCode(voucher.code)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copy mã"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          {isGroupBookingVoucher && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              Đặt nhóm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{voucher.name || '-'}</p>
                          {voucher.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{voucher.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {voucher.discount_type === 'Percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{voucher.discount_value}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{formatCurrency(voucher.discount_value)}đ</span>
                            </>
                          )}
                        </div>
                        {voucher.max_discount && (
                          <p className="text-xs text-gray-500">Tối đa: {formatCurrency(voucher.max_discount)}đ</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{applicableToLabels[voucher.applicable_to]}</span>
                        {voucher.min_order_amount > 0 && (
                          <p className="text-xs text-gray-500">Đơn tối thiểu: {formatCurrency(voucher.min_order_amount)}đ</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">
                          {voucher.used_count}/{voucher.usage_limit || '∞'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-600">{formatDate(voucher.valid_from)}</p>
                          <p className="text-gray-400">→ {formatDate(voucher.valid_to)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isGroupBookingVoucher ? (
                            <span className="text-xs text-gray-500 italic">Quản lý tại Đặt vé nhóm</span>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleMutation.mutate(voucher.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  voucher.is_active 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={voucher.is_active ? 'Tắt voucher' : 'Bật voucher'}
                              >
                                {voucher.is_active ? (
                                  <ToggleRight className="w-5 h-5" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => openEditModal(voucher)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingVoucher(voucher);
                                  setShowDeleteModal(true);
                                }}
                                disabled={voucher.used_count > 0}
                                className={`p-2 rounded-lg transition-colors ${
                                  voucher.used_count > 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                                title={voucher.used_count > 0 ? 'Không thể xóa voucher đã dùng' : 'Xóa'}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đầu
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-red-500 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cuối
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Code & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã voucher <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE50"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên voucher</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Giảm 50% cuối năm"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về voucher..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Percentage">Phần trăm (%)</option>
                    <option value="FixedAmount">Số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder={formData.discount_type === 'Percentage' ? 'VD: 20' : 'VD: 50000'}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.discount_type === 'Percentage' ? '%' : 'đ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      placeholder="VD: 100000"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      placeholder="VD: 100000"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">đ</span>
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Để trống = không giới hạn"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lượt/người dùng</label>
                  <input
                    type="number"
                    value={formData.usage_per_user}
                    onChange={(e) => setFormData({ ...formData, usage_per_user: e.target.value })}
                    placeholder="VD: 1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              {/* Valid Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Applicable To & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Áp dụng cho</label>
                  <select
                    value={formData.applicable_to}
                    onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="All">Tất cả (vé + combo)</option>
                    <option value="Tickets">Chỉ vé xem phim</option>
                    <option value="Combos">Chỉ combo</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingVoucher ? 'Cập nhật' : 'Tạo voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingVoucher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa voucher <strong className="text-red-600">{deletingVoucher.code}</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingVoucher(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingVoucher.id)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VouchersPage;
