import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Monitor,
  Armchair,
  DollarSign,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch screen type prices
const fetchScreenTypePrices = async () => {
  const response = await api.get('/theaters/screen-types');
  return response.data.prices;
};

// Fetch seat type prices
const fetchSeatTypePrices = async () => {
  const response = await api.get('/theaters/seat-prices');
  return response.data.prices;
};

const PricingPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('screen-types');
  const [showScreenTypeModal, setShowScreenTypeModal] = useState(false);
  const [editingScreenType, setEditingScreenType] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // Query screen type prices
  const { data: screenTypePrices = [], isLoading: loadingScreenTypes } = useQuery({
    queryKey: ['screenTypePrices'],
    queryFn: fetchScreenTypePrices
  });

  // Query seat type prices
  const { data: seatTypePrices = [], isLoading: loadingSeatTypes } = useQuery({
    queryKey: ['seatTypePrices'],
    queryFn: fetchSeatTypePrices
  });

  // Delete screen type mutation
  const deleteScreenTypeMutation = useMutation({
    mutationFn: (id) => api.delete(`/theaters/screen-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenTypePrices'] });
      toast.success('Đã xóa loại màn hình');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa loại màn hình');
    }
  });

  const handleAddScreenType = () => {
    setEditingScreenType(null);
    setShowScreenTypeModal(true);
  };

  const handleEditScreenType = (screenType) => {
    setEditingScreenType(screenType);
    setShowScreenTypeModal(true);
  };

  const handleDeleteScreenType = (screenType) => {
    setDeletingItem({ type: 'screen-type', data: screenType });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deletingItem.type === 'screen-type') {
      deleteScreenTypeMutation.mutate(deletingItem.data.id);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  if (loadingScreenTypes || loadingSeatTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Giá vé</h1>
          <p className="text-gray-500">Quản lý giá theo loại màn hình và loại ghế</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('screen-types')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'screen-types'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4 inline-block mr-2" />
              Loại màn hình
            </button>
            <button
              onClick={() => setActiveTab('seat-types')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'seat-types'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Armchair className="w-4 h-4 inline-block mr-2" />
              Loại ghế
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'screen-types' && (
            <ScreenTypesTab
              screenTypePrices={screenTypePrices}
              onAdd={handleAddScreenType}
              onEdit={handleEditScreenType}
              onDelete={handleDeleteScreenType}
              formatPrice={formatPrice}
            />
          )}

          {activeTab === 'seat-types' && (
            <SeatTypesTab
              seatTypePrices={seatTypePrices}
              formatPrice={formatPrice}
            />
          )}
        </div>
      </div>

      {/* Screen Type Modal */}
      {showScreenTypeModal && (
        <ScreenTypeModal
          screenType={editingScreenType}
          onClose={() => setShowScreenTypeModal(false)}
          onSave={() => {
            setShowScreenTypeModal(false);
            queryClient.invalidateQueries({ queryKey: ['screenTypePrices'] });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa loại màn hình <strong>{deletingItem?.data?.screen_type}</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingItem(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteScreenTypeMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteScreenTypeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Screen Types Tab Component
const ScreenTypesTab = ({ screenTypePrices, onAdd, onEdit, onDelete, formatPrice }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Danh sách loại màn hình</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus size={20} />
          Thêm loại màn hình
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại màn hình</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Giá cơ bản</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {screenTypePrices.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.screen_type === 'IMAX' ? 'bg-purple-500' :
                      item.screen_type === '4DX' ? 'bg-orange-500' :
                      item.screen_type === 'ScreenX' ? 'bg-blue-500' :
                      item.screen_type === 'Dolby Cinema' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <span className="font-medium text-gray-800">{item.screen_type}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-red-600 font-semibold">{formatPrice(item.base_price)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 text-sm">{item.description || '-'}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.is_active ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {screenTypePrices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có loại màn hình nào. Nhấn "Thêm loại màn hình" để bắt đầu.
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 Hướng dẫn</h4>
        <p className="text-blue-700 text-sm">
          <strong>Giá cơ bản</strong> là giá vé cho loại màn hình này. Khi tạo suất chiếu, hệ thống sẽ tự động lấy giá theo loại màn hình của phòng chiếu.
        </p>
        <p className="text-blue-700 text-sm mt-1">
          <strong>Công thức:</strong> Giá vé cuối cùng = Giá màn hình × Hệ số ghế + Phí ghế
        </p>
      </div>
    </div>
  );
};

// Seat Types Tab Component
const SeatTypesTab = ({ seatTypePrices, formatPrice }) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const updateMutation = useMutation({
    mutationFn: ({ seatType, data }) => api.put(`/theaters/seat-prices/${seatType}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seatTypePrices'] });
      toast.success('Đã cập nhật giá ghế');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật giá ghế');
    }
  });

  const handleEdit = (item) => {
    setEditingId(item.seat_type);
    setEditForm({
      price_multiplier: item.price_multiplier,
      extra_fee: item.extra_fee,
      description: item.description
    });
  };

  const handleSave = (seatType) => {
    // Validate
    const multiplier = parseFloat(editForm.price_multiplier);
    const extraFee = parseInt(editForm.extra_fee) || 0;
    
    if (isNaN(multiplier) || multiplier <= 0) {
      toast.error('Hệ số giá phải lớn hơn 0');
      return;
    }
    if (multiplier > 10) {
      toast.error('Hệ số giá không được vượt quá 10');
      return;
    }
    if (extraFee < 0) {
      toast.error('Phí thêm không được âm');
      return;
    }
    
    updateMutation.mutate({
      seatType,
      data: {
        price_multiplier: multiplier,
        extra_fee: extraFee,
        description: editForm.description
      }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Danh sách loại ghế</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại ghế</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hệ số giá</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phí thêm</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {seatTypePrices.map((item) => (
              <tr key={item.seat_type} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${
                      item.seat_type === 'VIP' ? 'bg-yellow-500' :
                      item.seat_type === 'Couple' ? 'bg-pink-500' :
                      item.seat_type === 'Wheelchair' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium text-gray-800">{item.seat_type}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingId === item.seat_type ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editForm.price_multiplier}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setEditForm({ ...editForm, price_multiplier: val });
                      }}
                      className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <span className="text-gray-800">×{item.price_multiplier}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === item.seat_type ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.extra_fee}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditForm({ ...editForm, extra_fee: val === '' ? '' : parseInt(val, 10) });
                      }}
                      className="w-28 px-2 py-1 border rounded focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <span className="text-gray-600">+{formatPrice(item.extra_fee)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === item.seat_type ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">{item.description || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {editingId === item.seat_type ? (
                      <>
                        <button
                          onClick={() => handleSave(item.seat_type)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Lưu"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Hủy"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Example calculation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-green-800 mb-2">📊 Ví dụ tính giá</h4>
        <p className="text-green-700 text-sm">
          Với phòng <strong>IMAX</strong> (giá 150,000đ) + ghế <strong>VIP</strong> (×1.5):
        </p>
        <p className="text-green-800 font-semibold mt-1">
          150,000 × 1.5 + 0 = 225,000đ
        </p>
      </div>
    </div>
  );
};

// Screen Type Modal Component
const ScreenTypeModal = ({ screenType, onClose, onSave }) => {
  const [form, setForm] = useState({
    screen_type: screenType?.screen_type || '',
    base_price: screenType?.base_price || 100000,
    description: screenType?.description || '',
    is_active: screenType?.is_active !== undefined ? screenType.is_active : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.screen_type.trim()) {
      toast.error('Vui lòng nhập tên loại màn hình');
      return;
    }
    if (!form.base_price || form.base_price <= 0) {
      toast.error('Vui lòng nhập giá cơ bản hợp lệ');
      return;
    }

    setLoading(true);

    try {
      if (screenType) {
        await api.put(`/theaters/screen-types/${screenType.id}`, form);
        toast.success('Đã cập nhật loại màn hình');
      } else {
        await api.post('/theaters/screen-types', form);
        toast.success('Đã thêm loại màn hình mới');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {screenType ? 'Chỉnh sửa loại màn hình' : 'Thêm loại màn hình'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên loại màn hình <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.screen_type}
              onChange={(e) => setForm({ ...form, screen_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              placeholder="VD: IMAX, 4DX, ScreenX, Dolby Cinema..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá cơ bản (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.base_price}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, base_price: val === '' ? '' : parseInt(val, 10) });
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              placeholder="100000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
              placeholder="Mô tả về loại màn hình..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Đang hoạt động
            </label>
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {screenType ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
