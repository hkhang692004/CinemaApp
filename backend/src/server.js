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
import promotionRoute from "../src/routes/promotionRoute.js";
import loyaltyRoute from "../src/routes/loyaltyRoute.js";
import orderRoute from "../src/routes/orderRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { initShowtimeStatusJob, initReservationExpiryJob, initTokenCleanupJob, initOrderExpiryJob, initYearlyResetJob } from "./jobs/updateShowtimeStatus.js";
import cors from 'cors';
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.io
initSocket(server);

// CORS config - allow multiple origins
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://cinemaapp-gkkn.onrender.com',
    'https://cinema-app-lovat-xi.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.CLIENT_URL === '*') {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for now
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
//public route

app.use("/api/auth", authRoute);
// Payment route 
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
app.use("/api/promotions",promotionRoute);
app.use("/api/loyalty",loyaltyRoute);
app.use("/api/orders",orderRoute);

async function startServer() {
  try {

    
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
    
    // Daily statistics now updated realtime in paymentService when payment success

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
      console.log(`🔌 WebSocket ready`);
    });
  } catch (error) {
    console.error("Lỗi khi kết nối hoặc tạo bảng:", error);
  }
}

startServer();
