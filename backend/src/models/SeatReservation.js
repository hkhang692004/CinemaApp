import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class SeatReservation extends Model { }
SeatReservation.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    showtime_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    seat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED },
    session_id: { type: DataTypes.STRING(100) },
    reserved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('Held', 'Confirmed', 'Released', 'Expired'), defaultValue: 'Held' }
}, {
    sequelize,
    modelName: 'SeatReservation',
    tableName: 'seat_reservations',
    timestamps: false,
    indexes: [{ unique: true, fields: ['showtime_id', 'seat_id'] }]
});


export default SeatReservation;