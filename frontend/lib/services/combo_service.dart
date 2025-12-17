import 'dart:convert';
import 'package:cinema_app/config/api_config.dart';
import 'package:cinema_app/models/combo.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/utils/http_helper.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

class ComboService {
  final AuthProvider authProvider;

  ComboService(this.authProvider);

  /// Lấy danh sách tất cả combo
  Future<List<Combo>> getAllCombos() async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.combos}');
      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final combosData = data['combos'];
        final List combosJson = combosData is List ? combosData : [];

        return combosJson.map((json) => Combo.fromJson(json)).toList();
      } else {
        throw Exception('Lấy danh sách combo thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getAllCombos: $e');
      rethrow;
    }
  }

  /// Lấy chi tiết combo theo ID
  Future<Combo> getComboById(int comboId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.combos}/$comboId');
      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Combo.fromJson(data['combo']);
      } else {
        throw Exception('Lấy chi tiết combo thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getComboById: $e');
      rethrow;
    }
  }

  /// Lấy combo theo category
  Future<List<Combo>> getCombosByCategory(String category) async {
    try {
      final url = Uri.parse(
          '${ApiConfig.baseURL}${ApiConfig.combos}/category/$category');
      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final combosData = data['combos'];
        final List combosJson = combosData is List ? combosData : [];

        return combosJson.map((json) => Combo.fromJson(json)).toList();
      } else {
        throw Exception('Lấy danh sách combo theo category thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getCombosByCategory: $e');
      rethrow;
    }
  }
}
