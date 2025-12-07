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
};
