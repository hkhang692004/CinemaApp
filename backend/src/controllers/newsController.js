import { newsService } from "../services/newsService.js";

export const getBannerNews = async (req, res) => {
  try {
    const banners = await newsService.getBannerNews();
    return res.status(200).json({ banners });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
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
