import 'package:http/http.dart' as http;
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/config/navigator_key.dart';
import 'package:flutter/material.dart';
import 'package:cinema_app/screens/login_screen.dart';


Future<http.Response> httpHelper(
    Future<http.Response> Function() request, {
      required AuthProvider authProvider,
    }) async {
  // Thực hiện request lần đầu
  http.Response response = await request();

  // Nếu không phải 401, trả về response ngay
  if (response.statusCode != 401) {
    return response;
  }

  // Nếu là 401, thử refresh token
  debugPrint('Access token hết hạn, đang refresh token...');

  try {
    // Gọi refresh token
    final refreshSuccess = await authProvider.refreshAccessToken();

    if (refreshSuccess) {
      // Refresh thành công, retry request ban đầu
      debugPrint('Refresh token thành công, retry request...');
      response = await request();
      return response;
    } else {
      // Refresh token thất bại → Redirect về Login
      debugPrint('Refresh token thất bại, redirect về Login...');
      _redirectToLogin();
      throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  } catch (e) {
    // Nếu có lỗi trong quá trình refresh → Redirect về Login
    debugPrint('Lỗi khi refresh token: $e');
    _redirectToLogin();
    throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
}

/// Redirect về màn hình Login
void _redirectToLogin() {
  // Xóa tất cả token và user data
  // (AuthProvider sẽ tự xóa khi refresh token fail)

  // Sử dụng GlobalKey để navigate từ bất kỳ đâu
  if (navigatorKey.currentState != null) {
    navigatorKey.currentState!.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false, // Xóa tất cả route cũ
    );
  }
}