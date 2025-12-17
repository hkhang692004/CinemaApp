import express from "express";
import { createReservation, releaseReservation, confirmReservation } from "../controllers/reservationController.js";

const router = express.Router();

// Tạo reservation (giữ ghế)
router.post("/", createReservation);

// Hủy reservation
router.post("/release", releaseReservation);

// Confirm reservation (sau thanh toán)
router.post("/confirm", confirmReservation);

export default router;
