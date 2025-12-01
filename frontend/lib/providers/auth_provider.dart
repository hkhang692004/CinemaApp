import 'dart:convert';

import 'package:cinema_app/models/user.dart';
import 'package:cinema_app/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final AuthService _authService = AuthService();

  String? _accessToken;
  String? _refreshToken;
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  String? get accessToken => _accessToken;

  String? get refreshToken => _refreshToken;

  UserModel? get user => _user;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  bool get isAuthenticated => _accessToken != null;

  Future<void> initialize() async {
    try {
      _accessToken = await _storage.read(key: 'accessToken');
      _refreshToken = await _storage.read(key: 'refreshToken');

      final userJson = await _storage.read(key: 'user');
      if (userJson != null) {
        _user = UserModel.fromJson(jsonDecode(userJson));
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Lỗi khởi tạo AuthProvider: $e');
    }
  }

  Future<void> saveToken({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
    notifyListeners();
  }

  Future<void> saveUser(UserModel user) async {
    _user = user;
    await _storage.write(key: 'user', value: jsonEncode(user.toJson()));
    notifyListeners();
  }

  Future<void> clearAll() async {
    _accessToken = null;
    _refreshToken = null;
    _user = null;
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
    await _storage.delete(key: 'user');
    notifyListeners();
  }

  Future<bool> signIn({required String email, required String password}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await _authService.signIn(
        email: email,
        password: password,
      );
      final String? accessToken = result.accessToken;
      final String? refreshToken = result.refreshToken;

      if (accessToken == null || refreshToken == null) {
        throw Exception('Không tìm thấy token');
      }
      await saveToken(accessToken: accessToken, refreshToken: refreshToken);
      if (result.user != null) {
        final dynamic userData = result.user;
        if (userData is UserModel) {
          await saveUser(userData);
        } else if (userData is Map) {
          await saveUser(
            UserModel.fromJson(Map<String, dynamic>.from(userData)),
          );
        } else {
          final userJson = jsonEncode(userData);
          await saveUser(UserModel.fromJson(jsonDecode(userJson)));
        }
      }
      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi SignIn trong AuthProvider: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required String dateOfBirth,
    String? avatarUrl,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await _authService.signUp(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
        dateOfBirth: dateOfBirth,
        avatarUrl: avatarUrl,
      );

      if (result.user != null) {
        final dynamic userData = result.user;
        if (userData is UserModel) {
          await saveUser(userData);
        } else if (userData is Map) {
          await saveUser(
            UserModel.fromJson(Map<String, dynamic>.from(userData)),
          );
        } else {
          final userJson = jsonEncode(userData);
          await saveUser(UserModel.fromJson(jsonDecode(userJson)));
        }
      }

      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi SignUp trong AuthProvider: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) {
      _errorMessage = 'Không có refresh token';
      return false;
    }
    try {
      final String newAccessToken = await _authService.refreshAccessToken(_refreshToken!);
      await saveToken(accessToken: newAccessToken, refreshToken: _refreshToken!);
      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi refreshAccessToken trong AuthProvider: $e');
      return false;
    }
  }

  Future<bool> signOut() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      if (_accessToken != null && _refreshToken != null) {
        await _authService.signOut(
            refreshToken: _refreshToken!, accessToken: _accessToken!);
      }
      await clearAll();
      _errorMessage = null;
      return true;
    }
    catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi SignOut trong AuthProvider: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> sendOTP(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _authService.sendOTP(email);
      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi sendOTP trong AuthProvider: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword(String email, String newPassword, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _authService.resetPassword(email, newPassword, otp);
      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Lỗi forgotPassword trong AuthProvider: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
