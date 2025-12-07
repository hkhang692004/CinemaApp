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
