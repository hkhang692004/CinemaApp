import express from "express";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js"; // import sequelize instance

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

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
