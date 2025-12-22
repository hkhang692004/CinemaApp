import express from "express";
import {
  getAllMovies,
  getComingSoonMovie,
  getDetailMovie,
  getNowShowingMovie,
  searchMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getAllGenres,
  getAllGenresWithUsage,
  createGenre,
  deleteGenre,
  uploadPoster,
  uploadBackdrop,
} from "../controllers/movieController.js";
import { adminOrManager } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/now-showing", getNowShowingMovie);
router.get("/coming-soon", getComingSoonMovie);
router.get("/search", searchMovie);
router.get("/genres", getAllGenres);

// Admin/Manager routes
router.get("/", adminOrManager, getAllMovies);
router.post("/", adminOrManager, createMovie);
router.put("/:id", adminOrManager, updateMovie);
router.delete("/:id", adminOrManager, deleteMovie);

// Genre admin routes
router.get("/genres/admin", adminOrManager, getAllGenresWithUsage);
router.post("/genres", adminOrManager, createGenre);
router.delete("/genres/:id", adminOrManager, deleteGenre);

// Upload routes
router.post("/upload/poster", adminOrManager, uploadPoster);
router.post("/upload/backdrop", adminOrManager, uploadBackdrop);

// Public - get movie detail (phải để cuối vì /:id match tất cả)
router.get("/:id", getDetailMovie);

export default router;
