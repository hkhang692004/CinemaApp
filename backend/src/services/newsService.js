import NewsArticle from "../models/NewsArticle.js";
import { Movie } from "../models/Movie.js";

export const newsService = {
  async getBannerNews() {
    return NewsArticle.findAll({
      where: {
        is_banner: true,
        is_active: true,
      },
      include: [
        {
          model: Movie,
          as: "linkedMovie", // Sử dụng alias đã định nghĩa trong association
          required: false, // LEFT JOIN - có thể không có phim
        },
      ],
      order: [["banner_order", "ASC"]],
      limit: 10,
    });
  },
  async getNewsDetail(newsId) {
    return NewsArticle.findByPk(newsId, {
      include: [
        {
          model: Movie,
          as: "linkedMovie", // Sử dụng alias đã định nghĩa trong association
          required: false, // LEFT JOIN - có thể không có phim
        },
      ],
    });
  },
  

  async getPaginatedNews(page = 1, pageSize = 6, search = null) {
    try {
      console.log(`📰 Fetching paginated news - Page: ${page}, Size: ${pageSize}, Search: ${search || 'none'}`);
      
      const offset = (page - 1) * pageSize;
      
      // Build where clause
      const whereClause = {
        is_active: true,
      };
      
      // Add search filter if provided
      if (search && search.trim()) {
        const { Op } = await import('sequelize');
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { summary: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
        ];
      }
      
      const { rows, count } = await NewsArticle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Movie,
            as: "linkedMovie",
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: pageSize,
        offset: offset,
      });

      console.log(`✅ Found ${rows.length} news articles for page ${page}, total: ${count}`);
      
      return {
        news: rows,
        total: count,
      };
    } catch (err) {
      console.error('❌ getPaginatedNews Error:', err.message);
      console.error('Stack:', err.stack);
      throw err;
    }
  }
};
