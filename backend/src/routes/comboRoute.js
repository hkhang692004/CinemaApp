import express from 'express';
import * as comboController from '../controllers/comboController.js';
import { protectedRoute, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============
// GET /api/combos - Lấy tất cả combo (active only)
router.get('/', comboController.getAllCombos);

// GET /api/combos/category/:category - Lấy combo theo category
router.get('/category/:category', comboController.getCombosByCategory);

// ============ ADMIN ROUTES ============
// GET /api/combos/admin - Lấy tất cả combo (bao gồm inactive)
router.get('/admin', protectedRoute, checkRole(['admin']), comboController.getAllCombosAdmin);

// GET /api/combos/stats - Thống kê combo
router.get('/stats', protectedRoute, checkRole(['admin']), comboController.getComboStats);

// GET /api/combos/categories - Lấy danh sách category
router.get('/categories', protectedRoute, checkRole(['admin']), comboController.getCategories);

// POST /api/combos/upload - Upload ảnh combo
router.post('/upload', protectedRoute, checkRole(['admin']), comboController.uploadImage);

// POST /api/combos - Tạo combo mới
router.post('/', protectedRoute, checkRole(['admin']), comboController.createCombo);

// PUT /api/combos/:id - Cập nhật combo
router.put('/:id', protectedRoute, checkRole(['admin']), comboController.updateCombo);

// DELETE /api/combos/:id - Xóa combo
router.delete('/:id', protectedRoute, checkRole(['admin']), comboController.deleteCombo);

// GET /api/combos/:id - Lấy chi tiết combo (đặt cuối để tránh conflict)
router.get('/:id', comboController.getComboById);

export default router;
