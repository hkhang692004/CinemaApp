import { showtimeService } from "../services/showtimeService.js";

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

        const seatsWithStatus = seats.map(seat => ({
            id: seat.id,
            roomId: seat.room_id,
            rowLabel: seat.row_label,
            seatNumber: seat.seat_number,
            seatType: seat.seat_type,
            isActive: seat.is_active,
            reserved: reservedSeatIds.includes(seat.id)
        }));

        return res.status(200).json({
            seats: seatsWithStatus,
            room: {
                id: showtime.CinemaRoom.id,
                name: showtime.CinemaRoom.name,
                seatCount: showtime.CinemaRoom.seat_count,
                screenType: showtime.CinemaRoom.screen_type
            }
        });
    } catch (error) {
        console.error("lỗi từ getSeatsByShowtime", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });   
    }
};