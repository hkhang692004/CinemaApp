import { theaterService } from "../services/theaterService.js";

export const getTheater = async(req,res) =>{
    try {
        const theaters = await theaterService.getTheaterList();
        return res.status(200).json({theaters});
    } catch (error) {
        console.error("lỗi từ getTheater", error);
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