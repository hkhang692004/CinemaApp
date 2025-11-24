import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Payment extends Model { }
Payment.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    provider: { type: DataTypes.STRING(50) },
    provider_payment_id: { type: DataTypes.STRING(200) },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'VND' },
    status: { type: DataTypes.ENUM('Initiated', 'Pending', 'Success', 'Failed', 'Refunded'), defaultValue: 'Initiated' },
    response_data: { type: DataTypes.JSON },
    paid_at: { type: DataTypes.DATE },
    refunded_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false
});


export default Payment;