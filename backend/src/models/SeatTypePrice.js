import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';

/**
 * Bảng quản lý giá phụ thu cho từng loại ghế
 * - price_multiplier: hệ số nhân với base_price của showtime
 *   VD: Standard = 1.0, VIP = 1.5, Couple = 2.0
 * - extra_fee: phí cố định thêm (VND)
 *   VD: Wheelchair = 0 (không phụ thu)
 * 
 * Công thức: final_price = base_price * price_multiplier + extra_fee
 */
export class SeatTypePrice extends Model { }
SeatTypePrice.init({
    seat_type: { 
        type: DataTypes.ENUM('Standard', 'VIP', 'Couple', 'Wheelchair'), 
        primaryKey: true 
    },
    price_multiplier: { 
        type: DataTypes.DECIMAL(3, 2), 
        allowNull: false,
        defaultValue: 1.0,
        comment: 'Hệ số nhân giá (VD: 1.0, 1.5, 2.0)'
    },
    extra_fee: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false,
        defaultValue: 0,
        comment: 'Phí cố định thêm (VND)'
    },
    description: {
        type: DataTypes.STRING(200),
        comment: 'Mô tả loại ghế'
    }
}, {
    sequelize,
    modelName: 'SeatTypePrice',
    tableName: 'seat_type_prices',
    timestamps: false
});

export default SeatTypePrice;
