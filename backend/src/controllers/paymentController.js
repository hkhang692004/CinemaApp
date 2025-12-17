import paymentService from '../services/paymentService.js';

// Tạo order mới
export async function createOrder(req, res) {
    try {
        const userId = req.user.id;
        const orderData = req.body;

        const result = await paymentService.createOrder(userId, orderData);

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: result
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Không thể tạo đơn hàng'
        });
    }
}

// Lấy thông tin loyalty
export async function getLoyaltyInfo(req, res) {
    try {
        const userId = req.user.id;
        const loyaltyInfo = await paymentService.getLoyaltyInfo(userId);

        res.json({
            success: true,
            data: loyaltyInfo
        });
    } catch (error) {
        console.error('Get loyalty info error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin điểm tích lũy'
        });
    }
}

// Tạo VNPay payment URL
export async function createVnpayPayment(req, res) {
    try {
        const { orderId, amount, orderInfo } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       '127.0.0.1';

        const paymentUrl = paymentService.createVnpayPaymentUrl(
            orderId, 
            amount, 
            orderInfo || `Thanh toán đơn hàng #${orderId}`,
            ipAddr
        );

        res.json({
            success: true,
            data: { paymentUrl }
        });
    } catch (error) {
        console.error('Create VNPay payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo link thanh toán'
        });
    }
}

// VNPay return callback (GET request from VNPay redirect)
export async function vnpayReturn(req, res) {
    try {
        console.log('📥 VNPay Return params:', req.query);
        const vnpParams = req.query;
        const result = await paymentService.processVnpayReturn(vnpParams);
        console.log('📤 VNPay Process result:', result);

        // Render HTML page that redirects to app via deep link
        const deepLink = result.success 
            ? `cinemaapp://payment-success?orderCode=${result.orderCode}&orderId=${result.orderId}`
            : `cinemaapp://payment-failed?message=${encodeURIComponent(result.message || 'Thanh toán thất bại')}`;

        const statusText = result.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại';
        const statusColor = result.success ? '#4CAF50' : '#f44336';

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${statusText}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
        }
        .status {
            font-size: 24px;
            font-weight: bold;
            color: ${statusColor};
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #ccc;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            padding: 15px 40px;
            background: ${statusColor};
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
        }
        .loading {
            margin-top: 20px;
            font-size: 14px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">${statusText}</div>
        <div class="message">${result.success ? `Mã đơn hàng: ${result.orderCode}` : (result.message || '')}</div>
        <a href="${deepLink}" class="btn">Quay về ứng dụng</a>
        <div class="loading">Đang chuyển hướng về ứng dụng...</div>
    </div>
    <script>
        // Auto redirect after 1 second
        setTimeout(function() {
            window.location.href = "${deepLink}";
        }, 1000);
    </script>
</body>
</html>
        `);
    } catch (error) {
        console.error('VNPay return error:', error);
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lỗi thanh toán</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
        }
        .container { text-align: center; padding: 40px; }
        .status { font-size: 24px; font-weight: bold; color: #f44336; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 15px 40px; background: #f44336; color: white; text-decoration: none; border-radius: 25px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">Lỗi xử lý thanh toán</div>
        <a href="cinemaapp://payment-failed?message=${encodeURIComponent('Lỗi xử lý thanh toán')}" class="btn">Quay về ứng dụng</a>
    </div>
    <script>
        setTimeout(function() {
            window.location.href = "cinemaapp://payment-failed?message=${encodeURIComponent('Lỗi xử lý thanh toán')}";
        }, 1000);
    </script>
</body>
</html>
        `);
    }
}

// Verify VNPay payment from Flutter (khi dùng deep link return)
export async function verifyVnpayPayment(req, res) {
    try {
        const vnpParams = req.body;
        const result = await paymentService.processVnpayReturn(vnpParams);

        res.json({
            success: result.success,
            message: result.message,
            data: result.success ? {
                orderCode: result.orderCode,
                orderId: result.orderId
            } : null
        });
    } catch (error) {
        console.error('Verify VNPay payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực thanh toán'
        });
    }
}

// VNPay IPN (Instant Payment Notification)
export async function vnpayIPN(req, res) {
    try {
        const vnpParams = req.query;
        const result = await paymentService.processVnpayReturn(vnpParams);

        if (result.success) {
            res.json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            res.json({ RspCode: '99', Message: result.message });
        }
    } catch (error) {
        console.error('VNPay IPN error:', error);
        res.json({ RspCode: '99', Message: 'Unknown error' });
    }
}

// Lấy chi tiết order
export async function getOrderDetails(req, res) {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await paymentService.getOrderDetails(orderId, userId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin đơn hàng'
        });
    }
}

// Lấy danh sách vé của user
export async function getMyTickets(req, res) {
    try {
        const userId = req.user.id;
        const tickets = await paymentService.getMyTickets(userId);

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách vé'
        });
    }
}

// Validate promotion code
export async function validatePromotion(req, res) {
    try {
        const { code, orderAmount } = req.body;
        const userId = req.user?.id; // Lấy userId từ token
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng nhập mã khuyến mãi' 
            });
        }

        const result = await paymentService.validatePromotion(code, orderAmount || 0, userId);
        
        if (!result.valid) {
            return res.status(400).json({ 
                success: false, 
                message: result.message 
            });
        }

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Validate promotion error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi kiểm tra mã khuyến mãi' 
        });
    }
}

// Get active promotions list
export async function getActivePromotions(req, res) {
    try {
        const promotions = await paymentService.getActivePromotions();
        res.json({
            success: true,
            promotions
        });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi lấy danh sách khuyến mãi' 
        });
    }
}

// Yêu cầu xuất hóa đơn
export async function requestInvoice(req, res) {
    try {
        const userId = req.user?.id;
        const { orderId, companyName, taxCode, companyAddress, buyerEmail } = req.body;

        if (!orderId || !companyName || !taxCode || !buyerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin: Tên công ty, Mã số thuế, Email'
            });
        }

        const result = await paymentService.requestInvoice(orderId, userId, {
            companyName,
            taxCode,
            companyAddress,
            buyerEmail
        });

        res.json({
            success: true,
            message: 'Yêu cầu xuất hóa đơn thành công',
            invoice: result
        });
    } catch (error) {
        console.error('Request invoice error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi yêu cầu xuất hóa đơn'
        });
    }
}

// Lấy thông tin hóa đơn
export async function getInvoice(req, res) {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;

        const invoice = await paymentService.getInvoice(orderId, userId);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Chưa có hóa đơn cho đơn hàng này'
            });
        }

        res.json({
            success: true,
            invoice
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin hóa đơn'
        });
    }
}

export default {
    createOrder,
    getLoyaltyInfo,
    createVnpayPayment,
    vnpayReturn,
    verifyVnpayPayment,
    vnpayIPN,
    getOrderDetails,
    getMyTickets,
    validatePromotion,
    getActivePromotions,
    requestInvoice,
    getInvoice
};
