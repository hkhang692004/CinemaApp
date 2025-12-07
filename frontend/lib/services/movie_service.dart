import 'dart:convert';
import 'package:cinema_app/config/api_config.dart';
import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/utils/http_helper.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

class MovieService {
  final AuthProvider authProvider; // Thêm field này

  MovieService(this.authProvider); // Constructor nhận AuthProvider
  Future<List<MovieModel>> getNowShowingMovies() async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.nowShowingMovies}',
      );
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}', // Lấy token từ AuthProvider
          },
        ),
        authProvider: authProvider, // Truyền AuthProvider vào httpHelper
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final moviesData = data['movies'];
        final List moviesJson = moviesData is List ? moviesData : [];

        return moviesJson.map((json) => MovieModel.fromJson(json)).toList();
      } else {
        throw Exception('Lấy danh sách phim đang chiếu thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getNowShowingMovies: $e');
      rethrow;
    }
  }

  Future<List<MovieModel>> getComingSoonMovies() async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.comingSoonMovies}',
      );
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}', // Lấy token từ AuthProvider
          },
        ),
        authProvider: authProvider, // Truyền AuthProvider vào httpHelper
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final moviesData = data['movies'];
        final List moviesJson = moviesData is List ? moviesData : [];

        return moviesJson.map((json) => MovieModel.fromJson(json)).toList();
      } else {
        throw Exception('Lấy danh sách phim sắp chiếu thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getComingSoonMovies: $e');
      rethrow;
    }
  }

  Future<MovieModel> getDetailMovie(int movieID) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.movie}/$movieID');
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}', // Lấy token từ AuthProvider
          },
        ),
        authProvider: authProvider, // Truyền AuthProvider vào httpHelper
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return MovieModel.fromJson(data['movie']);
      } else {
        throw Exception('Lấy chi tiết phim thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi getDetailMovie: $e');
      rethrow;
    }
  }

  Future<List<MovieModel>> searchMovies(
    String query,

  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.searchMovies}?q=$query',
      );
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}', // Lấy token từ AuthProvider
          },
        ),
        authProvider: authProvider, // Truyền AuthProvider vào httpHelper
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final moviesData = data['movies'];
        final List moviesJson = moviesData is List ? moviesData : [];

        return moviesJson.map((json) => MovieModel.fromJson(json)).toList();
      } else {
        throw Exception('Tìm kiếm phim thất bại');
      }
    } catch (e) {
      debugPrint('Lỗi searchMovies: $e');
      rethrow;
    }
  }
}
