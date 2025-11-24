import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class LoyaltyTierRate extends Model { }
LoyaltyTierRate.init({
    tier: { type: DataTypes.ENUM('Silver', 'Gold', 'Platinum'), primaryKey: true },
    points_per_1000: { type: DataTypes.DECIMAL(3, 2), allowNull: false }
}, {
    sequelize,
    modelName: 'LoyaltyTierRate',
    tableName: 'loyalty_tier_rates',
    timestamps: false
});


export default LoyaltyTierRate;