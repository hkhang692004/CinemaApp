import express from "express";
import {
  getComingSoonMovie,
  getDetailMovie,
  getNowShowingMovie,
  searchMovie,
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/now-showing", getNowShowingMovie);

router.get("/coming-soon", getComingSoonMovie);

router.get("/search", searchMovie);

router.get("/:id", getDetailMovie);


export default router;
