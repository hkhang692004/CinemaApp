import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';

/**
 * Bảng quản lý loại màn hình và giá cơ bản
 * - screen_type: tên loại màn hình (Standard, IMAX, 4DX, ScreenX, Dolby Cinema, ...)
 * - base_price: giá vé cơ bản cho loại màn hình này (VND)
 * - description: mô tả loại màn hình
 * - is_active: trạng thái hoạt động
 * 
 * Công thức giá cuối cùng: 
 * final_price = screen_type.base_price * seat_type.price_multiplier + seat_type.extra_fee
 */
export class ScreenTypePrice extends Model { }

ScreenTypePrice.init({
    id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        primaryKey: true, 
        autoIncrement: true 
    },
    screen_type: { 
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: true,
        comment: 'Tên loại màn hình (VD: Standard, IMAX, 4DX, ScreenX, Dolby Cinema)'
    },
    base_price: { 
        type: DataTypes.DECIMAL(12, 0), 
        allowNull: false,
        defaultValue: 100000,
        comment: 'Giá vé cơ bản (VND)'
    },
    description: {
        type: DataTypes.STRING(500),
        comment: 'Mô tả chi tiết loại màn hình'
    },
    is_active: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true,
        comment: 'Trạng thái hoạt động'
    }
}, {
    sequelize,
    modelName: 'ScreenTypePrice',
    tableName: 'screen_type_prices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default ScreenTypePrice;
