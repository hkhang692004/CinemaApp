import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search,
  Pencil, 
  Trash2, 
  Image as ImageIcon,
  Loader2, 
  X,
  Film,
  AlertCircle,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  GripVertical,
  Upload
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch all news (admin)
const fetchAllNews = async () => {
  const response = await api.get('/news/admin/all');
  return response.data;
};

// Fetch banners
const fetchBanners = async () => {
  const response = await api.get('/news/admin/banners');
  return response.data;
};

// Fetch movies for linking
const fetchMovies = async () => {
  const response = await api.get('/movies/now-showing');
  return response.data.movies || [];
};

const MAX_BANNERS = 12;

const NewsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('news'); // 'news' or 'banners'
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedBanner, setDraggedBanner] = useState(null);
  const ITEMS_PER_PAGE = 10;

  // Queries
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: fetchAllNews
  });

  const { data: bannerData, isLoading: bannerLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: fetchBanners
  });

  const allNews = newsData?.news || [];
  const banners = bannerData?.banners || [];
  const bannerCount = banners.length;

  // Sort news by created_at DESC and filter by search
  const filteredNews = useMemo(() => {
    return allNews
      .filter(item => 
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.summary?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [allNews, search]);

  // Pagination for news
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/news/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Đã xóa tin tức');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa');
    }
  });

  // Toggle banner mutation
  const toggleBannerMutation = useMutation({
    mutationFn: ({ id, is_banner }) => api.put(`/news/admin/${id}`, { is_banner }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(variables.is_banner ? 'Đã thêm vào banner' : 'Đã bỏ khỏi banner');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  });

  // Reorder banners mutation
  const reorderMutation = useMutation({
    mutationFn: (bannerIds) => {
      console.log('📦 Calling reorder API with:', bannerIds);
      console.log('📦 URL:', '/news/admin/reorder-banners');
      return api.put('/news/admin/reorder-banners', { bannerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Đã cập nhật thứ tự banner');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật thứ tự');
    }
  });

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleAddToBanner = (item) => {
    if (bannerCount >= MAX_BANNERS) {
      toast.error(`Đã đạt giới hạn ${MAX_BANNERS} banner. Vui lòng bỏ bớt banner trước.`);
      return;
    }
    if (!item.image_url) {
      toast.error('Tin tức cần có hình ảnh để đặt làm banner');
      return;
    }
    toggleBannerMutation.mutate({ id: item.id, is_banner: true });
  };

  const handleRemoveFromBanner = (item) => {
    toggleBannerMutation.mutate({ id: item.id, is_banner: false });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Drag and drop handlers for banners
  const handleDragStart = (e, banner) => {
    setDraggedBanner(banner);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetBanner) => {
    e.preventDefault();
    if (!draggedBanner || draggedBanner.id === targetBanner.id) return;

    const newBanners = [...banners];
    const draggedIndex = newBanners.findIndex(b => b.id === draggedBanner.id);
    const targetIndex = newBanners.findIndex(b => b.id === targetBanner.id);

    newBanners.splice(draggedIndex, 1);
    newBanners.splice(targetIndex, 0, draggedBanner);

    // Update order
    reorderMutation.mutate(newBanners.map(b => b.id));
    setDraggedBanner(null);
  };

  const handleDragEnd = () => {
    setDraggedBanner(null);
  };

  const isLoading = newsLoading || bannerLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tin tức & Banner</h1>
          <p className="text-gray-500 mt-1">Quản lý tin tức và chọn tin tức làm banner</p>
        </div>
        {activeTab === 'news' && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Plus size={20} />
            Thêm tin tức
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('news'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 -mb-px ${
              activeTab === 'news'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Newspaper size={20} />
            Tin tức ({allNews.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 -mb-px ${
              activeTab === 'banners'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <ImageIcon size={20} />
            Banner ({bannerCount}/{MAX_BANNERS})
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'news' ? (
            /* News Tab */
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tin tức..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Chưa có tin tức nào</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedNews.map((news) => (
                      <div
                        key={news.id}
                        className={`flex gap-4 p-4 rounded-lg border transition ${
                          news.is_banner
                            ? 'border-amber-300 bg-amber-50/50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Image */}
                        <div className="w-40 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {news.image_url ? (
                            <img
                              src={news.image_url}
                              alt={news.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={24} className="text-gray-400" />
                            </div>
                          )}
                          {/* Banner badge */}
                          {news.is_banner && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                              Banner
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 line-clamp-1">{news.title}</h3>
                              {news.summary && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{news.summary}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>{formatDate(news.created_at)}</span>
                                {news.linkedMovie && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Film size={12} />
                                    {news.linkedMovie.title}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {/* Add to Banner button - only show if not already banner */}
                              {!news.is_banner && (
                                <button
                                  onClick={() => handleAddToBanner(news)}
                                  disabled={toggleBannerMutation.isPending || bannerCount >= MAX_BANNERS}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition disabled:opacity-50"
                                  title="Thêm vào banner"
                                >
                                  <Star size={14} />
                                  Banner
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEdit(news)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Sửa"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(news)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredNews.length)} / {filteredNews.length}
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
            </>
          ) : (
            /* Banners Tab */
            <>
              {/* Info */}
              <div className={`flex items-center gap-2 px-4 py-3 mb-6 rounded-lg ${
                bannerCount >= MAX_BANNERS 
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                <AlertCircle size={20} />
                <span>
                  {bannerCount >= MAX_BANNERS 
                    ? `Đã đạt giới hạn ${MAX_BANNERS} banner. Bỏ bớt banner để thêm mới.`
                    : `Kéo thả để sắp xếp thứ tự banner. Đang hiển thị ${bannerCount}/${MAX_BANNERS} banner.`
                  }
                </span>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Chưa có banner nào</p>
                  <p className="text-sm text-gray-400">
                    Vào tab "Tin tức" và nhấn nút "Banner" để thêm tin tức làm banner
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, banner)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, banner)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition cursor-move ${
                        draggedBanner?.id === banner.id
                          ? 'border-red-400 bg-red-50 opacity-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Drag handle */}
                      <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                        <GripVertical size={20} />
                      </div>

                      {/* Order */}
                      <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Image */}
                      <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 line-clamp-1">{banner.title}</h3>
                        {banner.linkedMovie && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                            <Film size={12} />
                            <span className="truncate">{banner.linkedMovie.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveFromBanner(banner)}
                        disabled={toggleBannerMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                        title="Bỏ khỏi banner"
                      >
                        <StarOff size={14} />
                        Bỏ banner
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <NewsModal
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa tin tức <strong>"{deletingItem.title}"</strong>?
              {deletingItem.is_banner && (
                <span className="block mt-2 text-amber-600 text-sm">
                  ⚠️ Tin tức này đang được đặt làm banner
                </span>
              )}
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
                onClick={() => deleteMutation.mutate(deletingItem.id)}
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

// News Modal Component (for adding/editing news only)
const NewsModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: item?.title || '',
    summary: item?.summary || '',
    content: item?.content || '',
    image_url: item?.image_url || '',
    movie_id: item?.movie_id || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch movies
  const { data: movies = [] } = useQuery({
    queryKey: ['movies-for-news'],
    queryFn: fetchMovies
  });

  // Quill modules config
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  }), []);

  const handleImageUpload = async (e) => {
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

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const response = await api.post('/news/upload', { image: base64 });
          setForm(prev => ({ ...prev, image_url: response.data.url }));
          toast.success('Đã tải lên hình ảnh');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi tải lên hình ảnh');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error('Lỗi khi đọc file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    if (!form.image_url) {
      toast.error('Vui lòng tải lên hình ảnh');
      return;
    }

    // Check content - strip HTML tags to verify actual content
    const contentText = form.content.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content,
        image_url: form.image_url,
        movie_id: form.movie_id || null
      };

      if (item) {
        await api.put(`/news/admin/${item.id}`, payload);
        toast.success('Đã cập nhật tin tức');
      } else {
        await api.post('/news/admin', payload);
        toast.success('Đã thêm tin tức');
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Newspaper size={24} />
            {item ? 'Sửa tin tức' : 'Thêm tin tức mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề tin tức"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Nhập mô tả ngắn gọn về tin tức"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
            />
          </div>

          {/* Content with React Quill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden quill-wrapper">
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={(value) => setForm({ ...form, content: value })}
                modules={quillModules}
                placeholder="Nhập nội dung chi tiết..."
                className="bg-white [&_.ql-container]:min-h-[250px] [&_.ql-editor]:min-h-[250px]"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Upload area */}
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  uploading 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Đang tải lên...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Nhấn để chọn hình ảnh hoặc kéo thả vào đây
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG, GIF tối đa 5MB</span>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {form.image_url && (
                <div className="relative">
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video max-w-md">
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X size={16} />
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    Khuyến nghị kích thước banner: 1920x600 pixel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Link to Movie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liên kết với phim (tùy chọn)
            </label>
            <select
              value={form.movie_id}
              onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            >
              <option value="">Không liên kết</option>
              {movies.map(movie => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </div>

          {/* Info about banner */}
          {item?.is_banner && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <Star size={16} fill="currentColor" />
              <span>Tin tức này đang được hiển thị làm banner</span>
            </div>
          )}
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
            {item ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
