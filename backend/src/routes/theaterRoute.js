import express from "express";
import { getAllShowtimesByMovie, getShowtimeByMovieAndTheater, getTheater, getMoviesByTheater, getShowtimesByMovieAtTheater } from "../controllers/theaterController.js";


const router = express.Router();

router.get("/",getTheater);
router.get('/:theaterId/movies', getMoviesByTheater); // Lấy phim đang chiếu tại rạp
router.get('/:theaterId/movies/:movieId/showtimes', getShowtimesByMovieAtTheater); // Lấy suất chiếu của phim tại rạp
router.get('/movies/:movieId/showtimes', getAllShowtimesByMovie);
router.get("/:theaterId/showtimes/:movieId",getShowtimeByMovieAndTheater);



export default router;