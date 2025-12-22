import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class GroupBooking extends Model { }
GroupBooking.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    booking_code: { type: DataTypes.STRING(30), unique: true }, // Mã đặt chỗ (VD: GRP-ABC123-XYZ)
    
    // Contact info
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    address: { type: DataTypes.STRING(255) },
    company_name: { type: DataTypes.STRING(200) },
    
    // Service info
    service_type: { type: DataTypes.ENUM('group_booking', 'private_show', 'hall_rental', 'voucher'), defaultValue: 'group_booking' },
    guest_count: { type: DataTypes.INTEGER },
    preferred_date: { type: DataTypes.DATEONLY }, // Ngày khách muốn đặt
    
    // Location preference
    region: { type: DataTypes.STRING(100) },
    theater_id: { type: DataTypes.INTEGER.UNSIGNED },
    
    // Admin assigns showtime after negotiation
    assigned_showtime_id: { type: DataTypes.INTEGER.UNSIGNED }, // Suất chiếu được gán (có sẵn hoặc tạo mới)
    
    // Voucher info (for voucher service type)
    voucher_codes: { type: DataTypes.JSON }, // Array of generated voucher codes [{code, discount_type, discount_value, valid_to}]
    voucher_quantity: { type: DataTypes.INTEGER }, // Number of vouchers requested
    
    // Notes and pricing
    notes: { type: DataTypes.TEXT },
    admin_notes: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(12, 2) },
    final_price: { type: DataTypes.DECIMAL(12, 2) }, // Giá cuối cùng sau khi duyệt
    rejection_reason: { type: DataTypes.TEXT }, // Lý do từ chối hoặc hủy
    
    // Status
    status: { type: DataTypes.ENUM('Requested', 'Processing', 'Approved', 'Rejected', 'Completed', 'Cancelled'), defaultValue: 'Requested' },
    handled_by: { type: DataTypes.BIGINT.UNSIGNED },
    
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'GroupBooking',
    tableName: 'group_bookings',
    timestamps: false
});


export default GroupBooking;