import express from "express";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js"; // import sequelize instance
import authRoute from "../src/routes/authRoute.js";
import userRoute from "../src/routes/userRoute.js";
import movieRoute from "../src/routes/movieRoute.js";
import newsRoute from "../src/routes/newsRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
//public route

app.use("/api/auth", authRoute);
//authmidlleware
app.use(protectedRoute);
//private route

app.use("/api/users", userRoute);
app.use("/api/movies", movieRoute);
app.use("/api/news", newsRoute);

async function startServer() {
  try {

    // Đồng bộ các model với DB (tạo bảng nếu chưa có)
    await sequelize.sync({ alter: true }); // hoặc { force: true } để xóa tạo lại bảng

    app.listen(PORT, () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khi kết nối hoặc tạo bảng:", error);
  }
}

startServer();
