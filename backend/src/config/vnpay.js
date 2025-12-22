import dotenv from 'dotenv';

dotenv.config();

// VNPay Sandbox credentials (từ https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/)
export const VNPAY_CONFIG = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET ,
    vnp_Url: process.env.VNPAY_URL ,
    // Dùng environment variable cho Return URL
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'https://cinemaapp-gkkn.onrender.com/api/payment/vnpay-return',
};

export default VNPAY_CONFIG;
