import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Showtime extends Model { }
Showtime.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    movie_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('Scheduled', 'Cancelled', 'Completed'), defaultValue: 'Scheduled' }
}, {
    sequelize,
    modelName: 'Showtime',
    tableName: 'showtimes',
    timestamps: false
});


export default Showtime;