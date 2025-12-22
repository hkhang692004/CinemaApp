import { groupBookingService } from '../services/groupBookingService.js';
import { emitToAdmin, SOCKET_EVENTS } from '../socket.js';
import ManagerTheater from '../models/ManagerTheater.js';
import Role from '../models/Role.js';

// Helper function to get manager's theater IDs
async function getManagerTheaterIds(user) {
    const role = await Role.findByPk(user.role_id);
    if (role?.name === 'manager') {
        const assignments = await ManagerTheater.findAll({
            where: { user_id: user.id },
            attributes: ['theater_id']
        });
        return assignments.map(a => a.theater_id);
    }
    return null; // null means admin (no filter)
}

/**
 * Tạo yêu cầu đặt vé nhóm
 */
export async function createGroupBooking(req, res) {
    try {
        const userId = req.user.id;
        const result = await groupBookingService.createGroupBooking(userId, req.body);
        
        // Emit socket event to notify admin
        emitToAdmin(SOCKET_EVENTS.GROUP_BOOKING_CREATED, { booking: result.booking });
        
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

// ==================== ADMIN FUNCTIONS ====================

/**
 * Lấy tất cả booking (admin)
 */
export async function getAllBookings(req, res) {
    try {
        // Get manager's theaters if applicable
        const theaterIds = await getManagerTheaterIds(req.user);
        const filters = { ...req.query };
        
        if (theaterIds) {
            // Manager - filter by their theaters
            if (filters.theaterId) {
                // If specific theater requested, verify access
                if (!theaterIds.includes(parseInt(filters.theaterId))) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem đặt vé của rạp này'
                    });
                }
            } else {
                // No specific theater - use manager's theaters
                filters.theaterIds = theaterIds;
            }
        }
        
        const result = await groupBookingService.getAllBookings(filters);
        
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getAllBookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Lấy chi tiết booking (admin)
 */
export async function getBookingDetailAdmin(req, res) {
    try {
        const { bookingId } = req.params;
        const booking = await groupBookingService.getBookingDetailAdmin(bookingId);
        
        // Check manager access
        const theaterIds = await getManagerTheaterIds(req.user);
        if (theaterIds && booking.theaterId && !theaterIds.includes(booking.theaterId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đặt vé này'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error getBookingDetailAdmin:', error);
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Cập nhật booking (admin)
 */
export async function updateBooking(req, res) {
    try {
        const adminId = req.user.id;
        const { bookingId } = req.params;
        
        // Check manager access before updating
        const existingBooking = await groupBookingService.getBookingDetailAdmin(bookingId);
        const theaterIds = await getManagerTheaterIds(req.user);
        if (theaterIds && existingBooking.theaterId && !theaterIds.includes(existingBooking.theaterId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật đặt vé này'
            });
        }
        
        const booking = await groupBookingService.updateBooking(bookingId, adminId, req.body);
        
        // Emit socket event
        emitToAdmin(SOCKET_EVENTS.GROUP_BOOKING_UPDATED, { booking });
        
        return res.status(200).json({
            success: true,
            data: booking,
            message: 'Cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updateBooking:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Lấy thống kê (admin)
 */
export async function getStats(req, res) {
    try {
        const theaterIds = await getManagerTheaterIds(req.user);
        const stats = await groupBookingService.getStats(theaterIds);
        
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Lấy suất chiếu theo phòng và ngày (admin)
 */
export async function getShowtimesByRoom(req, res) {
    try {
        const { roomId } = req.params;
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ngày'
            });
        }

        const showtimes = await groupBookingService.getShowtimesByRoom(roomId, date);
        
        return res.status(200).json({
            success: true,
            data: showtimes
        });
    } catch (error) {
        console.error('Error getShowtimesByRoom:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Lấy ghế trống của suất chiếu (admin)
 */
export async function getAvailableSeats(req, res) {
    try {
        const { showtimeId } = req.params;
        const result = await groupBookingService.getAvailableSeats(showtimeId);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getAvailableSeats:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Tạo suất chiếu riêng (admin)
 */
export async function createPrivateShowtime(req, res) {
    try {
        const showtime = await groupBookingService.createPrivateShowtime(req.body);
        
        return res.status(201).json({
            success: true,
            data: showtime,
            message: 'Tạo suất chiếu thành công'
        });
    } catch (error) {
        console.error('Error createPrivateShowtime:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Lấy danh sách phim đang chiếu (admin)
 */
export async function getActiveMovies(req, res) {
    try {
        const movies = await groupBookingService.getActiveMovies();
        
        return res.status(200).json({
            success: true,
            data: movies
        });
    } catch (error) {
        console.error('Error getActiveMovies:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Lấy suất chiếu có sẵn của phim (admin)
 */
export async function getAvailableShowtimesByMovie(req, res) {
    try {
        const { movieId } = req.params;
        const { theaterId, date } = req.query;
        
        const showtimes = await groupBookingService.getAvailableShowtimesByMovie(
            parseInt(movieId), 
            theaterId ? parseInt(theaterId) : null,
            date || null
        );
        
        return res.status(200).json({
            success: true,
            data: showtimes
        });
    } catch (error) {
        console.error('Error getAvailableShowtimesByMovie:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
}

/**
 * Gửi lại email xác nhận (admin)
 */
export async function resendConfirmationEmail(req, res) {
    try {
        const { bookingId } = req.params;
        const result = await groupBookingService.resendConfirmationEmail(bookingId);
        
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error resendConfirmationEmail:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Tạo voucher cho doanh nghiệp (admin)
 */
export async function createVouchers(req, res) {
    try {
        const { bookingId } = req.params;
        const voucherData = req.body;
        
        const result = await groupBookingService.createVoucherForBooking(
            parseInt(bookingId),
            voucherData
        );
        
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error createVouchers:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Gửi email voucher cho khách hàng (admin)
 */
export async function sendVoucherEmail(req, res) {
    try {
        const { bookingId } = req.params;
        const result = await groupBookingService.sendVoucherEmailToCustomer(parseInt(bookingId));
        
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error sendVoucherEmail:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
