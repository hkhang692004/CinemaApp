import express from 'express';
import orderController from '../controllers/orderController.js';
import { checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy danh sách đơn hàng (admin/manager)
router.get('/', checkRole(['Admin', 'Manager']), orderController.getOrders);

// Lấy thống kê đơn hàng
router.get('/stats', checkRole(['Admin', 'Manager']), orderController.getOrderStats);

// Lấy chi tiết đơn hàng
router.get('/:id', checkRole(['Admin', 'Manager']), orderController.getOrderById);

// Cập nhật trạng thái đơn hàng (hủy/hoàn tiền)
router.patch('/:id/status', checkRole(['Admin', 'Manager']), orderController.updateOrderStatus);

export default router;
