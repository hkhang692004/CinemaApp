// backend/src/seedMovies.js
import { Movie } from "./models/Movie.js";
import MovieGenre from "./models/MovieGenre.js";
import sequelize from "./libs/db.js";

async function seedFakeMovies() {
  await sequelize.sync(); // Đảm bảo kết nối DB


  await MovieGenre.destroy({ where: {} }); // Xóa movie_genres trước
  await Movie.destroy({ where: {} }); // Sau đó mới xóa movies
  console.log("Đã xóa dữ liệu cũ!");

  const movies = [
    {
      title: "Inception",
      description:
        "A thief steals corporate secrets through dream-sharing technology.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://image.tmdb.org/t/p/original/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/w500/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      duration_min: 148,
      director: "Christopher Nolan",
      actors: "Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page",
      country: "USA",
      release_date: "2010-07-16",
      age_rating: "C13",
      status: "now_showing",
      avg_rating: 8.8,
    },
    {
      title: "Avengers: Endgame",
      description:
        "The Avengers assemble once more in order to reverse Thanos' actions.",
      trailer_url: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
      poster_url:
        "https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/w500/5BwqwxMEjeFtdknRV792Svo0K1v.jpg",
      duration_min: 181,
      director: "Anthony Russo, Joe Russo",
      actors: "Robert Downey Jr., Chris Evans, Mark Ruffalo",
      country: "USA",
      release_date: "2019-04-26",
      age_rating: "C13",
      status: "now_showing",
      avg_rating: 8.6,
    },
    {
      title: "Detective Conan: The Scarlet Bullet",
      description:
        "Movie about the world's first vacuum-tube super-conducting train.",
      trailer_url: "https://www.youtube.com/watch?v=HSow7Ep6l_4",
      poster_url:
        "https://image.tmdb.org/t/p/original/wowJzvF1KqEFSZoArkgngRy1r4L.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/f5o7KiOdcM9mqbobPbLDFcVqjcy.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    // ...thêm nhiều phim tùy ý
  ];

  for (const movie of movies) {
    await Movie.create(movie);
  }
  console.log("Đã seed dữ liệu fake cho bảng movies!");
  await sequelize.close();
}

seedFakeMovies();
