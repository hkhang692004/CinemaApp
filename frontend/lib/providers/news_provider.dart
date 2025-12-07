import 'package:cinema_app/models/news.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/services/news_service.dart';
import 'package:flutter/material.dart';

class NewsProvider extends ChangeNotifier {
  NewsService? _newsService;
  AuthProvider? _authProvider;

  List<NewsModel> _bannerNews = [];
  NewsModel? _selectedNews;
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
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBannerNews() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _bannerNews = await newsService.getBannerNews();
      debugPrint('✅ Đã load ${_bannerNews.length} banner news');
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
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
}