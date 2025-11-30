# CinemaApp - Tổng quan kiến trúc dự án

## 1. Backend (NodeJS + Express + Sequelize)

**Các nhóm thành phần:**
- **controllers/**: Xử lý logic cho API (ví dụ: authController, userController)
- **models/**: ORM Sequelize, ánh xạ bảng dữ liệu (User, Ticket, Session, Movie, ...)
- **routes/**: Định nghĩa endpoint API (authRoute, userRoute)
- **middlewares/**: Các hàm xử lý trước/sau vào controller (authMiddleware)
- **libs/db.js**: Cấu hình kết nối DB với Sequelize
- **server.js**: Entry point, cấu hình express, đăng ký route + middleware + khởi động server

**Các Model chủ đạo:**
  - User, Role, Session, TokenBlacklist
  - Ticket, Order, Payment, Promotion
  - Movie, Genre, Theater, CinemaRoom, Seat, Showtime
  - LoyaltyAccount, LoyaltyPointsTransaction, LoyaltyTierRate, LoyaltyTierRequirement
  - Combo, ComboItem, ComboOrder, GroupBooking, Invoice, NewsArticle, NewsMovieLink, DailyStatistic

**Các Controller:**
  - authController: Đăng ký, đăng nhập, refresh, logout
  - userController: authMe (profile)

**Route chính:**
  - /api/auth (signup, signin, refresh-token, signout)
  - /api/users (me - profile user)

**Middleware:**
  - protectedRoute: xác thực JWT, kiểm tra blacklist


## 2. Frontend (Flutter)

**Các nhóm thành phần:**
- **main.dart, app.dart:** Khởi động app, tạo Provider gốc
- **config/**: Cấu hình API endpoint (api_config.dart)
- **models/**: Định nghĩa data model (UserModel, AuthResponse, ...)
- **providers/**: Quản lý state/lifecycle (AuthProvider...)
- **screens/**: Các màn hình UI (login_screen.dart...)
- **services/**: Giao tiếp REST API (AuthService...)
- **widgets/**: Widget dùng lại
- **storage/**, **utils/**: Dự phòng features hệ thống con

**Luồng tổng quan:**
- App khởi động với Provider -> MaterialApp -> LoginScreen
- Tích hợp backend qua AuthService/API

---

> **Xem chi tiết function/class ở file full_function_doc.md**
> (Có thể cập nhật thêm khi mở rộng nghiệp vụ/new features)
