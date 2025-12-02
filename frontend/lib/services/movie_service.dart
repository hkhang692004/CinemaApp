import 'dart:convert';
import 'package:cinema_app/config/api_config.dart';
import 'package:cinema_app/models/movie.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

class MovieService {
  Future<List<MovieModel>> getNowShowingMovies(String accessToken) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.nowShowingMovies}',
      );
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiConfig.timeout);

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

  Future<List<MovieModel>> getComingSoonMovies(String accessToken) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.comingSoonMovies}',
      );
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiConfig.timeout);

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

  Future<MovieModel> getDetailMovie(int movieID, String accessToken) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.movie}/$movieID');
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiConfig.timeout);

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
    String accessToken,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}${ApiConfig.searchMovies}?q=$query',
      );
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiConfig.timeout);

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
