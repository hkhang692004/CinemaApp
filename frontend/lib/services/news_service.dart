import 'dart:convert';
import 'package:cinema_app/config/api_config.dart';
import 'package:cinema_app/models/news.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/utils/http_helper.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class NewsService {
  final AuthProvider authProvider;

  NewsService(this.authProvider);

  Future<List<NewsModel>> getBannerNews() async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.bannerNews}');
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
        final data = jsonDecode(response.body);
        final List<dynamic> banners = data['banners'] ?? [];
        debugPrint('📦 API trả về ${banners.length} banners');
        final result = banners.map((json) {
          try {
            return NewsModel.fromJson(json);
          } catch (e) {
            debugPrint('❌ Lỗi parse banner: $e');
            debugPrint('📄 JSON: $json');
            rethrow;
          }
        }).toList();
        return result;
      } else {
        debugPrint('❌ API trả về status: ${response.statusCode}');
        debugPrint('📄 Body: ${response.body}');
        throw Exception('Lấy danh sách tin tức banner thất bại');
      }
    } catch (e) {
      throw Exception('Lỗi getBannerNews: $e');
    }
  }

  Future<NewsModel> getNewsDetail(int newsId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.newsDetail}/$newsId');
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
        final data = jsonDecode(response.body);
        return NewsModel.fromJson(data['news']);
      } else {
        throw Exception('Lỗi lấy chi tiết tin tức');
      }
    } catch (e) {
      throw Exception('Lỗi getNewsDetail: $e');
    }
  }

  Future<Map<String, dynamic>> getPaginatedNews({int page = 1, int pageSize = 6, String? search}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.allNews}?page=$page&pageSize=$pageSize${search != null && search.isNotEmpty ? '&search=$search' : ''}');
      debugPrint('🔗 Fetching paginated news: $url');
      
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
        final data = jsonDecode(response.body);
        final List<dynamic> newsList = data['news'] ?? [];
        final pagination = data['pagination'] ?? {};
        
        debugPrint('📦 API trả về ${newsList.length} tin tức, trang ${pagination['page']} / ${pagination['totalPages']}');
        
        final news = newsList.map((json) {
          try {
            return NewsModel.fromJson(json);
          } catch (e) {
            debugPrint('❌ Lỗi parse news: $e');
            debugPrint('📄 JSON: $json');
            rethrow;
          }
        }).toList();
        
        return {
          'news': news,
          'pagination': pagination,
        };
      } else {
        debugPrint('❌ API trả về status: ${response.statusCode}');
        debugPrint('📄 Body: ${response.body}');
        throw Exception('Lấy danh sách tin tức thất bại');
      }
    } catch (e) {
      throw Exception('Lỗi getPaginatedNews: $e');
    }
  }
}
