import 'dart:async';
import 'package:cinema_app/models/news.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/services/news_service.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class NewsProvider extends ChangeNotifier {
  NewsService? _newsService;
  AuthProvider? _authProvider;

  List<NewsModel> _bannerNews = [];
  NewsModel? _selectedNews;
  List<NewsModel> _paginatedNews = []; // For all news screen
  bool _isLoading = false;
  String? _error;

  NewsProvider(AuthProvider? authProvider) {
    _authProvider = authProvider;
    if (authProvider != null) {
      _newsService = NewsService(authProvider);
    }
  }

  NewsService get newsService {
    if (_newsService == null) {
      if (_authProvider == null) {
        throw Exception('AuthProvider chưa được inject vào NewsProvider');
      }
      _newsService = NewsService(_authProvider!);
    }
    return _newsService!;
  }

  void updateAuthProvider(AuthProvider authProvider) {
    _authProvider = authProvider;
    _newsService = NewsService(authProvider);
  }

  List<NewsModel> get bannerNews => _bannerNews;
  NewsModel? get selectedNews => _selectedNews;
  List<NewsModel> get paginatedNews => _paginatedNews;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBannerNews() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _bannerNews = await newsService.getBannerNews();
      debugPrint('✅ Đã load ${_bannerNews.length} banner news');
      
      // Preload ảnh banner vào cache
      await _preloadBannerImages(_bannerNews);
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      debugPrint('❌ Lỗi load banner news: $e');
      notifyListeners();
    }
  }

  Future<void> loadNewsDetail(int newsId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _selectedNews = await newsService.getNewsDetail(newsId);
      
      // Preload ảnh banner của news detail vào cache
      if (_selectedNews != null && _selectedNews!.imageUrl != null && _selectedNews!.imageUrl!.isNotEmpty) {
        await _preloadNewsDetailImage(_selectedNews!.imageUrl!);
      }
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Preload ảnh banner news vào cache
  Future<void> _preloadBannerImages(List<NewsModel> newsList) async {
    if (newsList.isEmpty) return;

    final futures = <Future<void>>[];
    int loadedCount = 0;
    final totalImages = newsList.where((n) => n.imageUrl != null && n.imageUrl!.isNotEmpty).length;

    if (totalImages == 0) return;

    for (final news in newsList) {
      if (news.imageUrl != null && news.imageUrl!.isNotEmpty) {
        final completer = Completer<void>();
        
        CachedNetworkImageProvider(news.imageUrl!)
            .resolve(const ImageConfiguration())
            .addListener(
          ImageStreamListener(
            (ImageInfo imageInfo, bool synchronousCall) {
              if (!completer.isCompleted) {
                loadedCount++;
                completer.complete();
                debugPrint('Đã preload banner news ($loadedCount/$totalImages): ${news.title}');
              }
            },
            onError: (exception, stackTrace) {
              if (!completer.isCompleted) {
                loadedCount++;
                completer.complete();
                debugPrint('Lỗi preload banner news ${news.title}: $exception');
              }
            },
          ),
        );
        
        futures.add(completer.future);
      }
    }

    // Chờ tất cả ảnh preload xong hoặc timeout sau 5 giây
    if (futures.isNotEmpty) {
      try {
        await Future.any([
          Future.wait(futures),
          Future.delayed(const Duration(seconds: 5)),
        ]);
        debugPrint('Preload banner news hoàn thành: $loadedCount/$totalImages ảnh');
      } catch (e) {
        debugPrint('Lỗi khi preload banner news: $e');
      }
    }
  }

  /// Preload ảnh banner cho news detail page
  Future<void> _preloadNewsDetailImage(String imageUrl) async {
    try {
      final completer = Completer<void>();
      
      CachedNetworkImageProvider(imageUrl)
          .resolve(const ImageConfiguration())
          .addListener(
        ImageStreamListener(
          (ImageInfo imageInfo, bool synchronousCall) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Đã preload news detail image');
            }
          },
          onError: (exception, stackTrace) {
            if (!completer.isCompleted) {
              completer.complete();
              debugPrint('Lỗi preload news detail image: $exception');
            }
          },
        ),
      );

      await Future.any([
        completer.future,
        Future.delayed(const Duration(seconds: 3)),
      ]);
    } catch (e) {
      debugPrint('Lỗi khi preload news detail image: $e');
    }
  }

  /// Load paginated news (first page) - backend pagination
  Future<void> loadPaginatedNews({int page = 1, int pageSize = 6, String? search}) async {
    try {
      _isLoading = true;
      _error = null;
      _paginatedNews = []; // Reset dữ liệu cũ ngay lập tức
      notifyListeners();

      final result = await newsService.getPaginatedNews(page: page, pageSize: pageSize, search: search);
      _paginatedNews = result['news'] ?? [];
      
      debugPrint('✅ Đã load trang $page: ${_paginatedNews.length} tin tức');

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      debugPrint('❌ Lỗi load paginated news: $e');
      notifyListeners();
    }
  }

  /// Load more paginated news (append next page) - backend pagination
  Future<void> loadMorePaginatedNews({int page = 2, int pageSize = 6, String? search}) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await newsService.getPaginatedNews(page: page, pageSize: pageSize, search: search);
      final moreNews = result['news'] ?? [];
      
      _paginatedNews.addAll(moreNews);
      debugPrint('✅ Append trang $page: thêm ${moreNews.length} tin tức, tổng ${_paginatedNews.length}');
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      debugPrint('❌ Lỗi load more paginated news: $e');
      notifyListeners();
    }
  }
}