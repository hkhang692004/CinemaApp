import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_links/app_links.dart';
import 'package:cinema_app/config/navigator_key.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/services/payment_service.dart';
import 'screens/splash_screen.dart';
import 'screens/payment_success_screen.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    // Handle initial link (app opened from link)
    try {
      final initialLink = await _appLinks.getInitialLink();
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    } catch (e) {
      print('Error getting initial link: $e');
    }

    // Handle links while app is running
    _linkSubscription = _appLinks.uriLinkStream.listen((Uri uri) {
      _handleDeepLink(uri);
    });
  }

  void _handleDeepLink(Uri uri) async {
    print('📱 Deep link received: $uri');
    
    if (uri.scheme == 'cinemaapp') {
      final params = uri.queryParameters;
      
      if (uri.host == 'payment-success') {
        // Backend đã verify, chỉ cần navigate đến success screen
        final orderCode = params['orderCode'];
        final orderId = params['orderId'];
        
        if (orderCode != null) {
          navigatorKey.currentState?.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => PaymentSuccessScreen(
                orderCode: orderCode,
                orderId: int.tryParse(orderId ?? '0') ?? 0,
              ),
            ),
            (route) => route.isFirst,
          );
        }
      } else if (uri.host == 'payment-failed') {
        // Thanh toán thất bại
        final message = params['message'] ?? 'Thanh toán thất bại';
        _showPaymentError(Uri.decodeComponent(message));
      } else if (uri.host == 'vnpay-return') {
        // VNPay returned with payment result (fallback)
        print('📱 VNPay params: $params');
        
        final responseCode = params['vnp_ResponseCode'];
        final orderId = params['vnp_TxnRef'];
        
        if (responseCode == '00' && orderId != null) {
          // Payment successful - verify with backend
          try {
            final authProvider = Provider.of<AuthProvider>(
              navigatorKey.currentContext!,
              listen: false,
            );
            final paymentService = PaymentService(authProvider);
            
            // Convert params to Map<String, String>
            final vnpParams = Map<String, String>.from(params);
            final result = await paymentService.verifyVnpayPayment(vnpParams);
            
            if (result['success'] == true) {
              // Navigate to success screen
              navigatorKey.currentState?.pushAndRemoveUntil(
                MaterialPageRoute(
                  builder: (context) => PaymentSuccessScreen(
                    orderCode: result['data']['orderCode'],
                    orderId: result['data']['orderId'],
                  ),
                ),
                (route) => route.isFirst,
              );
            } else {
              _showPaymentError(result['message'] ?? 'Thanh toán thất bại');
            }
          } catch (e) {
            print('Error verifying payment: $e');
            _showPaymentError('Lỗi xác thực thanh toán');
          }
        } else {
          // Payment failed or cancelled
          final message = _getVnpayErrorMessage(responseCode);
          _showPaymentError(message);
        }
      }
    }
  }

  String _getVnpayErrorMessage(String? code) {
    switch (code) {
      case '24':
        return 'Bạn đã hủy giao dịch';
      case '09':
        return 'Thẻ/Tài khoản chưa đăng ký InternetBanking';
      case '10':
        return 'Xác thực thông tin thẻ không đúng quá 3 lần';
      case '11':
        return 'Đã hết hạn chờ thanh toán';
      case '12':
        return 'Thẻ/Tài khoản bị khóa';
      case '51':
        return 'Tài khoản không đủ số dư';
      case '65':
        return 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày';
      default:
        return 'Thanh toán thất bại';
    }
  }

  void _showPaymentError(String message) {
    if (navigatorKey.currentContext != null) {
      showDialog(
        context: navigatorKey.currentContext!,
        builder: (context) => AlertDialog(
          title: const Text('Thanh toán thất bại'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Navigate back to home
                navigatorKey.currentState?.popUntil((route) => route.isFirst);
              },
              child: const Text('Đóng'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
    );
  }
}