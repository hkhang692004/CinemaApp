import { Movie } from "./models/Movie.js";
import Genre from "./models/Genre.js";
import MovieGenre from "./models/MovieGenre.js";
import sequelize from "./libs/db.js";

/**
 * Gán genres cho các phim đã có sẵn (không xóa phim).
 * Map theo title -> danh sách genre name.
 * Có thể chạy sau khi đã seed movies.
 */
async function seedMovieGenresOnly() {
  await sequelize.sync(); // đảm bảo kết nối

  // Map tiêu đề phim -> danh sách tên thể loại
  const mapping = {
    Inception: ["Khoa học viễn tưởng", "Hành động", "Phiêu lưu"],
    "Avengers: Endgame": ["Hành động", "Phiêu lưu", "Khoa học viễn tưởng"],
    "Detective Conan: The Scarlet Bullet": ["Hành động", "Hoạt hình", "Bí ẩn"],
    "Zootopia 2": ["Hoạt hình", "Phiêu lưu", "Hài"],
    "JUJUTSU KAISEN: Execution -Shibuya Incident x The Culling Game Begins- (2025)":
      ["Hành động", "Kỳ ảo", "Hoạt hình"],
    "Five Nights at Freddy's 2 (2025)": ["Kinh dị", "Giả tưởng"],
    "Avatar: Fire and Ash (2025)": [
      "Phiêu lưu",
      "Khoa học viễn tưởng",
      "Hành động",
    ],
    "My Neighbor Totoro (1988)": ["Hoạt hình", "Gia đình", "Kỳ ảo"],
    "The Fatal Dealz (2025)": ["Chính kịch", "Tội phạm", "Gây cấn"],
    "The SpongeBob Movie: Search for SquarePants (2025)": [
      "Hoạt hình",
      "Hài",
      "Phiêu lưu",
    ],
    "Scarlet (2025)": ["Kỳ ảo", "Hành động"],
    "The Castle of Cagliostro (1979)t": ["Hoạt hình", "Phiêu lưu", "Hành động"],
    "Die My Love (2025)": ["Chính kịch", "Gây cấn"],
  };

  // Thu thập tất cả genre name cần dùng
  const genreNames = Array.from(
    new Set(
      Object.values(mapping)
        .flat()
        .map((g) => g.trim())
        .filter(Boolean)
    )
  );

  // Tạo genre nếu thiếu
  if (genreNames.length > 0) {
    await Genre.bulkCreate(
      genreNames.map((name) => ({ name })),
      { ignoreDuplicates: true }
    );
  }

  // Map tên -> instance Genre
  const genreMap = new Map(
    (await Genre.findAll()).map((g) => [g.name.toLowerCase(), g])
  );

  for (const [title, genres] of Object.entries(mapping)) {
    const movie = await Movie.findOne({ where: { title } });
    if (!movie) {
      console.warn(`⚠️  Không tìm thấy movie: ${title}`);
      continue;
    }

    const genreInstances = genres
      .map((name) => genreMap.get(name.toLowerCase()))
      .filter(Boolean);

    if (genreInstances.length === 0) {
      console.warn(`⚠️  Không tìm thấy genre cho movie: ${title}`);
      continue;
    }

    // Tạo liên kết nếu chưa có
    for (const g of genreInstances) {
      await MovieGenre.findOrCreate({
        where: { movie_id: movie.id, genre_id: g.id },
        defaults: { movie_id: movie.id, genre_id: g.id },
      });
    }

    console.log(`✅ Gán genres cho movie: ${title}`);
  }

  await sequelize.close();
}

seedMovieGenresOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed movie genres failed:", err);
    process.exit(1);
  });
