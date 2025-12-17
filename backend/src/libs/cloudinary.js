import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload ảnh lên Cloudinary
 * @param {string} base64Image - Ảnh base64 hoặc URL
 * @param {string} folder - Thư mục lưu trên Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadImage = async (base64Image, folder = 'cinema_app/avatars') => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Lỗi upload ảnh');
    }
};

/**
 * Xóa ảnh từ Cloudinary
 * @param {string} publicId - Public ID của ảnh
 */
export const deleteImage = async (publicId) => {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

export default cloudinary;
