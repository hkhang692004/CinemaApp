import Genre from "../models/Genre.js";
import { Movie } from "../models/Movie.js";
import MovieGenre from "../models/MovieGenre.js";
import Showtime from "../models/Showtime.js";
import Ticket from "../models/Ticket.js";
import { Op } from "sequelize";

export const movieService = {
  // Lấy tất cả phim (cho admin)
  async getAllMovies() {
    return Movie.findAll({
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getNowShowingMovie() {
    return Movie.findAll({
      where: {
        status: "now_showing",
      },
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      order: [["release_date", "DESC"]],
    });
  },
  async getComingSoonMovie() {
    return Movie.findAll({
      where: {
        status: "coming_soon",
      },
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      order: [["release_date", "DESC"]],
    });
  },
  async getDetailMovie(id) {
    return Movie.findByPk(id, {
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
    });
  },
  async searchMovie(data) {
    return Movie.findAll({
      where: { title: { [Op.like]: `%${data}%` } },
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      order: [["release_date", "DESC"]],
    });
  },

  // Tạo phim mới
  async createMovie(data) {
    const { genre_ids, ...movieData } = data;

    // Validation - kiểm tra các field bắt buộc
    const errors = [];
    
    if (!movieData.title || movieData.title.trim() === '') {
      errors.push('Tên phim');
    }
    if (!movieData.duration_min || movieData.duration_min === '') {
      errors.push('Thời lượng');
    }
    if (!movieData.release_date || movieData.release_date === '' || movieData.release_date === 'Invalid date') {
      errors.push('Ngày khởi chiếu');
    }
    if (!movieData.poster_url || movieData.poster_url === '') {
      errors.push('Poster phim');
    }
    if (!movieData.backdrop_url || movieData.backdrop_url === '') {
      errors.push('Ảnh nền (Backdrop)');
    }
    
    // Validate avg_rating range
    if (movieData.avg_rating !== undefined && movieData.avg_rating !== null && movieData.avg_rating !== '') {
      const rating = parseFloat(movieData.avg_rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        throw new Error('Đánh giá phim phải là số từ 0 đến 10');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Vui lòng nhập: ${errors.join(', ')}`);
    }

    // Clean data - chuyển chuỗi rỗng thành null
    const cleanedData = {
      title: movieData.title?.trim(),
      description: movieData.description || null,
      trailer_url: movieData.trailer_url || null,
      poster_url: movieData.poster_url || null,
      backdrop_url: movieData.backdrop_url || null,
      duration_min: movieData.duration_min ? parseInt(movieData.duration_min) : null,
      director: movieData.director || null,
      actors: movieData.actors || null,
      country: movieData.country || null,
      release_date: movieData.release_date && movieData.release_date !== 'Invalid date' ? movieData.release_date : null,
      age_rating: movieData.age_rating || 'P',
      avg_rating: movieData.avg_rating !== undefined && movieData.avg_rating !== '' ? parseFloat(movieData.avg_rating) : 0,
      status: movieData.status || 'coming_soon',
    };

    const movie = await Movie.create({
      ...cleanedData,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Gán genres nếu có
    if (genre_ids && genre_ids.length > 0) {
      await Promise.all(
        genre_ids.map((genreId) =>
          MovieGenre.create({
            movie_id: movie.id,
            genre_id: genreId,
          })
        )
      );
    }

    return this.getDetailMovie(movie.id);
  },

  // Cập nhật phim
  async updateMovie(id, data) {
    const movie = await Movie.findByPk(id);
    if (!movie) {
      throw new Error("Không tìm thấy phim");
    }

    const { genre_ids, status, ...movieData } = data;

    // Validate avg_rating range
    if (movieData.avg_rating !== undefined && movieData.avg_rating !== null && movieData.avg_rating !== '') {
      const rating = parseFloat(movieData.avg_rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        throw new Error('Đánh giá phim phải là số từ 0 đến 10');
      }
    }

    // Validate status transitions
    if (status && status !== movie.status) {
      const currentStatus = movie.status;
      
      // Phim đã kết thúc không được chỉnh sửa trạng thái
      if (currentStatus === 'ended') {
        throw new Error("Không thể thay đổi trạng thái của phim đã kết thúc");
      }
      
      // Phim sắp chiếu chỉ được chuyển thành đang chiếu
      if (currentStatus === 'coming_soon' && status !== 'now_showing') {
        throw new Error("Phim sắp chiếu chỉ có thể chuyển sang trạng thái đang chiếu");
      }
      
      // Phim đang chiếu chỉ được chuyển thành đã kết thúc
      if (currentStatus === 'now_showing') {
        if (status !== 'ended') {
          throw new Error("Phim đang chiếu chỉ có thể chuyển sang trạng thái đã kết thúc");
        }
        
        // Kiểm tra còn suất chiếu nào không
        const activeShowtimes = await Showtime.count({
          where: {
            movie_id: id,
            start_time: { [Op.gte]: new Date() }
          }
        });
        
        if (activeShowtimes > 0) {
          throw new Error(`Không thể kết thúc phim vì còn ${activeShowtimes} suất chiếu chưa diễn ra`);
        }
      }
    }

    await movie.update({
      ...movieData,
      ...(status && { status }),
      updated_at: new Date(),
    });

    // Cập nhật genres nếu có
    if (genre_ids !== undefined) {
      await MovieGenre.destroy({ where: { movie_id: id } });
      if (genre_ids.length > 0) {
        await Promise.all(
          genre_ids.map((genreId) =>
            MovieGenre.create({
              movie_id: id,
              genre_id: genreId,
            })
          )
        );
      }
    }

    return this.getDetailMovie(id);
  },

  // Xóa phim
  async deleteMovie(id) {
    const movie = await Movie.findByPk(id);
    if (!movie) {
      throw new Error("Không tìm thấy phim");
    }

    // Kiểm tra có suất chiếu chưa kết thúc không
    const activeShowtimes = await Showtime.findAll({
      where: {
        movie_id: id,
        status: 'Scheduled',
        start_time: { [Op.gte]: new Date() }
      }
    });

    if (activeShowtimes.length > 0) {
      throw new Error(`Không thể xóa phim vì còn ${activeShowtimes.length} suất chiếu chưa diễn ra`);
    }

    // Kiểm tra có vé đã bán không
    const showtimes = await Showtime.findAll({
      where: { movie_id: id },
      attributes: ['id']
    });

    if (showtimes.length > 0) {
      const showtimeIds = showtimes.map(s => s.id);
      const ticketCount = await Ticket.count({
        where: { showtime_id: { [Op.in]: showtimeIds } }
      });

      if (ticketCount > 0) {
        throw new Error(`Không thể xóa phim vì đã có ${ticketCount} vé được bán`);
      }
    }

    // Xóa genres liên quan
    await MovieGenre.destroy({ where: { movie_id: id } });

    // Xóa các suất chiếu đã hủy/hoàn thành (nếu có)
    await Showtime.destroy({ where: { movie_id: id } });

    await movie.destroy();
    return true;
  },

  // Lấy tất cả genres
  async getAllGenres() {
    return Genre.findAll({
      order: [["name", "ASC"]],
    });
  },

  // Lấy genres với số lượng phim sử dụng
  async getAllGenresWithUsage() {
    const genres = await Genre.findAll({
      order: [["name", "ASC"]],
    });

    // Đếm số phim sử dụng từng genre
    const genresWithUsage = await Promise.all(
      genres.map(async (genre) => {
        const movieCount = await MovieGenre.count({
          where: { genre_id: genre.id },
        });
        return {
          ...genre.toJSON(),
          movieCount,
        };
      })
    );

    return genresWithUsage;
  },

  // Tạo genre mới
  async createGenre(name) {
    if (!name || name.trim() === '') {
      throw new Error('Tên thể loại không được để trống');
    }

    // Kiểm tra trùng tên
    const existing = await Genre.findOne({
      where: { name: name.trim() },
    });
    if (existing) {
      throw new Error('Thể loại này đã tồn tại');
    }

    return Genre.create({ name: name.trim() });
  },

  // Xóa genre (chỉ khi không có phim sử dụng)
  async deleteGenre(id) {
    const genre = await Genre.findByPk(id);
    if (!genre) {
      throw new Error('Không tìm thấy thể loại');
    }

    // Kiểm tra có phim nào sử dụng genre này không
    const movieCount = await MovieGenre.count({
      where: { genre_id: id },
    });

    if (movieCount > 0) {
      throw new Error(`Không thể xóa vì có ${movieCount} phim đang sử dụng thể loại này`);
    }

    await genre.destroy();
    return true;
  },
};
