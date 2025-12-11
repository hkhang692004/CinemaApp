
import { Theater } from "../models/Theater.js";
import { CinemaRoom } from "../models/CinemaRoom.js";
import Showtime from "../models/Showtime.js";
import { Op } from 'sequelize';

export const theaterService = {
    async getTheaterList() {
        return Theater.findAll({
            attributes: ['id', 'name', 'city', 'address', 'phone', 'email'],
            where: { is_active: true },
            order: [['city', 'ASC'], ['name', 'ASC']]
        });
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
                required: false, // Vẫn hiển thị rạp dù không có phòng
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
                    required: false, // Vẫn hiển thị phòng dù không có suất chiếu
                    order: [['start_time', 'ASC']]
                }],
                order: [['name', 'ASC']]
            }],
            order: [['city', 'ASC'], ['name', 'ASC']]
        });
    }

};
