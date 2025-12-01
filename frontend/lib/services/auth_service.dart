import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:cinema_app/config/api_config.dart';
import 'package:cinema_app/models/auth_response.dart';
import 'package:flutter/cupertino.dart';

class AuthService {
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required String dateOfBirth,
    String? avatarUrl,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.signUp}');

      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'email': email,
              'password': password,
              'full_name': fullName,
              'phone': phone,
              'date_of_birth': dateOfBirth,
              'avatar_url': avatarUrl,
            }),
          )
          .timeout(ApiConfig.timeout);

      final data = json.decode(response.body);

      if (response.statusCode == 201) {
        return AuthResponse.fromJson(data);
      } else {
        throw Exception(data['message'] ?? 'Đăng ký thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi SignUp: $e');
      rethrow;
    }
  }

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.signIn}');
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'email': email, 'password': password}),
          )
          .timeout(ApiConfig.timeout);

      final data = json.decode(response.body);

      if (response.statusCode == 201) {
        return AuthResponse.fromJson(data);
      } else {
        throw Exception(data['message'] ?? 'Đăng nhập thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi SignIn: $e');
      rethrow;
    }
  }

  Future<String> refreshAccessToken(String refreshToken) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.refreshToken}');

      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'refreshToken': refreshToken}),
          )
          .timeout(ApiConfig.timeout);

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        return data['accessToken'];
      } else {
        throw Exception(data['message'] ?? 'Làm mới token thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi Refresh Token: $e');
      rethrow;
    }
  }

  Future<void> signOut({
    required String refreshToken,
    required String accessToken,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.signOut}');
      final response = await http
          .post(
            url,
            headers: {
              'Content-type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
            body: json.encode({'refreshToken': refreshToken}),
          )
          .timeout(ApiConfig.timeout);

      final data = json.decode(response.body);
      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Đăng xuất thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi SignOut: $e');
      rethrow;
    }
  }
  Future<String> sendOTP(String email) async{
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.sendOTP}');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email':email
        }),
      ).timeout(ApiConfig.timeout);
      final data = json.decode(response.body);
      if(response.statusCode == 200){
        return data['message'];
      }
      else{
        throw Exception(data['message'] ?? 'Gửi OTP thất bại');
      }
    }
    catch (e) {
      debugPrint('Lỗi Send OTP: $e');
      rethrow;
    }
  }
  Future<String> resetPassword(String email, String newPassword, String otp) async{
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.forgotPassword}');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email':email,
          'newPassword':newPassword,
          'otp':otp,
        }),
      ).timeout(ApiConfig.timeout);
      final data = json.decode(response.body);
      if(response.statusCode == 200){
        return data['message'];
      }
      else{
        throw Exception(data['message'] ?? 'Đặt lại mật khẩu thất bại');
      }
    }
    catch (e) {
      debugPrint('Lỗi Forget Password: $e');
      rethrow;
    }
  }

}
