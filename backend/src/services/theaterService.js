
import { Theater } from "../models/Theater.js";
import { CinemaRoom } from "../models/CinemaRoom.js";
import { Seat } from "../models/Seat.js";
import SeatTypePrice from "../models/SeatTypePrice.js";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import Ticket from "../models/Ticket.js";
import { Op } from 'sequelize';

export const theaterService = {
    // ==================== THEATER CRUD ====================
    async getTheaterList(activeOnly = false) {
        const whereClause = activeOnly ? { is_active: true } : {};
        return Theater.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'city', 'address', 'phone', 'email', 'image_url', 'is_active'],
            order: [['city', 'ASC'], ['name', 'ASC']]
        });
    },

    async getTheaterById(id) {
        return Theater.findByPk(id, {
            include: [{
                model: CinemaRoom,
                as: 'CinemaRooms',
                attributes: ['id', 'name', 'seat_count', 'screen_type', 'is_active']
            }]
        });
    },

    async createTheater(data) {
        const errors = [];
        if (!data.name || data.name.trim() === '') errors.push('Tên rạp');
        if (!data.city || data.city.trim() === '') errors.push('Thành phố');
        if (!data.address || data.address.trim() === '') errors.push('Địa chỉ');
        
        if (errors.length > 0) {
            throw new Error(`Vui lòng nhập: ${errors.join(', ')}`);
        }

        return Theater.create({
            name: data.name.trim(),
            address: data.address.trim(),
            city: data.city.trim(),
            phone: data.phone || null,
            email: data.email || null,
            image_url: data.image_url || null,
            is_active: data.is_active !== undefined ? data.is_active : true,
            created_at: new Date()
        });
    },

    async updateTheater(id, data) {
        const theater = await Theater.findByPk(id);
        if (!theater) throw new Error('Không tìm thấy rạp');

        return theater.update({
            name: data.name?.trim() || theater.name,
            address: data.address?.trim() || theater.address,
            city: data.city?.trim() || theater.city,
            phone: data.phone !== undefined ? data.phone : theater.phone,
            email: data.email !== undefined ? data.email : theater.email,
            image_url: data.image_url !== undefined ? data.image_url : theater.image_url,
            is_active: data.is_active !== undefined ? data.is_active : theater.is_active
        });
    },

    async deleteTheater(id) {
        const theater = await Theater.findByPk(id);
        if (!theater) throw new Error('Không tìm thấy rạp');

        // Kiểm tra có phòng chiếu không
        const roomCount = await CinemaRoom.count({ where: { theater_id: id } });
        if (roomCount > 0) {
            throw new Error(`Không thể xóa rạp vì còn ${roomCount} phòng chiếu`);
        }

        await theater.destroy();
        return true;
    },

    // ==================== CINEMA ROOM CRUD ====================
    async getRoomsByTheater(theaterId) {
        return CinemaRoom.findAll({
            where: { theater_id: theaterId },
            attributes: ['id', 'theater_id', 'name', 'seat_count', 'screen_type', 'is_active'],
            order: [['name', 'ASC']]
        });
    },

    async getRoomById(id) {
        return CinemaRoom.findByPk(id, {
            include: [
                { model: Theater, as: 'Theater', attributes: ['id', 'name'] },
                { model: Seat, as: 'Seats', attributes: ['id', 'row_label', 'seat_number', 'seat_type', 'is_active'] }
            ]
        });
    },

    async createRoom(data) {
        const errors = [];
        if (!data.theater_id) errors.push('ID rạp');
        if (!data.name || data.name.trim() === '') errors.push('Tên phòng');
        
        if (errors.length > 0) {
            throw new Error(`Vui lòng nhập: ${errors.join(', ')}`);
        }

        // Kiểm tra theater tồn tại
        const theater = await Theater.findByPk(data.theater_id);
        if (!theater) throw new Error('Không tìm thấy rạp');

        return CinemaRoom.create({
            theater_id: data.theater_id,
            name: data.name.trim(),
            seat_count: data.seat_count || 0,
            screen_type: data.screen_type || 'Standard',
            is_active: data.is_active !== undefined ? data.is_active : true
        });
    },

    async updateRoom(id, data) {
        const room = await CinemaRoom.findByPk(id);
        if (!room) throw new Error('Không tìm thấy phòng chiếu');

        return room.update({
            name: data.name?.trim() || room.name,
            seat_count: data.seat_count !== undefined ? data.seat_count : room.seat_count,
            screen_type: data.screen_type || room.screen_type,
            is_active: data.is_active !== undefined ? data.is_active : room.is_active
        });
    },

    async deleteRoom(id) {
        const room = await CinemaRoom.findByPk(id);
        if (!room) throw new Error('Không tìm thấy phòng chiếu');

        // Kiểm tra có suất chiếu không
        const showtimeCount = await Showtime.count({ where: { room_id: id } });
        if (showtimeCount > 0) {
            throw new Error(`Không thể xóa phòng vì còn ${showtimeCount} suất chiếu. Vui lòng xóa suất chiếu trước.`);
        }

        // Kiểm tra có vé đã đặt cho ghế trong phòng không
        const seats = await Seat.findAll({ where: { room_id: id }, attributes: ['id'] });
        const seatIds = seats.map(s => s.id);
        
        if (seatIds.length > 0) {
            const ticketCount = await Ticket.count({ where: { seat_id: seatIds } });
            if (ticketCount > 0) {
                throw new Error(`Không thể xóa phòng vì có ${ticketCount} vé đã được đặt cho ghế trong phòng này. Dữ liệu lịch sử sẽ bị mất.`);
            }
        }

        // Xóa ghế trước
        await Seat.destroy({ where: { room_id: id } });
        await room.destroy();
        return true;
    },

    // ==================== SEAT CRUD ====================
    async getSeatsByRoom(roomId) {
        return Seat.findAll({
            where: { room_id: roomId },
            attributes: ['id', 'room_id', 'row_label', 'seat_number', 'seat_type', 'is_active'],
            order: [['row_label', 'ASC'], ['seat_number', 'ASC']]
        });
    },

    async createSeat(data) {
        const errors = [];
        if (!data.room_id) errors.push('ID phòng');
        if (!data.row_label || data.row_label.trim() === '') errors.push('Hàng ghế');
        if (!data.seat_number || data.seat_number.trim() === '') errors.push('Số ghế');
        
        if (errors.length > 0) {
            throw new Error(`Vui lòng nhập: ${errors.join(', ')}`);
        }

        // Kiểm tra room tồn tại
        const room = await CinemaRoom.findByPk(data.room_id);
        if (!room) throw new Error('Không tìm thấy phòng chiếu');

        // Kiểm tra ghế đã tồn tại
        const existingSeat = await Seat.findOne({
            where: {
                room_id: data.room_id,
                row_label: data.row_label.trim(),
                seat_number: data.seat_number.trim()
            }
        });
        if (existingSeat) {
            throw new Error(`Ghế ${data.row_label}${data.seat_number} đã tồn tại`);
        }

        const seat = await Seat.create({
            room_id: data.room_id,
            row_label: data.row_label.trim(),
            seat_number: data.seat_number.trim(),
            seat_type: data.seat_type || 'Standard',
            is_active: data.is_active !== undefined ? data.is_active : true
        });

        // Cập nhật seat_count của room
        const seatCount = await Seat.count({ where: { room_id: data.room_id } });
        await room.update({ seat_count: seatCount });

        return seat;
    },

    async createSeatsForRoom(roomId, rows, seatsPerRow, seatType = 'Standard') {
        const room = await CinemaRoom.findByPk(roomId);
        if (!room) throw new Error('Không tìm thấy phòng chiếu');

        // Kiểm tra có vé đã đặt cho ghế trong phòng không
        const existingSeats = await Seat.findAll({ where: { room_id: roomId }, attributes: ['id'] });
        const seatIds = existingSeats.map(s => s.id);
        
        if (seatIds.length > 0) {
            const ticketCount = await Ticket.count({ where: { seat_id: seatIds } });
            if (ticketCount > 0) {
                throw new Error(`Không thể tạo lại ghế vì có ${ticketCount} vé đã được đặt. Vui lòng xử lý các vé trước.`);
            }
        }

        const seats = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, rows);
        
        for (const rowLabel of rowLabels) {
            for (let i = 1; i <= seatsPerRow; i++) {
                seats.push({
                    room_id: roomId,
                    row_label: rowLabel,
                    seat_number: i.toString(),
                    seat_type: seatType,
                    is_active: true
                });
            }
        }

        // Xóa ghế cũ và tạo ghế mới
        await Seat.destroy({ where: { room_id: roomId } });
        await Seat.bulkCreate(seats);

        // Cập nhật seat_count
        await room.update({ seat_count: seats.length });

        return seats;
    },

    // Tạo ghế custom với sơ đồ tùy chỉnh từng ghế
    async createSeatsCustom(roomId, seatsData) {
        const room = await CinemaRoom.findByPk(roomId);
        if (!room) throw new Error('Không tìm thấy phòng chiếu');

        // Kiểm tra có vé đã đặt cho ghế trong phòng không
        const existingSeats = await Seat.findAll({ where: { room_id: roomId }, attributes: ['id'] });
        const seatIds = existingSeats.map(s => s.id);
        
        if (seatIds.length > 0) {
            const ticketCount = await Ticket.count({ where: { seat_id: seatIds } });
            if (ticketCount > 0) {
                throw new Error(`Không thể tạo lại ghế vì có ${ticketCount} vé đã được đặt. Vui lòng xử lý các vé trước.`);
            }
        }

        const seats = seatsData.map(seat => ({
            room_id: roomId,
            row_label: seat.row_label,
            seat_number: seat.seat_number,
            seat_type: seat.seat_type || 'Standard',
            is_active: seat.is_active !== undefined ? seat.is_active : true
        }));

        // Xóa ghế cũ và tạo ghế mới
        await Seat.destroy({ where: { room_id: roomId } });
        await Seat.bulkCreate(seats);

        // Cập nhật seat_count
        await room.update({ seat_count: seats.length });

        return seats;
    },

    async updateSeat(id, data) {
        const seat = await Seat.findByPk(id);
        if (!seat) throw new Error('Không tìm thấy ghế');

        return seat.update({
            row_label: data.row_label?.trim() || seat.row_label,
            seat_number: data.seat_number?.trim() || seat.seat_number,
            seat_type: data.seat_type || seat.seat_type,
            is_active: data.is_active !== undefined ? data.is_active : seat.is_active
        });
    },

    async deleteSeat(id) {
        const seat = await Seat.findByPk(id);
        if (!seat) throw new Error('Không tìm thấy ghế');

        const roomId = seat.room_id;
        await seat.destroy();

        // Cập nhật seat_count
        const room = await CinemaRoom.findByPk(roomId);
        if (room) {
            const seatCount = await Seat.count({ where: { room_id: roomId } });
            await room.update({ seat_count: seatCount });
        }

        return true;
    },

    async updateMultipleSeats(seatIds, data) {
        await Seat.update(data, { where: { id: { [Op.in]: seatIds } } });
        return true;
    },

    // ==================== EXISTING METHODS ====================

    // Lấy danh sách phim đang chiếu tại 1 rạp
    async getMoviesByTheater(theaterId, days = 7) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + days);

        // Lấy cinema rooms của theater
        const rooms = await CinemaRoom.findAll({
            where: { theater_id: theaterId, is_active: true },
            attributes: ['id']
        });

        const roomIds = rooms.map(r => r.id);
        if (roomIds.length === 0) return [];

        // Lấy showtimes với movies
        const showtimes = await Showtime.findAll({
            where: {
                room_id: { [Op.in]: roomIds },
                status: 'Scheduled',
                start_time: { [Op.between]: [now, endDate] }
            },
            include: [{
                model: Movie,
                where: { status: 'now_showing' },
                attributes: ['id', 'title', 'poster_url', 'backdrop_url', 'duration_min', 'age_rating', 'release_date']
            }],
            order: [['start_time', 'ASC']]
        });

        // Group by movie, loại bỏ trùng lặp
        const movieMap = new Map();
        for (const showtime of showtimes) {
            if (showtime.Movie && !movieMap.has(showtime.Movie.id)) {
                movieMap.set(showtime.Movie.id, {
                    ...showtime.Movie.toJSON(),
                    showtime_count: 1
                });
            } else if (showtime.Movie) {
                movieMap.get(showtime.Movie.id).showtime_count++;
            }
        }

        return Array.from(movieMap.values());
    },

    // Lấy showtimes của 1 phim tại 1 rạp cụ thể
    async getShowtimesByMovieAndTheater(theaterId, movieId, days = 7) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + days);

        console.log('[getShowtimesByMovieAndTheater] theaterId:', theaterId, 'movieId:', movieId);
        console.log('[getShowtimesByMovieAndTheater] now:', now, 'endDate:', endDate);

        const rooms = await CinemaRoom.findAll({
            where: { theater_id: theaterId, is_active: true },
            attributes: ['id', 'theater_id', 'name', 'screen_type', 'seat_count'],
            include: [{
                model: Showtime,
                as: 'Showtimes',
                where: {
                    movie_id: movieId,
                    status: 'Scheduled',
                    start_time: { [Op.between]: [now, endDate] }
                },
                required: false,
                attributes: ['id', 'movie_id', 'room_id', 'start_time', 'end_time', 'base_price', 'status']
            }],
            order: [['name', 'ASC']]
        });

        console.log('[getShowtimesByMovieAndTheater] Found', rooms.length, 'rooms');
        rooms.forEach(r => {
            console.log('[getShowtimesByMovieAndTheater] Room:', r.name, 'Showtimes:', r.Showtimes?.length || 0);
            (r.Showtimes || []).forEach(s => console.log('  - id:', s.id, 'start_time:', s.start_time));
        });

        // Chỉ trả về rooms có showtimes
        const result = rooms.filter(room => room.Showtimes && room.Showtimes.length > 0);
        console.log('[getShowtimesByMovieAndTheater] Returning', result.length, 'rooms with showtimes');
        return result;
    },

    async getShowtimeByMovieAndTheater(movieId, theaterId) {
        return CinemaRoom.findAll({
            where: {
                theater_id: theaterId,
                is_active: true
            },
            include: [{
                model: Showtime,
                as: "Showtimes",
                where: {
                    movie_id: movieId,
                    status: "Scheduled"
                },
                required: false,
                order: [['start_time', 'ASC']], //sapxep showtime
            }],
            order: [['name', 'ASC']] // sapxep cinemaroom
        });
    },

    // theaterService.js



    // ... existing methods

    async getAllShowtimesByMovie(movieId, days = 7) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + days);

        return Theater.findAll({
            where: { is_active: true },
            attributes: ['id', 'name', 'city', 'address', 'phone', 'email'],
            include: [{
                model: CinemaRoom,
                as: 'CinemaRooms',
                where: { is_active: true },
                required: false, 
                include: [{
                    model: Showtime,
                    as: 'Showtimes',
                    where: {
                        movie_id: movieId,
                        status: 'Scheduled',
                        start_time: {
                            [Op.between]: [now, endDate]
                        }
                    },
                    required: false, 
                    order: [['start_time', 'ASC']]
                }],
                order: [['name', 'ASC']]
            }],
            order: [['city', 'ASC'], ['name', 'ASC']]
        });
    },

    // ==================== SEAT TYPE PRICES ====================
    async getSeatTypePrices() {
        return SeatTypePrice.findAll({
            order: [['seat_type', 'ASC']]
        });
    },

    async updateSeatTypePrice(seatType, data) {
        const price = await SeatTypePrice.findByPk(seatType);
        if (!price) {
            throw new Error('Không tìm thấy loại ghế');
        }

        await price.update({
            price_multiplier: data.price_multiplier !== undefined ? data.price_multiplier : price.price_multiplier,
            extra_fee: data.extra_fee !== undefined ? data.extra_fee : price.extra_fee,
            description: data.description !== undefined ? data.description : price.description
        });

        return price;
    }

};
