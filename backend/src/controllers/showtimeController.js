import { showtimeService } from "../services/showtimeService.js";
import SeatTypePrice from "../models/SeatTypePrice.js";

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