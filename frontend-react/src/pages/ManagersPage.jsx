import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X, 
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import api from '../config/api';

// Fetch managers
const fetchManagers = async () => {
  const response = await api.get('/managers');
  return response.data.data;
};

// Fetch theaters
const fetchTheaters = async () => {
  const response = await api.get('/managers/theaters');
  return response.data.data;
};

// Create manager
const createManager = async (data) => {
  const response = await api.post('/managers', data);
  return response.data;
};

// Update manager
const updateManager = async ({ id, data }) => {
  const response = await api.put(`/managers/${id}`, data);
  return response.data;
};

// Delete manager
const deleteManager = async (id) => {
  const response = await api.delete(`/managers/${id}`);
  return response.data;
};

const ManagersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    theater_ids: []
  });

  // Queries
  const { data: managers = [], isLoading: isLoadingManagers } = useQuery({
    queryKey: ['managers'],
    queryFn: fetchManagers
  });

  const { data: theaters = [], isLoading: isLoadingTheaters } = useQuery({
    queryKey: ['theaters-for-assign'],
    queryFn: fetchTheaters
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Tạo tài khoản manager thành công');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Lỗi tạo tài khoản');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Cập nhật manager thành công');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Lỗi cập nhật manager');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Xóa manager thành công');
      setIsDeleteModalOpen(false);
      setSelectedManager(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Lỗi xóa manager');
    }
  });

  // Filter managers
  const filteredManagers = managers.filter(manager => 
    manager.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.phone?.includes(searchTerm)
  );

  // Handlers
  const openCreateModal = () => {
    setSelectedManager(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      theater_ids: []
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (manager) => {
    setSelectedManager(manager);
    setFormData({
      email: manager.email,
      password: '',
      full_name: manager.fullName,
      phone: manager.phone || '',
      theater_ids: manager.theaters?.map(t => t.id) || []
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedManager(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      theater_ids: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedManager) {
      // Update - chỉ gửi fields đã thay đổi
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        theater_ids: formData.theater_ids
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: selectedManager.id, data: updateData });
    } else {
      // Create
      createMutation.mutate(formData);
    }
  };

  const handleTheaterToggle = (theaterId) => {
    setFormData(prev => ({
      ...prev,
      theater_ids: prev.theater_ids.includes(theaterId)
        ? prev.theater_ids.filter(id => id !== theaterId)
        : [...prev.theater_ids, theaterId]
    }));
  };

  const confirmDelete = (manager) => {
    setSelectedManager(manager);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedManager) {
      deleteMutation.mutate(selectedManager.id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Managers</h1>
          <p className="text-gray-500 mt-1">Quản lý tài khoản quản lý rạp chiếu phim</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Manager
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoadingManagers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? 'Không tìm thấy manager phù hợp' : 'Chưa có manager nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Manager</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Liên hệ</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Rạp quản lý</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Ngày tạo</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredManagers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
                          {manager.avatarUrl ? (
                            <img 
                              src={manager.avatarUrl} 
                              alt={manager.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{manager.fullName}</p>
                          <p className="text-sm text-gray-500">{manager.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-600">{manager.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {manager.theaters && manager.theaters.length > 0 ? (
                          manager.theaters.map((theater) => (
                            <span 
                              key={theater.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              <Building2 className="w-3 h-3" />
                              {theater.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Chưa được gán</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-600">{formatDate(manager.createdAt)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(manager)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(manager)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedManager ? 'Chỉnh sửa Manager' : 'Thêm Manager mới'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-gray-100"
                    placeholder="manager@example.com"
                    required
                    disabled={!!selectedManager}
                  />
                </div>
                {selectedManager && (
                  <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {!selectedManager && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder={selectedManager ? 'Để trống nếu không đổi' : 'Ít nhất 6 ký tự'}
                    required={!selectedManager}
                    minLength={selectedManager ? 0 : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="0901234567"
                    required
                  />
                </div>
              </div>

              {/* Theaters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rạp quản lý
                </label>
                {isLoadingTheaters ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : theaters.length === 0 ? (
                  <p className="text-sm text-gray-500">Không có rạp nào</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {theaters.map((theater) => (
                      <label 
                        key={theater.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.theater_ids.includes(theater.id)}
                          onChange={() => handleTheaterToggle(theater.id)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{theater.name}</p>
                          <p className="text-xs text-gray-500">{theater.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedManager ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa manager <strong>{selectedManager.fullName}</strong>? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedManager(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersPage;
