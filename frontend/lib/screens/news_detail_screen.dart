import 'package:cinema_app/models/news.dart';
import 'package:cinema_app/providers/news_provider.dart';
import 'package:cinema_app/screens/movie_detail_screen.dart';
import 'package:cinema_app/services/socket_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

class NewsDetailScreen extends StatefulWidget {
  final NewsModel news;

  const NewsDetailScreen({super.key, required this.news});

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  late NewsModel _currentNews;
  bool _isDeleted = false;
  
  // Store listener references for removal
  late void Function(int) _newsUpdatedListener;
  late void Function(int) _newsDeletedListener;

  @override
  void initState() {
    super.initState();
    _currentNews = widget.news;
    _setupSocketListeners();
  }

  @override
  void dispose() {
    // Remove socket listeners
    SocketService.instance.removeNewsUpdatedListener(_newsUpdatedListener);
    SocketService.instance.removeNewsDeletedListener(_newsDeletedListener);
    super.dispose();
  }

  void _setupSocketListeners() {
    // Create listener functions
    _newsUpdatedListener = (newsId) {
      if (newsId == _currentNews.id && mounted) {
        debugPrint('📰 News ${_currentNews.id} updated, refreshing detail...');
        _refreshNewsDetail();
      }
    };
    
    _newsDeletedListener = (newsId) {
      if (newsId == _currentNews.id && mounted) {
        debugPrint('📰 News ${_currentNews.id} deleted, closing screen...');
        setState(() {
          _isDeleted = true;
        });
        Navigator.of(context).pop();
      }
    };
    
    // Add listeners
    SocketService.instance.addNewsUpdatedListener(_newsUpdatedListener);
    SocketService.instance.addNewsDeletedListener(_newsDeletedListener);
  }

  Future<void> _refreshNewsDetail() async {
    try {
      final newsProvider = context.read<NewsProvider>();
      await newsProvider.loadNewsDetail(_currentNews.id);
      
      if (newsProvider.selectedNews != null && mounted) {
        setState(() {
          _currentNews = newsProvider.selectedNews!;
        });
      }
    } catch (e) {
      debugPrint('❌ Error refreshing news detail: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isDeleted) {
      return const Scaffold(
        body: Center(
          child: Text('Tin tức đã bị xóa'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin tức'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      backgroundColor: Colors.white,
      body: RefreshIndicator(
        onRefresh: _refreshNewsDetail,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner image
              if (_currentNews.imageUrl != null)
                CachedNetworkImage(
                  imageUrl: _currentNews.imageUrl!,
                  width: double.infinity,
                  height: 250,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 250,
                    color: Colors.grey[800],
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 250,
                    color: Colors.grey[800],
                    child: const Icon(Icons.image_not_supported, size: 50),
                  ),
                ),

              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      _currentNews.title,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Author & Date
                    if (_currentNews.author != null || _currentNews.publishedAt != null)
                      Text(
                        '${_currentNews.author ?? ''} • ${_currentNews.publishedAt != null ? _formatDate(_currentNews.publishedAt!) : ''}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    const SizedBox(height: 16),

                    // Summary
                    if (_currentNews.summary != null) ...[
                      Text(
                        _currentNews.summary!,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 16,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Content - Render HTML from React Quill
                    Html(
                      data: _currentNews.content,
                      style: {
                        "body": Style(
                          fontSize: FontSize(16),
                          lineHeight: const LineHeight(1.6),
                          color: Colors.black87,
                          margin: Margins.zero,
                          padding: HtmlPaddings.zero,
                        ),
                        "p": Style(
                          margin: Margins.only(bottom: 12),
                        ),
                        "h1": Style(
                          fontSize: FontSize(24),
                          fontWeight: FontWeight.bold,
                          margin: Margins.only(top: 16, bottom: 8),
                        ),
                        "h2": Style(
                          fontSize: FontSize(22),
                          fontWeight: FontWeight.bold,
                          margin: Margins.only(top: 14, bottom: 6),
                        ),
                        "h3": Style(
                          fontSize: FontSize(20),
                          fontWeight: FontWeight.bold,
                          margin: Margins.only(top: 12, bottom: 4),
                        ),
                        "img": Style(
                          width: Width(100, Unit.percent),
                          margin: Margins.symmetric(vertical: 12),
                        ),
                        "ul": Style(
                          margin: Margins.only(left: 16, bottom: 12),
                        ),
                        "ol": Style(
                          margin: Margins.only(left: 16, bottom: 12),
                        ),
                        "li": Style(
                          margin: Margins.only(bottom: 4),
                        ),
                        "blockquote": Style(
                          margin: Margins.symmetric(vertical: 12),
                          padding: HtmlPaddings.only(left: 16),
                          border: const Border(
                            left: BorderSide(color: Colors.grey, width: 4),
                          ),
                          fontStyle: FontStyle.italic,
                          color: Colors.grey[700],
                        ),
                        "a": Style(
                          color: const Color(0xFFE53935),
                          textDecoration: TextDecoration.underline,
                        ),
                      },
                      onLinkTap: (url, _, __) async {
                        if (url != null) {
                          final uri = Uri.parse(url);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        }
                      },
                    ),

                    // Button "Xem phim" nếu có linkedMovie
                    if (_currentNews.linkedMovie != null) ...[
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    MovieDetailScreen(movie: _currentNews.linkedMovie!),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE53935),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text(
                            'Xem thông tin phim',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
