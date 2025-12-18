import { groupBookingService } from '../services/groupBookingService.js';

/**
 * Tạo yêu cầu đặt vé nhóm
 */
export async function createGroupBooking(req, res) {
    try {
        const userId = req.user.id;
        const result = await groupBookingService.createGroupBooking(userId, req.body);
        
        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error createGroupBooking:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Lấy danh sách đặt vé nhóm của user
 */
export async function getMyGroupBookings(req, res) {
    try {
        const userId = req.user.id;
        const bookings = await groupBookingService.getUserGroupBookings(userId);
        
        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error getMyGroupBookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Lấy chi tiết một booking
 */
export async function getGroupBookingDetail(req, res) {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        
        const booking = await groupBookingService.getGroupBookingDetail(bookingId, userId);
        
        return res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error getGroupBookingDetail:', error);
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Hủy đặt vé nhóm
 */
export async function cancelGroupBooking(req, res) {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        
        const result = await groupBookingService.cancelGroupBooking(bookingId, userId);
        
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error cancelGroupBooking:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Lấy danh sách phòng của rạp
 */
export async function getTheaterRooms(req, res) {
    try {
        const { theaterId } = req.params;
        const rooms = await groupBookingService.getTheaterRooms(theaterId);
        
        return res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Error getTheaterRooms:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}
