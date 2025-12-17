import bcrypt from 'bcrypt';
import User from '../models/User.js';
import LoyaltyAccount from '../models/LoyaltyAccount.js';
import LoyaltyTierRequirement from '../models/LoyaltyTierRequirement.js';
import { uploadImage } from '../libs/cloudinary.js';

export const authMe = async (req, res) => {
    try {
        const user = req.user;

        return res.status(200).json({ user })
    } catch (error) {
        console.error("lỗi từ authMe", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Lấy thông tin profile bao gồm loyalty info
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'full_name', 'phone', 'avatar_url', 'date_of_birth', 'created_at']
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Lấy loyalty info
        let loyaltyAccount = await LoyaltyAccount.findOne({ where: { user_id: userId } });
        
        // Nếu chưa có loyalty account, tạo mới
        if (!loyaltyAccount) {
            loyaltyAccount = await LoyaltyAccount.create({
                user_id: userId,
                points: 0,
                tier: 'Silver',
                total_spent: 0,
                yearly_spent: 0,
                spent_year: new Date().getFullYear()
            });
        }
        
        // Lấy tier requirements để hiển thị progress
        const tierRequirements = await LoyaltyTierRequirement.findAll({
            order: [['min_yearly_spent', 'ASC']]
        });
        
        // Tính progress đến tier tiếp theo
        const currentYearlySpent = parseFloat(loyaltyAccount.yearly_spent) || 0;
        let nextTier = null;
        let progressPercent = 100;
        let amountToNextTier = 0;
        
        for (const tier of tierRequirements) {
            const minSpent = parseFloat(tier.min_yearly_spent);
            if (currentYearlySpent < minSpent) {
                nextTier = tier.tier;
                amountToNextTier = minSpent - currentYearlySpent;
                // Tính progress từ tier hiện tại đến tier tiếp theo
                const prevTierReq = tierRequirements.find(t => t.tier === loyaltyAccount.tier);
                const prevMinSpent = prevTierReq ? parseFloat(prevTierReq.min_yearly_spent) : 0;
                progressPercent = ((currentYearlySpent - prevMinSpent) / (minSpent - prevMinSpent)) * 100;
                break;
            }
        }
        
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                avatarUrl: user.avatar_url,
                dateOfBirth: user.date_of_birth,
                createdAt: user.created_at
            },
            loyalty: {
                points: loyaltyAccount.points,
                tier: loyaltyAccount.tier,
                totalSpent: parseFloat(loyaltyAccount.total_spent) || 0,
                yearlySpent: currentYearlySpent,
                spentYear: loyaltyAccount.spent_year,
                nextTier,
                amountToNextTier,
                progressPercent: Math.min(progressPercent, 100)
            },
            tierRequirements: tierRequirements.map(t => ({
                tier: t.tier,
                minYearlySpent: parseFloat(t.min_yearly_spent)
            }))
        });
    } catch (error) {
        console.error("lỗi từ getProfile", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Cập nhật avatar
 */
export const updateAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const { imageBase64 } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ảnh' });
        }
        
        // Upload lên Cloudinary
        const { url } = await uploadImage(imageBase64, 'cinema_app/avatars');
        
        // Cập nhật user
        await User.update(
            { avatar_url: url, updated_at: new Date() },
            { where: { id: userId } }
        );
        
        return res.status(200).json({
            message: 'Cập nhật avatar thành công',
            avatarUrl: url
        });
    } catch (error) {
        console.error("lỗi từ updateAvatar", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        
        // Lấy user với password
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }
        
        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Cập nhật
        await User.update(
            { password_hash: hashedPassword, updated_at: new Date() },
            { where: { id: userId } }
        );
        
        return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error("lỗi từ changePassword", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};