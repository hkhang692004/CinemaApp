import { SeatReservation } from "../models/SeatReservation.js";
import { Seat } from "../models/Seat.js";
import { Showtime } from "../models/Showtime.js";
import { Op } from "sequelize";

const RESERVATION_DURATION_MINUTES = 10;

export const reservationService = {
    // Tạo reservations (giữ ghế)
    async createReservations(showtimeId, seatIds, userId) {
        // Validate showtime exists
        const showtime = await Showtime.findByPk(showtimeId);
        if (!showtime) {
            throw new Error("Suất chiếu không tồn tại");
        }

        // Validate seats exist
        const seats = await Seat.findAll({
            where: { id: { [Op.in]: seatIds } }
        });
        if (seats.length !== seatIds.length) {
            throw new Error("Một số ghế không tồn tại");
        }

        // Check if seats already reserved/booked
        const existingReservations = await SeatReservation.findAll({
            where: {
                showtime_id: showtimeId,
                seat_id: { [Op.in]: seatIds },
                status: { [Op.in]: ['Held', 'Confirmed'] },
                expires_at: { [Op.gt]: new Date() } // Chưa hết hạn
            }
        });

        if (existingReservations.length > 0) {
            // Kiểm tra xem ghế có phải của chính user này không
            const ownReservations = existingReservations.filter(r => r.user_id === userId);
            const otherReservations = existingReservations.filter(r => r.user_id !== userId);
            
            // Nếu có ghế bị đặt bởi người khác -> lỗi
            if (otherReservations.length > 0) {
                const bookedSeatIds = otherReservations.map(r => r.seat_id);
                throw new Error(`Ghế đã được đặt bởi người khác: ${bookedSeatIds.join(', ')}`);
            }
            
            // Nếu ghế đã được đặt bởi chính user này -> extend thời gian
            const ownSeatIds = ownReservations.map(r => r.seat_id);
            const newSeatIds = seatIds.filter(id => !ownSeatIds.includes(id));
            
            const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000);
            
            // Extend thời gian cho ghế cũ
            if (ownSeatIds.length > 0) {
                await SeatReservation.update(
                    { expires_at: expiresAt, status: 'Held' },
                    {
                        where: {
                            showtime_id: showtimeId,
                            seat_id: { [Op.in]: ownSeatIds },
                            user_id: userId
                        }
                    }
                );
                console.log(`🔄 Extended ${ownSeatIds.length} existing reservations for user ${userId}`);
            }
            
            // Tạo mới cho ghế chưa có
            const newReservations = await Promise.all(
                newSeatIds.map(seatId =>
                    SeatReservation.create({
                        showtime_id: showtimeId,
                        seat_id: seatId,
                        user_id: userId,
                        expires_at: expiresAt,
                        status: 'Held'
                    })
                )
            );
            
            console.log(`✅ Created ${newReservations.length} new reservations for user ${userId}`);
            return { reservations: [...ownReservations, ...newReservations], expiresAt };
        }

        // Create reservations
        const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000);
        const reservations = await Promise.all(
            seatIds.map(seatId =>
                SeatReservation.create({
                    showtime_id: showtimeId,
                    seat_id: seatId,
                    user_id: userId,
                    expires_at: expiresAt,
                    status: 'Held'
                })
            )
        );

        return { reservations, expiresAt };
    },

    // Release reservations (hủy giữ ghế - XÓA LUÔN)
    async releaseReservations(showtimeId, seatIds, userId) {
        const deleted = await SeatReservation.destroy({
            where: {
                showtime_id: showtimeId,
                seat_id: { [Op.in]: seatIds },
                user_id: userId,
                status: 'Held'
            }
        });

        console.log(`🗑️ Deleted ${deleted} reservation(s) for user ${userId}`);
        return deleted;
    },

    // Confirm reservations (sau khi thanh toán)
    async confirmReservations(showtimeId, seatIds, userId) {
        const updated = await SeatReservation.update(
            { status: 'Confirmed' },
            {
                where: {
                    showtime_id: showtimeId,
                    seat_id: { [Op.in]: seatIds },
                    user_id: userId,
                    status: 'Held',
                    expires_at: { [Op.gt]: new Date() }
                }
            }
        );

        if (updated[0] === 0) {
            throw new Error("Không tìm thấy reservation hoặc đã hết hạn");
        }

        return updated[0];
    },

    // Auto-expire reservations (cron job) - XÓA LUÔN thay vì update status
    async expireOldReservations() {
        const deleted = await SeatReservation.destroy({
            where: {
                status: 'Held',
                expires_at: { [Op.lt]: new Date() }
            }
        });

        return deleted;
    }
};
