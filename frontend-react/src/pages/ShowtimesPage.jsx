import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Calendar,
  Loader2, 
  X,
  Clock,
  Film,
  Building2,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

// Fetch all showtimes
const fetchShowtimes = async () => {
  const response = await api.get('/showtimes/admin/all');
  return response.data.showtimes;
};

// Fetch movies for dropdown - only now showing
const fetchMovies = async () => {
  try {
    const response = await api.get('/movies/now-showing');
    return response.data.movies || [];
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    return [];
  }
};

// Fetch theaters for dropdown
const fetchTheaters = async () => {
  const response = await api.get('/theaters');
  return response.data.theaters;
};

// Fetch rooms by theater
const fetchRoomsByTheater = async (theaterId) => {
  if (!theaterId) return [];
  const response = await api.get(`/theaters/${theaterId}/rooms`);
  return response.data.rooms;
};

const ShowtimesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTheater, setFilterTheater] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterMovie, setFilterMovie] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'normal', 'group_booking'
  const [showModal, setShowModal] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingShowtime, setDeletingShowtime] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Check if user is manager
  const isManager = user?.role === 'manager';
  const managedTheaterIds = useMemo(() => 
    user?.managedTheaters?.map(t => t.id) || [], 
    [user?.managedTheaters]
  );

  // Queries
  const { data: showtimes = [], isLoading } = useQuery({
    queryKey: ['showtimes'],
    queryFn: fetchShowtimes
  });

  const { data: theaters = [] } = useQuery({
    queryKey: ['theaters'],
    queryFn: fetchTheaters
  });

  // Filter theaters for manager
  const availableTheaters = useMemo(() => {
    if (isManager && managedTheaterIds.length > 0) {
      return theaters.filter(t => managedTheaterIds.includes(t.id));
    }
    return theaters;
  }, [theaters, isManager, managedTheaterIds]);

  const { data: movies = [] } = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies
  });

  // Fetch rooms for filter based on selected theater
  const { data: filterRooms = [] } = useQuery({
    queryKey: ['filterRooms', filterTheater],
    queryFn: () => fetchRoomsByTheater(filterTheater),
    enabled: filterTheater !== 'all'
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/showtimes/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showtimes'] });
      toast.success('Đã xóa suất chiếu');
      setShowDeleteModal(false);
      setDeletingShowtime(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa suất chiếu');
    }
  });

  // Filter showtimes
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((showtime) => {
      const matchSearch = 
        showtime.Movie?.title?.toLowerCase().includes(search.toLowerCase()) ||
        showtime.CinemaRoom?.name?.toLowerCase().includes(search.toLowerCase()) ||
        showtime.CinemaRoom?.Theater?.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = filterStatus === 'all' || showtime.status === filterStatus;
      const matchTheater = filterTheater === 'all' || showtime.CinemaRoom?.Theater?.id?.toString() === filterTheater;
      const matchRoom = filterRoom === 'all' || showtime.room_id?.toString() === filterRoom;
      const matchMovie = filterMovie === 'all' || showtime.Movie?.id?.toString() === filterMovie;
      const matchType = filterType === 'all' || showtime.showtime_type === filterType;
      
      let matchDate = true;
      if (filterDate) {
        const showtimeDate = new Date(showtime.start_time).toISOString().split('T')[0];
        matchDate = showtimeDate === filterDate;
      }

      // Filter by source (normal vs group booking)
      const hasGroupBooking = showtime.GroupBookings && showtime.GroupBookings.length > 0;
      let matchSource = true;
      if (filterSource === 'normal') {
        matchSource = !hasGroupBooking;
      } else if (filterSource === 'group_booking') {
        matchSource = hasGroupBooking;
      }
      
      return matchSearch && matchStatus && matchTheater && matchRoom && matchMovie && matchType && matchDate && matchSource;
    });
  }, [showtimes, search, filterStatus, filterTheater, filterRoom, filterMovie, filterType, filterDate, filterSource]);

  // Pagination
  const totalPages = Math.ceil(filteredShowtimes.length / ITEMS_PER_PAGE);
  const paginatedShowtimes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredShowtimes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredShowtimes, currentPage]);

  const handleEdit = (showtime) => {
    setEditingShowtime(showtime);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingShowtime(null);
    setShowModal(true);
  };

  const handleDelete = (showtime) => {
    setDeletingShowtime(showtime);
    setShowDeleteModal(true);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đã lên lịch</span>;
      case 'Cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Đã hủy</span>;
      case 'Completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Đã chiếu</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Suất chiếu</h1>
          <p className="text-gray-500 mt-1">Quản lý lịch chiếu phim tại các rạp</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus size={20} />
          Thêm suất chiếu
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tên phim, phòng, rạp..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            />
          </div>

          {/* Filter by Theater */}
          <select
            value={filterTheater}
            onChange={(e) => { 
              setFilterTheater(e.target.value); 
              setFilterRoom('all'); // Reset room when theater changes
              setCurrentPage(1); 
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả rạp</option>
            {availableTheaters.map(theater => (
              <option key={theater.id} value={theater.id}>{theater.name}</option>
            ))}
          </select>

          {/* Filter by Room */}
          <select
            value={filterRoom}
            onChange={(e) => { setFilterRoom(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            disabled={filterTheater === 'all'}
          >
            <option value="all">Tất cả phòng</option>
            {filterRooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.screen_type} ({room.name})
              </option>
            ))}
          </select>

          {/* Filter by Movie */}
          <select
            value={filterMovie}
            onChange={(e) => { setFilterMovie(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả phim</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Scheduled">Đã lên lịch</option>
            <option value="Completed">Đã chiếu</option>
            <option value="Cancelled">Đã hủy</option>
          </select>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả loại</option>
            <option value="2D Phụ đề Việt">2D Phụ đề Việt</option>
            <option value="2D Lồng tiếng Việt">2D Lồng tiếng Việt</option>
            <option value="3D Phụ đề Việt">3D Phụ đề Việt</option>
            <option value="3D Lồng tiếng Việt">3D Lồng tiếng Việt</option>
          </select>

          {/* Filter by Source */}
          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả nguồn</option>
            <option value="normal">Suất chiếu thường</option>
            <option value="group_booking">Đặt nhóm</option>
          </select>

          {/* Filter by Date */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          />

          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              Xóa lọc ngày
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredShowtimes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy suất chiếu nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phim</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rạp / Phòng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedShowtimes.map((showtime) => {
                    const groupBookings = showtime.GroupBookings || [];
                    const hasGroupBooking = groupBookings.length > 0;
                    const groupBooking = groupBookings[0];
                    
                    return (
                    <tr key={showtime.id} className={`hover:bg-gray-50 ${hasGroupBooking ? 'bg-purple-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {showtime.Movie?.poster_url ? (
                            <img
                              src={showtime.Movie.poster_url}
                              alt={showtime.Movie.title}
                              className="w-10 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center">
                              <Film size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800 line-clamp-1">{showtime.Movie?.title || 'Thuê phòng'}</p>
                              {hasGroupBooking && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  groupBooking.service_type === 'private_show' 
                                    ? 'bg-indigo-100 text-indigo-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  <Users size={10} />
                                  {groupBooking.service_type === 'private_show' ? 'Chiếu riêng' : 'Thuê phòng'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {showtime.Movie?.duration_min ? `${showtime.Movie.duration_min} phút` : 'Không có phim'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{showtime.CinemaRoom?.Theater?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">
                              {showtime.CinemaRoom?.screen_type} ({showtime.CinemaRoom?.name})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(showtime.start_time).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(showtime.start_time)} - {formatTime(showtime.end_time)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{showtime.showtime_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        {hasGroupBooking ? (
                          <span className="text-xs text-purple-600 font-medium italic">Theo đặt nhóm</span>
                        ) : (
                          <span className="text-sm font-medium text-gray-800">{formatPrice(showtime.base_price)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(showtime.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {hasGroupBooking ? (
                            <span className="text-xs text-gray-400 italic">Từ đặt nhóm</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(showtime)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Sửa"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(showtime)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredShowtimes.length)} / {filteredShowtimes.length} suất chiếu
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
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
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-red-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Showtime Modal */}
      {showModal && (
        <ShowtimeModal
          showtime={editingShowtime}
          allShowtimes={showtimes}
          availableTheaters={availableTheaters}
          onClose={() => {
            setShowModal(false);
            setEditingShowtime(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['showtimes'] });
            setShowModal(false);
            setEditingShowtime(null);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingShowtime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa suất chiếu <strong>{deletingShowtime.Movie?.title}</strong> lúc{' '}
              <strong>{formatDateTime(deletingShowtime.start_time)}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingShowtime(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingShowtime.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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

// Showtime Modal Component
const ShowtimeModal = ({ showtime, onClose, onSave, allShowtimes = [], availableTheaters = [] }) => {
  const isEditing = !!showtime;
  const [form, setForm] = useState({
    movie_id: showtime?.movie_id || '',
    theater_id: showtime?.CinemaRoom?.Theater?.id || '',
    room_id: showtime?.room_id || '',
    show_date: showtime ? new Date(showtime.start_time).toISOString().split('T')[0] : '',
    start_time: showtime ? new Date(showtime.start_time).toTimeString().slice(0, 5) : '',
    base_price: showtime?.base_price || 75000,
    showtime_type: showtime?.showtime_type || '2D Phụ đề Việt',
    status: showtime?.status || 'Scheduled'
  });
  const [loading, setLoading] = useState(false);

  // Get showtimes in same room on same day for reference
  const showtimesInSameRoomSameDay = useMemo(() => {
    const roomId = isEditing ? showtime?.room_id : parseInt(form.room_id);
    const dateStr = isEditing 
      ? new Date(showtime?.start_time).toISOString().split('T')[0]
      : form.show_date;
    
    if (!roomId || !dateStr) return [];
    
    return allShowtimes
      .filter(s => {
        if (isEditing && s.id === showtime?.id) return false; // Exclude current showtime
        const sDate = new Date(s.start_time).toISOString().split('T')[0];
        return s.room_id === roomId && sDate === dateStr && s.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [allShowtimes, form.room_id, form.show_date, isEditing, showtime]);

  // Queries
  const { data: movies = [] } = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies
  });

  // Use availableTheaters prop instead of fetching all
  const theaters = availableTheaters;

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', form.theater_id],
    queryFn: () => fetchRoomsByTheater(form.theater_id),
    enabled: !!form.theater_id
  });

  // Calculate end_time based on movie duration
  const selectedMovie = isEditing 
    ? showtime?.Movie 
    : movies.find(m => m.id === parseInt(form.movie_id));
  const movieDuration = selectedMovie?.duration_min || selectedMovie?.duration_min || 120;
  
  const calculatedEndTime = useMemo(() => {
    if (!form.show_date || !form.start_time) return '';
    
    const startDateTime = new Date(`${form.show_date}T${form.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + movieDuration * 60000);
    return endDateTime.toTimeString().slice(0, 5);
  }, [form.show_date, form.start_time, movieDuration]);

  // Check showtime conflict (15 min gap required)
  const conflictInfo = useMemo(() => {
    if (!form.start_time || (!isEditing && (!form.room_id || !form.show_date))) {
      return null;
    }

    let startDateTime, endDateTime;
    if (isEditing) {
      const originalDate = new Date(showtime.start_time);
      const [hours, minutes] = form.start_time.split(':').map(Number);
      startDateTime = new Date(originalDate);
      startDateTime.setHours(hours, minutes, 0, 0);
    } else {
      startDateTime = new Date(`${form.show_date}T${form.start_time}`);
    }
    endDateTime = new Date(startDateTime.getTime() + movieDuration * 60000);
    const endWithGap = new Date(endDateTime.getTime() + 15 * 60000); // +15 min gap

    for (const s of showtimesInSameRoomSameDay) {
      const existingStart = new Date(s.start_time);
      const existingEnd = new Date(s.end_time);
      const existingEndWithGap = new Date(existingEnd.getTime() + 15 * 60000);

      // Check overlap: new showtime must not start before existing ends (+gap) AND new end (+gap) must not overlap existing start
      const hasConflict = (startDateTime < existingEndWithGap && endWithGap > existingStart);
      
      if (hasConflict) {
        return {
          conflicting: s,
          message: `Trùng với suất chiếu ${new Date(s.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${s.Movie?.title || 'Thuê phòng'})`
        };
      }
    }
    return null;
  }, [form.start_time, form.room_id, form.show_date, movieDuration, showtimesInSameRoomSameDay, isEditing, showtime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEditing && (!form.movie_id || !form.room_id)) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (!form.start_time) {
      toast.error('Vui lòng chọn giờ chiếu');
      return;
    }

    if (!isEditing && !form.show_date) {
      toast.error('Vui lòng chọn ngày chiếu');
      return;
    }

    // Check conflict before submit
    if (conflictInfo) {
      toast.error(`Trùng lịch: ${conflictInfo.message}`);
      return;
    }

    setLoading(true);

    try {
      let startDateTime, endDateTime;

      if (isEditing) {
        // Khi chỉnh sửa, giữ nguyên ngày gốc, chỉ thay đổi giờ
        const originalDate = new Date(showtime.start_time);
        const [hours, minutes] = form.start_time.split(':').map(Number);
        startDateTime = new Date(originalDate);
        startDateTime.setHours(hours, minutes, 0, 0);
        endDateTime = new Date(startDateTime.getTime() + movieDuration * 60000);

        const payload = {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          base_price: parseFloat(form.base_price),
          showtime_type: form.showtime_type
        };
        await api.put(`/showtimes/admin/${showtime.id}`, payload);
        toast.success('Đã cập nhật suất chiếu');
      } else {
        startDateTime = new Date(`${form.show_date}T${form.start_time}`);
        endDateTime = new Date(startDateTime.getTime() + movieDuration * 60000);

        const payload = {
          movie_id: parseInt(form.movie_id),
          room_id: parseInt(form.room_id),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          base_price: parseFloat(form.base_price),
          showtime_type: form.showtime_type,
          status: form.status
        };
        await api.post('/showtimes/admin', payload);
        toast.success('Đã thêm suất chiếu');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const showtimeTypes = [
    '2D Phụ đề Việt',
    '2D Lồng tiếng Việt',
    '3D Phụ đề Việt',
    '3D Lồng tiếng Việt'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {showtime ? 'Sửa suất chiếu' : 'Thêm suất chiếu mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Movie - disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phim <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600">
                {showtime?.Movie?.title} ({showtime?.Movie?.duration_min} phút)
              </div>
            ) : (
              <select
                value={form.movie_id}
                onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                required
              >
                <option value="">Chọn phim</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title} ({movie.duration_min} phút)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Theater & Room - disabled when editing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rạp <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600">
                  {showtime?.CinemaRoom?.Theater?.name}
                </div>
              ) : (
                <select
                  value={form.theater_id}
                  onChange={(e) => setForm({ ...form, theater_id: e.target.value, room_id: '' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  required
                >
                  <option value="">Chọn rạp</option>
                  {theaters.filter(t => t.is_active).map(theater => (
                    <option key={theater.id} value={theater.id}>
                      {theater.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng chiếu <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600">
                  {showtime?.CinemaRoom?.screen_type} ({showtime?.CinemaRoom?.name})
                </div>
              ) : (
                <select
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  required
                  disabled={!form.theater_id}
                >
                  <option value="">Chọn phòng</option>
                  {rooms.filter(r => r.is_active).map(room => (
                    <option key={room.id} value={room.id}>
                      {room.screen_type} ({room.name}) - {room.seat_count} ghế
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày chiếu <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600">
                  {new Date(showtime?.start_time).toLocaleDateString('vi-VN')}
                </div>
              ) : (
                <input
                  type="date"
                  value={form.show_date}
                  onChange={(e) => setForm({ ...form, show_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={calculatedEndTime}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Tự động tính theo thời lượng phim</p>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictInfo && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                <X size={16} className="text-red-500" />
                ⚠️ Trùng lịch: {conflictInfo.message}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Vui lòng chọn thời gian khác (cần cách ít nhất 15 phút)
              </p>
            </div>
          )}

          {/* Existing showtimes in same room - for reference */}
          {(form.room_id && form.show_date) || isEditing ? (
            showtimesInSameRoomSameDay.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Các suất chiếu khác trong phòng này (cùng ngày):
                </p>
                <div className="flex flex-wrap gap-2">
                  {showtimesInSameRoomSameDay.map(s => {
                    const isGroupBooking = s.GroupBookings && s.GroupBookings.length > 0;
                    const groupType = isGroupBooking ? s.GroupBookings[0].service_type : null;
                    return (
                      <span 
                        key={s.id} 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isGroupBooking 
                            ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {new Date(s.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                        {' - '}
                        {new Date(s.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {' '}({s.Movie?.title?.substring(0, 15) || 'Thuê phòng'})
                        {isGroupBooking && (
                          <span className="ml-1 text-[10px]">
                            [{groupType === 'private_show' ? 'Chiếu riêng' : 'Thuê phòng'}]
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  * Suất chiếu mới phải cách suất khác ít nhất 15 phút
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <Clock size={16} />
                  Phòng này chưa có suất chiếu nào trong ngày đã chọn
                </p>
              </div>
            )
          ) : null}

          {/* Showtime Type & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại suất chiếu
              </label>
              <select
                value={form.showtime_type}
                onChange={(e) => setForm({ ...form, showtime_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              >
                {showtimeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá vé cơ bản
              </label>
              <input
                type="number"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                min="0"
                step="1000"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              />
            </div>
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
            disabled={loading || conflictInfo}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {showtime ? 'Cập nhật' : 'Thêm suất chiếu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowtimesPage;
