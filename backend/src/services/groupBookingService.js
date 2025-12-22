import GroupBooking from '../models/GroupBooking.js';
import { Theater } from '../models/Theater.js';
import User from '../models/User.js';
import { Showtime } from '../models/Showtime.js';
import { CinemaRoom } from '../models/CinemaRoom.js';
import { Seat } from '../models/Seat.js';
import { SeatReservation } from '../models/SeatReservation.js';
import Movie from '../models/Movie.js';
import DailyStatistic from '../models/DailyStatistic.js';
import Promotion from '../models/Promotion.js';
import { Op } from 'sequelize';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { emitToAll, SOCKET_EVENTS } from '../socket.js';

// Config mail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD,
    },
});

// Tạo booking code unique
function generateBookingCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GRP-${timestamp}-${random}`;
}

// Gửi email xác nhận Group Booking
async function sendGroupBookingConfirmationEmail(booking, showtime, seats, theater) {
    const bookingCode = booking.booking_code || generateBookingCode();
    
    // Update booking code nếu chưa có
    if (!booking.booking_code) {
        await GroupBooking.update({ booking_code: bookingCode }, { where: { id: booking.id } });
    }

    // Format seats
    const seatList = seats && seats.length > 0 
        ? seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')
        : 'Toàn bộ phòng chiếu';

    // Format date time
    const showDate = showtime ? new Date(showtime.start_time).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) : booking.preferred_date;

    const showTime = showtime ? new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Theo lịch hẹn';

    const movieTitle = showtime?.Movie?.title || 'Chương trình chiếu riêng';
    const roomName = showtime?.CinemaRoom?.name || 'Theo sắp xếp';
    const theaterName = theater?.name || 'Theo sắp xếp';
    const theaterAddress = theater?.address || '';

    // QR Code data (có thể dùng thư viện QR sau, bây giờ dùng link tạo QR online)
    const qrData = JSON.stringify({
        type: 'GROUP_BOOKING',
        code: bookingCode,
        bookingId: booking.id,
        guestCount: booking.guest_count
    });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    const serviceTypeLabels = {
        'group_booking': 'Đặt vé nhóm',
        'private_show': 'Chiếu phim riêng',
        'hall_rental': 'Thuê hội trường',
        'voucher': 'Voucher doanh nghiệp'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e50914, #b81d24); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎬 ABSOLUTE CINEMA</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Xác nhận đặt chỗ thành công</p>
            <span style="display: inline-block; background: #28a745; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-top: 15px;">✓ ĐÃ XÁC NHẬN</span>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <!-- Booking Code -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
                <p style="margin: 5px 0 0; opacity: 0.9;">Mã đặt chỗ của bạn</p>
                <h2 style="margin: 0; font-size: 32px; letter-spacing: 3px;">${bookingCode}</h2>
            </div>

            <!-- QR Code -->
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; margin-bottom: 25px;">
                <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" style="border: 4px solid white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
                <p style="color: #666; margin-top: 10px; font-size: 14px;">📱 Quét mã QR này tại quầy để check-in</p>
            </div>

            <!-- Service Info -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px; color: #e50914; font-size: 18px;">🎫 Thông tin dịch vụ</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Loại dịch vụ</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${serviceTypeLabels[booking.service_type] || 'Đặt vé nhóm'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Số lượng khách</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${booking.guest_count} người</td>
                    </tr>
                    ${showtime ? `
                    <tr>
                        <td style="padding: 10px 0; color: #666;">Phim</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${movieTitle}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <!-- Location Info -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px; color: #e50914; font-size: 18px;">📍 Thời gian & Địa điểm</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Ngày chiếu</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${showDate}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Giờ chiếu</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${showTime}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Rạp chiếu</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${theaterName}</td>
                    </tr>
                    ${theaterAddress ? `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Địa chỉ</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${theaterAddress}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 10px 0; color: #666;">Phòng chiếu</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${roomName}</td>
                    </tr>
                </table>
                ${seats && seats.length > 0 ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong style="color: #856404;">🪑 Ghế đã đặt:</strong> ${seatList}
                </div>
                ` : ''}
            </div>

            ${booking.final_price ? `
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <p style="margin: 5px 0 0; color: #666;">Tổng thanh toán</p>
                <div style="font-size: 28px; font-weight: bold; color: #155724;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.final_price)}</div>
                <p style="margin: 5px 0 0; color: #666;">Vui lòng thanh toán trước khi đến rạp</p>
            </div>
            ` : ''}

            <!-- Notes -->
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;">
                <p style="margin: 0 0 8px; color: #004085;"><strong>📌 Lưu ý quan trọng:</strong></p>
                <p style="margin: 0 0 5px; color: #004085;">• Vui lòng đến trước giờ chiếu 15-30 phút để làm thủ tục</p>
                <p style="margin: 0 0 5px; color: #004085;">• Xuất trình mã QR hoặc mã đặt chỗ tại quầy</p>
                <p style="margin: 0; color: #004085;">• Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #333; color: white; padding: 25px; text-align: center;">
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">Cảm ơn quý khách đã sử dụng dịch vụ của Absolute Cinema!</p>
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">Mọi thắc mắc vui lòng liên hệ: <a href="mailto:support@absolutecinema.vn" style="color: #e50914; text-decoration: none;">support@absolutecinema.vn</a></p>
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">© ${new Date().getFullYear()} Absolute Cinema. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"Absolute Cinema" <${process.env.APP_EMAIL}>`,
        to: booking.email,
        subject: `[Absolute Cinema] Xác nhận đặt chỗ - ${bookingCode}`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Group booking confirmation email sent to ${booking.email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId, bookingCode };
    } catch (error) {
        console.error(`❌ Failed to send confirmation email:`, error.message);
        return { success: false, error: error.message, bookingCode };
    }
}

// Gửi email thông báo từ chối hoặc hủy
async function sendRejectionEmail(booking, reason, isRejected = true) {
    const serviceTypeLabels = {
        'group_booking': 'Đặt vé nhóm',
        'private_show': 'Chiếu phim riêng',
        'hall_rental': 'Thuê hội trường',
        'voucher': 'Voucher doanh nghiệp'
    };

    const statusLabel = isRejected ? 'Từ chối' : 'Hủy bỏ';
    const statusColor = isRejected ? '#dc3545' : '#6c757d';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: ${statusColor}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎬 ABSOLUTE CINEMA</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Thông báo về yêu cầu của bạn</p>
            <span style="display: inline-block; background: white; color: ${statusColor}; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-top: 15px; font-weight: bold;">
                ${isRejected ? '✗ ĐÃ TỪ CHỐI' : '✗ ĐÃ HỦY'}
            </span>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Xin chào <strong>${booking.full_name}</strong>,</p>
            
            <p style="color: #666; line-height: 1.6;">
                Chúng tôi rất tiếc phải thông báo rằng yêu cầu <strong>${serviceTypeLabels[booking.service_type] || 'Đặt vé nhóm'}</strong> 
                của bạn đã được <strong style="color: ${statusColor};">${statusLabel.toLowerCase()}</strong>.
            </p>

            <!-- Request Info -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">📋 Thông tin yêu cầu</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Loại dịch vụ</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${serviceTypeLabels[booking.service_type] || 'Đặt vé nhóm'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: #666;">Số lượng khách</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${booking.guest_count} người</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">Ngày yêu cầu</td>
                        <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">${booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <!-- Reason -->
            ${reason ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px;">📝 Lý do</h3>
                <p style="margin: 0; color: #856404; line-height: 1.6;">${reason}</p>
            </div>
            ` : ''}

            <!-- Contact -->
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc; margin-top: 20px;">
                <p style="margin: 0; color: #004085;">
                    Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline <strong>1900-xxxx</strong> 
                    hoặc email <a href="mailto:support@absolutecinema.vn" style="color: #0066cc;">support@absolutecinema.vn</a>.
                </p>
            </div>

            <p style="color: #666; margin-top: 20px;">
                Chúng tôi rất tiếc về sự bất tiện này và mong được phục vụ bạn trong tương lai.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #333; color: white; padding: 25px; text-align: center;">
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">Absolute Cinema - Trải nghiệm điện ảnh đỉnh cao</p>
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">© ${new Date().getFullYear()} Absolute Cinema. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"Absolute Cinema" <${process.env.APP_EMAIL}>`,
        to: booking.email,
        subject: `[Absolute Cinema] Yêu cầu của bạn đã được ${statusLabel.toLowerCase()}`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Rejection email sent to ${booking.email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send rejection email:`, error.message);
        return { success: false, error: error.message };
    }
}

// Generate random 5 characters (letters and numbers)
function generateRandom5Chars() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Tạo voucher cho doanh nghiệp
async function createEnterpriseVouchers(booking, voucherData) {
    const { 
        custom_prefix = '',
        quantity = 1, 
        discount_type = 'Percentage', 
        discount_value = 10,
        valid_days = 30,
        max_discount = null,
        usage_per_code = 1
    } = voucherData;

    // ===== VALIDATION =====
    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
        throw new Error('Số lượng voucher phải từ 1 đến 100');
    }

    // Validate discount_type
    if (!['Percentage', 'FixedAmount'].includes(discount_type)) {
        throw new Error('Loại giảm giá không hợp lệ');
    }

    // Validate discount_value
    const discountVal = parseFloat(discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
        throw new Error('Giá trị giảm giá phải lớn hơn 0');
    }
    if (discount_type === 'Percentage' && discountVal > 100) {
        throw new Error('Phần trăm giảm không được vượt quá 100%');
    }
    if (discount_type === 'FixedAmount' && discountVal > 10000000) {
        throw new Error('Số tiền giảm không được vượt quá 10.000.000đ');
    }

    // Validate valid_days
    const days = parseInt(valid_days);
    if (isNaN(days) || days < 1 || days > 365) {
        throw new Error('Số ngày hiệu lực phải từ 1 đến 365');
    }

    // Validate usage_per_code
    const usageLimit = parseInt(usage_per_code);
    if (isNaN(usageLimit) || usageLimit < 1 || usageLimit > 1000) {
        throw new Error('Số lần sử dụng/mã phải từ 1 đến 1000');
    }

    // Validate max_discount (if percentage)
    let maxDiscount = null;
    if (discount_type === 'Percentage' && max_discount) {
        maxDiscount = parseFloat(max_discount);
        if (isNaN(maxDiscount) || maxDiscount <= 0) {
            throw new Error('Giảm tối đa phải lớn hơn 0');
        }
    }

    // Validate prefix length
    const prefix = custom_prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (prefix.length > 20) {
        throw new Error('Prefix không được quá 20 ký tự');
    }
    // ===== END VALIDATION =====

    const vouchers = [];
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + days);

    for (let i = 0; i < qty; i++) {
        let code;
        let attempts = 0;
        
        // Generate code: ABS-XXXXX or ABS-PREFIX-XXXXX
        do {
            const randomPart = generateRandom5Chars();
            if (prefix) {
                // With custom prefix: ABS-PREFIX-XXXXX
                code = `ABS-${prefix}-${randomPart}`;
            } else {
                // Without prefix: ABS-XXXXX
                code = `ABS-${randomPart}`;
            }
            const existing = await Promotion.findOne({ where: { code } });
            if (!existing) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            throw new Error('Không thể tạo mã voucher duy nhất. Vui lòng thử lại.');
        }

        // Create promotion in database
        const promotion = await Promotion.create({
            code,
            name: `Voucher DN - ${booking.company_name || booking.full_name}${qty > 1 ? ` #${i + 1}` : ''}`,
            description: `Voucher doanh nghiệp từ yêu cầu #${booking.id}`,
            discount_type,
            discount_value: discountVal,
            max_discount: discount_type === 'Percentage' ? maxDiscount : null,
            usage_limit: usageLimit,
            usage_per_user: usageLimit,
            used_count: 0,
            valid_from: new Date(),
            valid_to: validTo,
            applicable_to: 'All',
            is_active: true
        });

        vouchers.push({
            id: promotion.id,
            code: promotion.code,
            discount_type,
            discount_value: discountVal,
            max_discount: maxDiscount,
            valid_to: validTo.toISOString()
        });
    }

    return vouchers;
}

// Gửi email voucher doanh nghiệp
async function sendVoucherEmail(booking, vouchers) {
    const discountLabel = vouchers[0]?.discount_type === 'Percentage' 
        ? `${vouchers[0].discount_value}%` 
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vouchers[0].discount_value);
    
    const validTo = new Date(vouchers[0]?.valid_to).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Generate voucher list HTML
    const voucherListHtml = vouchers.map((v, index) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <span style="background: #7c3aed; color: white; padding: 8px 16px; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px;">
                    ${v.code}
                </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #e53e3e; font-weight: bold;">
                ${v.discount_type === 'Percentage' ? v.discount_value + '%' : new Intl.NumberFormat('vi-VN').format(v.discount_value) + 'đ'}
            </td>
        </tr>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: #7c3aed; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎬 ABSOLUTE CINEMA</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Voucher doanh nghiệp</p>
            <span style="display: inline-block; background: white; color: #7c3aed; padding: 8px 20px; border-radius: 20px; font-size: 14px; margin-top: 15px; font-weight: bold;">
                🎁 ${vouchers.length} MÃ GIẢM GIÁ
            </span>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Xin chào <strong>${booking.full_name}</strong>${booking.company_name ? ` (${booking.company_name})` : ''},</p>
            
            <p style="color: #666; line-height: 1.6;">
                Cảm ơn bạn đã tin tưởng Absolute Cinema! Dưới đây là danh sách mã giảm giá dành riêng cho doanh nghiệp của bạn:
            </p>

            <!-- Voucher Info Box -->
            <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #666;">Mức giảm:</span>
                    <span style="color: #e53e3e; font-weight: bold; font-size: 18px;">${discountLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #666;">Số lượng voucher:</span>
                    <span style="font-weight: bold;">${vouchers.length} mã</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #666;">Hiệu lực đến:</span>
                    <span style="font-weight: bold;">${validTo}</span>
                </div>
            </div>

            <!-- Voucher Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #7c3aed; width: 60px;">STT</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #7c3aed;">Mã voucher</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #7c3aed; width: 100px;">Giảm</th>
                    </tr>
                </thead>
                <tbody>
                    ${voucherListHtml}
                </tbody>
            </table>

            <!-- Instructions -->
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #856404;">📋 Hướng dẫn sử dụng:</p>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    <li>Nhập mã voucher khi thanh toán vé trên app hoặc website</li>
                    <li>Mỗi mã chỉ sử dụng được 1 lần</li>
                    <li>Không áp dụng cùng các chương trình khuyến mãi khác</li>
                    <li>Voucher có hiệu lực đến hết ngày ${validTo}</li>
                </ul>
            </div>

            <p style="color: #666; text-align: center; margin-top: 30px;">
                Cảm ơn bạn đã đồng hành cùng Absolute Cinema! 🎬
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #333; color: white; padding: 25px; text-align: center;">
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">Absolute Cinema - Trải nghiệm điện ảnh đỉnh cao</p>
            <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">© ${new Date().getFullYear()} Absolute Cinema. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"Absolute Cinema" <${process.env.APP_EMAIL}>`,
        to: booking.email,
        subject: `[Absolute Cinema] 🎁 ${vouchers.length} Mã voucher doanh nghiệp của bạn`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Voucher email sent to ${booking.email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send voucher email:`, error.message);
        return { success: false, error: error.message };
    }
}

// Ghi nhận thống kê doanh thu cho Group Booking
async function recordGroupBookingStatistic(booking) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const theaterId = booking.theater_id || null;
    const movieId = booking.Showtime?.movie_id || null;
    const revenue = parseFloat(booking.final_price) || 0;
    const guestCount = booking.guest_count || 0;

    // Tìm hoặc tạo record thống kê cho ngày hôm nay
    let [stat, created] = await DailyStatistic.findOrCreate({
        where: {
            stat_date: today,
            theater_id: theaterId,
            movie_id: movieId
        },
        defaults: {
            stat_date: today,
            theater_id: theaterId,
            movie_id: movieId,
            total_tickets_sold: 0,
            total_revenue: 0,
            unique_customers: 0,
            group_ticket_revenue: 0,
            group_ticket_count: 0,
            private_show_revenue: 0,
            private_show_count: 0,
            hall_rental_revenue: 0,
            hall_rental_count: 0,
            group_booking_guests: 0
        }
    });

    // Cập nhật theo service_type
    const updateData = {
        group_booking_guests: (stat.group_booking_guests || 0) + guestCount,
        updated_at: new Date()
    };

    switch (booking.service_type) {
        case 'group_ticket':
            updateData.group_ticket_revenue = parseFloat(stat.group_ticket_revenue || 0) + revenue;
            updateData.group_ticket_count = (stat.group_ticket_count || 0) + 1;
            break;
        case 'private_show':
            updateData.private_show_revenue = parseFloat(stat.private_show_revenue || 0) + revenue;
            updateData.private_show_count = (stat.private_show_count || 0) + 1;
            break;
        case 'hall_rental':
            updateData.hall_rental_revenue = parseFloat(stat.hall_rental_revenue || 0) + revenue;
            updateData.hall_rental_count = (stat.hall_rental_count || 0) + 1;
            break;
    }

    await stat.update(updateData);
    
    console.log(`📊 Recorded group booking stat: ${booking.service_type}, revenue: ${revenue}, theater: ${theaterId}`);
    return stat;
}

export const groupBookingService = {
    /**
     * Tạo yêu cầu dịch vụ doanh nghiệp
     * Chỉ lưu thông tin, admin sẽ liên hệ tư vấn và báo giá sau
     */
    async createGroupBooking(userId, data) {
        const {
            fullName,
            email,
            phone,
            address,
            companyName,
            serviceType,
            guestCount,
            preferredDate,
            region,
            theaterId,
            notes
        } = data;

        // Validate required fields
        if (!fullName || !email || !phone) {
            throw new Error('Vui lòng nhập đầy đủ họ tên, email và số điện thoại');
        }

        // Voucher không cần các thông tin guest_count, preferredDate, theater
        if (serviceType !== 'voucher') {
            if (!guestCount || guestCount <= 0) {
                throw new Error('Vui lòng nhập số lượng khách dự kiến');
            }

            if (guestCount < 20) {
                throw new Error('Dịch vụ này yêu cầu tối thiểu 20 khách');
            }

            if (!preferredDate) {
                throw new Error('Vui lòng chọn ngày mong muốn');
            }

            // Validate theater if provided
            if (theaterId) {
                const theater = await Theater.findByPk(theaterId);
                if (!theater) {
                    throw new Error('Rạp không tồn tại');
                }
            }
        }

        // Create booking request
        const booking = await GroupBooking.create({
            user_id: userId,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address || null,
            company_name: companyName || null,
            service_type: serviceType || 'group_booking',
            guest_count: guestCount,
            preferred_date: preferredDate,
            region: region || null,
            theater_id: theaterId || null,
            notes: notes || null,
            status: 'Requested'
        });

        return {
            booking,
            message: 'Yêu cầu của bạn đã được gửi thành công! Nhân viên sẽ liên hệ tư vấn và báo giá trong vòng 24h làm việc.'
        };
    },

    /**
     * Lấy danh sách yêu cầu của user
     */
    async getUserGroupBookings(userId) {
        const bookings = await GroupBooking.findAll({
            where: { user_id: userId },
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });

        return bookings;
    },

    /**
     * Lấy chi tiết một yêu cầu
     */
    async getGroupBookingDetail(bookingId, userId) {
        const booking = await GroupBooking.findOne({
            where: { id: bookingId, user_id: userId },
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city', 'phone', 'email'], required: false }
            ]
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        return booking;
    },

    /**
     * Hủy yêu cầu (chỉ khi status = Requested)
     */
    async cancelGroupBooking(bookingId, userId) {
        const booking = await GroupBooking.findOne({
            where: { id: bookingId, user_id: userId }
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        if (!['Requested', 'Contacted'].includes(booking.status)) {
            throw new Error('Không thể hủy yêu cầu ở trạng thái này');
        }

        await booking.update({ status: 'Cancelled', updated_at: new Date() });

        return { message: 'Đã hủy yêu cầu' };
    },

    /**
     * Lấy danh sách phòng của rạp (nếu cần)
     */
    async getTheaterRooms(theaterId) {
        const { CinemaRoom } = await import('../models/CinemaRoom.js');
        const rooms = await CinemaRoom.findAll({
            where: { theater_id: theaterId, is_active: true },
            attributes: ['id', 'name', 'screen_type', 'seat_count']
        });

        return rooms;
    },

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * Lấy danh sách tất cả yêu cầu (admin)
     */
    async getAllBookings(options = {}) {
        const { 
            status, 
            serviceType, 
            search,
            startDate,
            endDate,
            theaterId,      // Single theater ID (from query)
            theaterIds,     // Array of theater IDs (from manager filter)
            page = 1, 
            limit = 20 
        } = options;

        // Parse to integers
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (serviceType) {
            where.service_type = serviceType;
        }

        if (search) {
            where[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { company_name: { [Op.like]: `%${search}%` } }
            ];
        }

        if (startDate || endDate) {
            where.preferred_date = {};
            if (startDate) where.preferred_date[Op.gte] = startDate;
            if (endDate) where.preferred_date[Op.lte] = endDate;
        }

        // Theater filter (single ID or array of IDs)
        if (theaterId) {
            where.theater_id = theaterId;
        } else if (theaterIds && theaterIds.length > 0) {
            where.theater_id = theaterIds;
        }

        const offset = (pageNum - 1) * limitNum;

        const { count, rows: bookings } = await GroupBooking.findAndCountAll({
            where,
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city'], required: false },
                { model: User, attributes: ['id', 'full_name', 'email', 'phone'], required: false },
                { 
                    model: Showtime, 
                    attributes: ['id', 'room_id', 'movie_id', 'start_time', 'end_time', 'status'], 
                    required: false,
                    include: [
                        { model: Movie, attributes: ['id', 'title'], required: false },
                        { 
                            model: CinemaRoom, 
                            attributes: ['id', 'name', 'theater_id'], 
                            required: false,
                            include: [{ model: Theater, attributes: ['id', 'name'], required: false }]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: limitNum,
            offset
        });

        return {
            bookings,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(count / limitNum)
            }
        };
    },

    /**
     * Lấy chi tiết booking (admin - không cần check user_id)
     */
    async getBookingDetailAdmin(bookingId) {
        const booking = await GroupBooking.findByPk(bookingId, {
            include: [
                { model: Theater, attributes: ['id', 'name', 'address', 'city', 'phone', 'email'], required: false },
                { model: User, attributes: ['id', 'full_name', 'email', 'phone'], required: false },
                { model: Showtime, required: false }
            ]
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        // Add theaterId for access check
        const result = booking.toJSON();
        result.theaterId = booking.theater_id;

        // Load reserved seats if there's an assigned showtime
        console.log('=== DEBUG GET BOOKING DETAIL ===');
        console.log('bookingId:', bookingId);
        console.log('assigned_showtime_id:', booking.assigned_showtime_id);
        
        if (booking.assigned_showtime_id) {
            const reservedSeats = await SeatReservation.findAll({
                where: {
                    showtime_id: booking.assigned_showtime_id,
                    status: 'Confirmed',
                    user_id: null // Group booking reservations have no user_id
                },
                attributes: ['seat_id']
            });
            result.reserved_seat_ids = reservedSeats.map(r => r.seat_id);
            console.log('Found reserved_seat_ids:', result.reserved_seat_ids);
        } else {
            result.reserved_seat_ids = [];
            console.log('No assigned_showtime_id, reserved_seat_ids: []');
        }

        return result;
    },

    /**
     * Cập nhật yêu cầu (admin)
     * Flow trạng thái:
     * - Requested → Processing
     * - Processing → Approved | Rejected (có thể edit thông tin)
     * - Approved → Completed | Cancelled (không thể edit thông tin)
     * - Completed → gửi email
     */
    async updateBooking(bookingId, adminId, data) {
        const booking = await GroupBooking.findByPk(bookingId);

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        const previousStatus = booking.status;
        const newStatus = data.status;

        // Validate status transition
        const validTransitions = {
            'Requested': ['Processing'],
            'Processing': ['Approved', 'Rejected'],
            'Approved': ['Completed', 'Cancelled'],
            'Rejected': [],
            'Completed': [],
            'Cancelled': []
        };

        if (newStatus && newStatus !== previousStatus) {
            if (!validTransitions[previousStatus]?.includes(newStatus)) {
                throw new Error(`Không thể chuyển từ "${previousStatus}" sang "${newStatus}"`);
            }
        }

        // Không cho phép chỉnh sửa khi đã Completed hoặc Cancelled
        if (['Completed', 'Cancelled'].includes(previousStatus)) {
            throw new Error('Không thể chỉnh sửa yêu cầu đã hoàn thành hoặc đã hủy');
        }

        // Nếu đã Approved, chỉ cho phép chuyển status, không edit thông tin
        if (previousStatus === 'Approved' && newStatus !== 'Completed' && newStatus !== 'Cancelled') {
            throw new Error('Không thể chỉnh sửa thông tin khi đã duyệt');
        }

        // Validate: Phải có giá trước khi duyệt (Approved)
        if (newStatus === 'Approved') {
            const priceToCheck = data.price !== undefined ? data.price : booking.price;
            if (!priceToCheck || parseFloat(priceToCheck) <= 0) {
                throw new Error('Vui lòng nhập báo giá trước khi duyệt');
            }
        }

        // Validate: Voucher type phải tạo voucher trước khi Completed
        if (booking.service_type === 'voucher' && newStatus === 'Completed') {
            if (!booking.voucher_codes || booking.voucher_codes.length === 0) {
                throw new Error('Vui lòng tạo voucher trước khi hoàn thành đơn hàng');
            }
        }

        const updateData = {
            updated_at: new Date()
        };

        // Chỉ cho phép cập nhật thông tin khi đang Processing
        if (previousStatus === 'Processing' || (previousStatus === 'Requested' && newStatus === 'Processing')) {
            if (data.adminNotes !== undefined) updateData.admin_notes = data.adminNotes;
            if (data.price !== undefined) updateData.price = data.price;
            if (data.assignedShowtimeId !== undefined) updateData.assigned_showtime_id = data.assignedShowtimeId;
            if (data.theaterId !== undefined) updateData.theater_id = data.theaterId;
        }

        // Lưu final_price khi Approved
        if (newStatus === 'Approved' && data.price) {
            updateData.final_price = data.price;
        }

        // Lưu lý do khi Rejected hoặc Cancelled
        if ((newStatus === 'Rejected' || newStatus === 'Cancelled') && data.rejectionReason) {
            updateData.rejection_reason = data.rejectionReason;
        }

        // Luôn cho phép đổi status
        if (newStatus) updateData.status = newStatus;

        // Ghi nhận người xử lý
        if (newStatus && newStatus !== 'Requested') {
            updateData.handled_by = adminId;
        }

        await booking.update(updateData);

        // Lưu danh sách ghế đã chọn
        let selectedSeatDetails = [];

        // Xử lý đặt ghế nếu có (khi đang Processing hoặc vừa chuyển sang Processing)
        const isProcessing = previousStatus === 'Processing' || newStatus === 'Processing';
        
        console.log('=== DEBUG SEAT SAVE ===');
        console.log('previousStatus:', previousStatus);
        console.log('newStatus:', newStatus);
        console.log('isProcessing:', isProcessing);
        console.log('data.selectedSeats:', data.selectedSeats);
        console.log('data.assignedShowtimeId:', data.assignedShowtimeId);
        console.log('Condition result:', isProcessing && data.selectedSeats && data.assignedShowtimeId);
        
        if (isProcessing && data.selectedSeats && data.assignedShowtimeId) {
            console.log('>>> ENTERING SEAT SAVE BLOCK');
            // Xóa tất cả ghế cũ của booking này trước khi tạo mới
            // (tìm theo showtime và các ghế đã có status Confirmed mà không thuộc order nào)
            if (booking.assigned_showtime_id) {
                // Lấy danh sách seat_id trước khi xóa để emit socket
                const oldReservations = await SeatReservation.findAll({
                    where: {
                        showtime_id: booking.assigned_showtime_id,
                        status: 'Confirmed',
                        user_id: null
                    },
                    attributes: ['seat_id']
                });
                const oldSeatIds = oldReservations.map(r => r.seat_id);

                await SeatReservation.destroy({
                    where: {
                        showtime_id: booking.assigned_showtime_id,
                        status: 'Confirmed',
                        user_id: null // Chỉ xóa những reservation không có user (group booking)
                    }
                });
                console.log(`🗑️ Cleared old reservations for showtime ${booking.assigned_showtime_id}`);

                // Emit socket để release ghế cũ
                if (oldSeatIds.length > 0) {
                    emitToAll(SOCKET_EVENTS.SEAT_RELEASED, {
                        showtimeId: booking.assigned_showtime_id,
                        seatIds: oldSeatIds,
                        releasedByUserId: 0,
                        isGroupBooking: true
                    });
                }
            }

            // Tạo reservation mới nếu có ghế được chọn
            if (data.selectedSeats.length > 0) {
                // Set expires_at xa trong tương lai để không bị expire
                const futureDate = new Date();
                futureDate.setFullYear(futureDate.getFullYear() + 10); // 10 năm sau

                const reservations = data.selectedSeats.map(seatId => ({
                    seat_id: seatId,
                    showtime_id: data.assignedShowtimeId,
                    status: 'Confirmed',
                    reserved_at: new Date(),
                    expires_at: futureDate
                }));

                // Dùng upsert để update nếu đã tồn tại
                for (const reservation of reservations) {
                    await SeatReservation.upsert(reservation, {
                        conflictFields: ['showtime_id', 'seat_id']
                    });
                }

                console.log(`✅ Created ${data.selectedSeats.length} seat reservations for showtime ${data.assignedShowtimeId}`);

                // Emit socket event để Flutter app cập nhật realtime
                emitToAll(SOCKET_EVENTS.SEAT_HELD, {
                    showtimeId: parseInt(data.assignedShowtimeId),
                    seatIds: data.selectedSeats,
                    heldByUserId: 0, // 0 = system/admin booking
                    isGroupBooking: true
                });
                console.log(`📤 Emitted SEAT_HELD for group booking: ${data.selectedSeats.length} seats`);

                // Lấy chi tiết ghế để gửi email
                selectedSeatDetails = await Seat.findAll({
                    where: { id: data.selectedSeats },
                    attributes: ['id', 'row_label', 'seat_number']
                });
            }
        }

        // Xử lý đặt ghế cho private_show/hall_rental khi chọn suất chiếu có sẵn (không tạo mới)
        // Khi tạo mới bằng createPrivateShowtime, ghế đã được đặt trong hàm đó rồi
        const serviceType = booking.service_type;
        if ((serviceType === 'private_show' || serviceType === 'hall_rental') && 
            data.assignedShowtimeId && previousStatus === 'Processing') {
            
            // Kiểm tra xem showtime này đã có reservation chưa
            const existingReservations = await SeatReservation.count({
                where: { 
                    showtime_id: data.assignedShowtimeId,
                    status: 'Confirmed',
                    user_id: null // Group booking reservations
                }
            });

            // Nếu chưa có reservation nào (admin chọn suất chiếu có sẵn thay vì tạo mới)
            if (existingReservations === 0) {
                // Lấy room_id từ showtime
                const showtime = await Showtime.findByPk(data.assignedShowtimeId);
                if (showtime && showtime.room_id) {
                    // Đặt hết tất cả ghế trong phòng
                    const allSeats = await Seat.findAll({
                        where: { room_id: showtime.room_id, is_active: true },
                        attributes: ['id']
                    });

                    if (allSeats.length > 0) {
                        const futureDate = new Date();
                        futureDate.setFullYear(futureDate.getFullYear() + 10);

                        const seatIds = allSeats.map(s => s.id);
                        
                        for (const seatId of seatIds) {
                            await SeatReservation.upsert({
                                seat_id: seatId,
                                showtime_id: data.assignedShowtimeId,
                                status: 'Confirmed',
                                reserved_at: new Date(),
                                expires_at: futureDate
                            }, {
                                conflictFields: ['showtime_id', 'seat_id']
                            });
                        }
                        
                        console.log(`✅ Reserved all ${seatIds.length} seats for private showtime ${data.assignedShowtimeId}`);

                        // Emit socket event
                        emitToAll(SOCKET_EVENTS.SEAT_HELD, {
                            showtimeId: parseInt(data.assignedShowtimeId),
                            seatIds: seatIds,
                            heldByUserId: 0,
                            isGroupBooking: true,
                            isPrivateShow: true
                        });
                        console.log(`📤 Emitted SEAT_HELD for private show: ${seatIds.length} seats`);
                    }
                }
            }
        }

        // Reload with associations
        await booking.reload({
            include: [
                { model: Theater, required: false },
                { model: User, required: false }
            ]
        });

        // Gửi email xác nhận khi status chuyển sang Completed
        if (newStatus === 'Completed' && previousStatus === 'Approved') {
            // Xử lý riêng cho voucher
            if (booking.service_type === 'voucher') {
                // Gửi email voucher
                if (booking.voucher_codes && booking.voucher_codes.length > 0) {
                    try {
                        const emailResult = await sendVoucherEmail(booking, booking.voucher_codes);
                        console.log('📧 Voucher email result:', emailResult);
                    } catch (emailError) {
                        console.error('⚠️ Failed to send voucher email:', emailError.message);
                    }
                }
            } else {
                // Xử lý cho các loại khác (group_booking, private_show, hall_rental)
                // Lấy thông tin showtime nếu có
                let showtime = null;
                if (booking.assigned_showtime_id) {
                    showtime = await Showtime.findByPk(booking.assigned_showtime_id, {
                        include: [
                            { model: Movie, attributes: ['id', 'title', 'duration_min'] },
                            { model: CinemaRoom, attributes: ['id', 'name'] }
                        ]
                    });
                }

                // Lấy theater
                const theater = booking.theater_id ? await Theater.findByPk(booking.theater_id) : null;

                // Lấy danh sách ghế đã đặt
                if (booking.assigned_showtime_id) {
                    const reservations = await SeatReservation.findAll({
                        where: { showtime_id: booking.assigned_showtime_id, status: 'Confirmed' },
                        include: [{ model: Seat, attributes: ['id', 'row_label', 'seat_number'] }]
                    });
                    selectedSeatDetails = reservations.map(r => r.Seat).filter(Boolean);
                }

                // Gửi email
                try {
                    const emailResult = await sendGroupBookingConfirmationEmail(
                        booking,
                        showtime,
                        selectedSeatDetails,
                        theater
                    );
                    console.log('📧 Email confirmation result:', emailResult);
                } catch (emailError) {
                    console.error('⚠️ Failed to send confirmation email:', emailError.message);
                }
            }

            // Ghi nhận thống kê doanh thu
            try {
                await recordGroupBookingStatistic(booking);
                console.log('📊 Group booking statistic recorded');
            } catch (statError) {
                console.error('⚠️ Failed to record statistic:', statError.message);
            }
        }

        // Xử lý khi Rejected (từ Processing)
        if (newStatus === 'Rejected' && previousStatus === 'Processing') {
            console.log('❌ Booking rejected, sending notification email...');
            
            // Gửi email thông báo từ chối
            try {
                await sendRejectionEmail(booking, data.rejectionReason, true);
                console.log('📧 Rejection email sent');
            } catch (emailError) {
                console.error('⚠️ Failed to send rejection email:', emailError.message);
            }
        }

        // Xử lý khi Cancelled (từ Approved)
        if (newStatus === 'Cancelled' && previousStatus === 'Approved') {
            console.log('🚫 Booking cancelled, releasing seats and sending notification...');
            
            // Giải phóng ghế đã reserve
            if (booking.assigned_showtime_id) {
                try {
                    // Lấy danh sách seat_id trước khi xóa để emit socket
                    const reservations = await SeatReservation.findAll({
                        where: {
                            showtime_id: booking.assigned_showtime_id,
                            status: 'Confirmed',
                            user_id: null
                        },
                        attributes: ['seat_id']
                    });
                    const releasedSeatIds = reservations.map(r => r.seat_id);

                    const deleted = await SeatReservation.destroy({
                        where: {
                            showtime_id: booking.assigned_showtime_id,
                            status: 'Confirmed',
                            user_id: null // Chỉ xóa những reservation không có user (group booking)
                        }
                    });
                    console.log(`🗑️ Released ${deleted} seat reservations for showtime ${booking.assigned_showtime_id}`);

                    // Emit socket event để Flutter app cập nhật realtime
                    if (releasedSeatIds.length > 0) {
                        emitToAll(SOCKET_EVENTS.SEAT_RELEASED, {
                            showtimeId: booking.assigned_showtime_id,
                            seatIds: releasedSeatIds,
                            releasedByUserId: 0,
                            isGroupBooking: true
                        });
                        console.log(`📤 Emitted SEAT_RELEASED for cancelled group booking: ${releasedSeatIds.length} seats`);
                    }
                } catch (error) {
                    console.error('⚠️ Failed to release seats:', error.message);
                }
            }
            
            // Gửi email thông báo hủy
            try {
                await sendRejectionEmail(booking, data.rejectionReason, false);
                console.log('📧 Cancellation email sent');
            } catch (emailError) {
                console.error('⚠️ Failed to send cancellation email:', emailError.message);
            }
        }

        return booking;
    },

    /**
     * Lấy thống kê (admin) - optionally filter by theaterIds
     */
    async getStats(theaterIds = null) {
        const whereBase = theaterIds && theaterIds.length > 0 
            ? { theater_id: theaterIds }
            : {};
            
        const [
            total,
            requested,
            processing,
            approved,
            completed,
            rejected,
            cancelled
        ] = await Promise.all([
            GroupBooking.count({ where: whereBase }),
            GroupBooking.count({ where: { ...whereBase, status: 'Requested' } }),
            GroupBooking.count({ where: { ...whereBase, status: 'Processing' } }),
            GroupBooking.count({ where: { ...whereBase, status: 'Approved' } }),
            GroupBooking.count({ where: { ...whereBase, status: 'Completed' } }),
            GroupBooking.count({ where: { ...whereBase, status: 'Rejected' } }),
            GroupBooking.count({ where: { ...whereBase, status: 'Cancelled' } })
        ]);

        // Tổng doanh thu từ các booking đã hoàn thành
        const revenueResult = await GroupBooking.sum('price', {
            where: { ...whereBase, status: 'Completed' }
        });

        return {
            total,
            requested,
            processing,
            approved,
            completed,
            rejected,
            cancelled,
            revenue: revenueResult || 0
        };
    },

    /**
     * Lấy danh sách suất chiếu theo phòng và ngày (admin)
     */
    async getShowtimesByRoom(roomId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const showtimes = await Showtime.findAll({
            where: {
                room_id: roomId,
                start_time: {
                    [Op.between]: [startOfDay, endOfDay]
                },
                status: 'Scheduled'
            },
            include: [
                { model: Movie, attributes: ['id', 'title', 'poster_url', 'duration_min'] }
            ],
            order: [['start_time', 'ASC']]
        });

        return showtimes;
    },

    /**
     * Lấy danh sách ghế trống của suất chiếu (admin)
     */
    async getAvailableSeats(showtimeId) {
        const showtime = await Showtime.findByPk(showtimeId, {
            include: [{ model: CinemaRoom }]
        });

        if (!showtime) {
            throw new Error('Không tìm thấy suất chiếu');
        }

        // Lấy tất cả ghế của phòng
        const allSeats = await Seat.findAll({
            where: { room_id: showtime.room_id },
            order: [['row_label', 'ASC'], ['seat_number', 'ASC']]
        });

        // Lấy các ghế đã đặt
        const reservedSeats = await SeatReservation.findAll({
            where: {
                showtime_id: showtimeId,
                status: { [Op.in]: ['Pending', 'Confirmed'] }
            },
            attributes: ['seat_id']
        });

        const reservedSeatIds = new Set(reservedSeats.map(r => r.seat_id));

        // Đánh dấu ghế available
        const seatsWithStatus = allSeats.map(seat => ({
            id: seat.id,
            row_label: seat.row_label,
            seat_number: seat.seat_number,
            seat_type: seat.seat_type,
            is_available: !reservedSeatIds.has(seat.id)
        }));

        // Group by row
        const seatsByRow = {};
        seatsWithStatus.forEach(seat => {
            if (!seatsByRow[seat.row_label]) {
                seatsByRow[seat.row_label] = [];
            }
            seatsByRow[seat.row_label].push(seat);
        });

        // Sort seats in each row by seat_number numerically
        Object.keys(seatsByRow).forEach(row => {
            seatsByRow[row].sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));
        });

        return {
            showtime,
            totalSeats: allSeats.length,
            availableCount: seatsWithStatus.filter(s => s.is_available).length,
            seatsByRow
        };
    },

    /**
     * Tạo suất chiếu riêng (cho private_show / hall_rental)
     */
    async createPrivateShowtime(data) {
        const { roomId, movieId, startTime, isPrivate = true, groupBookingId, customDuration } = data;

        // Kiểm tra phòng
        const room = await CinemaRoom.findByPk(roomId);
        if (!room) {
            throw new Error('Không tìm thấy phòng chiếu');
        }

        // Kiểm tra phim (optional cho hall_rental)
        let movie = null;
        let duration = customDuration || 180; // Use custom duration or default 3 hours
        if (movieId) {
            movie = await Movie.findByPk(movieId);
            if (!movie) {
                throw new Error('Không tìm thấy phim');
            }
            duration = movie.duration_min || 120; // Use duration_min field from movie
        }

        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            throw new Error('Thời gian bắt đầu không hợp lệ');
        }
        const end = new Date(start.getTime() + duration * 60000);

        // Kiểm tra xung đột thời gian
        const conflict = await Showtime.findOne({
            where: {
                room_id: roomId,
                status: 'Scheduled',
                [Op.or]: [
                    {
                        start_time: { [Op.between]: [start, end] }
                    },
                    {
                        end_time: { [Op.between]: [start, end] }
                    },
                    {
                        [Op.and]: [
                            { start_time: { [Op.lte]: start } },
                            { end_time: { [Op.gte]: end } }
                        ]
                    }
                ]
            }
        });

        if (conflict) {
            throw new Error('Thời gian này đã có suất chiếu khác');
        }

        // Tạo suất chiếu
        const showtime = await Showtime.create({
            movie_id: movieId || null,
            room_id: roomId,
            start_time: start,
            end_time: end,
            base_price: 0, // Private show có giá riêng
            status: 'Scheduled',
            is_private: isPrivate
        });

        // Đặt hết tất cả ghế trong phòng (private show = thuê cả phòng)
        const allSeats = await Seat.findAll({
            where: { room_id: roomId, is_active: true },
            attributes: ['id']
        });

        if (allSeats.length > 0) {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 10);

            const seatIds = allSeats.map(s => s.id);
            
            // Tạo reservation cho tất cả ghế
            for (const seatId of seatIds) {
                await SeatReservation.upsert({
                    seat_id: seatId,
                    showtime_id: showtime.id,
                    status: 'Confirmed',
                    reserved_at: new Date(),
                    expires_at: futureDate
                }, {
                    conflictFields: ['showtime_id', 'seat_id']
                });
            }
            
            console.log(`✅ Reserved all ${seatIds.length} seats for private showtime ${showtime.id}`);

            // Emit socket event để Flutter app cập nhật realtime
            emitToAll(SOCKET_EVENTS.SEAT_HELD, {
                showtimeId: showtime.id,
                seatIds: seatIds,
                heldByUserId: 0,
                isGroupBooking: true,
                isPrivateShow: true
            });
            console.log(`📤 Emitted SEAT_HELD for private showtime: ${seatIds.length} seats`);
        }

        // Cập nhật group booking nếu có
        if (groupBookingId) {
            await GroupBooking.update(
                { assigned_showtime_id: showtime.id },
                { where: { id: groupBookingId } }
            );
        }

        return showtime;
    },

    /**
     * Lấy danh sách phim đang chiếu (cho private_show)
     */
    async getActiveMovies() {
        const movies = await Movie.findAll({
            where: {
                status: 'now_showing'
            },
            attributes: ['id', 'title', 'poster_url', 'duration_min', 'status'],
            order: [['title', 'ASC']]
        });

        return movies;
    },

    /**
     * Lấy danh sách suất chiếu của phim chưa có người đặt (cho private_show)
     * Chỉ lấy các suất chiếu trong ngày chỉ định và chưa bắt đầu
     */
    async getAvailableShowtimesByMovie(movieId, theaterId, date) {
        const now = new Date();
        
        // Nếu có date, lọc theo ngày đó; nếu không thì lấy hôm nay
        let dayStart, dayEnd;
        if (date) {
            dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
        } else {
            dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);
            dayEnd = new Date();
            dayEnd.setHours(23, 59, 59, 999);
        }

        const whereClause = {
            movie_id: movieId,
            // Chỉ lấy suất chiếu trong ngày đã chọn
            start_time: { [Op.between]: [dayStart, dayEnd] },
            status: 'Scheduled'
        };

        // Nếu có theaterId, lọc theo theater
        const roomWhere = theaterId ? { theater_id: theaterId } : {};

        const showtimes = await Showtime.findAll({
            where: whereClause,
            include: [
                { 
                    model: CinemaRoom, 
                    attributes: ['id', 'name', 'seat_count', 'theater_id'],
                    where: roomWhere,
                    include: [{ model: Theater, attributes: ['id', 'name', 'city'] }]
                },
                { model: Movie, attributes: ['id', 'title', 'duration_min'] }
            ],
            order: [['start_time', 'ASC']]
        });

        // Lọc các suất chiếu chưa có reservation hoặc có rất ít (<5%)
        // VÀ chưa bắt đầu (start_time > now)
        const availableShowtimes = [];
        
        for (const showtime of showtimes) {
            // Bỏ qua suất chiếu đã bắt đầu hoặc đang diễn ra
            if (new Date(showtime.start_time) <= now) {
                continue;
            }
            
            const totalSeats = showtime.CinemaRoom?.seat_count || 0;
            
            // Đếm số ghế đã đặt
            const reservedCount = await SeatReservation.count({
                where: {
                    showtime_id: showtime.id,
                    status: { [Op.in]: ['Pending', 'Confirmed'] }
                }
            });
            
            const reservedPercent = totalSeats > 0 ? (reservedCount / totalSeats) * 100 : 0;
            
            // Chỉ lấy suất chiếu có < 5% ghế đã đặt (gần như trống)
            if (reservedPercent < 5) {
                availableShowtimes.push({
                    ...showtime.toJSON(),
                    reserved_count: reservedCount,
                    available_count: totalSeats - reservedCount,
                    reserved_percent: Math.round(reservedPercent)
                });
            }
        }

        return availableShowtimes;
    },

    /**
     * Gửi lại email xác nhận (admin)
     */
    async resendConfirmationEmail(bookingId) {
        const booking = await GroupBooking.findByPk(bookingId, {
            include: [
                { model: Theater, required: false },
                { model: User, required: false }
            ]
        });

        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        if (!['Approved', 'Completed'].includes(booking.status)) {
            throw new Error('Chỉ có thể gửi email cho yêu cầu đã được duyệt');
        }

        // Lấy thông tin showtime nếu có
        let showtime = null;
        if (booking.assigned_showtime_id) {
            showtime = await Showtime.findByPk(booking.assigned_showtime_id, {
                include: [
                    { model: Movie, attributes: ['id', 'title', 'duration_min'] },
                    { model: CinemaRoom, attributes: ['id', 'name'] }
                ]
            });
        }

        // Lấy ghế đã đặt nếu có
        let seats = [];
        if (booking.assigned_showtime_id) {
            const reservations = await SeatReservation.findAll({
                where: { 
                    showtime_id: booking.assigned_showtime_id,
                    status: 'Confirmed'
                },
                include: [{ model: Seat, attributes: ['id', 'row_label', 'seat_number'] }]
            });
            seats = reservations.map(r => r.Seat).filter(Boolean);
        }

        // Lấy theater
        const theater = booking.theater_id ? await Theater.findByPk(booking.theater_id) : null;

        // Gửi email
        const result = await sendGroupBookingConfirmationEmail(booking, showtime, seats, theater);

        if (!result.success) {
            throw new Error('Gửi email thất bại: ' + result.error);
        }

        return { 
            message: 'Đã gửi email xác nhận thành công',
            bookingCode: result.bookingCode
        };
    },

    /**
     * Tạo voucher doanh nghiệp
     * @param {number} bookingId - ID của booking
     * @param {object} voucherData - Thông tin voucher
     */
    async createVoucherForBooking(bookingId, voucherData) {
        const booking = await GroupBooking.findByPk(bookingId);
        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        if (booking.service_type !== 'voucher') {
            throw new Error('Yêu cầu này không phải loại voucher doanh nghiệp');
        }

        if (!['Processing', 'Approved'].includes(booking.status)) {
            throw new Error('Chỉ có thể tạo voucher khi yêu cầu đang xử lý hoặc đã duyệt');
        }

        // Tạo voucher
        const vouchers = await createEnterpriseVouchers(booking, voucherData);

        // Lưu voucher codes vào booking
        await booking.update({
            voucher_codes: vouchers,
            voucher_quantity: vouchers.length
        });

        return {
            message: `Đã tạo ${vouchers.length} mã voucher`,
            vouchers
        };
    },

    /**
     * Gửi email voucher cho khách hàng
     */
    async sendVoucherEmailToCustomer(bookingId) {
        const booking = await GroupBooking.findByPk(bookingId);
        if (!booking) {
            throw new Error('Không tìm thấy yêu cầu');
        }

        if (!booking.voucher_codes || booking.voucher_codes.length === 0) {
            throw new Error('Chưa có voucher nào được tạo');
        }

        const result = await sendVoucherEmail(booking, booking.voucher_codes);
        
        if (!result.success) {
            throw new Error('Gửi email thất bại: ' + result.error);
        }

        return { message: 'Đã gửi email voucher thành công' };
    }
};
