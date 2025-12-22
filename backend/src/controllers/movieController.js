import { movieService } from "../services/movieService.js";
import { uploadMoviePoster, uploadMovieBackdrop } from "../libs/cloudinary.js";
import { emitToClients, SOCKET_EVENTS } from "../socket.js";

// Lấy tất cả phim (admin)
export const getAllMovies = async (req, res) => {
  try {
    const movies = await movieService.getAllMovies();
    return res.status(200).json({ movies });
  } catch (error) {
    console.error("Error getAllMovies:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

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

// Tạo phim mới
export const createMovie = async (req, res) => {
  try {
    const movie = await movieService.createMovie(req.body);
    
    // Emit event để mobile app cập nhật
    emitToClients(SOCKET_EVENTS.MOVIE_CREATED, { movie });
    
    return res.status(201).json({ message: "Tạo phim thành công", movie });
  } catch (error) {
    console.error("Error createMovie:", error);
    return res.status(400).json({ message: error.message || "Lỗi tạo phim" });
  }
};

// Cập nhật phim
export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await movieService.updateMovie(id, req.body);
    
    // Emit event để mobile app cập nhật
    emitToClients(SOCKET_EVENTS.MOVIE_UPDATED, { movie });
    
    return res.status(200).json({ message: "Cập nhật phim thành công", movie });
  } catch (error) {
    console.error("Error updateMovie:", error);
    return res.status(400).json({ message: error.message || "Lỗi cập nhật phim" });
  }
};

// Xóa phim
export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    await movieService.deleteMovie(id);
    
    // Emit event để mobile app cập nhật
    emitToClients(SOCKET_EVENTS.MOVIE_DELETED, { movieId: parseInt(id) });
    
    return res.status(200).json({ message: "Xóa phim thành công" });
  } catch (error) {
    console.error("Error deleteMovie:", error);
    return res.status(400).json({ message: error.message || "Lỗi xóa phim" });
  }
};

// Lấy tất cả genres
export const getAllGenres = async (req, res) => {
  try {
    const genres = await movieService.getAllGenres();
    return res.status(200).json({ genres });
  } catch (error) {
    console.error("Error getAllGenres:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Lấy tất cả genres với số lượng phim sử dụng
export const getAllGenresWithUsage = async (req, res) => {
  try {
    const genres = await movieService.getAllGenresWithUsage();
    return res.status(200).json({ genres });
  } catch (error) {
    console.error("Error getAllGenresWithUsage:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Tạo genre mới
export const createGenre = async (req, res) => {
  try {
    const { name } = req.body;
    const genre = await movieService.createGenre(name);
    return res.status(201).json({ message: "Thêm thể loại thành công", genre });
  } catch (error) {
    console.error("Error createGenre:", error);
    return res.status(400).json({ message: error.message || "Lỗi thêm thể loại" });
  }
};

// Xóa genre
export const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;
    await movieService.deleteGenre(id);
    return res.status(200).json({ message: "Xóa thể loại thành công" });
  } catch (error) {
    console.error("Error deleteGenre:", error);
    return res.status(400).json({ message: error.message || "Lỗi xóa thể loại" });
  }
};

// Upload poster
export const uploadPoster = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const result = await uploadMoviePoster(image);
    return res.status(200).json({ 
      message: "Upload thành công",
      url: result.url 
    });
  } catch (error) {
    console.error("Error uploadPoster:", error);
    return res.status(400).json({ message: error.message || "Lỗi upload poster" });
  }
};

// Upload backdrop
export const uploadBackdrop = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const result = await uploadMovieBackdrop(image);
    return res.status(200).json({ 
      message: "Upload thành công",
      url: result.url 
    });
  } catch (error) {
    console.error("Error uploadBackdrop:", error);
    return res.status(400).json({ message: error.message || "Lỗi upload backdrop" });
  }
};
