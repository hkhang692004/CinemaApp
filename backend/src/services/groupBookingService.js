import GroupBooking from '../models/GroupBooking.js';
import { Theater } from '../models/Theater.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

export const groupBookingService = {
    /**
     * Tạo yêu cầu dịch vụ doanh nghiệp
     * Chỉ lưu thông tin, admin sẽ liên hệ tư vấn và báo giá sau
     */
    async createGroupBooking(userId, data) {
        const {
            fullName,
            email,
            phone,
            address,
            companyName,
            serviceType,
            guestCount,
            preferredDate,
            region,
            theaterId,
            notes
        } = data;

        // Validate required fields
        if (!fullName || !email || !phone) {
            throw new Error('Vui lòng nhập đầy đủ họ tên, email và số điện thoại');
        }

        if (!guestCount || guestCount <= 0) {
            throw new Error('Vui lòng nhập số lượng khách dự kiến');
        }

        if (guestCount < 20) {
            throw new Error('Dịch vụ này yêu cầu tối thiểu 20 khách');
        }

        if (!preferredDate) {
            throw new Error('Vui lòng chọn ngày mong muốn');
        }

        // Validate theater if provided
        if (theaterId) {
            const theater = await Theater.findByPk(theaterId);
            if (!theater) {
                throw new Error('Rạp không tồn tại');
            }
        }

        // Create booking request
        const booking = await GroupBooking.create({
            user_id: userId,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address || null,
            company_name: companyName || null,
            service_type: serviceType || 'group_booking',
            guest_count: guestCount,
            preferred_date: preferredDate,
            region: region || null,
            theater_id: theaterId || null,
            notes: notes || null,
            status: 'Requested'
        });

        return {
            booking,
            message: 'Yêu cầu của bạn đã được gửi thành công! Nhân viên sẽ liên hệ tư vấn và báo giá trong vòng 24h làm việc.'
        };
    },

    /**
     * Lấy danh sách yêu cầu của user
     */
    async getUserGroupBookings(userId) {
        const bookings = await GroupBooking.findAll({
            where: { user_id: userId },
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });

        return bookings;
    },

    /**
     * Lấy chi tiết một yêu cầu
     */
    async getGroupBookingDetail(bookingId, userId) {
        const booking = await GroupBooking.findOne({
            where: { id: bookingId, user_id: userId },
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city', 'phone', 'email'], required: false }
            ]
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        return booking;
    },

    /**
     * Hủy yêu cầu (chỉ khi status = Requested)
     */
    async cancelGroupBooking(bookingId, userId) {
        const booking = await GroupBooking.findOne({
            where: { id: bookingId, user_id: userId }
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        if (!['Requested', 'Contacted'].includes(booking.status)) {
            throw new Error('Không thể hủy yêu cầu ở trạng thái này');
        }

        await booking.update({ status: 'Cancelled', updated_at: new Date() });

        return { message: 'Đã hủy yêu cầu' };
    },

    /**
     * Lấy danh sách phòng của rạp (nếu cần)
     */
    async getTheaterRooms(theaterId) {
        const { CinemaRoom } = await import('../models/CinemaRoom.js');
        const rooms = await CinemaRoom.findAll({
            where: { theater_id: theaterId, is_active: true },
            attributes: ['id', 'name', 'screen_type', 'seat_count']
        });

        return rooms;
    }
};
