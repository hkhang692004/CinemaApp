import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  X,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  ChevronDown
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import socket, { SOCKET_EVENTS, connectSocket } from '../config/socket';

// Fetch combos (admin)
const fetchCombos = async ({ search, category, isActive, page, limit }) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (isActive !== '') params.append('isActive', isActive);
  params.append('page', page);
  params.append('limit', limit);
  const response = await api.get(`/combos/admin?${params.toString()}`);
  return response.data;
};

// Fetch categories
const fetchCategories = async () => {
  const response = await api.get('/combos/categories');
  return response.data.categories;
};

// Fetch stats
const fetchStats = async () => {
  const response = await api.get('/combos/stats');
  return response.data.stats;
};

const CombosPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [deletingCombo, setDeletingCombo] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', isActive: '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const limit = 10;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    price: '',
    category: '',
    items: [{ item_name: '', quantity: 1 }]
  });

  // Socket connection & events
  useEffect(() => {
    connectSocket();

    const handleComboCreated = () => {
      console.log('📡 COMBO_CREATED received');
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      queryClient.invalidateQueries({ queryKey: ['combo-categories'] });
    };

    const handleComboUpdated = () => {
      console.log('📡 COMBO_UPDATED received');
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
    };

    const handleComboDeleted = () => {
      console.log('📡 COMBO_DELETED received');
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      queryClient.invalidateQueries({ queryKey: ['combo-categories'] });
    };

    // Khi có đơn hàng thanh toán thành công, refresh combo data
    const handleOrderPaid = () => {
      console.log('📡 ORDER_PAID received - refreshing combos');
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
    };

    socket.on(SOCKET_EVENTS.COMBO_CREATED, handleComboCreated);
    socket.on(SOCKET_EVENTS.COMBO_UPDATED, handleComboUpdated);
    socket.on(SOCKET_EVENTS.COMBO_DELETED, handleComboDeleted);
    socket.on(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);

    return () => {
      socket.off(SOCKET_EVENTS.COMBO_CREATED, handleComboCreated);
      socket.off(SOCKET_EVENTS.COMBO_UPDATED, handleComboUpdated);
      socket.off(SOCKET_EVENTS.COMBO_DELETED, handleComboDeleted);
      socket.off(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);
    };
  }, [queryClient]);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['combos', filters, page],
    queryFn: () => fetchCombos({ ...filters, page, limit }),
    placeholderData: keepPreviousData
  });

  const combos = data?.combos || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const { data: categories = [] } = useQuery({
    queryKey: ['combo-categories'],
    queryFn: fetchCategories
  });

  const { data: stats } = useQuery({
    queryKey: ['combo-stats'],
    queryFn: fetchStats
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/combos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      queryClient.invalidateQueries({ queryKey: ['combo-categories'] });
      toast.success('Đã tạo combo');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi tạo combo');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/combos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      queryClient.invalidateQueries({ queryKey: ['combo-categories'] });
      toast.success('Đã cập nhật combo');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật combo');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/combos/${id}`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      toast.success(response.data.message);
      setShowDeleteModal(false);
      setDeletingCombo(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa combo');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/combos/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.invalidateQueries({ queryKey: ['combo-stats'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi thay đổi trạng thái');
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCategoryDropdown && !e.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  const closeModal = () => {
    setShowModal(false);
    setEditingCombo(null);
    setImagePreview(null);
    setShowCategoryDropdown(false);
    setCustomCategory('');
    setFormData({
      name: '',
      description: '',
      image_url: '',
      price: '',
      category: '',
      items: [{ item_name: '', quantity: 1 }]
    });
  };

  const openEditModal = (combo) => {
    setEditingCombo(combo);
    setImagePreview(combo.image_url || null);
    setShowCategoryDropdown(false);
    setCustomCategory('');
    setFormData({
      name: combo.name,
      description: combo.description || '',
      image_url: combo.image_url || '',
      price: combo.price,
      category: combo.category || '',
      items: combo.items?.length > 0 
        ? combo.items.map(item => ({ item_name: item.name, quantity: item.quantity }))
        : [{ item_name: '', quantity: 1 }]
    });
    setShowModal(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setImagePreview(base64);
      
      // Upload to server
      setUploading(true);
      try {
        const response = await api.post('/combos/upload', { image: base64 });
        setFormData(prev => ({ ...prev, image_url: response.data.url }));
        toast.success('Upload ảnh thành công');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi upload ảnh');
        setImagePreview(formData.image_url || null);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Tên combo');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Giá');
    if (!formData.category.trim()) errors.push('Danh mục');
    
    // Filter valid items
    const validItems = formData.items.filter(item => item.item_name.trim());
    if (validItems.length === 0) errors.push('Ít nhất 1 món');

    if (errors.length > 0) {
      toast.error(`Vui lòng nhập: ${errors.join(', ')}`);
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image_url: formData.image_url,
      price: parseFloat(formData.price),
      category: formData.category.trim(),
      items: validItems.map(item => ({
        item_name: item.item_name.trim(),
        quantity: parseInt(item.quantity) || 1
      }))
    };

    if (editingCombo) {
      updateMutation.mutate({ id: editingCombo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity: 1 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (isLoading && combos.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Combo</h1>
          <p className="text-gray-500 mt-1">Quản lý các combo bắp nước</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo Combo
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng combo</p>
                <p className="text-xl font-bold text-gray-800">{stats.totalCombos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ToggleRight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang bán</p>
                <p className="text-xl font-bold text-green-600">{stats.activeCombos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đã bán</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.topCombos?.reduce((sum, c) => sum + c.totalSold, 0) || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Doanh thu combo</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalRevenue || 0)}đ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Combos */}
      {stats?.topCombos?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-800">Top combo bán chạy</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.topCombos.map((combo, index) => (
              <div 
                key={combo.id} 
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
              >
                <span className="text-sm font-bold text-red-500">#{index + 1}</span>
                <span className="font-medium text-gray-700">{combo.name}</span>
                <span className="text-sm text-gray-500">({combo.totalSold} đã bán)</span>
              </div>
            ))}
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
              placeholder="Tìm kiếm theo tên combo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, category: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, isActive: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang bán</option>
            <option value="false">Ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Combos List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {combos.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có combo nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bao gồm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {combos.map((combo) => (
                    <tr key={combo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {combo.image_url ? (
                              <img 
                                src={combo.image_url} 
                                alt={combo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{combo.name}</p>
                            {combo.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{combo.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {combo.category || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {combo.items?.map((item, idx) => (
                            <span key={idx}>
                              {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                              {idx < combo.items.length - 1 && ', '}
                            </span>
                          )) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{formatCurrency(combo.price)}đ</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          combo.is_active 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {combo.is_active ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleMutation.mutate({ id: combo.id, is_active: !combo.is_active })}
                            className={`p-2 rounded-lg transition-colors ${
                              combo.is_active 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={combo.is_active ? 'Ngừng bán' : 'Mở bán'}
                          >
                            {combo.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(combo)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCombo(combo);
                              setShowDeleteModal(true);
                            }}
                            disabled={combo.order_count > 0}
                            className={`p-2 rounded-lg transition-colors ${
                              combo.order_count > 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title={combo.order_count > 0 ? `Không thể xóa - đã có ${combo.order_count} đơn hàng` : 'Xóa'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Hiển thị {combos.length} / {pagination.total} combo
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-gray-600">
                    {page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCombo ? 'Chỉnh sửa Combo' : 'Tạo Combo mới'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên combo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="VD: Combo Đôi"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Mô tả ngắn về combo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">đ</span>
                  </div>
                </div>

                <div className="relative category-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between bg-white"
                  >
                    <span className={formData.category ? 'text-gray-800' : 'text-gray-400'}>
                      {formData.category || 'Chọn hoặc nhập danh mục'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Custom input */}
                      <div className="p-2 border-b border-gray-100">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Nhập danh mục mới..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {customCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: customCategory.trim() }));
                              setCustomCategory('');
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full mt-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                          >
                            + Thêm "{customCategory.trim()}"
                          </button>
                        )}
                      </div>
                      
                      {/* Existing categories */}
                      <div className="py-1">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: cat }));
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${formData.category === cat ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Upload button */}
                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                            <span className="text-gray-600">Đang upload...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-600">Chọn ảnh</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG tối đa 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Các món trong combo <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Tên món (VD: Bắp rang bơ size L)"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-20 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="SL"
                        min="1"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm món
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingCombo ? 'Cập nhật' : 'Tạo combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCombo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xóa combo?</h3>
              <p className="text-gray-500">
                Bạn có chắc muốn xóa combo <span className="font-semibold">{deletingCombo.name}</span>?
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCombo(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingCombo.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

export default CombosPage;
