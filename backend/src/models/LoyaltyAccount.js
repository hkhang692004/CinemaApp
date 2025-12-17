import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';

export class LoyaltyAccount extends Model {}
LoyaltyAccount.init({
id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
points: { type: DataTypes.INTEGER, defaultValue: 0 },
tier: { type: DataTypes.ENUM('Silver','Gold','Platinum'), defaultValue: 'Silver' },
tier_expires_at: { type: DataTypes.DATEONLY },
total_spent: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
yearly_spent: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
spent_year: { type: DataTypes.INTEGER, defaultValue: new Date().getFullYear() },
created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
sequelize,
modelName: 'LoyaltyAccount',
tableName: 'loyalty_accounts',
timestamps: false
});


export default LoyaltyAccount;