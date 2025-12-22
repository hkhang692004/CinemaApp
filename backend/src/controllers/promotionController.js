import promotionService from '../services/promotionService.js';

// Get all promotions
export async function getPromotions(req, res) {
    try {
        const filters = {
            status: req.query.status,
            search: req.query.search
        };
        const promotions = await promotionService.getAllPromotions(filters);
        res.json({
            success: true,
            promotions
        });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi lấy danh sách voucher'
        });
    }
}

// Get single promotion
export async function getPromotionById(req, res) {
    try {
        const promotion = await promotionService.getPromotionById(req.params.id);
        res.json({
            success: true,
            promotion
        });
    } catch (error) {
        console.error('Get promotion error:', error);
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

// Create promotion
export async function createPromotion(req, res) {
    try {
        const promotion = await promotionService.createPromotion(req.body);
        res.status(201).json({
            success: true,
            message: 'Đã tạo voucher',
            promotion
        });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi tạo voucher'
        });
    }
}

// Update promotion
export async function updatePromotion(req, res) {
    try {
        const promotion = await promotionService.updatePromotion(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Đã cập nhật voucher',
            promotion
        });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi cập nhật voucher'
        });
    }
}

// Delete promotion
export async function deletePromotion(req, res) {
    try {
        await promotionService.deletePromotion(req.params.id);
        res.json({
            success: true,
            message: 'Đã xóa voucher'
        });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi xóa voucher'
        });
    }
}

// Toggle status
export async function togglePromotionStatus(req, res) {
    try {
        const promotion = await promotionService.togglePromotionStatus(req.params.id);
        res.json({
            success: true,
            message: promotion.is_active ? 'Đã kích hoạt voucher' : 'Đã tắt voucher',
            promotion
        });
    } catch (error) {
        console.error('Toggle promotion status error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// Get stats
export async function getPromotionStats(req, res) {
    try {
        const stats = await promotionService.getPromotionStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get promotion stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê voucher'
        });
    }
}

export default {
    getPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionStats
};
