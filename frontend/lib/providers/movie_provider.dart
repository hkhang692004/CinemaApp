import 'dart:async';
import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/services/movie_service.dart';
import 'package:cinema_app/services/socket_service.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class MovieProvider extends ChangeNotifier {
  MovieService? _movieService;
  AuthProvider? _authProvider; // Không dùng final để có thể update
  final SocketService _socketService = SocketService.instance;

  MovieProvider(AuthProvider? authProvider) {
    _authProvider = authProvider;
    if (authProvider != null) {
      _movieService = MovieService(authProvider);
    }
    _initSocketListeners();
  }

  /// Khởi tạo socket listeners
  void _initSocketListeners() {
    _socketService.connect();
    
    _socketService.onMovieCreated = () {
      debugPrint('🔄 Refreshing movies due to movie-created event');
      _refreshAllMovies();
    };
    
    _socketService.onMovieUpdated = (int movieId) {
      debugPrint('🔄 Refreshing movies due to movie-updated event (movieId: $movieId)');
      _refreshAllMovies();
      // Nếu đang xem chi tiết phim này, refresh luôn selectedMovie
      if (_selectedMovie != null && _selectedMovie!.id == movieId) {
        _refreshSelectedMovie(movieId);
      }
    };
    
    _socketService.onMovieDeleted = (int movieId) {
      debugPrint('🔄 Refreshing movies due to movie-deleted event (movieId: $movieId)');
      _refreshAllMovies();
      // Nếu đang xem chi tiết phim bị xóa, clear selectedMovie
      if (_selectedMovie != null && _selectedMovie!.id == movieId) {
        _selectedMovie = null;
        notifyListeners();
      }
    };
  }

  /// Refresh selectedMovie khi nó được cập nhật
  Future<void> _refreshSelectedMovie(int movieId) async {
    try {
      _selectedMovie = await movieService.getDetailMovie(movieId);
      notifyListeners();
      debugPrint('✅ Selected movie refreshed successfully');
    } catch (e) {
      debugPrint('❌ Error refreshing selected movie: $e');
    }
  }

  /// Refresh tất cả movies (silent - không hiển thị loading)
  Future<void> _refreshAllMovies() async {
    try {
      _nowShowingMovies = await movieService.getNowShowingMovies();
      _comingSoonMovies = await movieService.getComingSoonMovies();
      notifyListeners();
      debugPrint('✅ Movies refreshed successfully');
    } catch (e) {
      debugPrint('❌ Error refreshing movies: $e');
    }
  }

  /// Lấy MovieService, tự động khởi tạo nếu chưa có
  MovieService get movieService {
    if (_movieService == null) {
      if (_authProvider == null) {
        throw Exception('AuthProvider chưa được inject vào MovieProvider');
      }
      _movieService = MovieService(_authProvider!);
    }
    return _movieService!;
  }

  /// Update AuthProvider khi được inject từ ChangeNotifierProxyProvider
  void updateAuthProvider(AuthProvider newAuthProvider) {
    if (_authProvider == null) {
      _authProvider = newAuthProvider;
      // Khởi tạo MovieService nếu chưa có
      if (_movieService == null) {
        _movieService = MovieService(newAuthProvider);
      }
    }
  }

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

  Future<void> loadNowShowingMovies() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _nowShowingMovies = await movieService.getNowShowingMovies();
      _errorMessage = null;
      
      // Preload ảnh poster vào cache và CHỜ xong (best practice)
      await _preloadPosterImages(_nowShowingMovies);

    } catch (e) {
      debugPrint('Lỗi loadNowShowingMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadComingSoonMovies() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _comingSoonMovies = await movieService.getComingSoonMovies();
      _errorMessage = null;
      
      // Preload ảnh poster vào cache và CHỜ xong (best practice)
      await _preloadPosterImages(_comingSoonMovies);
      
    } catch (e) {
      debugPrint('Lỗi loadComingSoonMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> getDetailMovie(int movieId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _selectedMovie = await movieService.getDetailMovie(movieId);
      _errorMessage = null;
      
      // Preload backdrop và poster vào cache ngay khi fetch detail
      if (_selectedMovie != null) {
        await _preloadDetailImages(_selectedMovie!);
      }
    } catch (e) {
      debugPrint('Lỗi getDetailMovie: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchMovies(String query) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _searchResults = await movieService.searchMovies(query);
      _errorMessage = null;
      
      // Preload ảnh poster vào cache và CHỜ xong
      await _preloadPosterImages(_searchResults);
    } catch (e) {
      debugPrint('Lỗi searchMovies: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Preload ảnh poster vào cache và return Future để có thể await (best practice)
  /// Chờ tất cả ảnh preload xong hoặc timeout sau 5 giây
  Future<void> _preloadPosterImages(List<MovieModel> movies) async {
    if (movies.isEmpty) return;

    final futures = <Future<void>>[];
    int loadedCount = 0;
    final totalImages = movies.where((m) => m.posterUrl != null && m.posterUrl!.isNotEmpty).length;

    if (totalImages == 0) return;

    for (final movie in movies) {
      if (movie.posterUrl != null && movie.posterUrl!.isNotEmpty) {
        final completer = Completer<void>();
        
        CachedNetworkImageProvider(movie.posterUrl!)
            .resolve(const ImageConfiguration())
            .addListener(
          ImageStreamListener(
            (ImageInfo imageInfo, bool synchronousCall) {
              if (!completer.isCompleted) {
                loadedCount++;
                completer.complete();
                debugPrint('Đã preload ảnh ($loadedCount/$totalImages): ${movie.title}');
              }
            },
            onError: (exception, stackTrace) {
              if (!completer.isCompleted) {
                loadedCount++;
                completer.complete(); // Complete ngay cả khi lỗi để không block
                debugPrint('Lỗi preload ảnh ${movie.title}: $exception');
              }
            },
          ),
        );
        
        futures.add(completer.future);
      }
    }

    // Chờ tất cả ảnh preload xong hoặc timeout sau 5 giây
    try {
      await Future.any([
        Future.wait(futures),
        Future.delayed(const Duration(seconds: 5)),
      ]);
      debugPrint('Preload hoàn thành: $loadedCount/$totalImages ảnh');
    } catch (e) {
      debugPrint('Lỗi khi preload ảnh: $e');
    }
  }

  /// Preload backdrop và poster cho detail page
  Future<void> _preloadDetailImages(MovieModel movie) async {
    final futures = <Future<void>>[];

    // Preload backdrop
    if (movie.backdropUrl != null && movie.backdropUrl!.isNotEmpty) {
      final completer = Completer<void>();
      CachedNetworkImageProvider(movie.backdropUrl!)
          .resolve(const ImageConfiguration())
          .addListener(
        ImageStreamListener(
          (ImageInfo imageInfo, bool synchronousCall) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Đã preload backdrop: ${movie.title}');
            }
          },
          onError: (exception, stackTrace) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Lỗi preload backdrop: $exception');
            }
          },
        ),
      );
      futures.add(completer.future);
    }

    // Preload poster
    if (movie.posterUrl != null && movie.posterUrl!.isNotEmpty) {
      final completer = Completer<void>();
      CachedNetworkImageProvider(movie.posterUrl!)
          .resolve(const ImageConfiguration())
          .addListener(
        ImageStreamListener(
          (ImageInfo imageInfo, bool synchronousCall) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Đã preload poster: ${movie.title}');
            }
          },
          onError: (exception, stackTrace) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Lỗi preload poster: $exception');
            }
          },
        ),
      );
      futures.add(completer.future);
    }

    // Chờ tất cả preload xong hoặc timeout sau 3 giây
    if (futures.isNotEmpty) {
      try {
        await Future.any([
          Future.wait(futures),
          Future.delayed(const Duration(seconds: 3)),
        ]);
        debugPrint('Preload detail images hoàn thành');
      } catch (e) {
        debugPrint('Lỗi khi preload detail images: $e');
      }
    }
  }
}
