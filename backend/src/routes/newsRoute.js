import express from "express";
import { 
  getBannerNews, 
  getNews, 
  getNewsDetail,
  getAllBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  uploadImage
} from "../controllers/newsController.js";
import { adminOrManager } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/allnews", getNews);
router.get("/banners", getBannerNews);

// Admin routes for news management
router.get("/admin/all", adminOrManager, getAllNews);
router.post("/admin", adminOrManager, createNews);
router.post("/upload", adminOrManager, uploadImage);
router.put("/admin/reorder-banners", adminOrManager, reorderBanners);
router.put("/admin/:id", adminOrManager, updateNews);
router.delete("/admin/:id", adminOrManager, deleteNews);

// Admin routes for banner management
router.get("/admin/banners", adminOrManager, getAllBanners);
router.post("/admin/banners", adminOrManager, addBanner);
router.put("/admin/banners/:id", adminOrManager, updateBanner);
router.delete("/admin/banners/:id", adminOrManager, deleteBanner);

router.get("/:id", getNewsDetail);

export default router;
