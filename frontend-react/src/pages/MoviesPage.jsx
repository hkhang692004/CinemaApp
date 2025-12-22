import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Film, 
  Loader2, 
  X,
  Calendar,
  Clock,
  User,
  Image,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Fetch movies
const fetchMovies = async () => {
  const response = await api.get('/movies');
  return response.data.movies;
};

// Fetch genres
const fetchGenres = async () => {
  const response = await api.get('/movies/genres');
  return response.data.genres;
};

const MoviesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMovie, setDeletingMovie] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Query
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/movies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Đã xóa phim');
      setShowDeleteModal(false);
      setDeletingMovie(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa phim');
    }
  });

  const filteredMovies = movies.filter((movie) => {
    const matchSearch = movie.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    return matchSearch && movie.status === filter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMovies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMovies, currentPage]);

  // Reset to page 1 when filter/search changes
  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMovie(null);
    setShowModal(true);
  };

  const confirmDelete = (movie) => {
    setDeletingMovie(movie);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      now_showing: 'bg-green-100 text-green-700',
      coming_soon: 'bg-blue-100 text-blue-700',
      ended: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      now_showing: 'Đang chiếu',
      coming_soon: 'Sắp chiếu',
      ended: 'Đã kết thúc',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.ended}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getAgeRatingBadge = (rating) => {
    const styles = {
      P: 'bg-green-500',
      C13: 'bg-yellow-500',
      C16: 'bg-orange-500',
      C18: 'bg-red-500',
    };
    return (
      <span className={`px-1.5 py-0.5 text-[10px] text-white font-bold rounded ${styles[rating] || styles.P}`}>
        {rating}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Phim</h1>
          <p className="text-gray-500">Danh sách tất cả phim trong hệ thống ({movies.length} phim)</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          <Plus size={20} />
          Thêm phim
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
            <option value="ended">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy phim nào</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedMovies.map((movie) => (
            <div key={movie.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
              <div className="relative aspect-[2/3]">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Film className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {/* Age rating badge */}
                <div className="absolute top-2 left-2">
                  {getAgeRatingBadge(movie.age_rating)}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleEdit(movie)}
                    className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={18} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => confirmDelete(movie)}
                    className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition"
                    title="Xóa"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate" title={movie.title}>
                  {movie.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {movie.duration_min || '-'} phút
                  </span>
                  {movie.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(movie.release_date)}
                    </span>
                  )}
                </div>
                {/* Genres */}
                {movie.Genres && movie.Genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.Genres.slice(0, 3).map(genre => (
                      <span key={genre.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {genre.name}
                      </span>
                    ))}
                    {movie.Genres.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{movie.Genres.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-3">{getStatusBadge(movie.status)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        <p className="text-center text-sm text-gray-500">
          Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMovies.length)} / {filteredMovies.length} phim
        </p>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <MovieModal
          movie={editingMovie}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['movies'] });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa phim <strong>{deletingMovie.title}</strong>?
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingMovie(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingMovie.id)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
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

// Movie Add/Edit Modal
const MovieModal = ({ movie, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: movie?.title || '',
    description: movie?.description || '',
    duration_min: movie?.duration_min || '',
    release_date: movie?.release_date?.split('T')[0] || '',
    poster_url: movie?.poster_url || '',
    backdrop_url: movie?.backdrop_url || '',
    trailer_url: movie?.trailer_url || '',
    status: movie?.status || 'coming_soon',
    age_rating: movie?.age_rating || 'P',
    avg_rating: movie?.avg_rating || 0,
    director: movie?.director || '',
    actors: movie?.actors || '',
    country: movie?.country || '',
    genre_ids: movie?.Genres?.map(g => g.id) || [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const posterInputRef = useRef(null);
  const backdropInputRef = useRef(null);

  // Fetch genres
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate avg_rating trước khi submit
    const rating = parseFloat(form.avg_rating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      toast.error('Đánh giá phim phải là số từ 0 đến 10');
      return;
    }
    
    setLoading(true);

    try {
      const submitData = { ...form, avg_rating: rating };
      if (movie) {
        await api.put(`/movies/${movie.id}`, submitData);
        toast.success('Đã cập nhật phim');
      } else {
        await api.post('/movies', submitData);
        toast.success('Đã thêm phim mới');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId) => {
    setForm(prev => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(genreId)
        ? prev.genre_ids.filter(id => id !== genreId)
        : [...prev.genre_ids, genreId]
    }));
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingPoster(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const response = await api.post('/movies/upload/poster', { image: base64 });
          setForm(prev => ({ ...prev, poster_url: response.data.url }));
          toast.success('Đã tải lên poster thành công');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi tải lên poster');
        } finally {
          setUploadingPoster(false);
        }
      };
      reader.onerror = () => {
        toast.error('Lỗi khi đọc file');
        setUploadingPoster(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      setUploadingPoster(false);
    }
  };

  const handleBackdropUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingBackdrop(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const response = await api.post('/movies/upload/backdrop', { image: base64 });
          setForm(prev => ({ ...prev, backdrop_url: response.data.url }));
          toast.success('Đã tải lên ảnh nền thành công');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi tải lên ảnh nền');
        } finally {
          setUploadingBackdrop(false);
        }
      };
      reader.onerror = () => {
        toast.error('Lỗi khi đọc file');
        setUploadingBackdrop(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      setUploadingBackdrop(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: Film },
    { id: 'media', label: 'Hình ảnh & Video', icon: Image },
    { id: 'details', label: 'Chi tiết', icon: User },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {movie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
                activeTab === tab.id 
                  ? 'text-red-600 border-b-2 border-red-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={(value) => setForm({ ...form, description: value })}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                  placeholder="Nhập mô tả phim..."
                  className="bg-white rounded-lg [&_.ql-container]:min-h-[120px] [&_.ql-editor]:min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày khởi chiếu
                  </label>
                  <input
                    type="date"
                    value={form.release_date}
                    onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={movie?.status === 'ended'}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {/* Thêm mới: chỉ cho chọn sắp chiếu hoặc đang chiếu */}
                    {!movie && (
                      <>
                        <option value="coming_soon">Sắp chiếu</option>
                        <option value="now_showing">Đang chiếu</option>
                      </>
                    )}
                    {/* Chỉnh sửa: chỉ hiển thị options hợp lệ */}
                    {movie?.status === 'coming_soon' && (
                      <>
                        <option value="coming_soon">Sắp chiếu</option>
                        <option value="now_showing">Đang chiếu</option>
                      </>
                    )}
                    {movie?.status === 'now_showing' && (
                      <>
                        <option value="now_showing">Đang chiếu</option>
                        <option value="ended">Đã kết thúc</option>
                      </>
                    )}
                    {movie?.status === 'ended' && (
                      <option value="ended">Đã kết thúc</option>
                    )}
                  </select>
                  {movie?.status === 'ended' && (
                    <p className="text-xs text-gray-500 mt-1">Không thể thay đổi trạng thái của phim đã kết thúc</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới hạn độ tuổi
                  </label>
                  <select
                    value={form.age_rating}
                    onChange={(e) => setForm({ ...form, age_rating: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  >
                    <option value="P">P - Phổ biến</option>
                    <option value="C13">C13 - 13+</option>
                    <option value="C16">C16 - 16+</option>
                    <option value="C18">C18 - 18+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đánh giá (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.avg_rating}
                    onChange={(e) => setForm({ ...form, avg_rating: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="8.5"
                  />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thể loại
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleGenreToggle(genre.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        form.genre_ids.includes(genre.id)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Poster */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poster phim
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.poster_url}
                    onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="https://... hoặc upload từ máy"
                  />
                  <input
                    ref={posterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => posterInputRef.current?.click()}
                    disabled={uploadingPoster}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {uploadingPoster ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                    {uploadingPoster ? 'Đang tải...' : 'Tải lên'}
                  </button>
                </div>
                {form.poster_url && (
                  <div className="mt-2">
                    <img 
                      src={form.poster_url} 
                      alt="Poster preview" 
                      className="w-32 h-48 object-cover rounded-lg"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              {/* Backdrop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh nền (Backdrop)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.backdrop_url}
                    onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="https://... hoặc upload từ máy"
                  />
                  <input
                    ref={backdropInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackdropUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backdropInputRef.current?.click()}
                    disabled={uploadingBackdrop}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {uploadingBackdrop ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                    {uploadingBackdrop ? 'Đang tải...' : 'Tải lên'}
                  </button>
                </div>
                {form.backdrop_url && (
                  <div className="mt-2">
                    <img 
                      src={form.backdrop_url} 
                      alt="Backdrop preview" 
                      className="w-64 h-36 object-cover rounded-lg"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Trailer (YouTube)
                </label>
                <input
                  type="url"
                  value={form.trailer_url}
                  onChange={(e) => setForm({ ...form, trailer_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đạo diễn
                </label>
                <input
                  type="text"
                  value={form.director}
                  onChange={(e) => setForm({ ...form, director: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  placeholder="Tên đạo diễn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diễn viên
                </label>
                <textarea
                  value={form.actors}
                  onChange={(e) => setForm({ ...form, actors: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                  placeholder="Danh sách diễn viên, cách nhau bằng dấu phẩy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quốc gia
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  placeholder="Việt Nam, Mỹ, Hàn Quốc..."
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
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
            {movie ? 'Cập nhật' : 'Thêm phim'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;
