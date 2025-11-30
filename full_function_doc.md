# CinemaApp - Chi tiết Class, Function, Property nổi bật

## 1. BACKEND (NodeJS)

### Controllers
- **authController.js**
  - signUp: Đăng ký người dùng, kiểm tra định dạng/các trường hợp đặc biệt, trả về user.
  - signIn: Xác thực người dùng, trả JWT + refreshToken.
  - refreshToken: Cấp accessToken mới qua refresh token.
  - signOut: Đăng xuất, blacklist access token, xóa session refreshToken.
- **userController.js**
  - authMe: Lấy thông tin user từ req.user (qua middleware)

### Middleware
- **authMiddleware.js > protectedRoute**: Kiểm tra access token hợp lệ, loại bỏ token blacklist, thêm user vào req

### Models (Sequelize) - Xem models/*
- **User**: userId, email, password_hash, ...
- **Session**: user session & refresh token
- **TokenBlacklist**: token đã vô hiệu hóa
- **Các model khác**: Movie, Theater, Seat, Ticket, Payment ... (theo domain rạp chiếu phim)

### Database
- **libs/db.js**: Khởi tạo kết nối Sequelize từ biến môi trường

### Routes
- **routes/authRoute.js**: /api/auth/* (post: signup, signin, refresh-token, signout)
- **routes/userRoute.js**: /api/users/me

---

## 2. FRONTEND (Flutter)

### main.dart
- **main**: Khởi động Provider + App

### app.dart
- **App**: Widget gốc load MaterialApp > LoginScreen

### config/api_config.dart
- **ApiConfig**: Static endpoint API và timeout

### models/User.dart
- **UserModel**: id, email, fullName, phone, ... + fromJson, toJson
### models/auth_response.dart
- **AuthResponse**: message, accessToken, refreshToken, user + fromJson

### providers/auth_provider.dart
- **AuthProvider**: (Hiện chưa có code, dự kiến quản lý trạng thái xác thực)

### services/auth_service.dart
- **AuthService**: (Chưa có function, dự phòng cho dịch vụ xác thực với backend)

### screens/login_screen.dart
- **LoginScreen**: (Chưa có code - màn hình đăng nhập)

---

> **Chú ý:**
- Các file chưa triển khai method/class cụ thể vẫn ghi chú để tránh bỏ sót khi phát triển hoặc review.
- Bổ sung thêm các function mới vào file này khi mở rộng nghiệp vụ!
