import { VNPay, ignoreLogger, ProductCode, VnpLocale } from 'vnpay';
import { Op } from 'sequelize';
import crypto from 'crypto';
import emailService from '../libs/emailService.js';
import { 
    Order, 
    Payment, 
    Ticket, 
    ComboOrder,
    Combo,
    SeatReservation,
    LoyaltyAccount,
    LoyaltyPointsTransaction,
    LoyaltyTierRate,
    LoyaltyTierRequirement,
    Promotion,
    Showtime,
    Seat,
    CinemaRoom,
    Theater,
    Movie,
    Invoice,
    User,
    DailyStatistic,
    sequelize 
} from '../models/index.js';
import { VNPAY_CONFIG } from '../config/vnpay.js';
import { emitToAdmin, SOCKET_EVENTS } from '../socket.js';

/**
 * Cập nhật DailyStatistic realtime khi payment thành công
 * @param {Object} order - Order đã thanh toán
 * @param {Array} tickets - Danh sách tickets
 */
const updateDailyStatistics = async (order, tickets) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const revenue = parseFloat(order.total_amount) || 0;
        const ticketCount = tickets.length;
        const userId = order.user_id;

        // Lấy theater_id và movie_id từ ticket đầu tiên
        let theaterId = null;
        let movieId = null;
        
        if (tickets.length > 0) {
            const firstTicket = tickets[0];
            theaterId = firstTicket.theater_id;
            
            // Lấy movie_id từ showtime
            if (firstTicket.showtime_id) {
                const showtime = await Showtime.findByPk(firstTicket.showtime_id, {
                    attributes: ['movie_id']
                });
                movieId = showtime?.movie_id;
            }
        }

        // 1. Update overall stats (theater_id = null, movie_id = null)
        const [overallStat] = await DailyStatistic.findOrCreate({
            where: { stat_date: today, theater_id: null, movie_id: null },
            defaults: {
                stat_date: today,
                theater_id: null,
                movie_id: null,
                total_tickets_sold: 0,
                total_revenue: 0,
                unique_customers: 0
            }
        });
        
        await overallStat.increment({
            total_tickets_sold: ticketCount,
            total_revenue: revenue
        });
        
        // Check if this is a new unique customer today
        const existingOrderToday = await Order.count({
            where: {
                user_id: userId,
                status: 'Paid',
                id: { [Op.ne]: order.id },
                created_at: {
                    [Op.gte]: new Date(today + 'T00:00:00'),
                    [Op.lte]: new Date(today + 'T23:59:59')
                }
            }
        });
        
        if (existingOrderToday === 0) {
            await overallStat.increment({ unique_customers: 1 });
        }

        // 2. Update theater stats
        if (theaterId) {
            const [theaterStat] = await DailyStatistic.findOrCreate({
                where: { stat_date: today, theater_id: theaterId, movie_id: null },
                defaults: {
                    stat_date: today,
                    theater_id: theaterId,
                    movie_id: null,
                    total_tickets_sold: 0,
                    total_revenue: 0,
                    unique_customers: 0
                }
            });
            
            await theaterStat.increment({
                total_tickets_sold: ticketCount,
                total_revenue: revenue
            });

            // Check unique customer for this theater today
            const existingTheaterOrderToday = await Order.count({
                where: {
                    user_id: userId,
                    status: 'Paid',
                    id: { [Op.ne]: order.id },
                    created_at: {
                        [Op.gte]: new Date(today + 'T00:00:00'),
                        [Op.lte]: new Date(today + 'T23:59:59')
                    }
                },
                include: [{
                    model: Ticket,
                    where: { theater_id: theaterId },
                    required: true
                }]
            });
            
            if (existingTheaterOrderToday === 0) {
                await theaterStat.increment({ unique_customers: 1 });
            }
        }

        // 3. Update movie stats
        if (movieId) {
            const [movieStat] = await DailyStatistic.findOrCreate({
                where: { stat_date: today, theater_id: null, movie_id: movieId },
                defaults: {
                    stat_date: today,
                    theater_id: null,
                    movie_id: movieId,
                    total_tickets_sold: 0,
                    total_revenue: 0,
                    unique_customers: 0
                }
            });
            
            await movieStat.increment({
                total_tickets_sold: ticketCount,
                total_revenue: revenue
            });

            // Check unique customer for this movie today
            const existingMovieOrderToday = await Order.count({
                where: {
                    user_id: userId,
                    status: 'Paid',
                    id: { [Op.ne]: order.id },
                    created_at: {
                        [Op.gte]: new Date(today + 'T00:00:00'),
                        [Op.lte]: new Date(today + 'T23:59:59')
                    }
                },
                include: [{
                    model: Ticket,
                    include: [{
                        model: Showtime,
                        where: { movie_id: movieId },
                        required: true
                    }],
                    required: true
                }]
            });
            
            if (existingMovieOrderToday === 0) {
                await movieStat.increment({ unique_customers: 1 });
            }
        }

        console.log(`📊 DailyStatistic updated: +${ticketCount} tickets, +${revenue.toLocaleString()}đ`);
        
        // 🔔 Emit stats updated event to admin dashboard
        emitToAdmin(SOCKET_EVENTS.STATS_UPDATED, {
            date: today,
            ticketCount,
            revenue,
            theaterId,
            movieId
        });
    } catch (error) {
        // Log error but don't throw - stats update should not break payment flow
        console.error('❌ Error updating DailyStatistic:', error.message);
    }
};

// Gửi email hóa đơn VAT
async function sendInvoiceEmail(invoiceData, orderCode) {
    const {
        invoice_number,
        company_name,
        tax_code,
        company_address,
        buyer_email,
        total_before_tax,
        tax_amount,
        total_with_tax,
        issued_at
    } = invoiceData;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #044fa2, #0066cc); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .invoice-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .invoice-info h3 { margin: 0 0 15px; color: #044fa2; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #666; }
        .info-value { font-weight: 500; }
        .company-info { margin-bottom: 20px; }
        .company-info h4 { margin: 0 0 10px; color: #333; }
        .total-section { background: #044fa2; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.final { font-size: 20px; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px; margin-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 CINEMA APP</h1>
            <p>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</p>
        </div>
        
        <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge">✓ Hóa đơn điện tử</span>
            </div>
            
            <div class="invoice-info">
                <h3>📋 Thông tin hóa đơn</h3>
                <div class="info-row">
                    <span class="info-label">Số hóa đơn:</span>
                    <span class="info-value">${invoice_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày xuất:</span>
                    <span class="info-value">${new Date(issued_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng:</span>
                    <span class="info-value">${orderCode}</span>
                </div>
            </div>
            
            <div class="company-info">
                <h4>🏢 Thông tin người mua</h4>
                <p><strong>Công ty:</strong> ${company_name}</p>
                <p><strong>Mã số thuế:</strong> ${tax_code}</p>
                ${company_address ? `<p><strong>Địa chỉ:</strong> ${company_address}</p>` : ''}
                <p><strong>Email:</strong> ${buyer_email}</p>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Tiền trước thuế:</span>
                    <span>${Number(total_before_tax).toLocaleString('vi-VN')}đ</span>
                </div>
                <div class="total-row">
                    <span>Thuế GTGT (10%):</span>
                    <span>${Number(tax_amount).toLocaleString('vi-VN')}đ</span>
                </div>
                <div class="total-row final">
                    <span>TỔNG CỘNG:</span>
                    <span>${Number(total_with_tax).toLocaleString('vi-VN')}đ</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của Cinema App!</p>
            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
            <p>© ${new Date().getFullYear()} Cinema App. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    await emailService.sendMail({
        to: buyer_email,
        subject: `[Cinema App] Hóa đơn VAT - ${invoice_number}`,
        html: htmlContent
    });
    console.log(`✅ Invoice email sent to ${buyer_email}`);
}

// Tạo QR code data cho ticket
function generateQRCode(ticketId, orderCode, showtimeId, seatId) {
    const qrData = `TICKET:${ticketId}|ORDER:${orderCode}|ST:${showtimeId}|SEAT:${seatId}|T:${Date.now()}`;
    const qrHash = crypto.createHash('sha256').update(qrData + process.env.JWT_SECRET).digest('hex');
    return { qrCode: qrData, qrHash };
}

// Khởi tạo VNPay instance
const vnpay = new VNPay({
    tmnCode: VNPAY_CONFIG.vnp_TmnCode,
    secureSecret: VNPAY_CONFIG.vnp_HashSecret,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: true,
    loggerFn: ignoreLogger
});

// Tạo order mới
async function createOrder(userId, orderData) {
    const transaction = await sequelize.transaction();
    
    try {
        const { 
            showtimeId, 
            seats, // [{ id, price }] - danh sách ghế với giá từng ghế
            combos, // [{ comboId, quantity, price }]
            loyaltyPointsUsed = 0,
            promotionCode = null
        } = orderData;

        // Tính tổng tiền vé từ giá từng ghế
        let ticketTotal = 0;
        for (const seat of seats) {
            ticketTotal += parseFloat(seat.price) || 0;
        }
        
        // Lấy danh sách seatIds
        const seatIds = seats.map(s => s.id);
        
        // Tính tổng tiền combo
        let comboTotal = 0;
        if (combos && combos.length > 0) {
            for (const combo of combos) {
                comboTotal += combo.price * combo.quantity;
            }
        }

        const subtotal = ticketTotal + comboTotal;

        // Tính giảm giá từ loyalty points (1 point = 100 VND)
        let loyaltyDiscount = 0;
        if (loyaltyPointsUsed > 0) {
            // Kiểm tra user có đủ points không
            const loyaltyAccount = await LoyaltyAccount.findOne({
                where: { user_id: userId }
            });

            if (!loyaltyAccount || loyaltyAccount.points < loyaltyPointsUsed) {
                throw new Error('Không đủ điểm tích lũy');
            }

            // Giới hạn giảm tối đa 50% tổng đơn
            const maxDiscount = Math.floor(subtotal * 0.5);
            loyaltyDiscount = Math.min(loyaltyPointsUsed * 100, maxDiscount); // 1 point = 100 VND
        }

        // Tính giảm giá từ promotion code
        let promotionDiscount = 0;
        let appliedPromotion = null;
        if (promotionCode) {
            const promotion = await Promotion.findOne({
                where: {
                    code: promotionCode,
                    is_active: true,
                    valid_from: { [Op.lte]: new Date() },
                    valid_to: { [Op.gte]: new Date() }
                }
            });

            if (!promotion) {
                throw new Error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
            }

            // Kiểm tra usage limit
            if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
                throw new Error('Mã khuyến mãi đã hết lượt sử dụng');
            }

            // Kiểm tra usage_per_user - đếm số lần user đã dùng mã này
            if (promotion.usage_per_user) {
                const userUsageCount = await Order.count({
                    where: {
                        user_id: userId,
                        promotion_code: promotionCode,
                        status: { [Op.in]: ['Paid', 'Pending'] }
                    }
                });
                if (userUsageCount >= promotion.usage_per_user) {
                    throw new Error(`Bạn đã sử dụng mã này ${userUsageCount}/${promotion.usage_per_user} lần cho phép`);
                }
            }

            // Kiểm tra min order amount
            if (promotion.min_order_amount && subtotal < parseFloat(promotion.min_order_amount)) {
                throw new Error(`Đơn hàng tối thiểu ${promotion.min_order_amount.toLocaleString('vi-VN')}đ để áp dụng mã này`);
            }

            // Tính giảm giá dựa trên loại
            if (promotion.discount_type === 'Percentage') {
                promotionDiscount = Math.floor(subtotal * parseFloat(promotion.discount_value) / 100);
            } else if (promotion.discount_type === 'FixedAmount') {
                promotionDiscount = parseFloat(promotion.discount_value);
            }

            // Áp dụng max_discount nếu có
            if (promotion.max_discount && promotionDiscount > parseFloat(promotion.max_discount)) {
                promotionDiscount = parseFloat(promotion.max_discount);
            }

            appliedPromotion = promotion;
        }

        const totalAmount = Math.max(0, subtotal - loyaltyDiscount - promotionDiscount);

        // Tạo order code
        const orderCode = `ORD${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Tạo order
        const order = await Order.create({
            user_id: userId,
            order_code: orderCode,
            promotion_code: promotionCode || null,
            total_amount: totalAmount,
            discount_amount: promotionDiscount,
            loyalty_points_used: loyaltyPointsUsed,
            loyalty_discount: loyaltyDiscount,
            status: 'Pending',
            booking_expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 phút
        }, { transaction });

        // Tạo tickets - sử dụng giá từng ghế
        for (const seat of seats) {
            await Ticket.create({
                order_id: order.id,
                showtime_id: showtimeId,
                seat_id: seat.id,
                price: parseFloat(seat.price) || 0,
                status: 'Booked'
            }, { transaction });
        }

        // Tạo combo orders
        if (combos && combos.length > 0) {
            for (const combo of combos) {
                await ComboOrder.create({
                    order_id: order.id,
                    combo_id: combo.comboId,
                    quantity: combo.quantity,
                    unit_price: combo.price,
                    total_price: combo.price * combo.quantity
                }, { transaction });
            }
        }

        // Cập nhật reservation status thành Confirmed
        await SeatReservation.update(
            { status: 'Confirmed' },
            { 
                where: { 
                    showtime_id: showtimeId,
                    seat_id: { [Op.in]: seatIds },
                    user_id: userId,
                    status: 'Held'
                },
                transaction 
            }
        );

        // Cập nhật used_count cho promotion nếu có
        if (appliedPromotion) {
            appliedPromotion.used_count = (appliedPromotion.used_count || 0) + 1;
            await appliedPromotion.save({ transaction });
        }

        // Nếu totalAmount < 5000 (VNPay minimum), tự động hoàn thành đơn hàng miễn phí
        const MIN_VNPAY_AMOUNT = 5000;
        let isFreeOrder = false;
        if (totalAmount < MIN_VNPAY_AMOUNT) {
            isFreeOrder = true;
            // Cập nhật order thành Paid (vì đã thanh toán xong - miễn phí)
            await order.update({ status: 'Paid', payment_method: 'Free' }, { transaction });
            
            // Cập nhật tickets thành Paid
            await Ticket.update(
                { status: 'Paid' },
                { where: { order_id: order.id }, transaction }
            );

            // Cập nhật reservation thành Confirmed (đã thanh toán xong)
            await SeatReservation.update(
                { status: 'Confirmed' },
                { 
                    where: { 
                        showtime_id: showtimeId,
                        seat_id: { [Op.in]: seatIds },
                        user_id: userId
                    },
                    transaction 
                }
            );

            // Tạo payment record cho đơn miễn phí
            await Payment.create({
                order_id: order.id,
                provider: 'Free',
                provider_payment_id: `FREE_${order.order_code}`,
                amount: 0,
                currency: 'VND',
                status: 'Success',
                response_data: { freeOrder: true, originalAmount: subtotal }
            }, { transaction });
        }

        await transaction.commit();

        // 🔔 Emit realtime event for new order created
        const user = await User.findByPk(userId);
        emitToAdmin(SOCKET_EVENTS.NEW_ORDER, {
            orderId: order.id,
            orderCode: order.order_code,
            customer: user?.full_name || 'Khách hàng',
            amount: totalAmount,
            ticketCount: seatIds.length,
            status: isFreeOrder ? 'Paid' : 'Pending',
            createdAt: new Date()
        });

        // 🔔 Emit realtime event to admin dashboard for free orders
        if (isFreeOrder) {
            console.log('🔔 Emitting ORDER_PAID for free order:', order.order_code);
            emitToAdmin(SOCKET_EVENTS.ORDER_PAID, {
                orderId: order.id,
                orderCode: order.order_code,
                customer: user?.full_name || 'Khách hàng',
                amount: totalAmount,
                ticketCount: seatIds.length,
                paidAt: new Date(),
                isFreeOrder: true
            });

            // � Update daily statistics realtime for free orders
            const tickets = await Ticket.findAll({ where: { order_id: order.id } });
            await updateDailyStatistics(order, tickets);

            // �🔔 Emit combo update nếu order có combo
            if (combos && combos.length > 0) {
                console.log('🔔 Emitting COMBO_UPDATED (free order) for combos:', combos.map(c => c.comboId));
                emitToAdmin(SOCKET_EVENTS.COMBO_UPDATED, {
                    comboIds: combos.map(c => c.comboId)
                });
            }
        }

        return {
            orderId: order.id,
            orderCode: order.order_code,
            subtotal,
            loyaltyDiscount,
            promotionDiscount,
            promotionCode: appliedPromotion?.code || null,
            totalAmount,
            ticketCount: seatIds.length,
            comboCount: combos?.length || 0,
            isFreeOrder // Thêm flag để frontend biết đơn hàng miễn phí
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Lấy thông tin loyalty account
async function getLoyaltyInfo(userId) {
    let account = await LoyaltyAccount.findOne({
        where: { user_id: userId }
    });

    // Tạo mới nếu chưa có
    if (!account) {
        account = await LoyaltyAccount.create({
            user_id: userId,
            points: 0,
            tier: 'Silver',
            total_spent: 0
        });
    }

    return {
        points: account.points,
        tier: account.tier,
        totalSpent: parseFloat(account.total_spent),
        // 1 point = 1 VND
        maxDiscountInfo: 'Tối đa giảm 50% tổng đơn hàng'
    };
}

// Tạo VNPay payment URL
function createVnpayPaymentUrl(orderId, amount, orderInfo, ipAddr) {
    // Clean IP address
    let cleanIp = ipAddr;
    if (cleanIp.includes('::ffff:')) {
        cleanIp = cleanIp.replace('::ffff:', '');
    }
    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || !cleanIp) {
        cleanIp = '127.0.0.1';
    }

    console.log('🔗 VNPAY_RETURN_URL:', VNPAY_CONFIG.vnp_ReturnUrl);
    
    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: cleanIp,
        vnp_TxnRef: orderId.toString(),
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
        vnp_Locale: VnpLocale.VN,
    });

    console.log('🔐 VNPay URL:', paymentUrl);
    return paymentUrl;
}

// Xử lý callback từ VNPay
async function processVnpayReturn(vnpParams) {
    console.log('🔐 Verifying VNPay signature...');
    console.log('🔐 Params:', JSON.stringify(vnpParams, null, 2));
    
    // Verify signature using vnpay library
    const verifyResult = vnpay.verifyReturnUrl(vnpParams);
    console.log('🔐 Verify result:', verifyResult);
    
    if (!verifyResult.isVerified) {
        console.log('❌ Signature verification failed');
        return { success: false, message: 'Chữ ký không hợp lệ' };
    }

    console.log('✅ Signature verified successfully');
    const orderId = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionNo = vnpParams['vnp_TransactionNo'];
    const amount = parseInt(vnpParams['vnp_Amount']) / 100;

    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findByPk(orderId, { transaction });

        if (!order) {
            await transaction.rollback();
            return { success: false, message: 'Không tìm thấy đơn hàng' };
        }

        if (responseCode === '00') {
            // Payment success
            order.status = 'Paid';
            order.payment_method = 'VNPay';
            order.updated_at = new Date();
            await order.save({ transaction });

            // Create payment record
            await Payment.create({
                order_id: order.id,
                provider: 'VNPay',
                provider_payment_id: transactionNo,
                amount: amount,
                currency: 'VND',
                status: 'Success',
                response_data: vnpParams,
                paid_at: new Date()
            }, { transaction });

            // Update tickets status thành Paid và tạo QR code
            const tickets = await Ticket.findAll({
                where: { order_id: order.id },
                transaction
            });

            for (const ticket of tickets) {
                const { qrCode, qrHash } = generateQRCode(
                    ticket.id, 
                    order.order_code, 
                    ticket.showtime_id, 
                    ticket.seat_id
                );
                ticket.status = 'Paid';
                ticket.qr_code = qrCode;
                ticket.qr_hash = qrHash;
                await ticket.save({ transaction });
            }

            // Trừ loyalty points nếu có sử dụng
            if (order.loyalty_points_used > 0) {
                const loyaltyAccount = await LoyaltyAccount.findOne({
                    where: { user_id: order.user_id },
                    transaction
                });

                if (loyaltyAccount) {
                    loyaltyAccount.points -= order.loyalty_points_used;
                    await loyaltyAccount.save({ transaction });

                    // Ghi transaction
                    await LoyaltyPointsTransaction.create({
                        user_id: order.user_id,
                        points_change: -order.loyalty_points_used,
                        reason: `Đổi điểm cho đơn hàng ${order.order_code}`,
                        order_id: order.id
                    }, { transaction });
                }
            }

            // Cộng điểm cho đơn hàng này dựa trên tier rate
            let loyaltyAccount = await LoyaltyAccount.findOne({
                where: { user_id: order.user_id },
                transaction
            });

            const currentYear = new Date().getFullYear();

            if (!loyaltyAccount) {
                loyaltyAccount = await LoyaltyAccount.create({
                    user_id: order.user_id,
                    points: 0,
                    tier: 'Silver',
                    total_spent: 0,
                    yearly_spent: 0,
                    spent_year: currentYear
                }, { transaction });
            }

            // Reset yearly_spent nếu sang năm mới
            if (loyaltyAccount.spent_year !== currentYear) {
                loyaltyAccount.yearly_spent = 0;
                loyaltyAccount.spent_year = currentYear;
                // Hạ tier về Silver khi reset năm (tùy chọn)
                // loyaltyAccount.tier = 'Silver';
            }

            // Lấy tier rate dựa trên tier hiện tại của user
            const tierRate = await LoyaltyTierRate.findOne({
                where: { tier: loyaltyAccount.tier }
            });
            const pointsPerThousand = tierRate ? parseFloat(tierRate.points_per_1000) : 1.0;

            // Tính điểm: (tổng tiền / 1000) * rate
            const pointsEarned = Math.floor(parseFloat(order.total_amount) / 1000 * pointsPerThousand);
            
            if (pointsEarned > 0) {
                loyaltyAccount.points += pointsEarned;
                loyaltyAccount.total_spent = parseFloat(loyaltyAccount.total_spent) + parseFloat(order.total_amount);
                loyaltyAccount.yearly_spent = parseFloat(loyaltyAccount.yearly_spent || 0) + parseFloat(order.total_amount);
                
                // Kiểm tra và nâng hạng dựa trên chi tiêu trong năm
                const tierRequirements = await LoyaltyTierRequirement.findAll({
                    order: [['min_yearly_spent', 'DESC']]
                });
                
                for (const req of tierRequirements) {
                    // Chỉ dựa trên tổng chi tiêu trong năm để nâng hạng
                    if (parseFloat(loyaltyAccount.yearly_spent) >= parseFloat(req.min_yearly_spent)) {
                        if (loyaltyAccount.tier !== req.tier) {
                            loyaltyAccount.tier = req.tier;
                            console.log(`🎉 User ${order.user_id} upgraded to ${req.tier}! (Yearly spent: ${loyaltyAccount.yearly_spent})`);
                        }
                        break; // Lấy tier cao nhất đủ điều kiện
                    }
                }
                
                await loyaltyAccount.save({ transaction });

                await LoyaltyPointsTransaction.create({
                    user_id: order.user_id,
                    points_change: pointsEarned,
                    reason: `Tích điểm từ đơn hàng ${order.order_code} (${loyaltyAccount.tier} x${pointsPerThousand})`,
                    order_id: order.id
                }, { transaction });
            }

            await transaction.commit();

            // � Update daily statistics realtime
            await updateDailyStatistics(order, tickets);

            // �🔔 Emit realtime event to admin dashboard
            const user = await User.findByPk(order.user_id);
            emitToAdmin(SOCKET_EVENTS.ORDER_PAID, {
                orderId: order.id,
                orderCode: order.order_code,
                customer: user?.full_name || 'Khách hàng',
                amount: order.total_amount,
                ticketCount: tickets.length,
                paidAt: new Date(),
            });

            // 🔔 Emit combo update nếu order có combo
            const comboOrders = await ComboOrder.findAll({
                where: { order_id: order.id },
                attributes: ['combo_id']
            });
            if (comboOrders.length > 0) {
                console.log('🔔 Emitting COMBO_UPDATED for combos:', comboOrders.map(co => co.combo_id));
                emitToAdmin(SOCKET_EVENTS.COMBO_UPDATED, {
                    comboIds: comboOrders.map(co => co.combo_id)
                });
            }

            return { 
                success: true, 
                message: 'Thanh toán thành công',
                orderCode: order.order_code,
                orderId: order.id
            };
        } else {
            // Payment failed
            order.status = 'Cancelled';
            order.updated_at = new Date();
            await order.save({ transaction });

            await Payment.create({
                order_id: order.id,
                provider: 'VNPay',
                provider_payment_id: transactionNo,
                amount: amount,
                currency: 'VND',
                status: 'Failed',
                response_data: vnpParams
            }, { transaction });

            // Release seat reservations
            await SeatReservation.destroy({
                where: {
                    showtime_id: { [Op.in]: sequelize.literal(`(SELECT showtime_id FROM tickets WHERE order_id = ${order.id})`) },
                    user_id: order.user_id
                },
                transaction
            });

            await transaction.commit();

            return { 
                success: false, 
                message: getVnpayResponseMessage(responseCode),
                orderCode: order.order_code
            };
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Lấy thông tin order
async function getOrderDetails(orderId, userId) {
    const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        include: [
            {
                model: Ticket,
                include: ['Seat', 'Showtime']
            },
            {
                model: ComboOrder,
                include: ['Combo']
            },
            {
                model: Payment
            }
        ]
    });

    return order;
}

// Helper function
function getVnpayResponseMessage(code) {
    const messages = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
        '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
        '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Đã hết hạn chờ thanh toán',
        '12': 'Thẻ/Tài khoản bị khóa',
        '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
        '24': 'Khách hàng hủy giao dịch',
        '51': 'Tài khoản không đủ số dư',
        '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
        '99': 'Lỗi không xác định'
    };
    return messages[code] || 'Giao dịch thất bại';
}

// Lấy danh sách vé của user (gộp theo order)
async function getMyTickets(userId) {
    // Lấy tất cả orders đã thanh toán của user
    const orders = await Order.findAll({
        where: { 
            user_id: userId,
            status: 'Paid'  // Chỉ lấy đơn đã thanh toán
        },
        include: [
            {
                model: Ticket,
                include: [
                    {
                        model: Seat,
                        attributes: ['id', 'row_label', 'seat_number', 'seat_type']
                    }
                ]
            },
            {
                model: ComboOrder,
                include: [{
                    model: Combo,
                    attributes: ['id', 'name', 'description']
                }]
            }
        ],
        order: [['created_at', 'DESC']]
    });

    const result = [];

    for (const order of orders) {
        if (!order.Tickets || order.Tickets.length === 0) continue;

        // Lấy thông tin showtime từ ticket đầu tiên
        const firstTicket = order.Tickets[0];
        const showtime = await Showtime.findByPk(firstTicket.showtime_id, {
            include: [
                {
                    model: Movie,
                    attributes: ['id', 'title', 'poster_url', 'duration_min', 'age_rating']
                },
                {
                    model: CinemaRoom,
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: Theater,
                            attributes: ['id', 'name', 'address']
                        }
                    ]
                }
            ]
        });

        // Gộp thông tin ghế
        const seats = order.Tickets.map(ticket => ({
            id: ticket.Seat.id,
            row_label: ticket.Seat.row_label,
            seat_number: ticket.Seat.seat_number,
            seat_type: ticket.Seat.seat_type
        }));

        // Gộp thông tin combo
        const combos = (order.ComboOrders || []).map(co => ({
            name: co.Combo?.name || 'Combo',
            quantity: co.quantity,
            price: co.total_price
        }));

        // Lấy QR code từ ticket đầu tiên (hoặc tạo 1 QR chung cho order)
        const qrCode = firstTicket.qr_code;

        result.push({
            order_id: order.id,
            order_code: order.order_code,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            qr_code: qrCode,
            showtime: showtime ? {
                id: showtime.id,
                start_time: showtime.start_time,
                end_time: showtime.end_time,
                movie: showtime.Movie,
                cinema_room: showtime.CinemaRoom
            } : null,
            seats: seats,
            combos: combos,
            ticket_count: order.Tickets.length
        });
    }

    return result;
}

// Validate và lấy thông tin promotion
async function validatePromotion(code, orderAmount = 0, userId = null) {
    const promotion = await Promotion.findOne({
        where: {
            code: code,
            is_active: true,
            valid_from: { [Op.lte]: new Date() },
            valid_to: { [Op.gte]: new Date() }
        }
    });

    if (!promotion) {
        return { valid: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' };
    }

    // Kiểm tra usage limit
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
        return { valid: false, message: 'Mã khuyến mãi đã hết lượt sử dụng' };
    }

    // Kiểm tra usage_per_user - nếu có userId
    if (userId && promotion.usage_per_user) {
        const userUsageCount = await Order.count({
            where: {
                user_id: userId,
                promotion_code: code,
                status: { [Op.in]: ['Paid', 'Pending'] }
            }
        });
        if (userUsageCount >= promotion.usage_per_user) {
            return { 
                valid: false, 
                message: `Bạn đã sử dụng mã này ${userUsageCount}/${promotion.usage_per_user} lần cho phép` 
            };
        }
    }

    // Kiểm tra min order amount
    if (promotion.min_order_amount && orderAmount < parseFloat(promotion.min_order_amount)) {
        return { 
            valid: false, 
            message: `Đơn hàng tối thiểu ${parseFloat(promotion.min_order_amount).toLocaleString('vi-VN')}đ để áp dụng mã này` 
        };
    }

    // Tính giảm giá dự kiến
    let discount = 0;
    if (orderAmount > 0) {
        if (promotion.discount_type === 'Percentage') {
            discount = Math.floor(orderAmount * parseFloat(promotion.discount_value) / 100);
        } else if (promotion.discount_type === 'FixedAmount') {
            discount = parseFloat(promotion.discount_value);
        }

        // Áp dụng max_discount nếu có
        if (promotion.max_discount && discount > parseFloat(promotion.max_discount)) {
            discount = parseFloat(promotion.max_discount);
        }
    }

    return {
        valid: true,
        discount: discount,
        promotion: {
            code: promotion.code,
            name: promotion.name,
            description: promotion.description,
            discount_type: promotion.discount_type,
            discount_value: parseFloat(promotion.discount_value),
            max_discount: promotion.max_discount ? parseFloat(promotion.max_discount) : null,
            min_order_amount: promotion.min_order_amount ? parseFloat(promotion.min_order_amount) : 0,
            applicable_to: promotion.applicable_to
        }
    };
}

// Lấy danh sách promotion đang active
async function getActivePromotions() {
    const promotions = await Promotion.findAll({
        where: {
            is_active: true,
            valid_from: { [Op.lte]: new Date() },
            valid_to: { [Op.gte]: new Date() }
        },
        attributes: ['code', 'name', 'description', 'discount_type', 'discount_value', 'max_discount', 'min_order_amount', 'applicable_to'],
        order: [['discount_value', 'DESC']]
    });

    return promotions;
}

// Yêu cầu xuất hóa đơn VAT
async function requestInvoice(orderId, userId, invoiceData) {
    // Kiểm tra order thuộc về user
    const order = await Order.findOne({
        where: { id: orderId, user_id: userId, status: 'Paid' }
    });

    if (!order) {
        throw new Error('Đơn hàng không tồn tại hoặc chưa thanh toán');
    }

    // Kiểm tra đã có invoice chưa
    const existingInvoice = await Invoice.findOne({
        where: { order_id: orderId }
    });

    if (existingInvoice) {
        throw new Error('Đơn hàng này đã được yêu cầu xuất hóa đơn');
    }

    // Tạo invoice number: INV + năm + tháng + random
    const now = new Date();
    const invoiceNumber = `INV${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Tính thuế VAT 10%
    const taxAmount = parseFloat(order.total_amount) * 0.1;

    const invoice = await Invoice.create({
        order_id: orderId,
        invoice_number: invoiceNumber,
        company_name: invoiceData.companyName,
        tax_code: invoiceData.taxCode,
        company_address: invoiceData.companyAddress,
        buyer_email: invoiceData.buyerEmail,
        tax_amount: taxAmount,
        tax_info: {
            order_code: order.order_code,
            total_before_tax: parseFloat(order.total_amount),
            vat_rate: 10,
            created_by: userId
        }
    });

    const invoiceResult = {
        invoice_number: invoice.invoice_number,
        company_name: invoice.company_name,
        tax_code: invoice.tax_code,
        company_address: invoice.company_address,
        buyer_email: invoice.buyer_email,
        total_before_tax: parseFloat(order.total_amount),
        tax_amount: taxAmount,
        total_with_tax: parseFloat(order.total_amount) + taxAmount,
        issued_at: invoice.issued_at
    };

    // Gửi email hóa đơn
    try {
        await sendInvoiceEmail(invoiceResult, order.order_code);
    } catch (emailError) {
        console.error('⚠️ Failed to send invoice email:', emailError.message);
        // Không throw error - invoice đã được tạo, chỉ gửi email thất bại
    }

    return invoiceResult;
}

// Lấy thông tin hóa đơn
async function getInvoice(orderId, userId) {
    const order = await Order.findOne({
        where: { id: orderId, user_id: userId }
    });

    if (!order) {
        throw new Error('Đơn hàng không tồn tại');
    }

    const invoice = await Invoice.findOne({
        where: { order_id: orderId }
    });

    if (!invoice) {
        return null;
    }

    return {
        invoice_number: invoice.invoice_number,
        company_name: invoice.company_name,
        tax_code: invoice.tax_code,
        company_address: invoice.company_address,
        buyer_email: invoice.buyer_email,
        total_before_tax: invoice.tax_info?.total_before_tax,
        tax_amount: parseFloat(invoice.tax_amount),
        total_with_tax: (invoice.tax_info?.total_before_tax || 0) + parseFloat(invoice.tax_amount),
        issued_at: invoice.issued_at
    };
}

export default {
    createOrder,
    getLoyaltyInfo,
    createVnpayPaymentUrl,
    processVnpayReturn,
    getOrderDetails,
    getMyTickets,
    validatePromotion,
    getActivePromotions,
    requestInvoice,
    getInvoice
};
