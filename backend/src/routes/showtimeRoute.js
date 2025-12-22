import express from "express";
import { 
    getSeatsByShowtime, 
    getAllShowtimes, 
    createShowtime, 
    updateShowtime, 
    deleteShowtime 
} from "../controllers/showtimeController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/:showtimeId/seats", getSeatsByShowtime);

// Admin routes
router.get("/admin/all", protectedRoute, getAllShowtimes);
router.post("/admin", protectedRoute, createShowtime);
router.put("/admin/:id", protectedRoute, updateShowtime);
router.delete("/admin/:id", protectedRoute, deleteShowtime);


export default router;