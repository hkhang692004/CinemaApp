import { LoyaltyTierRequirement, LoyaltyTierRate, LoyaltyAccount } from '../models/index.js';

const loyaltyService = {
    // Get all tier requirements
    async getTierRequirements() {
        const requirements = await LoyaltyTierRequirement.findAll({
            order: [['min_yearly_spent', 'ASC']]
        });
        return requirements;
    },

    // Get all tier rates
    async getTierRates() {
        const rates = await LoyaltyTierRate.findAll({
            order: [['tier', 'ASC']]
        });
        return rates;
    },

    // Update tier requirement
    async updateTierRequirement(tier, data) {
        const requirement = await LoyaltyTierRequirement.findByPk(tier);
        if (!requirement) {
            throw new Error('Không tìm thấy hạng thành viên');
        }

        await requirement.update({
            min_yearly_spent: data.min_yearly_spent
        });

        return requirement;
    },

    // Update tier rate
    async updateTierRate(tier, data) {
        const rate = await LoyaltyTierRate.findByPk(tier);
        if (!rate) {
            throw new Error('Không tìm thấy hạng thành viên');
        }

        await rate.update({
            points_per_1000: data.points_per_1000
        });

        return rate;
    },

    // Get loyalty stats
    async getLoyaltyStats() {
        const [silver, gold, platinum, totalPoints] = await Promise.all([
            LoyaltyAccount.count({ where: { tier: 'Silver' } }),
            LoyaltyAccount.count({ where: { tier: 'Gold' } }),
            LoyaltyAccount.count({ where: { tier: 'Platinum' } }),
            LoyaltyAccount.sum('points') || 0
        ]);

        return {
            membersByTier: { Silver: silver, Gold: gold, Platinum: platinum },
            totalMembers: silver + gold + platinum,
            totalPoints
        };
    },

    // Get all config in one call
    async getAllLoyaltyConfig() {
        const [requirements, rates, stats] = await Promise.all([
            this.getTierRequirements(),
            this.getTierRates(),
            this.getLoyaltyStats()
        ]);

        // Combine requirements and rates by tier
        const tiers = ['Silver', 'Gold', 'Platinum'].map(tier => {
            const req = requirements.find(r => r.tier === tier);
            const rate = rates.find(r => r.tier === tier);
            return {
                tier,
                min_yearly_spent: req?.min_yearly_spent || 0,
                points_per_1000: rate?.points_per_1000 || 1
            };
        });

        return { tiers, stats };
    }
};

export default loyaltyService;
