import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Invoice extends Model { }
Invoice.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    invoice_number: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    company_name: { type: DataTypes.STRING(255) },
    tax_code: { type: DataTypes.STRING(50) },
    company_address: { type: DataTypes.TEXT },
    buyer_email: { type: DataTypes.STRING(255) },
    tax_amount: { type: DataTypes.DECIMAL(12, 2) },
    tax_info: { type: DataTypes.JSON },
    issued_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: false
});


export default Invoice;