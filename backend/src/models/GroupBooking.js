import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class GroupBooking extends Model { }
GroupBooking.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    theater_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    event_name: { type: DataTypes.STRING(200) },
    event_type: { type: DataTypes.STRING(50) },
    event_start: { type: DataTypes.DATE, allowNull: false },
    event_end: { type: DataTypes.DATE, allowNull: false },
    attendees_estimate: { type: DataTypes.INTEGER },
    special_requests: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(12, 2) },
    deposit_amount: { type: DataTypes.DECIMAL(12, 2) },
    status: { type: DataTypes.ENUM('Requested', 'Approved', 'Rejected', 'DepositPaid', 'FullyPaid', 'Completed', 'Cancelled'), defaultValue: 'Requested' },
    approved_by: { type: DataTypes.BIGINT.UNSIGNED },
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'GroupBooking',
    tableName: 'group_bookings',
    timestamps: false
});


export default GroupBooking;