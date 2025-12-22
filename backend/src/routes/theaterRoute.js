import express from "express";
import { 
    // Theater CRUD
    getTheater,
    getTheaterById,
    createTheater,
    updateTheater,
    deleteTheater,
    uploadTheaterImageController,
    // Room CRUD
    getRoomsByTheater,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    // Seat CRUD
    getSeatsByRoom,
    createSeat,
    createSeatsForRoom,
    createSeatsCustom,
    updateSeat,
    deleteSeat,
    updateMultipleSeats,
    // Seat Type Prices
    getSeatTypePrices,
    updateSeatTypePrice,
    // Existing
    getAllShowtimesByMovie, 
    getShowtimeByMovieAndTheater, 
    getMoviesByTheater, 
    getShowtimesByMovieAtTheater 
} from "../controllers/theaterController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";


const router = express.Router();

// ==================== SEAT TYPE PRICES (Admin) ====================
// Must be defined BEFORE /:id to avoid route conflict
router.get("/seat-prices", getSeatTypePrices);
router.put("/seat-prices/:seatType", protectedRoute, updateSeatTypePrice);

// ==================== THEATER CRUD (Admin) ====================
router.get("/", getTheater);
router.get("/:id", getTheaterById);
router.post("/", protectedRoute, createTheater);
router.put("/:id", protectedRoute, updateTheater);
router.delete("/:id", protectedRoute, deleteTheater);
router.post("/upload/image", protectedRoute, uploadTheaterImageController);

// ==================== ROOM CRUD (Admin) ====================
router.get("/:theaterId/rooms", getRoomsByTheater);
router.get("/rooms/:id", getRoomById);
router.post("/rooms", protectedRoute, createRoom);
router.put("/rooms/:id", protectedRoute, updateRoom);
router.delete("/rooms/:id", protectedRoute, deleteRoom);

// ==================== SEAT CRUD (Admin) ====================
router.get("/rooms/:roomId/seats", getSeatsByRoom);
router.post("/seats", protectedRoute, createSeat);
router.post("/rooms/:roomId/seats/generate", protectedRoute, createSeatsForRoom);
router.post("/rooms/:roomId/seats/generate-custom", protectedRoute, createSeatsCustom);
router.put("/seats/:id", protectedRoute, updateSeat);
router.delete("/seats/:id", protectedRoute, deleteSeat);
router.put("/seats/bulk-update", protectedRoute, updateMultipleSeats);

// ==================== EXISTING ROUTES ====================
router.get('/:theaterId/movies', getMoviesByTheater); // Lấy phim đang chiếu tại rạp
router.get('/:theaterId/movies/:movieId/showtimes', getShowtimesByMovieAtTheater); // Lấy suất chiếu của phim tại rạp
router.get('/movies/:movieId/showtimes', getAllShowtimesByMovie);
router.get("/:theaterId/showtimes/:movieId", getShowtimeByMovieAndTheater);



export default router;