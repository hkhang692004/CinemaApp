import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/auth_provider.dart';
import '../services/payment_service.dart';
import '../utils/snackbar_helper.dart';
import 'home_screen.dart';

class PaymentSuccessScreen extends StatefulWidget {
  final String orderCode;
  final int orderId;

  const PaymentSuccessScreen({
    Key? key,
    required this.orderCode,
    required this.orderId,
  }) : super(key: key);

  @override
  State<PaymentSuccessScreen> createState() => _PaymentSuccessScreenState();
}

class _PaymentSuccessScreenState extends State<PaymentSuccessScreen> {
  Map<String, dynamic>? _orderDetails;
  Map<String, dynamic>? _invoiceData;
  bool _isLoading = true;
  bool _hasRequestedInvoice = false;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paymentService = PaymentService(authProvider);
      final details = await paymentService.getOrderDetails(widget.orderId);
      
      setState(() {
        _orderDetails = details;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print('Error loading order details: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        body: SafeArea(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      // Success icon
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.green[50],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.check_circle,
                          size: 80,
                          color: Colors.green[600],
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Thanh toán thành công!',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Mã đơn hàng: ${widget.orderCode}',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[700],
                        ),
                      ),
                      const SizedBox(height: 32),
                      // Order details card
                      if (_orderDetails != null) _buildOrderCard(),
                      const SizedBox(height: 24),
                      // QR Code section
                      _buildQRSection(),
                      const SizedBox(height: 16),
                      // Invoice request button
                      _buildInvoiceSection(),
                      const SizedBox(height: 32),
                      // Buttons
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).popUntil((route) => route.isFirst);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF044fa2),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Về trang chủ',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () {
                          // Điều hướng đến trang vé - về HomeScreen với tab index 2
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(
                              builder: (context) => const HomeScreen(initialTabIndex: 2),
                            ),
                            (route) => false,
                          );
                        },
                        child: const Text('Xem lịch sử đặt vé'),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildOrderCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin vé',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Divider(height: 24),
          _buildInfoRow(
            'Tổng tiền',
            '${NumberFormat('#,###').format(double.tryParse(_orderDetails!['total_amount'].toString()) ?? 0)}đ',
            isBold: true,
          ),
          if (_orderDetails!['loyalty_discount'] != null && 
              double.tryParse(_orderDetails!['loyalty_discount'].toString()) != 0) ...[
            const SizedBox(height: 8),
            _buildInfoRow(
              'Giảm giá điểm',
              '-${NumberFormat('#,###').format(double.tryParse(_orderDetails!['loyalty_discount'].toString()) ?? 0)}đ',
              valueColor: Colors.green[700],
            ),
          ],
          const SizedBox(height: 8),
          _buildInfoRow(
            'Trạng thái',
            'Đã thanh toán',
            valueColor: Colors.green[700],
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            'Phương thức',
            _orderDetails!['payment_method'] ?? 'VNPay',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey[600]),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: valueColor ?? Colors.black87,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }

  Widget _buildQRSection() {
    // Lấy qr_code từ ticket đầu tiên (hoặc tạo QR từ order code)
    String? qrData;
    if (_orderDetails != null && _orderDetails!['Tickets'] != null) {
      final tickets = _orderDetails!['Tickets'] as List;
      if (tickets.isNotEmpty) {
        qrData = tickets[0]['qr_code'];
      }
    }
    qrData ??= 'ORDER:${widget.orderCode}';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Mã QR vé',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Center(
              child: QrImageView(
                data: qrData,
                version: QrVersions.auto,
                size: 180,
                backgroundColor: Colors.white,
                errorCorrectionLevel: QrErrorCorrectLevel.M,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            widget.orderCode,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Đưa mã này cho nhân viên khi vào rạp',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInvoiceSection() {
    if (_hasRequestedInvoice && _invoiceData != null) {
      // Đã yêu cầu hóa đơn - hiển thị thông tin
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green[200]!),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long, color: Colors.green[700]),
                const SizedBox(width: 8),
                Text(
                  'Đã yêu cầu xuất hóa đơn',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildInvoiceInfoRow('Số hóa đơn', _invoiceData!['invoice_number'] ?? ''),
            _buildInvoiceInfoRow('Công ty', _invoiceData!['company_name'] ?? ''),
            _buildInvoiceInfoRow('MST', _invoiceData!['tax_code'] ?? ''),
            _buildInvoiceInfoRow('Email', _invoiceData!['buyer_email'] ?? ''),
          ],
        ),
      );
    }

    // Chưa yêu cầu - hiển thị nút
    return OutlinedButton.icon(
      onPressed: _showInvoiceDialog,
      icon: const Icon(Icons.receipt_long),
      label: const Text('Yêu cầu xuất hóa đơn VAT'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Widget _buildInvoiceInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  void _showInvoiceDialog() {
    final companyNameController = TextEditingController();
    final taxCodeController = TextEditingController();
    final addressController = TextEditingController();
    final emailController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.receipt_long, color: Colors.blue[700]),
            const SizedBox(width: 8),
            const Text('Yêu cầu hóa đơn VAT'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: companyNameController,
                decoration: const InputDecoration(
                  labelText: 'Tên công ty *',
                  hintText: 'Nhập tên công ty',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: taxCodeController,
                decoration: const InputDecoration(
                  labelText: 'Mã số thuế *',
                  hintText: 'Nhập mã số thuế',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: addressController,
                decoration: const InputDecoration(
                  labelText: 'Địa chỉ công ty',
                  hintText: 'Nhập địa chỉ (không bắt buộc)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email nhận hóa đơn *',
                  hintText: 'Nhập email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              final companyName = companyNameController.text.trim();
              final taxCode = taxCodeController.text.trim();
              final email = emailController.text.trim();
              final address = addressController.text.trim();

              if (companyName.isEmpty || taxCode.isEmpty || email.isEmpty) {
                SnackBarHelper.showError(context, 'Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
              }

              Navigator.pop(context);
              await _requestInvoice(companyName, taxCode, address, email);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF044fa2),
            ),
            child: const Text('Gửi yêu cầu', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _requestInvoice(String companyName, String taxCode, String address, String email) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paymentService = PaymentService(authProvider);
      
      final result = await paymentService.requestInvoice(
        orderId: widget.orderId,
        companyName: companyName,
        taxCode: taxCode,
        companyAddress: address.isNotEmpty ? address : null,
        buyerEmail: email,
      );

      setState(() {
        _hasRequestedInvoice = true;
        _invoiceData = result;
      });

      if (mounted) {
        SnackBarHelper.showSuccess(context, 'Yêu cầu xuất hóa đơn thành công');
      }
    } catch (e) {
      if (mounted) {
        SnackBarHelper.showError(context, e.toString().replaceAll('Exception: ', ''));
      }
    }
  }
}
