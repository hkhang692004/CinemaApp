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
    {
      title: "Zootopia 2",
      description:
        "After cracking the biggest case in Zootopia's history, rookie cops Judy Hopps and Nick Wilde find themselves on the twisting trail of a great mystery when Gary De’Snake arrives and turns the animal metropolis upside down. To crack the case, Judy and Nick must go undercover to unexpected new parts of town, where their growing partnership is tested like never before.",
      trailer_url: "https://www.youtube.com/watch?v=xo4rkcC7kFc",
      poster_url:
        "https://image.tmdb.org/t/p/original/3Wg1LBCiTEXTxRrkNKOqJyyIFyF.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/5h2EsPKNDdB3MAtOk9MB9Ycg9Rz.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "now_showing",
      avg_rating: 7.8,
    },
    {
      title:
        "JUJUTSU KAISEN: Execution -Shibuya Incident x The Culling Game Begins- (2025)",
      description:
        "A veil abruptly descends over the busy Shibuya area amid the bustling Halloween crowds, trapping countless civilians inside. Satoru Gojo, the strongest jujutsu sorcerer, steps into the chaos. But lying in wait are curse users and spirits scheming to seal him away. Yuji Itadori, accompanied by his classmates and other top-tier jujutsu sorcerers, enters the fray in an unprecedented clash of curses — the Shibuya Incident. In the aftermath, ten colonies across Japan are transformed into dens of curses in a plan orchestrated by Noritoshi Kamo. As the deadly Culling Game starts, Special Grade sorcerer Yuta Okkotsu is assigned to carry out Yuji's execution for his perceived crimes. A compilation movie of Shibuya Incident including the first two episodes of the Culling Games arc.",
      trailer_url: "https://www.youtube.com/watch?v=C7P9ueuQ6FU",
      poster_url:
        "https://image.tmdb.org/t/p/original/tc7RrVW5FGvyO2tsgW6LIN1esHI.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/gtKglOSEq3d4MgQE4VsrT1sRkd0.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "now_showing",
      avg_rating: 7.8,
    },
    {
      title: "Five Nights at Freddy's 2 (2025)",
      description:
        "One year since the supernatural nightmare at Freddy Fazbear's Pizza, the stories about what transpired there have been twisted into a campy local legend, inspiring the town's first ever Fazfest. With the truth kept from her, Abby sneaks out to reconnect with Freddy, Bonnie, Chica, and Foxy, setting into motion a terrifying series of events that will reveal dark secrets about the real origin of Freddy's, and unleash a decades-hidden horror.",
      trailer_url: "https://www.youtube.com/watch?v=dSDpoobO6yM",
      poster_url:
        "https://image.tmdb.org/t/p/original/am6O7221qGtb5ba5uJKw7PfPZkJ.jpg",
      backdrop_url:
        "hhttps://image.tmdb.org/t/p/original/bZlismAr366jWFiZNKzY3x3AN5X.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "Avatar: Fire and Ash (2025)",
      description:
        "In the wake of the devastating war against the RDA and the loss of their eldest son, Jake Sully and Neytiri face a new threat on Pandora: the Ash People, a violent and power-hungry Na'vi tribe led by the ruthless Varang. Jake's family must fight for their survival and the future of Pandora in a conflict that pushes them to their emotional and physical limits.",
      trailer_url: "https://www.youtube.com/watch?v=nb_fFj_0rq8",
      poster_url:
        "https://image.tmdb.org/t/p/original/g96wHxU7EnoIFwemb2RgohIXrgW.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "My Neighbor Totoro (1988)",
      description:
        "Two sisters move to the country with their father in order to be closer to their hospitalized mother, and discover the surrounding trees are inhabited by Totoros, magical spirits of the forest. When the youngest runs away from home, the older sister seeks help from the spirits to find her.",
      trailer_url: "https://www.youtube.com/watch?v=srW-wajSxog",
      poster_url:
        "https://image.tmdb.org/t/p/original/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/95ozIP0A2fKaAXxwDxUEVn74Iux.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "The Fatal Dealz (2025)",
      description:
        "When a phone scam unexpectedly strikes, Dang Thuc — who once thought he had a stable life — is drawn into a dangerous spiral of money, family, and trust, where every choice comes at a cost not only of wealth, but of the people he loves most.",
      trailer_url: "https://www.youtube.com/watch?v=0wuVwkK-Vsc",
      poster_url:
        "https://image.tmdb.org/t/p/original/ayDNI6x8g3638uQSTmNqW9CeUUU.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/xinQJHeJyiCGhBqOV4IW8FPt7wY.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "The SpongeBob Movie: Search for SquarePants (2025)",
      description:
        "Desperate to be a big guy, SpongeBob sets out to prove his bravery to Mr. Krabs by following The Flying Dutchman – a mysterious swashbuckling ghost pirate – on a seafaring adventure that takes him to the deepest depths of the deep sea, where no Sponge has gone before.",
      trailer_url: "https://www.youtube.com/watch?v=XdPt8QWTypI",
      poster_url:
        "https://image.tmdb.org/t/p/original/jxJ9FMREmSOSqz45viIjYkP7eFE.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/kVSUUWiXoNwq2wVCZ4Mcqkniqvr.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "Scarlet (2025)",
      description:
        "After failing to avenge her father's murder, Princess Scarlet, wakes up in the Land of the Dead. In this world filled with madness, if she does not achieve her revenge against her nemesis and reach the No End Place, she will become Void and cease to exist. Can Scarlet find a way to live at the end of her endless journey?",
      trailer_url: "https://www.youtube.com/watch?v=8D4-ZihpaC4",
      poster_url:
        "https://image.tmdb.org/t/p/original/2O2tOyS4kvO9GtFPHpWmbXvfRQv.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/v6ahsPdNU0AVfgbQQU1xk8h6n6s.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "The Castle of Cagliostro (1979)t",
      description:
        "After a successful robbery leaves famed thief Lupin the Third and his partner Jigen with nothing but a large amount of expertly crafted counterfeit bills, he decides to track down the forgers responsible—and steal any other treasures he may find in the Castle of Cagliostro, including the 'damsel in distress' he finds imprisoned there.",
      trailer_url: "https://www.youtube.com/watch?v=xmKP3zp3Mug",
      poster_url:
        "https://image.tmdb.org/t/p/original/hSFdyWptoDHuXlFZGzIrfVell4Q.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/fCf8WfsRJEDFf1N6gA6o4ICRYp.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
    {
      title: "Die My Love (2025)",
      description:
        "Grace, a writer and young mother, is slowly slipping into madness. Locked away in an old house in Montana, her increasingly agitated and erratic behaviour leaves her companion, Jackson, worried and helpless.",
      trailer_url: "https://www.youtube.com/watch?v=2jzXHW6Qe70",
      poster_url:
        "https://image.tmdb.org/t/p/original/mgsTwamYMfNZTyTtdE3EjahqYlc.jpg",
      backdrop_url:
        "https://image.tmdb.org/t/p/original/ltIxMsVJD9iiD5V4SBp4kv3KhVb.jpg",
      duration_min: 110,
      director: "Chika Nagaoka",
      actors: "Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
      country: "Japan",
      release_date: "2021-04-16",
      age_rating: "P",
      status: "coming_soon",
      avg_rating: 7.8,
    },
  ];

  for (const movie of movies) {
    await Movie.create(movie);
  }
  console.log("Đã seed dữ liệu fake cho bảng movies!");
  await sequelize.close();
}

seedFakeMovies();
