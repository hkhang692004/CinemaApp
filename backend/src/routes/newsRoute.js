import express from "express";
import { getBannerNews, getNewsDetail } from "../controllers/newsController.js";

const router = express.Router();


router.get("/banners", getBannerNews);

router.get("/:id", getNewsDetail);

export default router;
