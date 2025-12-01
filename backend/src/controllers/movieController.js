import { movieService } from "../services/movieService.js";

export const getComingSoonMovie = async (req, res) => {
  try {
    const movies = await movieService.getComingSoonMovie();
    return res.status(200).json({ movies });
  } catch (error) {
    return res.status(500).json({ messsage: "Lỗi hệ thống" });
  }
};
export const getNowShowingMovie = async (req, res) => {
  try {
    const movies = await movieService.getNowShowingMovie();
    return res.status(200).json({ movies });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const getDetailMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await movieService.getDetailMovie(id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    return res.status(200).json({ movie });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchMovie = async (req, res) => {
  try {
    const { q } = req.query;
    const movies = await movieService.searchMovie(q);
    return res.json({ movies });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
