import { theaterService } from "../services/theaterService.js";
import { uploadTheaterImage } from "../libs/cloudinary.js";
import { emitToClients, SOCKET_EVENTS } from "../socket.js";

// ==================== THEATER CRUD ====================
export const getTheater = async(req,res) =>{
    try {
        // Nếu query param active=true, chỉ lấy rạp đang hoạt động (dùng cho mobile app)
        const activeOnly = req.query.active === 'true';
        const theaters = await theaterService.getTheaterList(activeOnly);
        return res.status(200).json({theaters});
    } catch (error) {
        console.error("lỗi từ getTheater", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getTheaterById = async(req, res) => {
    try {
        const { id } = req.params;
        const theater = await theaterService.getTheaterById(id);
        if (!theater) {
            return res.status(404).json({ message: "Không tìm thấy rạp" });
        }
        return res.status(200).json({ theater });
    } catch (error) {
        console.error("lỗi từ getTheaterById", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const createTheater = async(req, res) => {
    try {
        const theater = await theaterService.createTheater(req.body);
        return res.status(201).json({ message: "Đã tạo rạp thành công", theater });
    } catch (error) {
        console.error("lỗi từ createTheater", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const updateTheater = async(req, res) => {
    try {
        const { id } = req.params;
        const oldTheater = await theaterService.getTheaterById(id);
        const theater = await theaterService.updateTheater(id, req.body);
        
        // Emit socket event nếu trạng thái thay đổi
        if (oldTheater && oldTheater.is_active !== theater.is_active) {
            if (!theater.is_active) {
                // Rạp bị tạm đóng
                emitToClients(SOCKET_EVENTS.THEATER_CLOSED, { 
                    theaterId: theater.id,
                    theaterName: theater.name,
                    message: `Rạp ${theater.name} đã tạm đóng`
                });
            }
        }
        
        // Emit general update
        emitToClients(SOCKET_EVENTS.THEATER_UPDATED, { theater });
        
        return res.status(200).json({ message: "Đã cập nhật rạp", theater });
    } catch (error) {
        console.error("lỗi từ updateTheater", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const deleteTheater = async(req, res) => {
    try {
        const { id } = req.params;
        await theaterService.deleteTheater(id);
        return res.status(200).json({ message: "Đã xóa rạp" });
    } catch (error) {
        console.error("lỗi từ deleteTheater", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Upload theater image
export const uploadTheaterImageController = async(req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ message: "Vui lòng chọn ảnh" });
        }
        const result = await uploadTheaterImage(image);
        return res.status(200).json({ 
            message: "Upload thành công",
            url: result.url 
        });
    } catch (error) {
        console.error("lỗi từ uploadTheaterImage", error);
        return res.status(400).json({ message: error.message || "Lỗi upload ảnh" });
    }
};

// ==================== CINEMA ROOM CRUD ====================
export const getRoomsByTheater = async(req, res) => {
    try {
        const { theaterId } = req.params;
        const rooms = await theaterService.getRoomsByTheater(theaterId);
        return res.status(200).json({ rooms });
    } catch (error) {
        console.error("lỗi từ getRoomsByTheater", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getRoomById = async(req, res) => {
    try {
        const { id } = req.params;
        const room = await theaterService.getRoomById(id);
        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
        }
        return res.status(200).json({ room });
    } catch (error) {
        console.error("lỗi từ getRoomById", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const createRoom = async(req, res) => {
    try {
        const room = await theaterService.createRoom(req.body);
        return res.status(201).json({ message: "Đã tạo phòng chiếu", room });
    } catch (error) {
        console.error("lỗi từ createRoom", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const updateRoom = async(req, res) => {
    try {
        const { id } = req.params;
        const oldRoom = await theaterService.getRoomById(id);
        const room = await theaterService.updateRoom(id, req.body);
        
        // Emit socket event nếu trạng thái thay đổi (bảo trì)
        if (oldRoom && oldRoom.is_active !== room.is_active) {
            if (!room.is_active) {
                // Phòng chuyển sang bảo trì
                emitToClients(SOCKET_EVENTS.ROOM_CLOSED, { 
                    roomId: room.id,
                    theaterId: room.theater_id,
                    roomName: room.name,
                    message: `Phòng ${room.name} đang bảo trì`
                });
            }
        }
        
        // Emit general update
        emitToClients(SOCKET_EVENTS.ROOM_UPDATED, {
            room: {
                id: room.id,
                theater_id: room.theater_id,
                name: room.name,
                screen_type: room.screen_type,
                seat_count: room.seat_count,
                is_active: room.is_active
            }
        });
        
        return res.status(200).json({ message: "Đã cập nhật phòng chiếu", room });
    } catch (error) {
        console.error("lỗi từ updateRoom", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const deleteRoom = async(req, res) => {
    try {
        const { id } = req.params;
        await theaterService.deleteRoom(id);
        return res.status(200).json({ message: "Đã xóa phòng chiếu" });
    } catch (error) {
        console.error("lỗi từ deleteRoom", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// ==================== SEAT CRUD ====================
export const getSeatsByRoom = async(req, res) => {
    try {
        const { roomId } = req.params;
        const seats = await theaterService.getSeatsByRoom(roomId);
        return res.status(200).json({ seats });
    } catch (error) {
        console.error("lỗi từ getSeatsByRoom", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const createSeat = async(req, res) => {
    try {
        const seat = await theaterService.createSeat(req.body);
        return res.status(201).json({ message: "Đã tạo ghế", seat });
    } catch (error) {
        console.error("lỗi từ createSeat", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const createSeatsForRoom = async(req, res) => {
    try {
        const { roomId } = req.params;
        const { rows, seatsPerRow, seatType } = req.body;
        
        if (!rows || !seatsPerRow) {
            return res.status(400).json({ message: "Vui lòng nhập số hàng và số ghế mỗi hàng" });
        }

        const seats = await theaterService.createSeatsForRoom(roomId, rows, seatsPerRow, seatType);
        return res.status(201).json({ message: `Đã tạo ${seats.length} ghế`, seats });
    } catch (error) {
        console.error("lỗi từ createSeatsForRoom", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// Tạo ghế custom với sơ đồ tùy chỉnh
export const createSeatsCustom = async(req, res) => {
    try {
        const { roomId } = req.params;
        const { seats } = req.body;
        
        if (!seats || seats.length === 0) {
            return res.status(400).json({ message: "Vui lòng tạo sơ đồ ghế" });
        }

        const createdSeats = await theaterService.createSeatsCustom(roomId, seats);
        return res.status(201).json({ message: `Đã tạo ${createdSeats.length} ghế`, seats: createdSeats });
    } catch (error) {
        console.error("lỗi từ createSeatsCustom", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const updateSeat = async(req, res) => {
    try {
        const { id } = req.params;
        const seat = await theaterService.updateSeat(id, req.body);
        return res.status(200).json({ message: "Đã cập nhật ghế", seat });
    } catch (error) {
        console.error("lỗi từ updateSeat", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const deleteSeat = async(req, res) => {
    try {
        const { id } = req.params;
        await theaterService.deleteSeat(id);
        return res.status(200).json({ message: "Đã xóa ghế" });
    } catch (error) {
        console.error("lỗi từ deleteSeat", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

export const updateMultipleSeats = async(req, res) => {
    try {
        const { seatIds, data } = req.body;
        if (!seatIds || seatIds.length === 0) {
            return res.status(400).json({ message: "Vui lòng chọn ghế" });
        }
        await theaterService.updateMultipleSeats(seatIds, data);
        return res.status(200).json({ message: `Đã cập nhật ${seatIds.length} ghế` });
    } catch (error) {
        console.error("lỗi từ updateMultipleSeats", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};

// ==================== EXISTING METHODS ====================

// Lấy danh sách phim đang chiếu tại 1 rạp
export const getMoviesByTheater = async(req, res) => {
    try {
        const { theaterId } = req.params;
        const { days = 7 } = req.query;

        if (!theaterId) {
            return res.status(400).json({ message: "Thiếu tham số theaterId" });
        }

        const movies = await theaterService.getMoviesByTheater(theaterId, parseInt(days));
        return res.status(200).json({ movies });
    } catch (error) {
        console.error("lỗi từ getMoviesByTheater", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Lấy showtimes của 1 phim tại 1 rạp
export const getShowtimesByMovieAtTheater = async(req, res) => {
    try {
        const { theaterId, movieId } = req.params;
        const { days = 7 } = req.query;

        if (!theaterId || !movieId) {
            return res.status(400).json({ message: "Thiếu tham số theaterId hoặc movieId" });
        }

        const rooms = await theaterService.getShowtimesByMovieAndTheater(theaterId, movieId, parseInt(days));
        return res.status(200).json({ rooms });
    } catch (error) {
        console.error("lỗi từ getShowtimesByMovieAtTheater", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getShowtimeByMovieAndTheater = async(req,res) =>{
    try {
        const {movieId,theaterId} = req.params;
        if(!movieId || !theaterId){
            return res.status(400).json({message:"Thiếu tham số movieId hoặc theaterId"});
        }
        const rooms = await theaterService.getShowtimeByMovieAndTheater(movieId,theaterId);
        return res.status(200).json({rooms});
    } catch (error) {
        console.error("lỗi từ getShowtimeByMovieAndTheater", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// theaterController.js - API MỚI
export const getAllShowtimesByMovie = async(req, res) => {
    try {
        const { movieId } = req.params;
        const { days = 7 } = req.query; // Số ngày muốn lấy
        
        if (!movieId) {
            return res.status(400).json({ message: "Thiếu tham số movieId" });
        }

        // Lấy tất cả rạp có suất chiếu của phim này
        const theaters = await theaterService.getAllShowtimesByMovie(movieId, days);
        
        return res.status(200).json({ theaters });
    } catch (error) {
        console.error("lỗi từ getAllShowtimesByMovie", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ==================== SEAT TYPE PRICES ====================
export const getSeatTypePrices = async(req, res) => {
    try {
        const prices = await theaterService.getSeatTypePrices();
        return res.status(200).json({ prices });
    } catch (error) {
        console.error("lỗi từ getSeatTypePrices", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const updateSeatTypePrice = async(req, res) => {
    try {
        const { seatType } = req.params;
        const { price_multiplier, extra_fee, description } = req.body;
        
        const updated = await theaterService.updateSeatTypePrice(seatType, {
            price_multiplier,
            extra_fee,
            description
        });
        
        return res.status(200).json({ 
            message: "Đã cập nhật giá ghế", 
            price: updated 
        });
    } catch (error) {
        console.error("lỗi từ updateSeatTypePrice", error);
        return res.status(400).json({ message: error.message || "Lỗi hệ thống" });
    }
};