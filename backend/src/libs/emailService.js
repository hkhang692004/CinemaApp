import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email gửi từ - đã verify trên SendGrid
const FROM_EMAIL = 'absolutecinema.noreply@gmail.com';
const FROM_NAME = 'Absolute Cinema';

export const emailService = {
    async sendMail({ to, subject, html, attachments }) {
        try {
            const msg = {
                to,
                from: {
                    email: FROM_EMAIL,
                    name: FROM_NAME
                },
                subject,
                html,
            };

            // Thêm attachments nếu có (cho inline images với CID)
            if (attachments && attachments.length > 0) {
                msg.attachments = attachments;
            }

            const response = await sgMail.send(msg);
            console.log('Email sent successfully:', response[0].statusCode);
            return response;
        } catch (err) {
            console.error('Lỗi gửi email:', err.response?.body || err.message);
            throw err;
        }
    }
};

export default emailService;
