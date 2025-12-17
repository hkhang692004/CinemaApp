import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class LoyaltyTierRequirement extends Model { }
LoyaltyTierRequirement.init({
    tier: { type: DataTypes.ENUM('Silver', 'Gold', 'Platinum'), primaryKey: true },
    min_yearly_spent: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, {
    sequelize,
    modelName: 'LoyaltyTierRequirement',
    tableName: 'loyalty_tier_requirements',
    timestamps: false
});


export default LoyaltyTierRequirement;