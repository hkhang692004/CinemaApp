import dotenv from 'dotenv';

dotenv.config();

// VNPay Sandbox credentials (từ https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/)
export const VNPAY_CONFIG = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET ,
    vnp_Url: process.env.VNPAY_URL ,
    // Dùng ngrok URL cho development - VNPay sẽ callback về đây
    vnp_ReturnUrl: 'https://5a70278cded3.ngrok-free.app/api/payment/vnpay-return',
};

export default VNPAY_CONFIG;
