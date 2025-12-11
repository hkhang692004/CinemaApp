import express from "express";
import { getSeatsByShowtime } from "../controllers/showtimeController.js";

const router = express.Router();


router.get("/:showtimeId/seats",getSeatsByShowtime);


export default router;