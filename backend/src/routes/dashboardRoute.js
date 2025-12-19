import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { adminOrManager } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần admin hoặc manager
router.get('/stats', adminOrManager, dashboardController.getStats);
router.get('/recent-orders', adminOrManager, dashboardController.getRecentOrders);
router.get('/revenue-chart', adminOrManager, dashboardController.getRevenueChart);
router.get('/top-movies', adminOrManager, dashboardController.getTopMovies);

export default router;
