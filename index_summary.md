# CinemaApp - Tổng quan kiến trúc dự án (Cập nhật)

## 1. Backend (NodeJS + Express + Sequelize)

- Đã mô tả ở các phiên bản trước với các nhóm: controller, model, middleware, route, cấu trúc DB.

## 2. Frontend (Flutter)

**A. Cấu trúc & Luồng phát triển khuyến nghị**

- models/: Định nghĩa các object, phản hồi API.
- services/: Giao tiếp REST API (call backend, trả về model).
- providers/: State management (ChangeNotifier), quản lý logic và notify widget.
- screens/: UI layout cho từng màn hình.
- config/: Constant endpoint, param query.
- widgets/: Tổ chức các widget tái dùng.

**B. Luồng phát triển thực tiễn khởi đầu**

1. Xây dựng đăng nhập: (model + service + provider + UI)
2. Tạo navigation, handle lưu/lấy accessToken sau login
3. Sau xác thực OK → phát triển các màn hình nghiệp vụ (trang chủ, show phim, đặt vé...)

**C. Demo luồng xác thực đề xuất**

- Xây dựng AuthService call API, nhận accessToken/refreshToken.
- AuthProvider chuyển state và notify UI.
- LoginScreen kiểm tra trạng thái, hiển thị thông báo lỗi/thành công.
- Token được lưu local (shared_preferences) chuẩn bị cho các request có xác thực về sau.

**Ghi chú cho DEV**: Hãy ưu tiên hoàn thiện phần xác thực (login/register) đầu tiên để test được luồng frontend-backend. Sau đó mở rộng màn hình theo business/domain app.

---

Xem chi tiết từng function/class tại **full_function_doc.md**.
