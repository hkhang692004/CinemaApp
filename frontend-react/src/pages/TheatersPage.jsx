import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Building2, 
  Loader2, 
  X,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Armchair,
  Eye,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Upload
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch theaters
const fetchTheaters = async () => {
  const response = await api.get('/theaters');
  return response.data.theaters;
};

// Fetch rooms by theater
const fetchRoomsByTheater = async (theaterId) => {
  const response = await api.get(`/theaters/${theaterId}/rooms`);
  return response.data.rooms;
};

// Fetch seats by room
const fetchSeatsByRoom = async (roomId) => {
  const response = await api.get(`/theaters/rooms/${roomId}/seats`);
  return response.data.seats;
};

const TheatersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showTheaterModal, setShowTheaterModal] = useState(false);
  const [editingTheater, setEditingTheater] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTheater, setExpandedTheater] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedTheaterId, setSelectedTheaterId] = useState(null);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showGenerateSeatsModal, setShowGenerateSeatsModal] = useState(false);
  const ITEMS_PER_PAGE = 8;

  // Query theaters
  const { data: theaters = [], isLoading } = useQuery({
    queryKey: ['theaters'],
    queryFn: fetchTheaters
  });

  // Delete mutation
  const deleteTheaterMutation = useMutation({
    mutationFn: (id) => api.delete(`/theaters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theaters'] });
      toast.success('Đã xóa rạp');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa rạp');
    }
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id) => api.delete(`/theaters/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theaters'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã xóa phòng chiếu');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa phòng chiếu');
    }
  });

  const filteredTheaters = theaters.filter((theater) => {
    return theater.name.toLowerCase().includes(search.toLowerCase()) ||
           theater.city?.toLowerCase().includes(search.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredTheaters.length / ITEMS_PER_PAGE);
  const paginatedTheaters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTheaters.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTheaters, currentPage]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEditTheater = (theater) => {
    setEditingTheater(theater);
    setShowTheaterModal(true);
  };

  const handleAddTheater = () => {
    setEditingTheater(null);
    setShowTheaterModal(true);
  };

  const handleDeleteTheater = (theater) => {
    setDeletingItem({ type: 'theater', data: theater });
    setShowDeleteModal(true);
  };

  const handleAddRoom = (theaterId) => {
    setSelectedTheaterId(theaterId);
    setEditingRoom(null);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setSelectedTheaterId(room.theater_id);
    setShowRoomModal(true);
  };

  const handleDeleteRoom = (room) => {
    setDeletingItem({ type: 'room', data: room });
    setShowDeleteModal(true);
  };

  const handleViewSeats = (room) => {
    setSelectedRoom(room);
    setShowSeatsModal(true);
  };

  const handleGenerateSeats = (room) => {
    setSelectedRoom(room);
    setShowGenerateSeatsModal(true);
  };

  const confirmDelete = () => {
    if (deletingItem.type === 'theater') {
      deleteTheaterMutation.mutate(deletingItem.data.id);
    } else if (deletingItem.type === 'room') {
      deleteRoomMutation.mutate(deletingItem.data.id);
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Rạp chiếu</h1>
          <p className="text-gray-500">Quản lý rạp, phòng chiếu và ghế ngồi</p>
        </div>
        <button
          onClick={handleAddTheater}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus size={20} />
          Thêm rạp mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên rạp hoặc thành phố..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {/* Theaters List */}
      <div className="space-y-4">
        {paginatedTheaters.map((theater) => (
          <TheaterCard
            key={theater.id}
            theater={theater}
            isExpanded={expandedTheater === theater.id}
            onToggle={() => setExpandedTheater(expandedTheater === theater.id ? null : theater.id)}
            onEdit={() => handleEditTheater(theater)}
            onDelete={() => handleDeleteTheater(theater)}
            onAddRoom={() => handleAddRoom(theater.id)}
            onEditRoom={handleEditRoom}
            onDeleteRoom={handleDeleteRoom}
            onViewSeats={handleViewSeats}
            onGenerateSeats={handleGenerateSeats}
          />
        ))}

        {filteredTheaters.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy rạp nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg font-medium transition ${
                currentPage === page
                  ? 'bg-red-600 text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showTheaterModal && (
        <TheaterModal
          theater={editingTheater}
          onClose={() => setShowTheaterModal(false)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['theaters'] });
            setShowTheaterModal(false);
          }}
        />
      )}

      {showRoomModal && (
        <RoomModal
          room={editingRoom}
          theaterId={selectedTheaterId}
          onClose={() => setShowRoomModal(false)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['theaters'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            setShowRoomModal(false);
          }}
        />
      )}

      {showSeatsModal && selectedRoom && (
        <SeatsModal
          room={selectedRoom}
          onClose={() => setShowSeatsModal(false)}
        />
      )}

      {showGenerateSeatsModal && selectedRoom && (
        <GenerateSeatsModal
          room={selectedRoom}
          onClose={() => setShowGenerateSeatsModal(false)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['seats', selectedRoom.id] });
            setShowGenerateSeatsModal(false);
          }}
        />
      )}

      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">
              Xác nhận xóa {deletingItem.type === 'theater' ? 'rạp' : 'phòng chiếu'}
            </h3>
            <p className="text-gray-500 mb-4">
              Bạn có chắc chắn muốn xóa {deletingItem.type === 'theater' ? 'rạp' : 'phòng chiếu'}{' '}
              <strong>{deletingItem.data.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTheaterMutation.isPending || deleteRoomMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {(deleteTheaterMutation.isPending || deleteRoomMutation.isPending) ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Theater Card Component
const TheaterCard = ({ 
  theater, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onViewSeats,
  onGenerateSeats
}) => {
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', theater.id],
    queryFn: () => fetchRoomsByTheater(theater.id),
    enabled: isExpanded
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Theater Header */}
      <div className="p-4 flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
          {theater.image_url ? (
            <img src={theater.image_url} alt={theater.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg">{theater.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                {theater.address}, {theater.city}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              theater.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {theater.is_active ? 'Hoạt động' : 'Tạm đóng'}
            </span>
          </div>
          
          {!theater.is_active && (
            <p className="text-xs text-red-500 mt-1">
              ⚠️ Rạp đang tạm đóng - Người dùng không thể đặt vé mới
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {theater.phone && (
              <span className="flex items-center gap-1">
                <Phone size={14} />
                {theater.phone}
              </span>
            )}
            {theater.email && (
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {theater.email}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Rooms Section (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <DoorOpen size={18} />
              Phòng chiếu ({rooms.length})
            </h4>
            <button
              onClick={onAddRoom}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Plus size={16} />
              Thêm phòng
            </button>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Chưa có phòng chiếu nào</p>
          ) : (
            <div className="grid gap-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      room.screen_type === 'IMAX' ? 'bg-purple-100 text-purple-600' :
                      room.screen_type === '4DX' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <DoorOpen size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{room.screen_type} ({room.name})</p>
                      <p className="text-sm text-gray-500">
                        {room.seat_count} ghế
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewSeats(room)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Xem ghế"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onGenerateSeats(room)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Tạo ghế"
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => onEditRoom(room)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteRoom(room)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Theater Modal
const TheaterModal = ({ theater, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: theater?.name || '',
    address: theater?.address || '',
    city: theater?.city || '',
    phone: theater?.phone || '',
    email: theater?.email || '',
    image_url: theater?.image_url || '',
    is_active: theater?.is_active !== undefined ? theater.is_active : true,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const response = await api.post('/theaters/upload/image', { image: base64 });
          setForm(prev => ({ ...prev, image_url: response.data.url }));
          toast.success('Đã tải lên ảnh thành công');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi tải lên ảnh');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        toast.error('Lỗi khi đọc file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    if (form.phone && form.phone.trim() !== '') {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(form.phone.replace(/\s|-/g, ''))) {
        toast.error('Số điện thoại không hợp lệ (10-11 số)');
        return;
      }
    }
    
    // Validate email
    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.error('Email không hợp lệ');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (theater) {
        await api.put(`/theaters/${theater.id}`, form);
        toast.success('Đã cập nhật rạp');
      } else {
        await api.post('/theaters', form);
        toast.success('Đã thêm rạp mới');
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
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {theater ? 'Chỉnh sửa rạp' : 'Thêm rạp mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên rạp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              placeholder="TP. Hồ Chí Minh, Hà Nội..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh rạp
            </label>
            <div className="flex gap-3">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {uploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: '' })}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
            {form.image_url && (
              <div className="mt-2">
                <img 
                  src={form.image_url} 
                  alt="Theater preview" 
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
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
            {theater ? 'Cập nhật' : 'Thêm rạp'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Room Modal
const RoomModal = ({ room, theaterId, onClose, onSave }) => {
  const [form, setForm] = useState({
    theater_id: room?.theater_id || theaterId,
    name: room?.name || '',
    screen_type: room?.screen_type || 'Standard',
    is_active: room?.is_active !== undefined ? room.is_active : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (room) {
        await api.put(`/theaters/rooms/${room.id}`, form);
        toast.success('Đã cập nhật phòng chiếu');
      } else {
        await api.post('/theaters/rooms', form);
        toast.success('Đã thêm phòng chiếu');
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
            {room ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên phòng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              placeholder="Phòng 1, Phòng IMAX..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại màn hình
            </label>
            <select
              value={form.screen_type}
              onChange={(e) => setForm({ ...form, screen_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            >
              <option value="Standard">Standard</option>
              <option value="IMAX">IMAX</option>
              <option value="4DX">4DX</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="room_is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="room_is_active" className="text-sm text-gray-700">
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
            {room ? 'Cập nhật' : 'Thêm phòng'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Seats Modal
const SeatsModal = ({ room, onClose }) => {
  const { data: seats = [], isLoading } = useQuery({
    queryKey: ['seats', room.id],
    queryFn: () => fetchSeatsByRoom(room.id)
  });

  // Group seats by row and find max seat number
  const { seatsByRow, maxSeatNumber } = useMemo(() => {
    const grouped = {};
    let maxNum = 0;
    
    seats.forEach(seat => {
      if (!grouped[seat.row_label]) {
        grouped[seat.row_label] = {};
      }
      const seatNum = parseInt(seat.seat_number);
      grouped[seat.row_label][seatNum] = seat;
      if (seatNum > maxNum) maxNum = seatNum;
    });
    
    return { seatsByRow: grouped, maxSeatNumber: maxNum };
  }, [seats]);

  const rows = Object.keys(seatsByRow).sort();

  const getSeatColor = (seat) => {
    if (!seat.is_active) return 'bg-gray-300 text-gray-500';
    switch (seat.seat_type) {
      case 'VIP': return 'bg-yellow-400 text-yellow-900';
      case 'Couple': return 'bg-pink-400 text-pink-900';
      case 'Wheelchair': return 'bg-blue-400 text-blue-900';
      default: return 'bg-green-400 text-green-900';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Sơ đồ ghế - {room.screen_type} ({room.name})</h2>
            <p className="text-sm text-gray-500">{seats.length} ghế</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : seats.length === 0 ? (
            <div className="text-center py-8">
              <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có ghế nào được tạo</p>
            </div>
          ) : (
            <>
              {/* Screen */}
              <div className="mb-8 text-center">
                <div className="w-3/4 mx-auto h-2 bg-gray-300 rounded-full mb-2"></div>
                <p className="text-sm text-gray-500">Màn hình</p>
              </div>

              {/* Seats Grid */}
              <div className="space-y-2">
                {rows.map(row => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-8 text-center font-medium text-gray-600">{row}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: maxSeatNumber }, (_, i) => {
                        const seatNum = i + 1;
                        const seat = seatsByRow[row][seatNum];
                        
                        if (!seat) {
                          // Empty space for missing seat
                          return (
                            <div
                              key={`${row}-${seatNum}-empty`}
                              className="w-8 h-8 rounded border border-dashed border-gray-200"
                            />
                          );
                        }
                        
                        return (
                          <div
                            key={seat.id}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${getSeatColor(seat)}`}
                            title={`${seat.row_label}${seat.seat_number} - ${seat.seat_type}`}
                          >
                            {seat.seat_number}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-400 rounded"></div>
                  <span className="text-sm">Standard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                  <span className="text-sm">VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-400 rounded"></div>
                  <span className="text-sm">Couple</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-400 rounded"></div>
                  <span className="text-sm">Wheelchair</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <span className="text-sm">Không hoạt động</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Generate Seats Modal - Interactive seat map
const GenerateSeatsModal = ({ room, onClose, onSave }) => {
  const [form, setForm] = useState({
    rows: 8,
    seatsPerRow: 12,
  });
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Standard'); // Standard, VIP, Couple, Wheelchair, Remove
  const [seatMap, setSeatMap] = useState({}); // { "A1": "Standard", "A2": "VIP", ... } - null means removed

  // Generate initial seat map when rows/seatsPerRow change
  const generateSeatMap = () => {
    const newMap = {};
    for (let r = 0; r < form.rows; r++) {
      const rowLabel = String.fromCharCode(65 + r); // A, B, C...
      for (let s = 1; s <= form.seatsPerRow; s++) {
        const seatKey = `${rowLabel}${s}`;
        newMap[seatKey] = 'Standard'; // Default type
      }
    }
    setSeatMap(newMap);
  };

  // Handle seat click
  const handleSeatClick = (rowLabel, seatNumber) => {
    const seatKey = `${rowLabel}${seatNumber}`;
    setSeatMap(prev => {
      const newMap = { ...prev };
      if (selectedTool === 'Remove') {
        newMap[seatKey] = null; // Mark as removed
      } else {
        newMap[seatKey] = selectedTool; // Set seat type
      }
      return newMap;
    });
  };

  // Get seat style based on type
  const getSeatStyle = (seatType) => {
    if (seatType === null) return 'bg-gray-100 border-dashed border-gray-300 text-gray-300';
    switch (seatType) {
      case 'VIP': return 'bg-yellow-400 border-yellow-500 text-yellow-900';
      case 'Couple': return 'bg-pink-400 border-pink-500 text-pink-900';
      case 'Wheelchair': return 'bg-blue-400 border-blue-500 text-blue-900';
      default: return 'bg-emerald-400 border-emerald-500 text-emerald-900';
    }
  };

  // Count seats by type
  const seatCounts = useMemo(() => {
    const counts = { Standard: 0, VIP: 0, Couple: 0, Wheelchair: 0, Removed: 0 };
    Object.values(seatMap).forEach(type => {
      if (type === null) counts.Removed++;
      else if (counts[type] !== undefined) counts[type]++;
    });
    return counts;
  }, [seatMap]);

  const totalActiveSeats = Object.values(seatMap).filter(t => t !== null).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert seatMap to array of seats
      const seats = [];
      Object.entries(seatMap).forEach(([key, type]) => {
        if (type !== null) {
          const rowLabel = key.charAt(0);
          const seatNumber = key.slice(1);
          seats.push({
            row_label: rowLabel,
            seat_number: seatNumber,
            seat_type: type,
            is_active: true
          });
        }
      });

      await api.post(`/theaters/rooms/${room.id}/seats/generate-custom`, { seats });
      toast.success(`Đã tạo ${seats.length} ghế`);
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Tool buttons config
  const tools = [
    { id: 'Standard', label: 'Standard', color: 'bg-emerald-400', textColor: 'text-emerald-700' },
    { id: 'VIP', label: 'VIP', color: 'bg-yellow-400', textColor: 'text-yellow-700' },
    { id: 'Couple', label: 'Couple', color: 'bg-pink-400', textColor: 'text-pink-700' },
    { id: 'Wheelchair', label: 'Wheelchair', color: 'bg-blue-400', textColor: 'text-blue-700' },
    { id: 'Remove', label: 'Bỏ ghế', color: 'bg-gray-300', textColor: 'text-gray-700', icon: '✕' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Tạo ghế cho phòng {room?.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Config Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Cấu hình sơ đồ</h3>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số hàng (A-Z)
                </label>
                <input
                  type="number"
                  min="1"
                  max="26"
                  value={form.rows}
                  onChange={(e) => setForm({ ...form, rows: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                  onBlur={(e) => {
                    let val = parseInt(e.target.value, 10) || 8;
                    val = Math.min(26, Math.max(1, val));
                    setForm({ ...form, rows: val });
                  }}
                  className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghế mỗi hàng
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.seatsPerRow}
                  onChange={(e) => setForm({ ...form, seatsPerRow: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                  onBlur={(e) => {
                    let val = parseInt(e.target.value, 10) || 12;
                    val = Math.min(30, Math.max(1, val));
                    setForm({ ...form, seatsPerRow: val });
                  }}
                  className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={generateSeatMap}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Tạo sơ đồ
              </button>
            </div>
          </div>

          {/* Tool Selection */}
          {Object.keys(seatMap).length > 0 && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Chọn công cụ (click vào ghế để áp dụng)</h3>
                <div className="flex flex-wrap gap-2">
                  {tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`px-4 py-2 rounded-lg border-2 transition flex items-center gap-2 ${
                        selectedTool === tool.id 
                          ? `${tool.color} border-gray-800 ring-2 ring-gray-800 ring-offset-2` 
                          : `${tool.color} border-transparent hover:border-gray-400`
                      }`}
                    >
                      {tool.icon && <span>{tool.icon}</span>}
                      <span className={`font-medium ${tool.textColor}`}>{tool.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Đang chọn: <strong>{tools.find(t => t.id === selectedTool)?.label}</strong> - Click vào ghế để đổi loại
                </p>
              </div>

              {/* Seat Map */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Sơ đồ ghế</h3>
                
                {/* Screen */}
                <div className="mb-6">
                  <div className="bg-gray-300 h-2 rounded-full mx-auto w-3/4"></div>
                  <p className="text-center text-xs text-gray-500 mt-1">Màn hình</p>
                </div>

                {/* Seats Grid */}
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {Array.from({ length: form.rows }, (_, rowIndex) => {
                      const rowLabel = String.fromCharCode(65 + rowIndex);
                      return (
                        <div key={rowLabel} className="flex items-center gap-1 mb-1">
                          <span className="w-6 text-sm font-medium text-gray-600 text-center">{rowLabel}</span>
                          <div className="flex gap-1">
                            {Array.from({ length: form.seatsPerRow }, (_, seatIndex) => {
                              const seatNumber = seatIndex + 1;
                              const seatKey = `${rowLabel}${seatNumber}`;
                              const seatType = seatMap[seatKey];
                              
                              return (
                                <button
                                  key={seatKey}
                                  onClick={() => handleSeatClick(rowLabel, seatNumber)}
                                  className={`w-8 h-8 rounded border text-xs font-medium transition hover:scale-110 hover:shadow-md ${getSeatStyle(seatType)}`}
                                  title={`${seatKey} - ${seatType || 'Đã bỏ'}`}
                                >
                                  {seatType === null ? '✕' : seatNumber}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend & Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between items-start gap-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-400 rounded"></div>
                      <span className="text-sm">Standard ({seatCounts.Standard})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                      <span className="text-sm">VIP ({seatCounts.VIP})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-pink-400 rounded"></div>
                      <span className="text-sm">Couple ({seatCounts.Couple})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-400 rounded"></div>
                      <span className="text-sm">Wheelchair ({seatCounts.Wheelchair})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">✕</div>
                      <span className="text-sm">Bỏ ghế ({seatCounts.Removed})</span>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-lg font-semibold text-gray-800">{totalActiveSeats} ghế</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {Object.keys(seatMap).length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">Nhập số hàng và số ghế, sau đó bấm <strong>"Tạo sơ đồ"</strong> để bắt đầu</p>
            </div>
          )}
        </div>

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
            disabled={loading || totalActiveSeats === 0}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo {totalActiveSeats} ghế
          </button>
        </div>
      </div>
    </div>
  );
};

export default TheatersPage;
