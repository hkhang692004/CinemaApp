import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class LoyaltyPointsTransaction extends Model { }
LoyaltyPointsTransaction.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    order_id: { type: DataTypes.BIGINT.UNSIGNED },
    points_change: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(255) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'LoyaltyPointsTransaction',
    tableName: 'loyalty_points_transactions',
    timestamps: false
});


export default LoyaltyPointsTransaction;