import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class ComboOrder extends Model { }
ComboOrder.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    combo_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'ComboOrder',
    tableName: 'combo_orders',
    timestamps: false
});


export default ComboOrder;