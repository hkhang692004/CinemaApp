import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../utils/http_helper.dart';
import '../models/payment.dart';

class PaymentService {
  final String baseUrl = 'https://cinemaapp-gkkn.onrender.com/api/payment';
  final AuthProvider authProvider;

  PaymentService(this.authProvider);

  // Lấy thông tin loyalty points
  Future<LoyaltyInfo> getLoyaltyInfo() async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/loyalty'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return LoyaltyInfo.fromJson(data['data']);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Không thể lấy thông tin điểm');
      }
    } catch (e) {
      print('❌ Error getting loyalty info: $e');
      rethrow;
    }
  }

  // Tạo order
  Future<OrderResult> createOrder({
    required int showtimeId,
    required List<Map<String, dynamic>> seats, // [{id, price}]
    required List<Map<String, dynamic>> combos,
    int loyaltyPointsUsed = 0,
    String? promotionCode,
  }) async {
    try {
      final body = {
        'showtimeId': showtimeId,
        'seats': seats, // Gửi danh sách ghế với giá từng ghế
        'combos': combos,
        'loyaltyPointsUsed': loyaltyPointsUsed,
      };
      
      if (promotionCode != null && promotionCode.isNotEmpty) {
        body['promotionCode'] = promotionCode;
      }

      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/orders'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode(body),
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return OrderResult.fromJson(data['data']);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Không thể tạo đơn hàng');
      }
    } catch (e) {
      print('❌ Error creating order: $e');
      rethrow;
    }
  }

  // Tạo VNPay payment URL
  Future<String> createVnpayPayment(int orderId, double amount, String orderInfo) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/vnpay/create'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'orderId': orderId,
            'amount': amount,
            'orderInfo': orderInfo,
          }),
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data']['paymentUrl'];
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Không thể tạo link thanh toán');
      }
    } catch (e) {
      print('❌ Error creating VNPay payment: $e');
      rethrow;
    }
  }

  // Verify VNPay payment từ deep link params
  Future<Map<String, dynamic>> verifyVnpayPayment(Map<String, String> vnpParams) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/vnpay/verify'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode(vnpParams),
        ),
        authProvider: authProvider,
      );

      final data = jsonDecode(response.body);
      return data;
    } catch (e) {
      print('❌ Error verifying VNPay payment: $e');
      rethrow;
    }
  }

  // Lấy chi tiết order
  Future<Map<String, dynamic>> getOrderDetails(int orderId) async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/orders/$orderId'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Không tìm thấy đơn hàng');
      }
    } catch (e) {
      print('❌ Error getting order details: $e');
      rethrow;
    }
  }

  // Lấy danh sách vé của user
  Future<List<Map<String, dynamic>>> getMyTickets() async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/my-tickets'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Không thể lấy danh sách vé');
      }
    } catch (e) {
      print('❌ Error getting my tickets: $e');
      rethrow;
    }
  }

  // Validate promotion code
  Future<Map<String, dynamic>> validatePromotion(String code, double orderAmount) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/promotions/validate'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'code': code,
            'orderAmount': orderAmount,
          }),
        ),
        authProvider: authProvider,
      );

      final data = jsonDecode(response.body);
      return data;
    } catch (e) {
      print('❌ Error validating promotion: $e');
      rethrow;
    }
  }

  // Get active promotions
  Future<List<Map<String, dynamic>>> getActivePromotions() async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/promotions'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['promotions'] ?? []);
      } else {
        return [];
      }
    } catch (e) {
      print('❌ Error getting promotions: $e');
      return [];
    }
  }

  // Yêu cầu xuất hóa đơn
  Future<Map<String, dynamic>> requestInvoice({
    required int orderId,
    required String companyName,
    required String taxCode,
    String? companyAddress,
    required String buyerEmail,
  }) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/invoices'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'orderId': orderId,
            'companyName': companyName,
            'taxCode': taxCode,
            'companyAddress': companyAddress,
            'buyerEmail': buyerEmail,
          }),
        ),
        authProvider: authProvider,
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data['invoice'];
      } else {
        throw Exception(data['message'] ?? 'Lỗi yêu cầu hóa đơn');
      }
    } catch (e) {
      print('❌ Error requesting invoice: $e');
      rethrow;
    }
  }

  // Lấy thông tin hóa đơn
  Future<Map<String, dynamic>?> getInvoice(int orderId) async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/invoices/$orderId'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data['invoice'];
      }
      return null;
    } catch (e) {
      print('❌ Error getting invoice: $e');
      return null;
    }
  }
}
