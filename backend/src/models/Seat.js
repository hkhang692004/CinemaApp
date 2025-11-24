import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Seat extends Model { }
Seat.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    row_label: { type: DataTypes.STRING(10) },
    seat_number: { type: DataTypes.STRING(10) },
    seat_type: { type: DataTypes.ENUM('Standard', 'VIP', 'Couple', 'Wheelchair'), defaultValue: 'Standard' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    sequelize,
    modelName: 'Seat',
    tableName: 'seats',
    timestamps: false,
    indexes: [{ unique: true, fields: ['room_id', 'row_label', 'seat_number'] }]
});


export default Seat;