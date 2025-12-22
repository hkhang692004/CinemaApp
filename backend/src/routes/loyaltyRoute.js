import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import {
    getLoyaltyConfig,
    updateTierRequirement,
    updateTierRate,
    updateAllTiers
} from '../controllers/loyaltyController.js';

const router = express.Router();

// Get all config
router.get('/config', protectedRoute, getLoyaltyConfig);

// Update individual tier
router.put('/requirements/:tier', protectedRoute, updateTierRequirement);
router.put('/rates/:tier', protectedRoute, updateTierRate);

// Bulk update all tiers
router.put('/tiers', protectedRoute, updateAllTiers);

export default router;
