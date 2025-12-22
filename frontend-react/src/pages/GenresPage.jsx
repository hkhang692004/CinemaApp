import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Tags, 
  Loader2, 
  X,
  Film,
  AlertCircle
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch genres with usage count
const fetchGenres = async () => {
  const response = await api.get('/movies/genres/admin');
  return response.data.genres;
};

const GenresPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGenre, setDeletingGenre] = useState(null);
  const [newGenreName, setNewGenreName] = useState('');

  // Query
  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['genres-admin'],
    queryFn: fetchGenres
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (name) => api.post('/movies/genres', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres-admin'] });
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      toast.success('Đã thêm thể loại');
      setShowModal(false);
      setNewGenreName('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi thêm thể loại');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/movies/genres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres-admin'] });
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      toast.success('Đã xóa thể loại');
      setShowDeleteModal(false);
      setDeletingGenre(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa thể loại');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) {
      toast.error('Vui lòng nhập tên thể loại');
      return;
    }
    createMutation.mutate(newGenreName.trim());
  };

  const handleDelete = (genre) => {
    if (genre.movieCount > 0) {
      toast.error(`Không thể xóa vì có ${genre.movieCount} phim đang sử dụng`);
      return;
    }
    setDeletingGenre(genre);
    setShowDeleteModal(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Thể loại</h1>
          <p className="text-gray-500 mt-1">Thêm, xóa thể loại phim</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm thể loại
        </button>
      </div>

      {/* Genres Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {genres.length === 0 ? (
            <div className="text-center py-12">
              <Tags className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có thể loại nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {genres.map((genre) => (
                <div
                  key={genre.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Tags className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{genre.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {genre.movieCount} phim
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(genre)}
                    disabled={genre.movieCount > 0}
                    className={`p-2 rounded-lg transition-colors ${
                      genre.movieCount > 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={genre.movieCount > 0 ? `Có ${genre.movieCount} phim đang sử dụng` : 'Xóa thể loại'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Lưu ý</p>
          <p className="text-blue-600 text-sm mt-1">
            Chỉ có thể xóa các thể loại không được sử dụng bởi bất kỳ phim nào. 
            Các thể loại đang sử dụng sẽ hiển thị số lượng phim tương ứng.
          </p>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Thêm thể loại mới</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewGenreName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên thể loại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="VD: Hành động, Tình cảm, Kinh dị..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewGenreName('');
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    'Thêm thể loại'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingGenre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                <p className="text-gray-500">
                  Bạn có chắc muốn xóa thể loại "{deletingGenre.name}"?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingGenre(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingGenre.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
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

export default GenresPage;
