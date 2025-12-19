import express from 'express';
import { adminOrManager, adminOnly } from '../middlewares/authMiddleware.js';
import {
  getOverviewReport,
  getTheaterReport,
  getMovieReport,
  getMonthlyComparison,
  triggerAggregation
} from '../controllers/reportController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu admin hoặc manager
router.get('/overview', adminOrManager, getOverviewReport);
router.get('/theaters', adminOrManager, getTheaterReport);
router.get('/movies', adminOrManager, getMovieReport);
router.get('/monthly', adminOrManager, getMonthlyComparison);

// Chỉ admin mới được trigger aggregation thủ công
router.post('/aggregate', adminOnly, triggerAggregation);

export default router;
