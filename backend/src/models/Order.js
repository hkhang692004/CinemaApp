import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Order extends Model { }
Order.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    order_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    loyalty_points_used: { type: DataTypes.INTEGER, defaultValue: 0 },
    loyalty_discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('Pending', 'Paid', 'Cancelled', 'Refunded'), defaultValue: 'Pending' },
    payment_method: { type: DataTypes.STRING(50) },
    booking_expires_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: false
});


export default Order;