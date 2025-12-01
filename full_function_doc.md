# CinemaApp - Chi tiết Class, Function, Property nổi bật (Update)

## BACKEND (NodeJS) — không thay đổi, xem phần trước

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

### Models (Sequelize) - Xem models/\*

- **User**: userId, email, password_hash, ...
- **Session**: user session & refresh token
- **TokenBlacklist**: token đã vô hiệu hóa
- **Các model khác**: Movie, Theater, Seat, Ticket, Payment ... (theo domain rạp chiếu phim)

### Database

- **libs/db.js**: Khởi tạo kết nối Sequelize từ biến môi trường

### Routes

- **routes/authRoute.js**: /api/auth/\* (post: signup, signin, refresh-token, signout)
- **routes/userRoute.js**: /api/users/me

---

## FRONTEND (Flutter) — cập nhật hướng dẫn thực tiễn

### main.dart

- **main**: Bọc root widget với ChangeNotifierProvider, inject AuthProvider toàn app.

### app.dart

- **App**: Widget gốc load MaterialApp > LoginScreen

### config/api_config.dart

- **ApiConfig**: Static endpoint API và timeout

### models/User.dart

- **UserModel**: id, email, fullName, phone, ... + fromJson, toJson

### models/auth_response.dart

- **AuthResponse**: Model mapping response đăng nhập API.
  - fromJson(Map): Parse Response JSON

### providers/auth_provider.dart

- **AuthProvider extends ChangeNotifier**:
  - Field: `loading`, `error`, `token`
  - Method: `Future<void> login(email, password)`: Gọi AuthService.login, set state, notifyListeners;
  - Hướng dẫn: Có thể phát triển thêm (logout, auto login từ local, ...)

### services/auth_service.dart

- **AuthService**:
  - `Future<AuthResponse> signIn(String email, String password)`: Call API/sign-in, trả về AuthResponse (accessToken, thông báo, ...)
  - Hướng dẫn: Tạo tiếp các method signUp, refreshToken, signOut tương tự (call các endpoint backend có sẵn).

### screens/login_screen.dart

- **LoginScreen**: UI/layout form login, nhận state từ AuthProvider, hiển thị lỗi/thành công/loading qua Consumer/Provider.of.

### main.dart

- **main**: Bọc root widget với ChangeNotifierProvider, inject AuthProvider toàn app.

---

**Mô hình phát triển chuẩn:**

- Object (model) — REST API Service — State Provider — UI Screen
- Ưu tiên xác thực đầu tiên, template các chức năng khác phát triển tương tự.

**Ví dụ mô tả function login:**

```dart
Future<void> login(email, password) async {
  loading = true; error = null; notifyListeners();
  // Gọi AuthService.signIn()
  // Nếu thành công: lưu accessToken, chuyển trạng thái app
  // Nếu lỗi: error = message
  loading = false; notifyListeners();
}
```

> Lưu ý: Luồng xác thực là xương sống đầu app. Sau khi hoàn thiện, tất cả navigation/bảo vệ màn hình đều dựa vào AuthProvider/token.

---

**Tips**: Cứ mỗi khi backend bổ sung endpoint mới chỉ cần tạo:

- model mapping mới
- bổ sung function vào service/provider
- tạo UI tương ứng
