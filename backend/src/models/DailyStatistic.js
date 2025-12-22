import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class DailyStatistic extends Model { }
DailyStatistic.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    stat_date: { type: DataTypes.DATEONLY, allowNull: false },
    theater_id: { type: DataTypes.INTEGER.UNSIGNED },
    movie_id: { type: DataTypes.BIGINT.UNSIGNED },
    total_tickets_sold: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_revenue: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    unique_customers: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // Group Booking Statistics
    group_ticket_revenue: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },      // Doanh thu đặt vé nhóm
    group_ticket_count: { type: DataTypes.INTEGER, defaultValue: 0 },               // Số booking đặt vé nhóm
    private_show_revenue: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },      // Doanh thu chiếu riêng
    private_show_count: { type: DataTypes.INTEGER, defaultValue: 0 },               // Số booking chiếu riêng
    hall_rental_revenue: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },       // Doanh thu thuê hội trường
    hall_rental_count: { type: DataTypes.INTEGER, defaultValue: 0 },                // Số booking thuê hội trường
    group_booking_guests: { type: DataTypes.INTEGER, defaultValue: 0 },             // Tổng số khách từ group booking
    
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'DailyStatistic',
    tableName: 'daily_statistics',
    timestamps: false,
    indexes: [{ unique: true, fields: ['stat_date', 'theater_id', 'movie_id'] }]
});


export default DailyStatistic;