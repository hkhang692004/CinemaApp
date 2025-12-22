import { showtimeService } from "../services/showtimeService.js";
import { emitToAll, SOCKET_EVENTS } from '../socket.js';
import SeatTypePrice from "../models/SeatTypePrice.js";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import { CinemaRoom } from "../models/CinemaRoom.js";
import { Theater } from "../models/Theater.js";
import Ticket from "../models/Ticket.js";
import GroupBooking from "../models/GroupBooking.js";
import ManagerTheater from "../models/ManagerTheater.js";
import Role from "../models/Role.js";
import { Op } from "sequelize";

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

export const getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        if (!showtimeId) {
            return res.status(400).json({ message: "Thiếu tham số showtimeId" });
        }
        const showtime = await showtimeService.getShowTime(showtimeId);
        if (!showtime) {
            return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
        }

        const seats = await showtimeService.getSeat(showtime);

        const reservedSeats = await showtimeService.getReservedSeats(showtimeId);

        const reservedSeatIds = reservedSeats.map(r => r.seat_id);
        
        // Lấy bảng giá loại ghế
        const seatTypePrices = await SeatTypePrice.findAll();
        const priceMap = {};
        seatTypePrices.forEach(stp => {
            priceMap[stp.seat_type] = {
                multiplier: parseFloat(stp.price_multiplier),
                extraFee: parseFloat(stp.extra_fee)
            };
        });
        
        const basePrice = parseFloat(showtime.base_price);

        const seatsWithStatus = seats.map(seat => {
            const pricing = priceMap[seat.seat_type] || { multiplier: 1.0, extraFee: 0 };
            const seatPrice = basePrice * pricing.multiplier + pricing.extraFee;
            
            return {
                id: seat.id,
                room_id: seat.room_id,
                row_label: seat.row_label,
                seat_number: seat.seat_number,
                seat_type: seat.seat_type,
                is_active: seat.is_active,
                reserved: reservedSeatIds.includes(seat.id),
                status: reservedSeatIds.includes(seat.id) ? 'Booked' : 'Available',
                price: seatPrice
            };
        });

        return res.status(200).json({
            seats: seatsWithStatus,
            showtime: {
                id: showtime.id,
                start_time: showtime.start_time,
                end_time: showtime.end_time,
                base_price: showtime.base_price,
                status: showtime.status
            },
            room: {
                id: showtime.CinemaRoom.id,
                name: showtime.CinemaRoom.name,
                seatCount: showtime.CinemaRoom.seat_count,
                screenType: showtime.CinemaRoom.screen_type
            },
            seatTypePrices: seatTypePrices.map(stp => ({
                seatType: stp.seat_type,
                multiplier: parseFloat(stp.price_multiplier),
                extraFee: parseFloat(stp.extra_fee),
                description: stp.description,
                calculatedPrice: basePrice * parseFloat(stp.price_multiplier) + parseFloat(stp.extra_fee)
            }))
        });
    } catch (error) {
        console.error("lỗi từ getSeatsByShowtime", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });   
    }
};

// ==================== ADMIN CRUD ====================

// Get all showtimes for admin
export const getAllShowtimes = async (req, res) => {
    try {
        // Get theater filter for manager
        const theaterIds = await getManagerTheaterIds(req.user);
        
        // Build room filter
        let roomIds = null;
        if (theaterIds && theaterIds.length > 0) {
            const rooms = await CinemaRoom.findAll({
                where: { theater_id: theaterIds },
                attributes: ['id']
            });
            roomIds = rooms.map(r => r.id);
            
            if (roomIds.length === 0) {
                return res.status(200).json({ showtimes: [] });
            }
        }
        
        const whereClause = roomIds ? { room_id: roomIds } : {};
        
        const showtimes = await Showtime.findAll({
            where: whereClause,
            include: [
                { 
                    model: Movie, 
                    attributes: ['id', 'title', 'poster_url', 'duration_min'] 
                },
                { 
                    model: CinemaRoom,
                    attributes: ['id', 'name', 'screen_type', 'seat_count'],
                    include: [{
                        model: Theater,
                        as: 'Theater',
                        attributes: ['id', 'name', 'city']
                    }]
                },
                {
                    model: GroupBooking,
                    attributes: ['id', 'service_type', 'full_name', 'status'],
                    required: false
                }
            ],
            order: [['start_time', 'DESC']]
        });

        return res.status(200).json({ showtimes });
    } catch (error) {
        console.error("lỗi từ getAllShowtimes", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Create new showtime
export const createShowtime = async (req, res) => {
    try {
        const { movie_id, room_id, start_time, end_time, base_price, showtime_type } = req.body;

        // Validate required fields
        if (!movie_id || !room_id || !start_time || !end_time) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // Check if movie exists
        const movie = await Movie.findByPk(movie_id);
        if (!movie) {
            return res.status(404).json({ message: "Không tìm thấy phim" });
        }

        // Check if room exists
        const room = await CinemaRoom.findByPk(room_id, {
            include: [{ model: Theater, as: 'Theater' }]
        });
        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
        }

        // Check manager access to theater
        const theaterIds = await getManagerTheaterIds(req.user);
        if (theaterIds && !theaterIds.includes(room.theater_id)) {
            return res.status(403).json({ message: "Bạn không có quyền tạo suất chiếu cho rạp này" });
        }

        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        const MIN_GAP_MINUTES = 15;

        // Get start and end of the day for filtering
        const dayStart = new Date(startDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Check for overlapping showtimes in the same room on the same day
        const overlapping = await Showtime.findOne({
            where: {
                room_id,
                status: 'Scheduled',
                [Op.and]: [
                    { start_time: { [Op.between]: [dayStart, dayEnd] } },
                    {
                        [Op.or]: [
                            // New showtime starts during existing
                            {
                                [Op.and]: [
                                    { start_time: { [Op.lte]: startDate } },
                                    { end_time: { [Op.gt]: startDate } }
                                ]
                            },
                            // New showtime ends during existing
                            {
                                [Op.and]: [
                                    { start_time: { [Op.lt]: endDate } },
                                    { end_time: { [Op.gte]: endDate } }
                                ]
                            },
                            // New showtime contains existing
                            {
                                [Op.and]: [
                                    { start_time: { [Op.gte]: startDate } },
                                    { end_time: { [Op.lte]: endDate } }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({ 
                message: "Phòng đã có suất chiếu trong khung giờ này. Vui lòng chọn thời gian khác." 
            });
        }

        // Check 15-minute gap requirement - only for same day
        // Find showtimes that end within 15 minutes before this start time
        const tooCloseAfterPrevious = await Showtime.findOne({
            where: {
                room_id,
                status: 'Scheduled',
                [Op.and]: [
                    { start_time: { [Op.between]: [dayStart, dayEnd] } },
                    { end_time: { [Op.gt]: new Date(startDate.getTime() - MIN_GAP_MINUTES * 60000) } },
                    { end_time: { [Op.lte]: startDate } }
                ]
            }
        });

        if (tooCloseAfterPrevious) {
            return res.status(400).json({ 
                message: `Suất chiếu phải cách suất chiếu trước ít nhất ${MIN_GAP_MINUTES} phút` 
            });
        }

        // Find showtimes that start within 15 minutes after this ends
        const tooCloseBeforeNext = await Showtime.findOne({
            where: {
                room_id,
                status: 'Scheduled',
                [Op.and]: [
                    { start_time: { [Op.between]: [dayStart, dayEnd] } },
                    { start_time: { [Op.gte]: endDate } },
                    { start_time: { [Op.lt]: new Date(endDate.getTime() + MIN_GAP_MINUTES * 60000) } }
                ]
            }
        });

        if (tooCloseBeforeNext) {
            return res.status(400).json({ 
                message: `Suất chiếu phải cách suất chiếu sau ít nhất ${MIN_GAP_MINUTES} phút` 
            });
        }

        const showtime = await Showtime.create({
            movie_id,
            room_id,
            start_time: startDate,
            end_time: endDate,
            base_price: base_price || 75000,
            showtime_type: showtime_type || '2D Phụ đề Việt',
            status: 'Scheduled'
        });

        // Reload with associations for socket emit
        const showtimeWithDetails = await Showtime.findByPk(showtime.id, {
            include: [
                { model: Movie, attributes: ['id', 'title', 'poster_url', 'duration_min'] },
                { model: CinemaRoom, attributes: ['id', 'name', 'theater_id'] }
            ]
        });

        // Emit socket event for realtime update
        emitToAll(SOCKET_EVENTS.SHOWTIME_CREATED, {
            showtime: showtimeWithDetails,
            movieId: movie_id,
            roomId: room_id,
            theaterId: room.theater_id
        });
        console.log(`📤 Emitted SHOWTIME_CREATED: movie ${movie_id}, room ${room_id}`);

        return res.status(201).json({ 
            message: "Đã tạo suất chiếu", 
            showtime: showtimeWithDetails 
        });
    } catch (error) {
        console.error("lỗi từ createShowtime", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Update showtime - Chỉ được sửa: start_time, showtime_type, base_price
export const updateShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time, base_price, showtime_type } = req.body;

        const showtime = await Showtime.findByPk(id, {
            include: [{ model: CinemaRoom, attributes: ['id', 'theater_id'] }]
        });
        if (!showtime) {
            return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
        }

        // Check manager access to theater
        const theaterIds = await getManagerTheaterIds(req.user);
        if (theaterIds && !theaterIds.includes(showtime.CinemaRoom.theater_id)) {
            return res.status(403).json({ message: "Bạn không có quyền sửa suất chiếu này" });
        }

        // Check if there are tickets for this showtime - cannot edit if tickets exist
        const ticketCount = await Ticket.count({ where: { showtime_id: id } });
        if (ticketCount > 0) {
            return res.status(400).json({ 
                message: `Không thể chỉnh sửa suất chiếu vì đã có ${ticketCount} vé được đặt` 
            });
        }

        const MIN_GAP_MINUTES = 15;

        // Check for overlapping if time changed
        if (start_time || end_time) {
            const startDate = new Date(start_time || showtime.start_time);
            const endDate = new Date(end_time || showtime.end_time);

            // Get start and end of the day for filtering
            const dayStart = new Date(startDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(startDate);
            dayEnd.setHours(23, 59, 59, 999);

            // Check overlapping - only same room and same day
            const overlapping = await Showtime.findOne({
                where: {
                    id: { [Op.ne]: id },
                    room_id: showtime.room_id,
                    status: 'Scheduled',
                    [Op.and]: [
                        { start_time: { [Op.between]: [dayStart, dayEnd] } },
                        {
                            [Op.or]: [
                                // New showtime starts during existing
                                {
                                    [Op.and]: [
                                        { start_time: { [Op.lte]: startDate } },
                                        { end_time: { [Op.gt]: startDate } }
                                    ]
                                },
                                // New showtime ends during existing
                                {
                                    [Op.and]: [
                                        { start_time: { [Op.lt]: endDate } },
                                        { end_time: { [Op.gte]: endDate } }
                                    ]
                                },
                                // New showtime contains existing
                                {
                                    [Op.and]: [
                                        { start_time: { [Op.gte]: startDate } },
                                        { end_time: { [Op.lte]: endDate } }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            });

            if (overlapping) {
                return res.status(400).json({ 
                    message: "Phòng đã có suất chiếu trong khung giờ này" 
                });
            }

            // Check 15-minute gap with previous showtime - same day only
            const tooCloseAfterPrevious = await Showtime.findOne({
                where: {
                    id: { [Op.ne]: id },
                    room_id: showtime.room_id,
                    status: 'Scheduled',
                    [Op.and]: [
                        { start_time: { [Op.between]: [dayStart, dayEnd] } },
                        { end_time: { [Op.gt]: new Date(startDate.getTime() - MIN_GAP_MINUTES * 60000) } },
                        { end_time: { [Op.lte]: startDate } }
                    ]
                }
            });

            if (tooCloseAfterPrevious) {
                return res.status(400).json({ 
                    message: `Suất chiếu phải cách suất chiếu trước ít nhất ${MIN_GAP_MINUTES} phút` 
                });
            }

            // Check 15-minute gap with next showtime - same day only
            const tooCloseBeforeNext = await Showtime.findOne({
                where: {
                    id: { [Op.ne]: id },
                    room_id: showtime.room_id,
                    status: 'Scheduled',
                    [Op.and]: [
                        { start_time: { [Op.between]: [dayStart, dayEnd] } },
                        { start_time: { [Op.gte]: endDate } },
                        { start_time: { [Op.lt]: new Date(endDate.getTime() + MIN_GAP_MINUTES * 60000) } }
                    ]
                }
            });

            if (tooCloseBeforeNext) {
                return res.status(400).json({ 
                    message: `Suất chiếu phải cách suất chiếu sau ít nhất ${MIN_GAP_MINUTES} phút` 
                });
            }

            // Update time
            showtime.start_time = startDate;
            showtime.end_time = endDate;
        }

        // Update allowed fields only
        if (base_price !== undefined) {
            showtime.base_price = base_price;
        }
        if (showtime_type) {
            showtime.showtime_type = showtime_type;
        }

        await showtime.save();

        // Reload with associations for socket emit
        const showtimeWithDetails = await Showtime.findByPk(showtime.id, {
            include: [
                { model: Movie, attributes: ['id', 'title', 'poster_url', 'duration_min'] },
                { model: CinemaRoom, attributes: ['id', 'name', 'theater_id'] }
            ]
        });

        // Emit socket event for realtime update
        emitToAll(SOCKET_EVENTS.SHOWTIME_UPDATED, {
            showtime: showtimeWithDetails,
            movieId: showtime.movie_id,
            roomId: showtime.room_id,
            theaterId: showtimeWithDetails.CinemaRoom?.theater_id
        });
        console.log(`📤 Emitted SHOWTIME_UPDATED: id ${showtime.id}`);

        return res.status(200).json({ 
            message: "Đã cập nhật suất chiếu", 
            showtime: showtimeWithDetails 
        });
    } catch (error) {
        console.error("lỗi từ updateShowtime", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Delete showtime
export const deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;

        const showtime = await Showtime.findByPk(id, {
            include: [{ model: CinemaRoom, attributes: ['id', 'theater_id'] }]
        });
        if (!showtime) {
            return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
        }

        // Check manager access to theater
        const theaterIds = await getManagerTheaterIds(req.user);
        if (theaterIds && !theaterIds.includes(showtime.CinemaRoom.theater_id)) {
            return res.status(403).json({ message: "Bạn không có quyền xóa suất chiếu này" });
        }

        // Check if there are tickets for this showtime
        const ticketCount = await Ticket.count({ where: { showtime_id: id } });
        if (ticketCount > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa suất chiếu vì có ${ticketCount} vé đã được đặt` 
            });
        }

        // Store info before deleting
        const showtimeInfo = {
            id: showtime.id,
            movieId: showtime.movie_id,
            roomId: showtime.room_id
        };

        const theaterId = showtime.CinemaRoom.theater_id;

        await showtime.destroy();

        // Emit socket event for realtime update
        emitToAll(SOCKET_EVENTS.SHOWTIME_DELETED, {
            showtimeId: showtimeInfo.id,
            movieId: showtimeInfo.movieId,
            roomId: showtimeInfo.roomId,
            theaterId: theaterId
        });
        console.log(`📤 Emitted SHOWTIME_DELETED: id ${showtimeInfo.id}`);

        return res.status(200).json({ message: "Đã xóa suất chiếu" });
    } catch (error) {
        console.error("lỗi từ deleteShowtime", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};