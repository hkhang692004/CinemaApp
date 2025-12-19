import express from "express";
import http from "http";
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
import groupBookingRoute from "../src/routes/groupBookingRoute.js";
import managerTheaterRoute from "../src/routes/managerTheaterRoute.js";
import dashboardRoute from "../src/routes/dashboardRoute.js";
import reportRoute from "../src/routes/reportRoute.js";
import managerRoute from "../src/routes/managerRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { initShowtimeStatusJob, initReservationExpiryJob, initTokenCleanupJob, initOrderExpiryJob, initYearlyResetJob, initDailyStatsJob } from "./jobs/updateShowtimeStatus.js";
import cors from 'cors';
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.io
initSocket(server);

app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));
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
app.use("/api/group-bookings",groupBookingRoute);
app.use("/api/manager-theaters",managerTheaterRoute);
app.use("/api/dashboard",dashboardRoute);
app.use("/api/reports",reportRoute);
app.use("/api/managers",managerRoute);

async function startServer() {
  try {

    
    await sequelize.sync({});

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
    
    // Initialize cron job for daily statistics aggregation
    initDailyStatsJob();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
      console.log(`🔌 WebSocket ready`);
    });
  } catch (error) {
    console.error("Lỗi khi kết nối hoặc tạo bảng:", error);
  }
}

startServer();
