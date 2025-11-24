import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Promotion extends Model { }
Promotion.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    name: { type: DataTypes.STRING(200) },
    description: { type: DataTypes.TEXT },
    discount_type: { type: DataTypes.ENUM('Percentage', 'FixedAmount', 'BuyXGetY'), defaultValue: 'Percentage' },
    discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    min_order_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    max_discount: { type: DataTypes.DECIMAL(10, 2) },
    usage_limit: { type: DataTypes.INTEGER },
    usage_per_user: { type: DataTypes.INTEGER, defaultValue: 1 },
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    valid_from: { type: DataTypes.DATE },
    valid_to: { type: DataTypes.DATE },
    applicable_to: { type: DataTypes.ENUM('All', 'Tickets', 'Combos'), defaultValue: 'All' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    sequelize,
    modelName: 'Promotion',
    tableName: 'promotions',
    timestamps: false
});


export default Promotion;