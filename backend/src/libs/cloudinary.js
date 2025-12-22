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
 * @param {object} options - Tùy chọn transformation
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadImage = async (base64Image, folder = 'cinema_app/avatars', options = {}) => {
    try {
        const defaultTransformation = [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
        ];

        const result = await cloudinary.uploader.upload(base64Image, {
            folder,
            transformation: options.transformation || defaultTransformation
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
 * Upload poster phim lên Cloudinary
 */
export const uploadMoviePoster = async (base64Image) => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'cinema_app/posters',
            transformation: [
                { width: 500, height: 750, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload poster error:', error);
        throw new Error('Lỗi upload poster');
    }
};

/**
 * Upload backdrop phim lên Cloudinary
 */
export const uploadMovieBackdrop = async (base64Image) => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'cinema_app/backdrops',
            transformation: [
                { width: 1280, height: 720, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload backdrop error:', error);
        throw new Error('Lỗi upload backdrop');
    }
};

/**
 * Upload ảnh rạp chiếu lên Cloudinary
 */
export const uploadTheaterImage = async (base64Image) => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'cinema_app/theaters',
            transformation: [
                { width: 800, height: 450, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload theater image error:', error);
        throw new Error('Lỗi upload ảnh rạp');
    }
};

/**
 * Upload ảnh tin tức/banner lên Cloudinary
 */
export const uploadNewsImage = async (base64Image) => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'cinema_app/news',
            transformation: [
                { width: 1920, height: 600, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload news image error:', error);
        throw new Error('Lỗi upload ảnh tin tức');
    }
};

/**
 * Upload ảnh combo lên Cloudinary
 */
export const uploadComboImage = async (base64Image) => {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'cinema_app/combos',
            transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload combo image error:', error);
        throw new Error('Lỗi upload ảnh combo');
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
