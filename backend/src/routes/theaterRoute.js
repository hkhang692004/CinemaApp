import express from "express";
import { getAllShowtimesByMovie, getShowtimeByMovieAndTheater, getTheater } from "../controllers/theaterController.js";


const router = express.Router();

router.get("/",getTheater);
router.get('/movies/:movieId/showtimes', getAllShowtimesByMovie);
router.get("/:theaterId/showtimes/:movieId",getShowtimeByMovieAndTheater);



export default router;