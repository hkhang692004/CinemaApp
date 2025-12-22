import express from 'express';
import {
    createGroupBooking,
    getMyGroupBookings,
    getGroupBookingDetail,
    cancelGroupBooking,
    getTheaterRooms,
    // Admin functions
    getAllBookings,
    getBookingDetailAdmin,
    updateBooking,
    getStats,
    getShowtimesByRoom,
    getAvailableSeats,
    createPrivateShowtime,
    getActiveMovies,
    getAvailableShowtimesByMovie,
    resendConfirmationEmail,
    createVouchers,
    sendVoucherEmail
} from '../controllers/groupBookingController.js';
import { protectedRoute, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== USER ROUTES ====================

// Tạo yêu cầu đặt vé nhóm
router.post('/', protectedRoute, createGroupBooking);

// Lấy danh sách đặt vé nhóm của user
router.get('/my-bookings', protectedRoute, getMyGroupBookings);

// Lấy danh sách phòng của rạp
router.get('/theaters/:theaterId/rooms', getTheaterRooms);

// ==================== ADMIN/MANAGER ROUTES ====================

// Lấy thống kê
router.get('/admin/stats', protectedRoute, checkRole(['admin', 'manager']), getStats);

// Lấy tất cả booking
router.get('/admin/all', protectedRoute, checkRole(['admin', 'manager']), getAllBookings);

// Lấy danh sách phim đang chiếu
router.get('/admin/movies', protectedRoute, checkRole(['admin', 'manager']), getActiveMovies);

// Lấy suất chiếu có sẵn của phim (chưa có người đặt)
router.get('/admin/movies/:movieId/showtimes', protectedRoute, checkRole(['admin', 'manager']), getAvailableShowtimesByMovie);

// Lấy suất chiếu theo phòng
router.get('/admin/rooms/:roomId/showtimes', protectedRoute, checkRole(['admin', 'manager']), getShowtimesByRoom);

// Lấy ghế trống của suất chiếu
router.get('/admin/showtimes/:showtimeId/seats', protectedRoute, checkRole(['admin', 'manager']), getAvailableSeats);

// Tạo suất chiếu riêng
router.post('/admin/private-showtime', protectedRoute, checkRole(['admin', 'manager']), createPrivateShowtime);

// Tạo voucher cho doanh nghiệp
router.post('/admin/:bookingId/vouchers', protectedRoute, checkRole(['admin', 'manager']), createVouchers);

// Gửi email voucher
router.post('/admin/:bookingId/send-voucher-email', protectedRoute, checkRole(['admin', 'manager']), sendVoucherEmail);

// Lấy chi tiết booking (admin)
router.get('/admin/:bookingId', protectedRoute, checkRole(['admin', 'manager']), getBookingDetailAdmin);

// Cập nhật booking (admin)
router.put('/admin/:bookingId', protectedRoute, checkRole(['admin', 'manager']), updateBooking);

// Gửi lại email xác nhận (admin)
router.post('/admin/:bookingId/resend-email', protectedRoute, checkRole(['admin', 'manager']), resendConfirmationEmail);

// ==================== USER ROUTES (with params) ====================

// Lấy chi tiết một booking (user - phải để cuối vì có :bookingId)
router.get('/:bookingId', protectedRoute, getGroupBookingDetail);

// Hủy đặt vé nhóm
router.delete('/:bookingId', protectedRoute, cancelGroupBooking);

export default router;
