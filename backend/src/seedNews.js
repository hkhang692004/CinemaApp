// backend/src/seedNews.js
import NewsArticle from "./models/NewsArticle.js";
import { Movie } from "./models/Movie.js";
import sequelize from "./libs/db.js";

async function seedFakeNews() {
  await sequelize.sync(); // Đảm bảo kết nối DB

  // Xóa dữ liệu cũ
  await NewsArticle.destroy({ where: {} });
  console.log("Đã xóa dữ liệu tin tức cũ!");

  // Lấy danh sách phim đã có để liên kết
  const movies = await Movie.findAll();
  const movieMap = {};
  movies.forEach((movie) => {
    movieMap[movie.title] = movie.id;
  });

  const newsArticles = [
    {
      title: "Inception - Kiệt tác khoa học viễn tưởng quay trở lại màn ảnh",
      summary: "Bộ phim đình đám của Christopher Nolan sẽ được chiếu lại tại các rạp vào tuần này.",
      content: `Inception, bộ phim khoa học viễn tưởng đình đám của đạo diễn Christopher Nolan, sẽ được chiếu lại tại các rạp chiếu phim trên toàn quốc vào tuần này. 

Bộ phim với sự tham gia của Leonardo DiCaprio, Joseph Gordon-Levitt và Ellen Page đã từng gây sốt khi ra mắt vào năm 2010 với cốt truyện độc đáo về công nghệ chia sẻ giấc mơ.

Đây là cơ hội tuyệt vời cho những khán giả chưa từng xem hoặc muốn trải nghiệm lại kiệt tác này trên màn ảnh lớn. Vé đang được bán với giá ưu đãi đặc biệt.`,
      image_url: "https://image.tmdb.org/t/p/original/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
      published_at: new Date(),
      author: "Cinema News",
      is_active: true,
      is_banner: true,
      banner_order: 1,
      linkedMovieTitle: "Inception", // Để lấy movie_id sau
    },
    {
      title: "Avengers: Endgame - Kỷ nguyên kết thúc của MCU",
      summary: "Bộ phim siêu anh hùng lớn nhất mọi thời đại đang được chiếu tại rạp.",
      content: `Avengers: Endgame, bộ phim kết thúc giai đoạn 3 của Vũ trụ Điện ảnh Marvel, đang được chiếu lại tại các rạp với chất lượng 4K.

Bộ phim với thời lượng 181 phút đã phá vỡ mọi kỷ lục phòng vé và trở thành bộ phim có doanh thu cao nhất mọi thời đại. Với sự tham gia của toàn bộ dàn sao MCU, đây là trải nghiệm không thể bỏ lỡ.

Đặc biệt, rạp sẽ tổ chức các suất chiếu đặc biệt vào cuối tuần với nhiều ưu đãi hấp dẫn.`,
      image_url: "https://image.tmdb.org/t/p/original/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
      published_at: new Date(),
      author: "Cinema News",
      is_active: true,
      is_banner: true,
      banner_order: 2,
      linkedMovieTitle: "Avengers: Endgame",
    },
    {
      title: "JUJUTSU KAISEN: Execution - Sự kiện Shibuya chính thức ra mắt",
      summary: "Bộ phim anime đình đám dựa trên manga nổi tiếng đã có mặt tại rạp.",
      content: `JUJUTSU KAISEN: Execution - Shibuya Incident x The Culling Game Begins là bộ phim tổng hợp các sự kiện quan trọng nhất của series anime đình đám.

Bộ phim kể về sự kiện Shibuya, nơi Satoru Gojo bị phong ấn và cuộc chiến đấu của Yuji Itadori cùng các đồng đội. Đây là một trong những arc quan trọng nhất của series.

Fans của anime không thể bỏ qua cơ hội xem bộ phim này trên màn ảnh lớn với chất lượng âm thanh và hình ảnh tuyệt vời.`,
      image_url: "https://image.tmdb.org/t/p/original/tc7RrVW5FGvyO2tsgW6LIN1esHI.jpg",
      published_at: new Date(),
      author: "Anime News",
      is_active: true,
      is_banner: true,
      banner_order: 3,
      linkedMovieTitle: "JUJUTSU KAISEN: Execution -Shibuya Incident x The Culling Game Begins- (2025)",
    },
    {
      title: "Zootopia 2 - Cuộc phiêu lưu mới của Judy và Nick",
      summary: "Phần tiếp theo của bộ phim hoạt hình đình đám đã chính thức ra mắt.",
      content: `Zootopia 2 tiếp tục câu chuyện của cảnh sát Judy Hopps và Nick Wilde trong một cuộc phiêu lưu mới đầy thú vị.

Lần này, hai nhân vật chính phải đối mặt với một âm mưu lớn khi Gary De'Snake xuất hiện và làm đảo lộn thành phố Zootopia. Để giải quyết vụ án, họ phải điều tra ở những khu vực bất ngờ nhất.

Bộ phim hứa hẹn sẽ mang đến nhiều tiếng cười và những khoảnh khắc cảm động cho khán giả mọi lứa tuổi.`,
      image_url: "https://image.tmdb.org/t/p/original/3Wg1LBCiTEXTxRrkNKOqJyyIFyF.jpg",
      published_at: new Date(),
      author: "Animation News",
      is_active: true,
      is_banner: true,
      banner_order: 4,
      linkedMovieTitle: "Zootopia 2",
    },
    {
      title: "Khuyến mãi đặc biệt: Mua 2 tặng 1 cho tất cả các suất chiếu",
      summary: "Chương trình khuyến mãi lớn nhất trong năm đang diễn ra tại tất cả các rạp.",
      content: `Nhân dịp kỷ niệm, hệ thống rạp chiếu phim triển khai chương trình khuyến mãi đặc biệt: Mua 2 vé tặng 1 vé cho tất cả các suất chiếu.

Chương trình áp dụng cho:
- Tất cả các phim đang chiếu
- Tất cả các suất chiếu trong ngày
- Không giới hạn số lượng

Thời gian áp dụng: Từ ngày 1/1/2025 đến hết ngày 31/1/2025.

Đừng bỏ lỡ cơ hội xem phim với giá ưu đãi này!`,
      image_url: "https://image.tmdb.org/t/p/original/g96wHxU7EnoIFwemb2RgohIXrgW.jpg",
      published_at: new Date(),
      author: "Marketing Team",
      is_active: true,
      is_banner: true,
      banner_order: 5,
      linkedMovieTitle: null, // Không liên kết phim
    },
    {
      title: "Avatar: Fire and Ash - Hành trình mới trên Pandora",
      summary: "Phần tiếp theo của Avatar đã chính thức ra mắt với nhiều điều bất ngờ.",
      content: `Avatar: Fire and Ash là phần tiếp theo của series Avatar đình đám, kể về cuộc chiến mới của gia đình Jake Sully và Neytiri.

Sau cuộc chiến tàn khốc với RDA và mất đi đứa con trai cả, gia đình họ phải đối mặt với mối đe dọa mới: bộ tộc Ash People do Varang lãnh đạo.

Bộ phim hứa hẹn sẽ mang đến những cảnh quay ngoạn mục và câu chuyện cảm động về tình yêu gia đình.`,
      image_url: "https://image.tmdb.org/t/p/original/g96wHxU7EnoIFwemb2RgohIXrgW.jpg",
      published_at: new Date(),
      author: "Cinema News",
      is_active: true,
      is_banner: false,
      banner_order: 0,
      linkedMovieTitle: "Avatar: Fire and Ash (2025)",
    },
    {
      title: "Hướng dẫn đặt vé online - Nhanh chóng và tiện lợi",
      summary: "Tìm hiểu cách đặt vé trực tuyến để tiết kiệm thời gian và nhận nhiều ưu đãi.",
      content: `Đặt vé online đang trở thành xu hướng phổ biến hiện nay. Với ứng dụng của chúng tôi, bạn có thể:

1. Xem lịch chiếu phim real-time
2. Chọn ghế ngồi yêu thích
3. Thanh toán online an toàn
4. Nhận vé điện tử ngay lập tức

Ngoài ra, khi đặt vé online, bạn sẽ nhận được:
- Giảm 10% cho lần đặt đầu tiên
- Tích điểm thưởng cho mỗi vé
- Nhận thông báo về các suất chiếu đặc biệt

Hãy tải ứng dụng ngay hôm nay!`,
      image_url: "https://image.tmdb.org/t/p/original/g96wHxU7EnoIFwemb2RgohIXrgW.jpg",
      published_at: new Date(),
      author: "Support Team",
      is_active: true,
      is_banner: false,
      banner_order: 0,
      linkedMovieTitle: null, // Không liên kết phim
    },
    {
      title: "Five Nights at Freddy's 2 - Nỗi sợ hãi quay trở lại",
      summary: "Phần tiếp theo của bộ phim kinh dị đình đám đã có mặt tại rạp.",
      content: `Five Nights at Freddy's 2 tiếp tục câu chuyện một năm sau sự kiện tại Freddy Fazbear's Pizza. 

Câu chuyện về những gì đã xảy ra đã bị bóp méo thành một truyền thuyết địa phương, truyền cảm hứng cho lễ hội Fazfest đầu tiên của thị trấn. 

Abby, không biết sự thật, lén lút ra ngoài để gặp lại Freddy, Bonnie, Chica và Foxy, khởi động một chuỗi sự kiện đáng sợ sẽ tiết lộ những bí mật đen tối về nguồn gốc thực sự của Freddy's.`,
      image_url: "https://image.tmdb.org/t/p/original/am6O7221qGtb5ba5uJKw7PfPZkJ.jpg",
      published_at: new Date(),
      author: "Horror News",
      is_active: true,
      is_banner: false,
      banner_order: 0,
      linkedMovieTitle: "Five Nights at Freddy's 2 (2025)",
    },
  ];

  // Tạo tin tức và liên kết với phim (nếu có)
  for (const newsData of newsArticles) {
    const { linkedMovieTitle, ...newsFields } = newsData;
    
    // Lấy movie_id nếu có linkedMovieTitle
    if (linkedMovieTitle && movieMap[linkedMovieTitle]) {
      newsFields.movie_id = movieMap[linkedMovieTitle];
    }
    
    const news = await NewsArticle.create(newsFields);
    console.log(`Đã tạo tin tức: ${news.title}${newsFields.movie_id ? ` (liên kết với phim ID: ${newsFields.movie_id})` : ''}`);
  }

  console.log("Đã seed dữ liệu fake cho bảng news_articles!");
  await sequelize.close();
}

seedFakeNews();

