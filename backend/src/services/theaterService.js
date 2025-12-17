
import { Theater } from "../models/Theater.js";
import { CinemaRoom } from "../models/CinemaRoom.js";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import { Op } from 'sequelize';

export const theaterService = {
    async getTheaterList() {
        return Theater.findAll({
            attributes: ['id', 'name', 'city', 'address', 'phone', 'email', 'image_url'],
            where: { is_active: true },
            order: [['city', 'ASC'], ['name', 'ASC']]
        });
    },

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
    }

};
