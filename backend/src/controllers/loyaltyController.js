import loyaltyService from '../services/loyaltyService.js';

// Get all loyalty config
export async function getLoyaltyConfig(req, res) {
    try {
        const config = await loyaltyService.getAllLoyaltyConfig();
        res.json({
            success: true,
            ...config
        });
    } catch (error) {
        console.error('Get loyalty config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi lấy cấu hình loyalty'
        });
    }
}

// Update tier requirement
export async function updateTierRequirement(req, res) {
    try {
        const { tier } = req.params;
        const requirement = await loyaltyService.updateTierRequirement(tier, req.body);
        res.json({
            success: true,
            message: 'Đã cập nhật yêu cầu hạng',
            requirement
        });
    } catch (error) {
        console.error('Update tier requirement error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi cập nhật yêu cầu hạng'
        });
    }
}

// Update tier rate
export async function updateTierRate(req, res) {
    try {
        const { tier } = req.params;
        const rate = await loyaltyService.updateTierRate(tier, req.body);
        res.json({
            success: true,
            message: 'Đã cập nhật tỷ lệ tích điểm',
            rate
        });
    } catch (error) {
        console.error('Update tier rate error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi cập nhật tỷ lệ tích điểm'
        });
    }
}

// Bulk update all tiers
export async function updateAllTiers(req, res) {
    try {
        const { tiers } = req.body;
        
        for (const tierData of tiers) {
            await loyaltyService.updateTierRequirement(tierData.tier, {
                min_yearly_spent: tierData.min_yearly_spent
            });
            await loyaltyService.updateTierRate(tierData.tier, {
                points_per_1000: tierData.points_per_1000
            });
        }
        
        res.json({
            success: true,
            message: 'Đã cập nhật tất cả cấu hình'
        });
    } catch (error) {
        console.error('Update all tiers error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi cập nhật cấu hình'
        });
    }
}

export default {
    getLoyaltyConfig,
    updateTierRequirement,
    updateTierRate,
    updateAllTiers
};
