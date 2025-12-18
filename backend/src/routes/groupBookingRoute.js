import express from 'express';
import {
    createGroupBooking,
    getMyGroupBookings,
    getGroupBookingDetail,
    cancelGroupBooking,
    getTheaterRooms
} from '../controllers/groupBookingController.js';

const router = express.Router();

// Tạo yêu cầu đặt vé nhóm
router.post('/', createGroupBooking);

// Lấy danh sách đặt vé nhóm của user
router.get('/my-bookings', getMyGroupBookings);

// Lấy chi tiết một booking
router.get('/:bookingId', getGroupBookingDetail);

// Hủy đặt vé nhóm
router.delete('/:bookingId', cancelGroupBooking);

// Lấy danh sách phòng của rạp
router.get('/theaters/:theaterId/rooms', getTheaterRooms);

export default router;
