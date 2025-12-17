import express from 'express';
import * as comboController from '../controllers/comboController.js';

const router = express.Router();

// GET /api/combos - Lấy tất cả combo
router.get('/', comboController.getAllCombos);

// GET /api/combos/:id - Lấy chi tiết combo
router.get('/:id', comboController.getComboById);

// GET /api/combos/category/:category - Lấy combo theo category
router.get('/category/:category', comboController.getCombosByCategory);

export default router;
