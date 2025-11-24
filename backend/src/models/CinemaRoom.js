import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class CinemaRoom extends Model { }
CinemaRoom.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    theater_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100) },
    seat_count: { type: DataTypes.INTEGER.UNSIGNED },
    screen_type: { type: DataTypes.ENUM('Standard', 'IMAX', '4DX'), defaultValue: 'Standard' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    sequelize,
    modelName: 'CinemaRoom',
    tableName: 'cinema_rooms',
    timestamps: false
});


export default CinemaRoom;