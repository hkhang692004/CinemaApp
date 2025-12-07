import bcrypt from "bcrypt";
import crypto from "crypto";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
import Session from "../models/Session.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

// config mail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

export const authService = {
  async signUp(data) {
    const { email, password, full_name, phone, avatar_url, date_of_birth } =
      data;
    if (!email || !password || !full_name || !phone || !date_of_birth) {
      throw new Error("Hãy điền đầy đủ thông tin");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Email không hợp lệ");
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) throw new Error("Số điện thoại không hợp lệ");
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error(
        "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và ký tự đặc biệt"
      );
    }
    const duplicate = await User.findOne({ where: { email } });
    if (duplicate) throw new Error("Email đã tồn tại");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      role_id: 1,
      email,
      password_hash: hashedPassword,
      full_name,
      phone,
      avatar_url:
        avatar_url ||
        "https://res.cloudinary.com/dblzpkokm/image/upload/v1753510457/ppc92xhxybex8lhpuemr.png",
      date_of_birth,
    });
    return {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
    };
  },

  async signIn(data) {
    const { email, password } = data;
    if (!email || !password) throw new Error("Thiếu email hoặc mật khẩu");

    const user = await User.findOne({ where: { email ,role_id: 1 } });
    if (!user) throw new Error("Email hoặc mật khẩu sai");

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error("Email hoặc mật khẩu sai");

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    return { accessToken, refreshToken };
  },

  async refreshToken(token) {
    if (!token) throw new Error("Thiếu refresh token");
    const matchSession = await Session.findOne({
      where: {
        refresh_token: token,
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!matchSession)
      throw new Error("Refresh token không hợp lệ hoặc hết hạn");
    const user = await User.findByPk(matchSession.user_id);
    if (!user) throw new Error("Người dùng không tồn tại");

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    return { accessToken };
  },

  async signOut(accessToken, refreshToken) {
    if (!accessToken || !refreshToken)
      throw new Error("Thiếu access token hoặc refresh token");
    const decodeToken = jwt.decode(accessToken);
    if (!decodeToken || !decodeToken.exp)
      throw new Error("Access token không hợp lệ");
    const expiresAt = new Date(decodeToken.exp * 1000);
    await TokenBlacklist.findOrCreate({
      where: { token: accessToken },
      defaults: { expires_at: expiresAt },
    });
    await Session.destroy({ where: { refresh_token: refreshToken } });
    return true;
  },

  async sendResetOTP(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp_code = otp;
    user.otp_expires = new Date(Date.now() + 2 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: "Absolute Cinema <absolutecinema.noreply@gmail.com>",
      to: email,
      subject: "Mã OTP khôi phục mật khẩu",
      html: `
        <p>Xin chào ${user.full_name},</p>
        <h2>${otp}</h2>
        <p>Mã có hiệu lực trong 2 phút</p>
      `,
    });

    return true;
  },

  async resetPassword({ email, otp, newPassword }) {
    const user = await User.findOne({ where: { email, otp_code: otp } });
    if (!user) throw new Error("Email hoặc OTP không đúng");
    if (user.otp_expires < new Date()) throw new Error("Mã OTP đã hết hạn");
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword))
      throw new Error("Mật khẩu không đủ mạnh");

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.otp_code = null;
    user.otp_expires = null;
    await user.save();
    return true;
  },
};
