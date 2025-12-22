import { Promotion, Order } from '../models/index.js';
import { Op } from 'sequelize';

const promotionService = {
    // Get all promotions with usage stats
    async getAllPromotions(filters = {}) {
        const where = {};
        
        // Filter by status
        if (filters.status === 'active') {
            where.is_active = true;
            where.valid_from = { [Op.lte]: new Date() };
            where.valid_to = { [Op.gte]: new Date() };
        } else if (filters.status === 'expired') {
            where.valid_to = { [Op.lt]: new Date() };
        } else if (filters.status === 'upcoming') {
            where.valid_from = { [Op.gt]: new Date() };
        } else if (filters.status === 'inactive') {
            where.is_active = false;
        }

        // Search by code or name
        if (filters.search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${filters.search}%` } },
                { name: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        const promotions = await Promotion.findAll({
            where,
            order: [['valid_from', 'DESC']]
        });

        return promotions;
    },

    // Get single promotion
    async getPromotionById(id) {
        const promotion = await Promotion.findByPk(id);
        if (!promotion) {
            throw new Error('Không tìm thấy voucher');
        }
        return promotion;
    },

    // Create new promotion
    async createPromotion(data) {
        // Check if code already exists
        const existing = await Promotion.findOne({ where: { code: data.code } });
        if (existing) {
            throw new Error('Mã voucher đã tồn tại');
        }

        const promotion = await Promotion.create({
            code: data.code.toUpperCase(),
            name: data.name,
            description: data.description,
            discount_type: data.discount_type || 'Percentage',
            discount_value: data.discount_value,
            min_order_amount: data.min_order_amount || 0,
            max_discount: data.max_discount,
            usage_limit: data.usage_limit,
            usage_per_user: data.usage_per_user || 1,
            used_count: 0,
            valid_from: data.valid_from,
            valid_to: data.valid_to,
            applicable_to: data.applicable_to || 'All',
            is_active: data.is_active !== false
        });

        return promotion;
    },

    // Update promotion
    async updatePromotion(id, data) {
        const promotion = await Promotion.findByPk(id);
        if (!promotion) {
            throw new Error('Không tìm thấy voucher');
        }

        // Check if new code conflicts with existing
        if (data.code && data.code !== promotion.code) {
            const existing = await Promotion.findOne({ 
                where: { 
                    code: data.code.toUpperCase(),
                    id: { [Op.ne]: id }
                } 
            });
            if (existing) {
                throw new Error('Mã voucher đã tồn tại');
            }
        }

        await promotion.update({
            code: data.code ? data.code.toUpperCase() : promotion.code,
            name: data.name !== undefined ? data.name : promotion.name,
            description: data.description !== undefined ? data.description : promotion.description,
            discount_type: data.discount_type || promotion.discount_type,
            discount_value: data.discount_value !== undefined ? data.discount_value : promotion.discount_value,
            min_order_amount: data.min_order_amount !== undefined ? data.min_order_amount : promotion.min_order_amount,
            max_discount: data.max_discount !== undefined ? data.max_discount : promotion.max_discount,
            usage_limit: data.usage_limit !== undefined ? data.usage_limit : promotion.usage_limit,
            usage_per_user: data.usage_per_user !== undefined ? data.usage_per_user : promotion.usage_per_user,
            valid_from: data.valid_from || promotion.valid_from,
            valid_to: data.valid_to || promotion.valid_to,
            applicable_to: data.applicable_to || promotion.applicable_to,
            is_active: data.is_active !== undefined ? data.is_active : promotion.is_active
        });

        return promotion;
    },

    // Delete promotion
    async deletePromotion(id) {
        const promotion = await Promotion.findByPk(id);
        if (!promotion) {
            throw new Error('Không tìm thấy voucher');
        }

        // Check if promotion has been used
        if (promotion.used_count > 0) {
            throw new Error('Không thể xóa voucher đã được sử dụng');
        }

        await promotion.destroy();
        return { message: 'Đã xóa voucher' };
    },

    // Toggle promotion status
    async togglePromotionStatus(id) {
        const promotion = await Promotion.findByPk(id);
        if (!promotion) {
            throw new Error('Không tìm thấy voucher');
        }

        await promotion.update({ is_active: !promotion.is_active });
        return promotion;
    },

    // Get promotion stats
    async getPromotionStats() {
        const now = new Date();
        
        const [total, active, expired, totalUsed] = await Promise.all([
            Promotion.count(),
            Promotion.count({
                where: {
                    is_active: true,
                    valid_from: { [Op.lte]: now },
                    valid_to: { [Op.gte]: now }
                }
            }),
            Promotion.count({
                where: { valid_to: { [Op.lt]: now } }
            }),
            Promotion.sum('used_count') || 0
        ]);

        return { total, active, expired, totalUsed };
    }
};

export default promotionService;
