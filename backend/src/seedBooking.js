// backend/src/seedBooking.js
import { Theater } from "./models/Theater.js";
import { CinemaRoom } from "./models/CinemaRoom.js";
import Showtime from "./models/Showtime.js";
import { Seat } from "./models/Seat.js";
import { Movie } from "./models/Movie.js";
import sequelize from "./libs/db.js";

async function seedBookingData() {
  try {
    await sequelize.sync();
    console.log("✅ Database synced");

    // =====================================================
    // 1️⃣ SEED THEATERS (Khu Vực)
    // =====================================================
    console.log("\n📍 Seeding Theaters...");
    
    await Theater.destroy({ where: {} });
    
    const theaters = await Theater.bulkCreate([
      {
        name: "CGV Landmark 81",
        city: "TP.HCM",
        address: "Landmark 81, 720A Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        phone: "0283 555 0001",
        email: "cgv.landmark@cgv.vn",
        is_active: true,
      },
      {
        name: "BHD Star Cineplex",
        city: "TP.HCM",
        address: "Saigon Square, 67-71 Mạc Thị Buôn, Quận 1, TP.HCM",
        phone: "0283 555 0002",
        email: "bhd.saigon@bhd.vn",
        is_active: true,
      },
      {
        name: "Lotte Cinema",
        city: "Hà Nội",
        address: "Lotte Center Hanoi, 54 Lyuluongvan, Hoang Dieu, Hanoi",
        phone: "0243 555 0003",
        email: "lotte.hanoi@lotte.vn",
        is_active: true,
      },
      {
        name: "CGV Hanoiland",
        city: "Hà Nội",
        address: "Hanoiland, 1A Luong Van Lang, Hoan Kiem, Hanoi",
        phone: "0243 555 0004",
        email: "cgv.hanoi@cgv.vn",
        is_active: true,
      },
      {
        name: "Galaxy Cinema",
        city: "Đà Nẵng",
        address: "Hoang Gia Building, 100 Hung Vuong, Da Nang",
        phone: "0236 555 0005",
        email: "galaxy.danang@galaxy.vn",
        is_active: true,
      },
    ]);
    
    console.log(`✅ Created ${theaters.length} theaters`);

    // =====================================================
    // 2️⃣ SEED CINEMA ROOMS (Phòng Chiếu)
    // =====================================================
    console.log("\n🎬 Seeding Cinema Rooms...");
    
    await CinemaRoom.destroy({ where: {} });
    
    const rooms = await CinemaRoom.bulkCreate([
      // CGV Landmark 81 - 3 phòng
      {
        theater_id: theaters[0].id,
        name: "Phòng 1 - Standard",
        seat_count: 100,
        screen_type: "Standard",
        is_active: true,
      },
      {
        theater_id: theaters[0].id,
        name: "Phòng 2 - IMAX",
        seat_count: 150,
        screen_type: "IMAX",
        is_active: true,
      },
      {
        theater_id: theaters[0].id,
        name: "Phòng 3 - 4DX",
        seat_count: 80,
        screen_type: "4DX",
        is_active: true,
      },
      // BHD Saigon - 2 phòng
      {
        theater_id: theaters[1].id,
        name: "Phòng A - Standard",
        seat_count: 120,
        screen_type: "Standard",
        is_active: true,
      },
      {
        theater_id: theaters[1].id,
        name: "Phòng B - VIP",
        seat_count: 50,
        screen_type: "Standard",
        is_active: true,
      },
      // Lotte Hanoi - 2 phòng
      {
        theater_id: theaters[2].id,
        name: "Phòng 1 - Standard",
        seat_count: 100,
        screen_type: "Standard",
        is_active: true,
      },
      {
        theater_id: theaters[2].id,
        name: "Phòng 2 - Premium",
        seat_count: 60,
        screen_type: "IMAX",
        is_active: true,
      },
    ]);
    
    console.log(`✅ Created ${rooms.length} rooms`);

    // =====================================================
    // 3️⃣ SEED SEATS (Ghế)
    // =====================================================
    console.log("\n💺 Seeding Seats...");
    
    await Seat.destroy({ where: {} });
    
    const seatsData = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatPerRow = 12;
    
    // Tạo ghế cho mỗi phòng
    rooms.forEach(room => {
      let seatCount = Math.ceil(room.seat_count / 8); // Số ghế mỗi hàng
      
      rows.forEach((row, rowIndex) => {
        if (rowIndex >= 8) return; // Chỉ 8 hàng
        
        for (let i = 1; i <= seatPerRow; i++) {
          // Xác định loại ghế
          let seatType = "Standard";
          if (rowIndex >= 6) seatType = "VIP"; // 2 hàng cuối là VIP
          if (rowIndex === 7 && i % 2 === 0) seatType = "Couple"; // Một vài ghế Couple
          
          seatsData.push({
            room_id: room.id,
            row_label: row,
            seat_number: String(i),
            seat_type: seatType,
            is_active: true,
          });
        }
      });
    });
    
    await Seat.bulkCreate(seatsData);
    console.log(`✅ Created ${seatsData.length} seats`);

    // =====================================================
    // 4️⃣ SEED SHOWTIMES (Suất Chiếu)
    // =====================================================
    console.log("\n🎥 Seeding Showtimes...");
    
    await Showtime.destroy({ where: {} });
    
    // Lấy phim đầu tiên + một vài phim khác
    const movies = await Movie.findAll({ limit: 5 });
    if (movies.length === 0) {
      console.warn("⚠️ No movies found! Please seed movies first.");
      return;
    }

    const showtimes = [];
    const timeSlots = [
      { hour: 9, minute: 0 },    // 09:00
      { hour: 11, minute: 30 },  // 11:30
      { hour: 14, minute: 0 },   // 14:00
      { hour: 16, minute: 30 },  // 16:30
      { hour: 19, minute: 0 },   // 19:00
      { hour: 21, minute: 30 },  // 21:30
    ];

    // Tạo suất chiếu cho 7 ngày
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      timeSlots.forEach((slot, slotIdx) => {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + dayOffset);
        startTime.setHours(slot.hour, slot.minute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 150); // +2.5 hours

        // Mỗi phòng có suất chiếu với các phim khác nhau
        rooms.forEach((room, roomIdx) => {
          // Chọn phim luân phiên
          const movieIdx = (slotIdx + roomIdx + dayOffset) % movies.length;
          const movie = movies[movieIdx];
          
          // Tính giá dựa vào loại phòng
          let basePrice = 100000;
          if (room.screen_type === "IMAX") basePrice = 150000;
          if (room.screen_type === "4DX") basePrice = 180000;
          if (room.screen_type === "VIP") basePrice = 130000;
          if (room.screen_type === "Premium") basePrice = 140000;

          showtimes.push({
            movie_id: movie.id,
            room_id: room.id,
            start_time: startTime,
            end_time: endTime,
            base_price: basePrice,
            status: "Scheduled",
          });
        });
      });
    }

    await Showtime.bulkCreate(showtimes);
    console.log(`✅ Created ${showtimes.length} showtimes`);

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ SEED DATA COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log(`
📊 Summary:
  • Theaters: ${theaters.length}
  • Rooms: ${rooms.length}
  • Seats: ${seatsData.length}
  • Showtimes: ${showtimes.length}

🧪 Test API:
  GET /api/theaters
  GET /api/theaters/1/showtimes/1
  GET /api/showtimes/1/seats

📝 Sample Data:
  • Theater: "${theaters[0].name}" (${theaters[0].city})
  • Room: "${rooms[0].name}"
  • Showtime: ${showtimes[0]?.start_time?.toLocaleString('vi-VN')}
    `);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
}

seedBookingData();
