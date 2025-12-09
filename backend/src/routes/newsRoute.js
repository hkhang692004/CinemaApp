import express from "express";
import { getBannerNews, getNews, getNewsDetail } from "../controllers/newsController.js";

const router = express.Router();

router.get("/allnews",getNews);
router.get("/banners", getBannerNews);

router.get("/:id", getNewsDetail);

export default router;
