import jwt from 'jsonwebtoken';
import User from '../models/User.js'
import  TokenBlacklist  from '../models/TokenBlacklist.js';
import Role from '../models/Role.js';
import { Op } from 'sequelize';

export const protectedRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer '))
            return res.status(401).json({ message: "Access token không hợp lệ" });

        const token = authHeader.split(" ")[1];

        // blacklist
        const blacklist = await TokenBlacklist.findOne({
            where: {
                token,
                expires_at: { [Op.gt]: new Date() }
            }
        });

        if (blacklist) {
            return res.status(401).json({ message: "Token đã bị vô hiệu hóa" });
        }

        // verify token
        let decodedUser;
        try {
            decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Access token không hợp lệ hoặc hết hạn" });
        }

        // user
        const user = await User.findByPk(decodedUser.userId, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!user)
            return res.status(404).json({ message: "Người dùng không tồn tại" });

        
        req.user = user;

        next();

    } catch (error) {
        console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Middleware kiểm tra role admin
export const adminOnly = async (req, res, next) => {
    try {
        const role = await Role.findByPk(req.user.role_id);
        
        if (!role || role.name !== 'admin') {
            return res.status(403).json({ message: "Chỉ admin mới có quyền thực hiện" });
        }
        
        next();
    } catch (error) {
        console.error("Lỗi adminOnly middleware:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Middleware kiểm tra role admin hoặc manager
export const adminOrManager = async (req, res, next) => {
    try {
        const role = await Role.findByPk(req.user.role_id);
        
        if (!role || (role.name !== 'admin' && role.name !== 'manager')) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập" });
        }
        
        req.userRole = role.name;
        next();
    } catch (error) {
        console.error("Lỗi adminOrManager middleware:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
