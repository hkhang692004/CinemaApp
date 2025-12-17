import { CinemaRoom } from "../models/CinemaRoom.js";
import { Seat } from "../models/Seat.js";
import SeatReservation from "../models/SeatReservation.js";
import { Showtime } from "../models/Showtime.js";

export const showtimeService = {

    async getShowTime(showtimeId){
        return Showtime.findByPk(showtimeId,{
            include:[{model:CinemaRoom}]
        });
    },


    async getSeat(showtime){
        return Seat.findAll({
            where:{
                room_id:showtime.room_id,
                is_active:true
            },
            order: [['row_label','ASC'],['seat_number','ASC']]
        });
    },

    async getReservedSeats(showtimeId){
        // Chỉ lấy ghế còn reservation (Held hoặc Confirmed)
        // Released đã bị xóa nên không cần filter
        return SeatReservation.findAll({
                where:{
                    showtime_id: showtimeId
                },
                attributes:['seat_id']
        });
    },
};