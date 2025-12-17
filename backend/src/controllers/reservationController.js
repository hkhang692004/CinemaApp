import { reservationService } from "../services/reservationService.js";

// Tạo reservation (giữ ghế tạm thời)
export const createReservation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { showtimeId, seatIds } = req.body;

        if (!showtimeId || !seatIds || seatIds.length === 0) {
            return res.status(400).json({ message: "Thiếu thông tin suất chiếu hoặc ghế" });
        }

        const result = await reservationService.createReservations(showtimeId, seatIds, userId);
        
        // Tính số giây còn lại từ thời điểm hiện tại
        const now = new Date();
        const durationSeconds = Math.floor((result.expiresAt.getTime() - now.getTime()) / 1000);
        
        return res.status(201).json({
            message: "Giữ ghế thành công",
            reservations: result.reservations,
            expiresAt: result.expiresAt,
            durationSeconds: durationSeconds
        });
    } catch (error) {
        console.error("Lỗi createReservation:", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Release reservation (hủy giữ ghế)
export const releaseReservation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { showtimeId, seatIds } = req.body;

        if (!showtimeId || !seatIds || seatIds.length === 0) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        await reservationService.releaseReservations(showtimeId, seatIds, userId);
        
        return res.status(200).json({ message: "Hủy giữ ghế thành công" });
    } catch (error) {
        console.error("Lỗi releaseReservation:", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Confirm reservation (sau khi thanh toán)
export const confirmReservation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { showtimeId, seatIds } = req.body;

        if (!showtimeId || !seatIds || seatIds.length === 0) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        await reservationService.confirmReservations(showtimeId, seatIds, userId);
        
        return res.status(200).json({ message: "Xác nhận đặt ghế thành công" });
    } catch (error) {
        console.error("Lỗi confirmReservation:", error);
        return res.status(500).json({ message: error.message || "Lỗi hệ thống" });
    }
};
