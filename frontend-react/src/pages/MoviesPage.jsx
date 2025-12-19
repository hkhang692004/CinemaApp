import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Film, Loader2 } from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, now_showing, coming_soon
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const response = await api.get('/movies');
      setMovies(response.data.movies || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách phim');
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((movie) => {
    const matchSearch = movie.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    if (filter === 'now_showing') return matchSearch && movie.status === 'now_showing';
    if (filter === 'coming_soon') return matchSearch && movie.status === 'coming_soon';
    return matchSearch;
  });

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phim này?')) return;
    
    try {
      await api.delete(`/movies/${id}`);
      toast.success('Đã xóa phim');
      loadMovies();
    } catch (error) {
      toast.error('Lỗi xóa phim');
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMovie(null);
    setShowModal(true);
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

  if (loading) {
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
          <p className="text-gray-500">Danh sách tất cả phim trong hệ thống</p>
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.map((movie) => (
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(movie)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                >
                  <Edit size={18} className="text-gray-700" />
                </button>
                <button
                  onClick={() => handleDelete(movie.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{movie.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{movie.duration} phút</p>
              <div className="mt-2">{getStatusBadge(movie.status)}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy phim nào</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <MovieModal
          movie={editingMovie}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadMovies();
          }}
        />
      )}
    </div>
  );
};

// Movie Add/Edit Modal
const MovieModal = ({ movie, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: movie?.title || '',
    description: movie?.description || '',
    duration: movie?.duration || '',
    release_date: movie?.release_date?.split('T')[0] || '',
    poster_url: movie?.poster_url || '',
    trailer_url: movie?.trailer_url || '',
    status: movie?.status || 'coming_soon',
    age_rating: movie?.age_rating || 'P',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (movie) {
        await api.put(`/movies/${movie.id}`, form);
        toast.success('Đã cập nhật phim');
      } else {
        await api.post('/movies', form);
        toast.success('Đã thêm phim mới');
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {movie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên phim *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời lượng (phút) *
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                required
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Poster
            </label>
            <input
              type="url"
              value={form.poster_url}
              onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Trailer
            </label>
            <input
              type="url"
              value={form.trailer_url}
              onChange={(e) => setForm({ ...form, trailer_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="coming_soon">Sắp chiếu</option>
                <option value="now_showing">Đang chiếu</option>
                <option value="ended">Đã kết thúc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới hạn độ tuổi
              </label>
              <select
                value={form.age_rating}
                onChange={(e) => setForm({ ...form, age_rating: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="P">P - Phổ biến</option>
                <option value="T13">T13 - 13+</option>
                <option value="T16">T16 - 16+</option>
                <option value="T18">T18 - 18+</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {movie ? 'Cập nhật' : 'Thêm phim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoviesPage;
