import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/combo.dart';
import '../models/payment.dart';
import '../providers/auth_provider.dart';
import '../providers/seat_selection_provider.dart';
import '../services/payment_service.dart';
import '../utils/snackbar_helper.dart';
import 'payment_success_screen.dart';
import 'vnpay_webview_screen.dart';

class PaymentScreen extends StatefulWidget {
  final double seatTotal;
  final double comboTotal;
  final List<Map<String, dynamic>> selectedCombos;

  const PaymentScreen({
    Key? key,
    required this.seatTotal,
    required this.comboTotal,
    required this.selectedCombos,
  }) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isLoading = false;
  bool _isCreatingOrder = false;
  LoyaltyInfo? _loyaltyInfo;
  int _pointsToUse = 0;
  bool _ageConfirmed = false;
  String? _errorMessage;

  // Promotion fields
  final TextEditingController _promoCodeController = TextEditingController();
  String? _appliedPromoCode;
  double _promoDiscount = 0;
  String? _promoMessage;
  bool _isValidatingPromo = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showAgeConfirmationDialog();
      _loadLoyaltyInfo();

      // Set callback khi hết giờ
      Provider.of<SeatSelectionProvider>(
        context,
        listen: false,
      ).setOnExpiredCallback(() {
        _handleReservationExpired();
      });
    });
  }

  @override
  void dispose() {
    _promoCodeController.dispose();
    super.dispose();
  }

  void _showAgeConfirmationDialog() {
    final seatProvider = Provider.of<SeatSelectionProvider>(
      context,
      listen: false,
    );
    final movie = seatProvider.movie;

    String ageRating = 'P';
    if (movie != null && movie['age_rating'] != null) {
      ageRating = movie['age_rating'];
    }

    // Xác định màu sắc và mô tả dựa trên age rating
    Color ratingColor;
    String ratingDescription;
    IconData ratingIcon;

    switch (ageRating) {
      case 'C18':
        ratingColor = Colors.red[700]!;
        ratingDescription =
            'Phim chỉ dành cho khán giả từ 18 tuổi trở lên. Phim có thể chứa nội dung người lớn.';
        ratingIcon = Icons.no_adult_content;
        break;
      case 'C16':
        ratingColor = Colors.orange[700]!;
        ratingDescription =
            'Phim dành cho khán giả từ 16 tuổi trở lên. Phim có thể chứa bạo lực hoặc nội dung nhạy cảm.';
        ratingIcon = Icons.warning_amber_rounded;
        break;
      case 'C13':
        ratingColor = Colors.amber[700]!;
        ratingDescription =
            'Phim dành cho khán giả từ 13 tuổi trở lên. Khuyến cáo trẻ em dưới 13 tuổi nên có phụ huynh đi cùng.';
        ratingIcon = Icons.family_restroom;
        break;
      default: // P - Phổ biến
        ratingColor = Colors.green[600]!;
        ratingDescription = 'Phim phù hợp với mọi lứa tuổi.';
        ratingIcon = Icons.check_circle_outline;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: EdgeInsets.zero,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header với badge age rating
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                color: ratingColor.withOpacity(0.1),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                children: [
                  // Age rating badge
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: ratingColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: ratingColor.withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        ageRating,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Phân loại độ tuổi',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: ratingColor,
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),

              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(ratingIcon, color: ratingColor, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          ratingDescription,
                          style: const TextStyle(fontSize: 14, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.grey[600],
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Vé đã mua không được hoàn trả nếu bạn không đủ điều kiện về độ tuổi.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Bạn xác nhận đủ tuổi để xem phim này?',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: BorderSide(color: Colors.grey[400]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Từ chối',
                      style: TextStyle(
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => _ageConfirmed = true);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ratingColor,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'Xác nhận',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _loadLoyaltyInfo() async {
    try {
      setState(() => _isLoading = true);

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paymentService = PaymentService(authProvider);
      final loyaltyInfo = await paymentService.getLoyaltyInfo();

      setState(() {
        _loyaltyInfo = loyaltyInfo;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      print('Error loading loyalty info: $e');
    }
  }

  void _handleReservationExpired() async {
    if (!mounted) return;

    await Provider.of<SeatSelectionProvider>(
      context,
      listen: false,
    ).clearSelection();

    if (mounted) {
      SnackBarHelper.showError(context, 'Thời gian giữ ghế đã hết');
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  double get _subtotal => widget.seatTotal + widget.comboTotal;

  double get _loyaltyDiscount {
    if (_loyaltyInfo == null) return 0;
    // Giới hạn giảm tối đa 50%
    final maxDiscount = _subtotal * 0.5;
    final loyaltyValue = _pointsToUse * 100.0; // 1 điểm = 100 đồng
    return loyaltyValue > maxDiscount ? maxDiscount : loyaltyValue;
  }

  double get _totalAmount => _subtotal - _loyaltyDiscount - _promoDiscount;

  int get _maxPointsCanUse {
    if (_loyaltyInfo == null) return 0;
    // Tối đa có thể dùng 50% của subtotal (tính bằng đồng, chia cho 100 để convert sang điểm)
    final maxFromSubtotal = ((_subtotal * 0.5) / 100).floor();
    return _loyaltyInfo!.points < maxFromSubtotal
        ? _loyaltyInfo!.points
        : maxFromSubtotal;
  }

  Future<void> _validatePromoCode() async {
    final code = _promoCodeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() {
        _promoMessage = 'Vui lòng nhập mã khuyến mãi';
      });
      return;
    }

    setState(() {
      _isValidatingPromo = true;
      _promoMessage = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paymentService = PaymentService(authProvider);
      final result = await paymentService.validatePromotion(code, _subtotal);

      if (result['success'] == true) {
        setState(() {
          _appliedPromoCode = code;
          _promoDiscount = (result['discount'] as num).toDouble();
          _promoMessage =
              'Áp dụng thành công: -${NumberFormat('#,###').format(_promoDiscount)}đ';
        });
      } else {
        setState(() {
          _promoMessage = result['message'] ?? 'Mã khuyến mãi không hợp lệ';
        });
      }
    } catch (e) {
      setState(() {
        _promoMessage = 'Lỗi kiểm tra mã khuyến mãi';
      });
    } finally {
      setState(() {
        _isValidatingPromo = false;
      });
    }
  }

  void _removePromoCode() {
    setState(() {
      _appliedPromoCode = null;
      _promoDiscount = 0;
      _promoMessage = null;
      _promoCodeController.clear();
    });
  }

  Future<void> _processPayment() async {
    if (_isCreatingOrder) return;

    setState(() {
      _isCreatingOrder = true;
      _errorMessage = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final seatProvider = Provider.of<SeatSelectionProvider>(
        context,
        listen: false,
      );
      final paymentService = PaymentService(authProvider);

      // Tạo order
      final orderResult = await paymentService.createOrder(
        showtimeId: seatProvider.showtimeId!,
        seats: seatProvider.selectedSeats.map((s) => {
          'id': s.id,
          'price': s.price > 0 ? s.price : seatProvider.ticketPrice,
        }).toList(),
        combos: widget.selectedCombos,
        loyaltyPointsUsed: _pointsToUse,
        promotionCode: _appliedPromoCode,
      );

      // Nếu đơn hàng miễn phí (< 5000đ), chuyển thẳng tới màn hình thành công
      if (orderResult.isFreeOrder) {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => PaymentSuccessScreen(
                orderId: orderResult.orderId,
                orderCode: orderResult.orderCode,
              ),
            ),
          );
        }
        return;
      }

      // Tạo VNPay payment URL
      final paymentUrl = await paymentService.createVnpayPayment(
        orderResult.orderId,
        orderResult.totalAmount,
        'Thanh toán vé xem phim - ${orderResult.orderCode}',
      );

      // Mở WebView để thanh toán
      if (mounted) {
        final result = await Navigator.push<Map<String, dynamic>>(
          context,
          MaterialPageRoute(
            builder: (_) => VnpayWebviewScreen(
              paymentUrl: paymentUrl,
              orderCode: orderResult.orderCode,
            ),
          ),
        );

        // Xử lý kết quả từ WebView
        if (result != null && mounted) {
          if (result['success'] == true) {
            // Thanh toán thành công
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => PaymentSuccessScreen(
                  orderId: orderResult.orderId,
                  orderCode: orderResult.orderCode,
                ),
              ),
            );
          } else if (result['cancelled'] == true) {
            // User hủy thanh toán
            setState(() {
              _isCreatingOrder = false;
              _errorMessage = 'Bạn đã hủy thanh toán';
            });
          } else {
            // Thanh toán thất bại
            setState(() {
              _isCreatingOrder = false;
              _errorMessage = 'Thanh toán thất bại. Vui lòng thử lại.';
            });
          }
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isCreatingOrder = false;
      });
    }
  }

  void _showPaymentPendingDialog(OrderResult orderResult) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.hourglass_top, color: Colors.orange),
            SizedBox(width: 8),
            Text('Đang chờ thanh toán'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Mã đơn hàng: ${orderResult.orderCode}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Vui lòng hoàn tất thanh toán trong trình duyệt.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _checkPaymentStatus(orderResult.orderId);
            },
            child: const Text('Đã thanh toán xong'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _isCreatingOrder = false);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.grey),
            child: const Text('Hủy'),
          ),
        ],
      ),
    );
  }

  Future<void> _checkPaymentStatus(int orderId) async {
    try {
      setState(() => _isCreatingOrder = true);

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paymentService = PaymentService(authProvider);
      final orderDetails = await paymentService.getOrderDetails(orderId);

      if (orderDetails['status'] == 'Paid') {
        // Thanh toán thành công
        if (mounted) {
          final seatProvider = Provider.of<SeatSelectionProvider>(
            context,
            listen: false,
          );
          seatProvider.clearSelectionWithoutApi();

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => PaymentSuccessScreen(
                orderCode: orderDetails['order_code'],
                orderId: orderId,
              ),
            ),
          );
        }
      } else {
        // Chưa thanh toán
        SnackBarHelper.showWarning(
          context,
          'Chưa nhận được thanh toán. Vui lòng thử lại.',
        );
        setState(() => _isCreatingOrder = false);
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Không thể kiểm tra trạng thái thanh toán';
        _isCreatingOrder = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Thanh toán',
            style: TextStyle(
              color: Colors.black87,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          actions: [
            Consumer<SeatSelectionProvider>(
              builder: (context, provider, _) {
                if (provider.hasReservation && provider.remainingTime != null) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: _buildTimer(provider.remainingTime!),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildOrderSummary(),
                    const SizedBox(height: 16),
                    _buildPromotionSection(),
                    const SizedBox(height: 16),
                    _buildLoyaltySection(),
                    const SizedBox(height: 16),
                    _buildPaymentMethodSection(),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: Colors.red[700]),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: TextStyle(color: Colors.red[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
        bottomNavigationBar: _buildBottomBar(),
      ),
    );
  }

  Widget _buildOrderSummary() {
    final seatProvider = Provider.of<SeatSelectionProvider>(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chi tiết đơn hàng',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const Divider(height: 24),
          // Movie info
          if (seatProvider.movie != null) ...[
            Text(
              seatProvider.movie!['title'] ?? 'Phim',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              '${seatProvider.showtime?['formatted_time'] ?? ''} - ${seatProvider.showtime?['formatted_date'] ?? ''}',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            Text(
              seatProvider.theater?['name'] ?? '',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const Divider(height: 24),
          ],
          // Seats
          _buildSummaryRow(
            'Ghế (${seatProvider.selectedSeats.length})',
            seatProvider.selectedSeats
                .map((s) => '${s.rowLabel}${s.seatNumber}')
                .join(', '),
            widget.seatTotal,
          ),
          // Combos
          if (widget.selectedCombos.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...widget.selectedCombos.map(
              (combo) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: _buildSummaryRow(
                  '${combo['name']} x${combo['quantity']}',
                  '',
                  (combo['price'] as num).toDouble() *
                      (combo['quantity'] as int),
                ),
              ),
            ),
          ],
          const Divider(height: 24),
          // Subtotal
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tạm tính',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              Text(
                '${NumberFormat('#,###').format(_subtotal)}đ',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String detail, double price) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
              if (detail.isNotEmpty)
                Text(
                  detail,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
            ],
          ),
        ),
        Text(
          '${NumberFormat('#,###').format(price)}đ',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _buildPromotionSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_offer, color: Colors.red[700]),
              const SizedBox(width: 8),
              const Text(
                'Mã khuyến mãi',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_appliedPromoCode != null) ...[
            // Show applied promo code
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green[300]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green[700], size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _appliedPromoCode!,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.green[700],
                          ),
                        ),
                        Text(
                          'Giảm ${NumberFormat('#,###').format(_promoDiscount)}đ',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _removePromoCode,
                    icon: Icon(Icons.close, color: Colors.grey[600], size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ] else ...[
            // Show input field
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _promoCodeController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      hintText: 'Nhập mã khuyến mãi',
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF044fa2)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _isValidatingPromo ? null : _validatePromoCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF044fa2),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isValidatingPromo
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Áp dụng',
                          style: TextStyle(color: Colors.white),
                        ),
                ),
              ],
            ),
            if (_promoMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _promoMessage!,
                style: TextStyle(
                  fontSize: 12,
                  color: _promoMessage!.contains('thành công')
                      ? Colors.green[700]
                      : Colors.red[700],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildLoyaltySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.star, color: Colors.amber[700]),
              const SizedBox(width: 8),
              const Text(
                'Điểm thành viên',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loyaltyInfo != null) ...[
            Row(
              children: [
                _buildTierBadge(_loyaltyInfo!.tier),
                const SizedBox(width: 12),
                Text(
                  '${NumberFormat('#,###').format(_loyaltyInfo!.points)} điểm',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF044fa2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              _loyaltyInfo!.maxDiscountInfo,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            if (_loyaltyInfo!.points > 0) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Sử dụng điểm:'),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Slider(
                      value: _pointsToUse.toDouble(),
                      min: 0,
                      max: _maxPointsCanUse.toDouble(),
                      divisions: _maxPointsCanUse > 0 ? _maxPointsCanUse : 1,
                      label:
                          '${NumberFormat('#,###').format(_pointsToUse)} điểm',
                      onChanged: (value) {
                        setState(() => _pointsToUse = value.round());
                      },
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Điểm sử dụng: ${NumberFormat('#,###').format(_pointsToUse)}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  Text(
                    '-${NumberFormat('#,###').format(_loyaltyDiscount)}đ',
                    style: TextStyle(
                      color: Colors.green[700],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ] else ...[
            Text(
              'Đang tải thông tin điểm...',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTierBadge(String tier) {
    Color bgColor;
    switch (tier.toLowerCase()) {
      case 'gold':
        bgColor = Colors.amber;
        break;
      case 'platinum':
        bgColor = Colors.blueGrey;
        break;
      default:
        bgColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        tier.toUpperCase(),
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Phương thức thanh toán',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF044fa2), width: 2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Image.network(
                  'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png',
                  width: 60,
                  height: 40,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    width: 60,
                    height: 40,
                    color: Colors.grey[200],
                    child: const Icon(Icons.payment),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'VNPay',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'Thanh toán qua VNPay QR',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.check_circle, color: const Color(0xFF044fa2)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_promoDiscount > 0)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Khuyến mãi ($_appliedPromoCode)'),
                  Text(
                    '-${NumberFormat('#,###').format(_promoDiscount)}đ',
                    style: TextStyle(
                      color: Colors.green[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            if (_loyaltyDiscount > 0)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Giảm giá điểm thành viên'),
                  Text(
                    '-${NumberFormat('#,###').format(_loyaltyDiscount)}đ',
                    style: TextStyle(
                      color: Colors.green[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            if (_promoDiscount > 0 || _loyaltyDiscount > 0)
              const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tổng thanh toán',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${NumberFormat('#,###').format(_totalAmount)}đ',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF044fa2),
                      ),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: _isCreatingOrder ? null : _processPayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF044fa2),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isCreatingOrder
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Thanh toán VNPay',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimer(Duration remaining) {
    final minutes = remaining.inMinutes;
    final seconds = remaining.inSeconds % 60;
    final isLowTime = remaining.inMinutes < 2;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isLowTime ? Colors.red : Colors.orange,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Text(
            '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
