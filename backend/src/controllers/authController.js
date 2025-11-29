import bcrypt from "bcrypt"
import { User } from "../models/User.js";
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Session from "../models/Session.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { Op } from "sequelize";



const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
    try {
        const { email, password, full_name, phone, avatar_url, date_of_birth } = req.body;

        if (!email || !password || !full_name || !phone || !date_of_birth) {
            return res.status(400).json({ message: "Hãy điền đầy đủ thông tin" });
        }

        // Kiểm tra định dạng email đơn giản bằng regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }

        // Kiểm tra định dạng số điện thoại (ví dụ: chỉ gồm số và có độ dài từ 9-15)
        const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
        }

        // Kiểm tra độ dài password
        if (password.length < 8) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
        }

        // Kiểm tra định dạng password: ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
            });
        }

        // Kiểm tra duplicate email
        const duplicate = await User.findOne({ where: { email } });
        if (duplicate) {
            return res.status(409).json({ message: "Email đã tồn tại" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = await User.create({
            role_id: 1,
            email,
            password_hash: hashedPassword,
            full_name,
            phone,
            avatar_url: avatar_url || "https://res.cloudinary.com/dblzpkokm/image/upload/v1753510457/ppc92xhxybex8lhpuemr.png",
            date_of_birth
        });

        return res.status(201).json({
            message: "Tạo user thành công",
            user: {
                id: newUser.id,
                email: newUser.email,
                full_name: newUser.full_name
            }
        });

    } catch (error) {
        console.error('Lỗi khi chạy signUp', error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


export const signIn = async (req, res) => {
    try {
        const { password, email } = req.body;

        if (!password || !email) {
            return res.status(400).json({ message: "Hãy điền đầy đủ thông tin" })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(401).json({ message: "Email không hợp lệ" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Email hoặc mật khẩu sai " });
        }

        const matchPassword = await bcrypt.compare(password, user.password_hash)
        if (!matchPassword) {
            return res.status(401).json({ message: "Email hoặc mật khẩu sai " });
        }

        //accessToken
        const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

        //refreshToken
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //them vao session
        await Session.create({
            user_id: user.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL),

        })

        return res.status(201).json({
            message: "Đăng nhập thành công",
            accessToken: accessToken,
            refreshToken: refreshToken
        })


    } catch (error) {
        console.error('Lỗi khi chạy signIn', error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken)
            return res.status(401).json({ message: "Thiếu refresh token" });

        const matchSession = await Session.findOne({
            where: {
                refresh_token: refreshToken,
                expires_at: { [Op.gt]: new Date() }
            }
        })
        if (!matchSession)
            return res.status(401).json({ message: "Refresh token không hợp lệ hoặc hết hạn" });

        const user = await User.findByPk(matchSession.user_id);
        if (!user)
            return res.status(401).json({ message: "Người dùng không tồn tại" })

        const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

        return res.status(200).json({
            accessToken
        });

    } catch (error) {
        console.error("Lỗi khi chạy refreshToken", error);
        res.status(500).json({ message: "Lỗi hệ thống" })
    }
};

export const signOut = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access token không hợp lệ" });
        }

        const accessToken = authHeader.split(" ")[1];
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Thiếu refresh token" });
        }

        const decodeToken = jwt.decode(accessToken);
        if (!decodeToken || !decodeToken.exp) {
            return res.status(400).json({ message: "Access token không hợp lệ" });
        }

        const expiresAt = new Date(decodeToken.exp * 1000);

       
        await TokenBlacklist.findOrCreate({
            where: { token: accessToken },
            defaults: {
                expires_at: expiresAt
            }
        });

        await Session.destroy({ where: { refresh_token: refreshToken } });

        return res.status(200).json({ message: "Đăng xuất thành công" });

    } catch (error) {
        console.log("Lỗi khi chạy logOut", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
