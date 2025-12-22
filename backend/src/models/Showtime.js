import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Showtime extends Model { }
Showtime.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    movie_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // Allow null for hall_rental
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    showtime_type: { 
        type: DataTypes.ENUM('2D Phụ đề Việt', '2D Lồng tiếng Việt', '3D Phụ đề Việt', '3D Lồng tiếng Việt'), 
        defaultValue: '2D Phụ đề Việt',
        allowNull: false 
    },
    status: { type: DataTypes.ENUM('Scheduled', 'Cancelled', 'Completed'), defaultValue: 'Scheduled' }
}, {
    sequelize,
    modelName: 'Showtime',
    tableName: 'showtimes',
    timestamps: false
});


export default Showtime;