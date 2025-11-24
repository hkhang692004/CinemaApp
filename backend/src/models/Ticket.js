import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Ticket extends Model { }
Ticket.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    showtime_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    seat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('Booked', 'CheckedIn', 'Cancelled', 'Refunded'), defaultValue: 'Booked' },
    qr_code: { type: DataTypes.STRING(500) },
    qr_hash: { type: DataTypes.CHAR(64), unique: true },
    checked_in_at: { type: DataTypes.DATE },
    checked_in_by: { type: DataTypes.BIGINT.UNSIGNED },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets',
    timestamps: false
});


export default Ticket;