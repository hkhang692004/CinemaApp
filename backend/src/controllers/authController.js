import { authService } from "../services/authService.js";

export const signUp = async (req, res) => {
  try {
    const user = await authService.signUp(req.body);
    return res.status(201).json({ message: "Tạo user thành công", user });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await authService.signIn({
      email,
      password,
    });
    return res
      .status(201)
      .json({ message: "Đăng nhập thành công", accessToken, refreshToken });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Access token không hợp lệ" });
    const accessToken = authHeader.split(" ")[1];
    const { refreshToken } = req.body;
    await authService.signOut(accessToken, refreshToken);
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.sendResetOTP(email);
    return res
      .status(200)
      .json({ message: "Mã OTP đã được gửi đến email của bạn" });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const verifyOTPandReset = async (req, res) => {
  try {
    await authService.resetPassword(req.body);
    return res
      .status(200)
      .json({ message: "Mật khẩu đã được khôi phục thành công" });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Lỗi hệ thống" });
  }
};
