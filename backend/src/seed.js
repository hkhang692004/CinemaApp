// backend/src/seed.js - MASTER SEED FILE
// Gộp tất cả seeds vào 1 file để dễ quản lý
// Chạy: node src/seed.js [option]
// Options: --all, --movies, --genres, --news, --combos, --booking, --promotions, --loyalty

import { 
    sequelize,
    Movie, 
    Genre,
    MovieGenre,
    NewsArticle,
    Combo,
    ComboItem,
    Theater,
    CinemaRoom,
    Seat,
    Showtime,
    Promotion,
    LoyaltyTierRate,
    LoyaltyTierRequirement,
    LoyaltyAccount,
    SeatTypePrice,
    ScreenTypePrice,
    GroupBooking
} from './models/index.js';

// =====================================================
// MOVIES DATA
// =====================================================
const moviesData = [
    {
        title: "Inception",
        description: "A thief steals corporate secrets through dream-sharing technology.",
        trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        poster_url: "https://image.tmdb.org/t/p/original/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/w500/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
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
        description: "The Avengers assemble once more in order to reverse Thanos' actions.",
        trailer_url: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
        poster_url: "https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/w500/5BwqwxMEjeFtdknRV792Svo0K1v.jpg",
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
        description: "Movie about the world's first vacuum-tube super-conducting train.",
        trailer_url: "https://www.youtube.com/watch?v=HSow7Ep6l_4",
        poster_url: "https://image.tmdb.org/t/p/original/wowJzvF1KqEFSZoArkgngRy1r4L.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/f5o7KiOdcM9mqbobPbLDFcVqjcy.jpg",
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
        description: "After cracking the biggest case in Zootopia's history, rookie cops Judy Hopps and Nick Wilde find themselves on the twisting trail of a great mystery.",
        trailer_url: "https://www.youtube.com/watch?v=xo4rkcC7kFc",
        poster_url: "https://image.tmdb.org/t/p/original/3Wg1LBCiTEXTxRrkNKOqJyyIFyF.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/5h2EsPKNDdB3MAtOk9MB9Ycg9Rz.jpg",
        duration_min: 110,
        director: "Rich Moore",
        actors: "Ginnifer Goodwin, Jason Bateman",
        country: "USA",
        release_date: "2025-11-26",
        age_rating: "P",
        status: "now_showing",
        avg_rating: 7.8,
    },
    {
        title: "JUJUTSU KAISEN: Execution -Shibuya Incident x The Culling Game Begins- (2025)",
        description: "A compilation movie of Shibuya Incident including the first two episodes of the Culling Games arc.",
        trailer_url: "https://www.youtube.com/watch?v=C7P9ueuQ6FU",
        poster_url: "https://image.tmdb.org/t/p/original/tc7RrVW5FGvyO2tsgW6LIN1esHI.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/gtKglOSEq3d4MgQE4VsrT1sRkd0.jpg",
        duration_min: 150,
        director: "Gege Akutami",
        actors: "Junya Enoki, Yuma Uchida",
        country: "Japan",
        release_date: "2025-01-16",
        age_rating: "C16",
        status: "now_showing",
        avg_rating: 8.5,
    },
    {
        title: "Five Nights at Freddy's 2 (2025)",
        description: "One year since the supernatural nightmare at Freddy Fazbear's Pizza, the stories about what transpired there have been twisted into a campy local legend.",
        trailer_url: "https://www.youtube.com/watch?v=dSDpoobO6yM",
        poster_url: "https://image.tmdb.org/t/p/original/am6O7221qGtb5ba5uJKw7PfPZkJ.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/bZlismAr366jWFiZNKzY3x3AN5X.jpg",
        duration_min: 110,
        director: "Emma Tammi",
        actors: "Josh Hutcherson, Elizabeth Lail",
        country: "USA",
        release_date: "2025-12-05",
        age_rating: "C16",
        status: "coming_soon",
        avg_rating: 7.2,
    },
    {
        title: "Avatar: Fire and Ash (2025)",
        description: "Jake Sully and Neytiri face a new threat on Pandora: the Ash People, a violent Na'vi tribe led by the ruthless Varang.",
        trailer_url: "https://www.youtube.com/watch?v=nb_fFj_0rq8",
        poster_url: "https://image.tmdb.org/t/p/original/g96wHxU7EnoIFwemb2RgohIXrgW.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg",
        duration_min: 180,
        director: "James Cameron",
        actors: "Sam Worthington, Zoe Saldana",
        country: "USA",
        release_date: "2025-12-19",
        age_rating: "C13",
        status: "coming_soon",
        avg_rating: 8.0,
    },
    {
        title: "My Neighbor Totoro (1988)",
        description: "Two sisters discover the surrounding trees are inhabited by Totoros, magical spirits of the forest.",
        trailer_url: "https://www.youtube.com/watch?v=srW-wajSxog",
        poster_url: "https://image.tmdb.org/t/p/original/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/95ozIP0A2fKaAXxwDxUEVn74Iux.jpg",
        duration_min: 86,
        director: "Hayao Miyazaki",
        actors: "Noriko Hidaka, Chika Sakamoto",
        country: "Japan",
        release_date: "1988-04-16",
        age_rating: "P",
        status: "now_showing",
        avg_rating: 8.1,
    },
];

// =====================================================
// GENRES DATA & MAPPING
// =====================================================
const genresData = [
    "Hành động", "Phiêu lưu", "Hoạt hình", "Hài", "Tội phạm", "Chính kịch",
    "Gia đình", "Kỳ ảo", "Lịch sử", "Kinh dị", "Âm nhạc", "Bí ẩn",
    "Lãng mạn", "Khoa học viễn tưởng", "Gây cấn", "Chiến tranh"
];

const movieGenreMapping = {
    "Inception": ["Khoa học viễn tưởng", "Hành động", "Phiêu lưu"],
    "Avengers: Endgame": ["Hành động", "Phiêu lưu", "Khoa học viễn tưởng"],
    "Detective Conan: The Scarlet Bullet": ["Hành động", "Hoạt hình", "Bí ẩn"],
    "Zootopia 2": ["Hoạt hình", "Phiêu lưu", "Hài"],
    "JUJUTSU KAISEN: Execution -Shibuya Incident x The Culling Game Begins- (2025)": ["Hành động", "Kỳ ảo", "Hoạt hình"],
    "Five Nights at Freddy's 2 (2025)": ["Kinh dị", "Kỳ ảo"],
    "Avatar: Fire and Ash (2025)": ["Phiêu lưu", "Khoa học viễn tưởng", "Hành động"],
    "My Neighbor Totoro (1988)": ["Hoạt hình", "Gia đình", "Kỳ ảo"],
};

// =====================================================
// COMBOS DATA
// =====================================================
const combosData = [
    {
        name: 'Combo Solo',
        description: 'Combo dành cho 1 người: 1 Bắp rang bơ (Size M) + 1 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400',
        price: 79000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (M)', quantity: 1 },
            { item_name: 'Nước ngọt (M)', quantity: 1 }
        ]
    },
    {
        name: 'Combo Couple',
        description: 'Combo dành cho 2 người: 1 Bắp rang bơ (Size L) + 2 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400',
        price: 109000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 1 },
            { item_name: 'Nước ngọt (M)', quantity: 2 }
        ]
    },
    {
        name: 'Combo Family',
        description: 'Combo dành cho gia đình: 2 Bắp rang bơ (Size L) + 4 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400',
        price: 189000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 2 },
            { item_name: 'Nước ngọt (M)', quantity: 4 }
        ]
    },
    {
        name: 'Bắp rang bơ (M)',
        description: 'Bắp rang bơ thơm ngon size M',
        image_url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
        price: 45000,
        category: 'Bắp',
        is_active: true,
        items: [{ item_name: 'Bắp rang bơ (M)', quantity: 1 }]
    },
    {
        name: 'Coca-Cola (M)',
        description: 'Nước ngọt Coca-Cola size M',
        image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        price: 32000,
        category: 'Nước uống',
        is_active: true,
        items: [{ item_name: 'Coca-Cola (M)', quantity: 1 }]
    },
    {
        name: 'Hotdog',
        description: 'Hotdog xúc xích thơm ngon',
        image_url: 'https://images.unsplash.com/photo-1612392062631-94e9f4a855c5?w=400',
        price: 45000,
        category: 'Đồ ăn',
        is_active: true,
        items: [{ item_name: 'Hotdog', quantity: 1 }]
    },
];

// =====================================================
// THEATERS DATA
// =====================================================
const theatersData = [
    {
        name: "CGV Landmark 81",
        city: "TP.HCM",
        address: "Landmark 81, 720A Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        phone: "0283 555 0001",
        email: "cgv.landmark@cgv.vn",
        image_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
        is_active: true,
    },
    {
        name: "BHD Star Cineplex",
        city: "TP.HCM",
        address: "Saigon Square, 67-71 Mạc Thị Buôn, Quận 1, TP.HCM",
        phone: "0283 555 0002",
        email: "bhd.saigon@bhd.vn",
        image_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
        is_active: true,
    },
    {
        name: "Lotte Cinema",
        city: "Hà Nội",
        address: "Lotte Center Hanoi, 54 Lyuluongvan, Hoang Dieu, Hanoi",
        phone: "0243 555 0003",
        email: "lotte.hanoi@lotte.vn",
        image_url: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800",
        is_active: true,
    },
    {
        name: "Galaxy Cinema",
        city: "Đà Nẵng",
        address: "Hoang Gia Building, 100 Hung Vuong, Da Nang",
        phone: "0236 555 0005",
        email: "galaxy.danang@galaxy.vn",
        image_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800",
        is_active: true,
    },
];

// =====================================================
// PROMOTIONS DATA
// =====================================================
const promotionsData = [
    {
        code: 'WELCOME10',
        name: 'Giảm 10% cho khách hàng mới',
        description: 'Mã giảm giá 10% cho lần đặt vé đầu tiên. Áp dụng cho tất cả các phim.',
        discount_type: 'Percentage',
        discount_value: 10,
        min_order_amount: 100000,
        max_discount: 50000,
        usage_limit: 1000,
        usage_per_user: 1,
        used_count: 0,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 ngày
        applicable_to: 'All',
        is_active: true,
    },
    {
        code: 'COMBO20K',
        name: 'Giảm 20K cho Combo',
        description: 'Giảm trực tiếp 20,000đ khi mua combo bất kỳ từ 100,000đ.',
        discount_type: 'FixedAmount',
        discount_value: 20000,
        min_order_amount: 100000,
        max_discount: 20000,
        usage_limit: 500,
        usage_per_user: 2,
        used_count: 0,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
        applicable_to: 'Combos',
        is_active: true,
    },
    {
        code: 'SALE50',
        name: 'Giảm 50% vé xem phim',
        description: 'Giảm 50% giá vé cho tất cả các suất chiếu (tối đa 100,000đ).',
        discount_type: 'Percentage',
        discount_value: 50,
        min_order_amount: 0,
        max_discount: 100000,
        usage_limit: 200,
        usage_per_user: 1,
        used_count: 0,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        applicable_to: 'Tickets',
        is_active: true,
    },
    {
        code: 'BIRTHDAY',
        name: 'Ưu đãi sinh nhật',
        description: 'Giảm 30% cho khách hàng có sinh nhật trong tháng.',
        discount_type: 'Percentage',
        discount_value: 30,
        min_order_amount: 0,
        max_discount: 150000,
        usage_limit: null, // Unlimited
        usage_per_user: 1,
        used_count: 0,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
        applicable_to: 'All',
        is_active: true,
    },
    {
        code: 'NEWYEAR2025',
        name: 'Chào năm mới 2025',
        description: 'Giảm 25% cho tất cả đơn hàng dịp năm mới.',
        discount_type: 'Percentage',
        discount_value: 25,
        min_order_amount: 200000,
        max_discount: 100000,
        usage_limit: 1000,
        usage_per_user: 2,
        used_count: 0,
        valid_from: new Date('2025-01-01'),
        valid_to: new Date('2025-01-31'),
        applicable_to: 'All',
        is_active: true,
    },
    {
        code: 'VIP30',
        name: 'Ưu đãi VIP 30%',
        description: 'Dành riêng cho khách hàng thân thiết hạng Gold/Platinum.',
        discount_type: 'Percentage',
        discount_value: 30,
        min_order_amount: 0,
        max_discount: 200000,
        usage_limit: null,
        usage_per_user: 5,
        used_count: 0,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 tháng
        applicable_to: 'All',
        is_active: true,
    },
];

// =====================================================
// LOYALTY TIER RATES DATA
// =====================================================
const loyaltyTierRatesData = [
    { tier: 'Silver', points_per_1000: 1.00 },   // 1 điểm / 1000đ
    { tier: 'Gold', points_per_1000: 1.50 },     // 1.5 điểm / 1000đ
    { tier: 'Platinum', points_per_1000: 2.00 }, // 2 điểm / 1000đ
];

// =====================================================
// LOYALTY TIER REQUIREMENTS DATA
// =====================================================
const loyaltyTierRequirementsData = [
    { tier: 'Silver', min_yearly_spent: 0 },           // Mặc định
    { tier: 'Gold', min_yearly_spent: 2000000 },       // 2 triệu/năm
    { tier: 'Platinum', min_yearly_spent: 5000000 },   // 5 triệu/năm
];

// =====================================================
// SEAT TYPE PRICES DATA
// =====================================================
const seatTypePricesData = [
    { seat_type: 'Standard', price_multiplier: 1.0, extra_fee: 0, description: 'Ghế tiêu chuẩn' },
    { seat_type: 'VIP', price_multiplier: 1.5, extra_fee: 0, description: 'Ghế VIP - vị trí tốt nhất' },
    { seat_type: 'Couple', price_multiplier: 2.0, extra_fee: 20000, description: 'Ghế đôi cho cặp đôi' },
    { seat_type: 'Wheelchair', price_multiplier: 1.0, extra_fee: 0, description: 'Ghế dành cho người khuyết tật' },
];

// =====================================================
// SCREEN TYPE PRICES DATA
// =====================================================
const screenTypePricesData = [
    { screen_type: 'Standard', base_price: 100000, description: 'Màn hình tiêu chuẩn 2D', is_active: true },
    { screen_type: 'IMAX', base_price: 150000, description: 'Màn hình IMAX - trải nghiệm hình ảnh sống động với âm thanh vòm', is_active: true },
    { screen_type: '4DX', base_price: 180000, description: 'Trải nghiệm 4D với ghế chuyển động, gió, nước, mùi hương', is_active: true },
    { screen_type: 'ScreenX', base_price: 160000, description: 'Màn hình 270 độ bao quanh 3 mặt phòng chiếu', is_active: true },
    { screen_type: 'Dolby Cinema', base_price: 200000, description: 'Công nghệ Dolby Vision và Dolby Atmos cao cấp nhất', is_active: true },
];

// =====================================================
// NEWS DATA
// =====================================================
const newsData = [
    {
        title: "Inception - Kiệt tác khoa học viễn tưởng quay trở lại màn ảnh",
        summary: "Bộ phim đình đám của Christopher Nolan sẽ được chiếu lại tại các rạp vào tuần này.",
        content: `Inception, bộ phim khoa học viễn tưởng đình đám của đạo diễn Christopher Nolan, sẽ được chiếu lại tại các rạp chiếu phim trên toàn quốc.`,
        image_url: "https://image.tmdb.org/t/p/original/ii8QGacT3MXESqBckQlyrATY0lT.jpg",
        published_at: new Date(),
        author: "Cinema News",
        is_active: true,
        is_banner: true,
        banner_order: 1,
        linkedMovieTitle: "Inception",
    },
    {
        title: "Avengers: Endgame - Kỷ nguyên kết thúc của MCU",
        summary: "Bộ phim siêu anh hùng lớn nhất mọi thời đại đang được chiếu tại rạp.",
        content: `Avengers: Endgame, bộ phim kết thúc giai đoạn 3 của Vũ trụ Điện ảnh Marvel.`,
        image_url: "https://image.tmdb.org/t/p/original/9wXPKruA6bWYk2co5ix6fH59Qr8.jpg",
        published_at: new Date(),
        author: "Cinema News",
        is_active: true,
        is_banner: true,
        banner_order: 2,
        linkedMovieTitle: "Avengers: Endgame",
    },
    {
        title: "Khuyến mãi đặc biệt: Mua 2 tặng 1 cho tất cả các suất chiếu",
        summary: "Chương trình khuyến mãi lớn nhất trong năm đang diễn ra.",
        content: `Nhân dịp kỷ niệm, hệ thống rạp chiếu phim triển khai chương trình khuyến mãi đặc biệt: Mua 2 vé tặng 1 vé cho tất cả các suất chiếu.`,
        image_url: "https://res.cloudinary.com/dblzpkokm/image/upload/v1765175198/CGV_DealJOY_1600x400_1_gu0ljn.jpg",
        published_at: new Date(),
        author: "Marketing Team",
        is_active: true,
        is_banner: true,
        banner_order: 3,
        linkedMovieTitle: null,
    },
];

// =====================================================
// SEED FUNCTIONS
// =====================================================

async function seedMovies() {
    console.log("\n🎬 Seeding Movies...");
    await MovieGenre.destroy({ where: {} });
    await Movie.destroy({ where: {} });
    
    for (const movie of moviesData) {
        await Movie.create(movie);
    }
    console.log(`✅ Created ${moviesData.length} movies`);
}

async function seedGenres() {
    console.log("\n🏷️ Seeding Genres...");
    await Genre.bulkCreate(
        genresData.map(name => ({ name })),
        { ignoreDuplicates: true }
    );
    console.log(`✅ Created ${genresData.length} genres`);
    
    // Link movies to genres
    const genreMap = new Map(
        (await Genre.findAll()).map(g => [g.name.toLowerCase(), g])
    );
    
    for (const [title, genres] of Object.entries(movieGenreMapping)) {
        const movie = await Movie.findOne({ where: { title } });
        if (!movie) continue;
        
        for (const genreName of genres) {
            const genre = genreMap.get(genreName.toLowerCase());
            if (genre) {
                await MovieGenre.findOrCreate({
                    where: { movie_id: movie.id, genre_id: genre.id }
                });
            }
        }
    }
    console.log(`✅ Linked genres to movies`);
}

async function seedCombos() {
    console.log("\n🍿 Seeding Combos...");
    await ComboItem.destroy({ where: {} });
    await Combo.destroy({ where: {} });
    
    for (const comboData of combosData) {
        const { items, ...comboInfo } = comboData;
        const combo = await Combo.create(comboInfo);
        for (const item of items) {
            await ComboItem.create({ combo_id: combo.id, ...item });
        }
    }
    console.log(`✅ Created ${combosData.length} combos`);
}

async function seedBooking() {
    console.log("\n🏢 Seeding Theaters, Rooms, Seats, Showtimes...");
    
    // Xóa các bảng có foreign key tham chiếu đến theaters trước
    await GroupBooking.destroy({ where: {} });
    
    // Theaters
    await Theater.destroy({ where: {} });
    const theaters = await Theater.bulkCreate(theatersData);
    console.log(`✅ Created ${theaters.length} theaters`);
    
    // Rooms
    await CinemaRoom.destroy({ where: {} });
    const roomsData = [];
    theaters.forEach((theater, idx) => {
        roomsData.push(
            { theater_id: theater.id, name: "Phòng 1 - Standard", seat_count: 100, screen_type: "Standard", is_active: true },
            { theater_id: theater.id, name: "Phòng 2 - IMAX", seat_count: 150, screen_type: "IMAX", is_active: true },
        );
        if (idx === 0) {
            roomsData.push({ theater_id: theater.id, name: "Phòng 3 - 4DX", seat_count: 80, screen_type: "4DX", is_active: true });
        }
    });
    const rooms = await CinemaRoom.bulkCreate(roomsData);
    console.log(`✅ Created ${rooms.length} rooms`);
    
    // Seats
    await Seat.destroy({ where: {} });
    const seatsData = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    rooms.forEach(room => {
        rows.forEach((row, rowIndex) => {
            const seatNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            seatNumbers.forEach(seatNum => {
                let seatType = "Standard";
                if (rowIndex >= 6) seatType = "VIP";
                if (rowIndex === 7 && seatNum % 2 === 0) seatType = "Couple";
                seatsData.push({
                    room_id: room.id,
                    row_label: row,
                    seat_number: String(seatNum),
                    seat_type: seatType,
                    is_active: true,
                });
            });
        });
    });
    await Seat.bulkCreate(seatsData);
    console.log(`✅ Created ${seatsData.length} seats`);
    
    // Showtimes
    await Showtime.destroy({ where: {} });
    const movies = await Movie.findAll({ limit: 5 });
    if (movies.length === 0) {
        console.warn("⚠️ No movies found! Skipping showtimes.");
        return;
    }
    
    // Lấy giá từ bảng ScreenTypePrice
    const screenTypePrices = await ScreenTypePrice.findAll();
    const screenPriceMap = {};
    screenTypePrices.forEach(sp => {
        screenPriceMap[sp.screen_type] = parseFloat(sp.base_price);
    });
    
    const showtimes = [];
    const timeSlots = [
        { hour: 9, minute: 0 },
        { hour: 11, minute: 30 },
        { hour: 14, minute: 0 },
        { hour: 16, minute: 30 },
        { hour: 19, minute: 0 },
        { hour: 21, minute: 30 },
    ];
    
    // Showtime types - all rooms can have all types
    const showtimeTypes = ['2D Phụ đề Việt', '2D Lồng tiếng Việt', '3D Phụ đề Việt', '3D Lồng tiếng Việt'];
    
    // Bắt đầu từ NGÀY MAI để đảm bảo tất cả suất chiếu đều trong tương lai
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {  // Từ ngày mai (1) đến 7 ngày sau
        timeSlots.forEach((slot, slotIdx) => {
            rooms.forEach((room, roomIdx) => {
                const startTime = new Date(today);
                startTime.setDate(startTime.getDate() + dayOffset);
                startTime.setHours(slot.hour, slot.minute, 0, 0);
                
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + 150);
                
                const movieIdx = (slotIdx + roomIdx + dayOffset) % movies.length;
                // Lấy giá từ bảng ScreenTypePrice, mặc định 100000 nếu không tìm thấy
                let basePrice = screenPriceMap[room.screen_type] || 100000;
                
                // Rotate through all showtime types for variety
                // Each slot gets a different type, cycling through all 4
                const showtimeType = showtimeTypes[(slotIdx + roomIdx + dayOffset) % showtimeTypes.length];
                
                showtimes.push({
                    movie_id: movies[movieIdx].id,
                    room_id: room.id,
                    start_time: startTime,
                    end_time: endTime,
                    base_price: basePrice,
                    showtime_type: showtimeType,
                    status: "Scheduled",
                });
            });
        });
    }
    await Showtime.bulkCreate(showtimes);
    console.log(`✅ Created ${showtimes.length} showtimes (from ${new Date(today.getTime() + 86400000).toLocaleDateString()} to ${new Date(today.getTime() + 7 * 86400000).toLocaleDateString()})`);
}

async function seedPromotions() {
    console.log("\n🎁 Seeding Promotions...");
    await Promotion.destroy({ where: {} });
    await Promotion.bulkCreate(promotionsData);
    console.log(`✅ Created ${promotionsData.length} promotions`);
}

async function seedLoyalty() {
    console.log("\n⭐ Seeding Loyalty Tier Rates & Requirements...");
    
    await LoyaltyTierRate.destroy({ where: {} });
    await LoyaltyTierRate.bulkCreate(loyaltyTierRatesData);
    console.log(`✅ Created ${loyaltyTierRatesData.length} tier rates`);
    
    await LoyaltyTierRequirement.destroy({ where: {} });
    await LoyaltyTierRequirement.bulkCreate(loyaltyTierRequirementsData);
    console.log(`✅ Created ${loyaltyTierRequirementsData.length} tier requirements`);
    
    // Seed seat type prices
    await SeatTypePrice.destroy({ where: {} });
    await SeatTypePrice.bulkCreate(seatTypePricesData);
    console.log(`✅ Created ${seatTypePricesData.length} seat type prices`);
    
    // Seed screen type prices
    await ScreenTypePrice.destroy({ where: {} });
    await ScreenTypePrice.bulkCreate(screenTypePricesData);
    console.log(`✅ Created ${screenTypePricesData.length} screen type prices`);
}

async function seedNews() {
    console.log("\n📰 Seeding News...");
    await NewsArticle.destroy({ where: {} });
    
    const movies = await Movie.findAll();
    const movieMap = {};
    movies.forEach(m => { movieMap[m.title] = m.id; });
    
    for (const newsItem of newsData) {
        const { linkedMovieTitle, ...newsFields } = newsItem;
        if (linkedMovieTitle && movieMap[linkedMovieTitle]) {
            newsFields.movie_id = movieMap[linkedMovieTitle];
        }
        await NewsArticle.create(newsFields);
    }
    console.log(`✅ Created ${newsData.length} news articles`);
}

// =====================================================
// MAIN SEED FUNCTION
// =====================================================
async function seedAll() {
    try {
        await sequelize.sync();
        console.log("🚀 Database connected!");
        console.log("=".repeat(50));
        
        await seedMovies();
        await seedGenres();
        await seedCombos();
        await seedBooking();
        await seedPromotions();
        await seedLoyalty();
        await seedNews();
        
        console.log("\n" + "=".repeat(50));
        console.log("🎉 ALL SEED DATA COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(50));
        
        console.log(`
📊 Summary:
  • Movies: ${moviesData.length}
  • Genres: ${genresData.length}
  • Combos: ${combosData.length}
  • Theaters: ${theatersData.length}
  • Promotions: ${promotionsData.length}
  • Loyalty Tiers: ${loyaltyTierRatesData.length}
  • News: ${newsData.length}
        `);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Seed Error:", error);
        process.exit(1);
    }
}

// =====================================================
// CLI HANDLER
// =====================================================
const args = process.argv.slice(2);
const option = args[0] || '--all';

(async () => {
    await sequelize.sync();
    console.log("🚀 Database connected!");
    
    switch (option) {
        case '--movies':
            await seedMovies();
            break;
        case '--genres':
            await seedGenres();
            break;
        case '--combos':
            await seedCombos();
            break;
        case '--booking':
            await seedBooking();
            break;
        case '--promotions':
            await seedPromotions();
            break;
        case '--loyalty':
            await seedLoyalty();
            break;
        case '--news':
            await seedNews();
            break;
        case '--all':
        default:
            await seedAll();
            return; // seedAll already exits
    }
    
    console.log("\n✅ Seed completed!");
    process.exit(0);
})();
