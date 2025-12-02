import 'package:cinema_app/models/movie.dart';

import 'package:cinema_app/services/movie_service.dart';
import 'package:flutter/material.dart';

class MovieProvider extends ChangeNotifier {
  final MovieService _movieService = MovieService();

  List<MovieModel> _nowShowingMovies = [];
  List<MovieModel> _comingSoonMovies = [];
  MovieModel? _selectedMovie;
  List<MovieModel> _searchResults = [];

  bool _isLoading = false;
  String? _errorMessage;

  List<MovieModel> get nowShowingMovies => _nowShowingMovies;

  List<MovieModel> get comingSoonMovies => _comingSoonMovies;

  MovieModel? get selectedMovie => _selectedMovie;

  List<MovieModel> get searchResults => _searchResults;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  Future<void> loadNowShowingMovies(String accessToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _nowShowingMovies = await _movieService.getNowShowingMovies(accessToken);
      _errorMessage = null;

    } catch (e) {
      debugPrint('Lỗi loadNowShowingMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadComingSoonMovies(String accessToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _comingSoonMovies = await _movieService.getComingSoonMovies(accessToken);
      _errorMessage = null;
      
    } catch (e) {
      debugPrint('Lỗi loadComingSoonMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> getDetailMovie(int movieId, String accessToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _selectedMovie = await _movieService.getDetailMovie(movieId, accessToken);
      _errorMessage = null;
    } catch (e) {
      debugPrint('Lỗi getDetailMovie: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchMovies(String query, String accessToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _searchResults = await _movieService.searchMovies(query, accessToken);
      _errorMessage = null;
    } catch (e) {
      debugPrint('Lỗi searchMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
