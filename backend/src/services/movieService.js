import Genre from "../models/Genre.js";
import { Movie } from "../models/Movie.js";
import { Op } from "sequelize";

export const movieService = {
  async getNowShowingMovie() {
    return Movie.findAll({
      where: {
        status: "now_showing",
      },
      order: [["release_date", "DESC"]],
    });
  },
  async getComingSoonMovie() {
    return Movie.findAll({
      where: {
        status: "coming_soon",
      },
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
      order: [["release_date", "DESC"]],
    });
  },
};
