import express from "express";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js"; // import sequelize instance
import authRoute from "../src/routes/authRoute.js";
import userRoute from "../src/routes/userRoute.js";
import movieRoute from "../src/routes/movieRoute.js";
import newsRoute from "../src/routes/newsRoute.js";
import theaterRoute from "../src/routes/theaterRoute.js";
import showtimeRoute from "../src/routes/showtimeRoute.js";
import reservationRoute from "../src/routes/reservationRoute.js";
import comboRoute from "../src/routes/comboRoute.js";
import paymentRoute from "../src/routes/paymentRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { initShowtimeStatusJob, initReservationExpiryJob, initTokenCleanupJob, initOrderExpiryJob, initYearlyResetJob } from "./jobs/updateShowtimeStatus.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
//public route

app.use("/api/auth", authRoute);
// Payment route - có cả public và protected routes (xử lý trong route file)
app.use("/api/payment", paymentRoute);

//authmidlleware
app.use(protectedRoute);
//private route

app.use("/api/users", userRoute);
app.use("/api/movies", movieRoute);
app.use("/api/news", newsRoute);
app.use("/api/theaters",theaterRoute);
app.use("/api/showtimes",showtimeRoute);
app.use("/api/reservations",reservationRoute);
app.use("/api/combos",comboRoute);

async function startServer() {
  try {

    // Đồng bộ các model với DB
    // Dùng { force: true } lần đầu nếu cần reset DB
    // Dùng { alter: true } khi cần cập nhật schema (có thể gây lỗi duplicate keys)
    // Dùng {} để chỉ sync mà không thay đổi gì
    await sequelize.sync();

    // Initialize cron job for updating showtime status
    initShowtimeStatusJob();
    
    // Initialize cron job for expiring old reservations
    initReservationExpiryJob();
    
    // Initialize cron job for cleaning up expired tokens
    initTokenCleanupJob();
    
    // Initialize cron job for expiring pending orders
    initOrderExpiryJob();
    
    // Initialize cron job for yearly loyalty reset
    initYearlyResetJob();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khi kết nối hoặc tạo bảng:", error);
  }
}

startServer();
