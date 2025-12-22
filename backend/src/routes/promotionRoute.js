import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    getPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionStats
} from '../controllers/promotionController.js';

const router = express.Router();

// Admin routes
router.get('/stats', protectedRoute, getPromotionStats);
router.get('/', protectedRoute, getPromotions);
router.get('/:id', protectedRoute, getPromotionById);
router.post('/', protectedRoute, createPromotion);
router.put('/:id', protectedRoute, updatePromotion);
router.delete('/:id', protectedRoute, deletePromotion);
router.patch('/:id/toggle', protectedRoute, togglePromotionStatus);

export default router;
