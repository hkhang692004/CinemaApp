import { newsService } from "../services/newsService.js";
import NewsArticle from "../models/NewsArticle.js";
import { Movie } from "../models/Movie.js";
import { uploadNewsImage } from "../libs/cloudinary.js";
import { emitToClients, SOCKET_EVENTS } from "../socket.js";

const MAX_BANNERS = 12;

// Upload news image
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Vui lòng cung cấp hình ảnh" });
    }
    const result = await uploadNewsImage(image);
    return res.status(200).json({ url: result.url });
  } catch (error) {
    console.error("Error uploadImage:", error);
    return res.status(500).json({ message: error.message || "Lỗi upload hình ảnh" });
  }
};

export const getBannerNews = async (req, res) => {
  try {
    const banners = await newsService.getBannerNews();
    return res.status(200).json({ banners });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Admin: Get all banners
export const getAllBanners = async (req, res) => {
  try {
    const banners = await NewsArticle.findAll({
      where: { is_banner: true },
      include: [{
        model: Movie,
        as: "linkedMovie",
        required: false,
        attributes: ['id', 'title', 'poster_url']
      }],
      order: [["banner_order", "ASC"]]
    });
    return res.status(200).json({ banners, maxBanners: MAX_BANNERS });
  } catch (error) {
    console.error("Error getAllBanners:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Admin: Add banner
export const addBanner = async (req, res) => {
  try {
    const { title, summary, image_url, movie_id, is_active } = req.body;

    // Check max banners
    const bannerCount = await NewsArticle.count({ where: { is_banner: true } });
    if (bannerCount >= MAX_BANNERS) {
      return res.status(400).json({ 
        message: `Đã đạt giới hạn ${MAX_BANNERS} banner. Vui lòng xóa banner cũ trước khi thêm mới.` 
      });
    }

    if (!title || !image_url) {
      return res.status(400).json({ message: "Tiêu đề và hình ảnh là bắt buộc" });
    }

    // Get max banner_order
    const maxOrder = await NewsArticle.max('banner_order', { where: { is_banner: true } }) || 0;

    const banner = await NewsArticle.create({
      title,
      summary: summary || '',
      content: summary || title,
      image_url,
      movie_id: movie_id || null,
      is_banner: true,
      banner_order: maxOrder + 1,
      is_active: is_active !== undefined ? is_active : true,
      author: 'Admin'
    });

    return res.status(201).json({ message: "Đã thêm banner", banner });
  } catch (error) {
    console.error("Error addBanner:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

// Admin: Update banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, image_url, movie_id, is_active, banner_order } = req.body;

    const banner = await NewsArticle.findOne({ where: { id, is_banner: true } });
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    await banner.update({
      title: title || banner.title,
      summary: summary !== undefined ? summary : banner.summary,
      content: summary || banner.content,
      image_url: image_url || banner.image_url,
      movie_id: movie_id !== undefined ? movie_id : banner.movie_id,
      is_active: is_active !== undefined ? is_active : banner.is_active,
      banner_order: banner_order !== undefined ? banner_order : banner.banner_order
    });

    return res.status(200).json({ message: "Đã cập nhật banner", banner });
  } catch (error) {
    console.error("Error updateBanner:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

// Admin: Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await NewsArticle.findOne({ where: { id, is_banner: true } });
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    await banner.destroy();

    return res.status(200).json({ message: "Đã xóa banner" });
  } catch (error) {
    console.error("Error deleteBanner:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

// Admin: Reorder banners
export const reorderBanners = async (req, res) => {
  console.log("📦 reorderBanners called");
  console.log("📦 req.body:", req.body);
  try {
    const { bannerIds } = req.body; // Array of banner IDs in new order
    console.log("📦 bannerIds:", bannerIds);

    if (!Array.isArray(bannerIds)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    // Update order for each banner
    for (let i = 0; i < bannerIds.length; i++) {
      await NewsArticle.update(
        { banner_order: i + 1 },
        { where: { id: bannerIds[i], is_banner: true } }
      );
    }

    // Emit socket event
    emitToClients(SOCKET_EVENTS.BANNERS_REORDERED, { bannerIds });

    return res.status(200).json({ message: "Đã cập nhật thứ tự banner" });
  } catch (error) {
    console.error("Error reorderBanners:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const getNewsDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await newsService.getNewsDetail(id);
    if (!news)
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    return res.status(200).json({ news });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getNews = async (req, res) => {
  try {
    const { page = 1, pageSize = 6, search } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 6));
    
    console.log(`📰 Fetching news - Page: ${pageNum}, Size: ${pageSizeNum}, Search: ${search || 'none'}`);
    
    const { news, total } = await newsService.getPaginatedNews(pageNum, pageSizeNum, search);
    const totalPages = Math.ceil(total / pageSizeNum);
    
    return res.status(200).json({ 
      news, 
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error('❌ getNews Error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// Admin: Get all news
export const getAllNews = async (req, res) => {
  try {
    const news = await NewsArticle.findAll({
      include: [{
        model: Movie,
        as: "linkedMovie",
        required: false,
        attributes: ['id', 'title', 'poster_url']
      }],
      order: [["created_at", "DESC"]]
    });
    return res.status(200).json({ news });
  } catch (error) {
    console.error("Error getAllNews:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Admin: Create news
export const createNews = async (req, res) => {
  try {
    const { title, summary, content, image_url, movie_id, is_active, is_banner } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề là bắt buộc" });
    }

    // Check max banners if is_banner
    if (is_banner) {
      const bannerCount = await NewsArticle.count({ where: { is_banner: true } });
      if (bannerCount >= MAX_BANNERS) {
        return res.status(400).json({ 
          message: `Đã đạt giới hạn ${MAX_BANNERS} banner.` 
        });
      }
    }

    // Get max banner_order if is_banner
    let banner_order = null;
    if (is_banner) {
      const maxOrder = await NewsArticle.max('banner_order', { where: { is_banner: true } }) || 0;
      banner_order = maxOrder + 1;
    }

    const news = await NewsArticle.create({
      title,
      summary: summary || '',
      content: content || summary || title,
      image_url: image_url || null,
      movie_id: movie_id || null,
      is_banner: is_banner || false,
      banner_order,
      is_active: is_active !== undefined ? is_active : true,
      author: 'Admin'
    });

    // Emit socket event
    emitToClients(SOCKET_EVENTS.NEWS_CREATED, { news });
    if (is_banner) {
      emitToClients(SOCKET_EVENTS.BANNER_UPDATED, { action: 'created', news });
    }

    return res.status(201).json({ message: "Đã thêm tin tức", news });
  } catch (error) {
    console.error("Error createNews:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

// Admin: Update news
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, image_url, movie_id, is_active, is_banner } = req.body;

    const news = await NewsArticle.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }

    // Check max banners if toggling to banner
    if (is_banner && !news.is_banner) {
      const bannerCount = await NewsArticle.count({ where: { is_banner: true } });
      if (bannerCount >= MAX_BANNERS) {
        return res.status(400).json({ 
          message: `Đã đạt giới hạn ${MAX_BANNERS} banner.` 
        });
      }
    }

    // Handle banner_order
    let banner_order = news.banner_order;
    if (is_banner && !news.is_banner) {
      // Adding as banner
      const maxOrder = await NewsArticle.max('banner_order', { where: { is_banner: true } }) || 0;
      banner_order = maxOrder + 1;
    } else if (!is_banner && news.is_banner) {
      // Removing from banner
      banner_order = null;
    }

    await news.update({
      title: title !== undefined ? title : news.title,
      summary: summary !== undefined ? summary : news.summary,
      content: content !== undefined ? content : news.content,
      image_url: image_url !== undefined ? image_url : news.image_url,
      movie_id: movie_id !== undefined ? movie_id : news.movie_id,
      is_active: is_active !== undefined ? is_active : news.is_active,
      is_banner: is_banner !== undefined ? is_banner : news.is_banner,
      banner_order
    });

    // Reload news with linkedMovie for socket event
    const updatedNews = await NewsArticle.findByPk(id, {
      include: [{
        model: Movie,
        as: "linkedMovie",
        required: false,
        attributes: ['id', 'title', 'poster_url']
      }]
    });

    // Emit socket event
    emitToClients(SOCKET_EVENTS.NEWS_UPDATED, { news: updatedNews });
    // If banner status changed, emit banner update
    if (is_banner !== undefined) {
      emitToClients(SOCKET_EVENTS.BANNER_UPDATED, { 
        action: is_banner ? 'added' : 'removed', 
        news: updatedNews 
      });
    }

    return res.status(200).json({ message: "Đã cập nhật tin tức", news: updatedNews });
  } catch (error) {
    console.error("Error updateNews:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

// Admin: Delete news
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await NewsArticle.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }

    const wasBanner = news.is_banner;
    const newsId = news.id;
    
    await news.destroy();

    // Emit socket event
    emitToClients(SOCKET_EVENTS.NEWS_DELETED, { id: newsId });
    if (wasBanner) {
      emitToClients(SOCKET_EVENTS.BANNER_UPDATED, { action: 'deleted', id: newsId });
    }

    return res.status(200).json({ message: "Đã xóa tin tức" });
  } catch (error) {
    console.error("Error deleteNews:", error);
    return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};
