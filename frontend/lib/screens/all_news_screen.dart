import 'package:cached_network_image/cached_network_image.dart';
import 'package:cinema_app/models/news.dart';
import 'package:cinema_app/providers/news_provider.dart';
import 'package:cinema_app/screens/news_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class AllNewsScreen extends StatefulWidget {
  const AllNewsScreen({super.key});

  @override
  State<AllNewsScreen> createState() => _AllNewsScreenState();
}

class _AllNewsScreenState extends State<AllNewsScreen> {
  late ScrollController _scrollController;
  late TextEditingController _searchController;
  int _currentPage = 1;
  final int _pageSize = 6;
  bool _isLoadingMore = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _searchController = TextEditingController();
    _scrollController.addListener(_onScroll);
    
    // Load first page
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        debugPrint('🔄 AllNewsScreen: Loading page 1...');
        context.read<NewsProvider>().loadPaginatedNews(page: 1, pageSize: _pageSize);
      }
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent ) {
      if (!_isLoadingMore && mounted) {
        _loadMoreNews();
      }
    }
  }

  void _loadMoreNews() {
    if (_isLoadingMore) return;
    
    debugPrint('📥 AllNewsScreen._loadMoreNews() triggered for page ${_currentPage + 1}');
    
    setState(() {
      _isLoadingMore = true;
    });
    
    context.read<NewsProvider>().loadMorePaginatedNews(
      page: _currentPage + 1,
      pageSize: _pageSize,
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
    ).then((_) {
      if (mounted) {
        setState(() {
          _currentPage++;
          _isLoadingMore = false;
        });
        debugPrint('✅ Page ${_currentPage} loaded successfully');
      }
    }).catchError((_) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    });
  }

  void _performSearch(String query) {
    if (mounted) {
      setState(() {
        _searchQuery = query;
        _currentPage = 1; // Reset về trang 1 khi search
      });
      
      debugPrint('🔍 Searching for: $query');
      context.read<NewsProvider>().loadPaginatedNews(
        page: 1, 
        pageSize: _pageSize,
        search: query.isNotEmpty ? query : null,
      );
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Tin tức',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                _performSearch(value);
              },
              decoration: InputDecoration(
                hintText: 'Tìm kiếm tin tức...',
                hintStyle: TextStyle(color: Colors.grey[400]),
                prefixIcon: const Icon(Icons.search, color: Color(0xFFE53935)),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey),
                        onPressed: () {
                          _searchController.clear();
                          _performSearch('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.grey),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE53935), width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          // News List
          Expanded(
            child: Consumer<NewsProvider>(
              builder: (context, newsProvider, child) {
                final allNews = newsProvider.paginatedNews;
                debugPrint('📺 AllNewsScreen build: ${allNews.length} tin tức trong _paginatedNews');

                if (allNews.isEmpty && !newsProvider.isLoading) {
                  return Center(
                    child: Text(
                      _searchQuery.isNotEmpty ? 'Không tìm thấy kết quả' : 'Chưa có tin tức',
                      style: const TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: allNews.length + (newsProvider.isLoading ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == allNews.length) {
                      // Loading indicator at the bottom
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFFE53935),
                          ),
                        ),
                      );
                    }

                    final news = allNews[index];
                    return _buildNewsCard(news);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewsCard(NewsModel news) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => NewsDetailScreen(news: news),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withValues(alpha: 0.1),
              spreadRadius: 1,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // News image
            if (news.imageUrl != null && news.imageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: CachedNetworkImage(
                  imageUrl: news.imageUrl!,
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.grey[200],
                    child: const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFFE53935),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey[300],
                    child: const Icon(
                      Icons.image_not_supported,
                      color: Colors.grey,
                      size: 50,
                    ),
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                ),
                child: const Icon(
                  Icons.image_not_supported,
                  color: Colors.grey,
                  size: 50,
                ),
              ),
            // News content
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    news.title ?? 'Không có tiêu đề',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    news.summary ?? news.content ?? 'Chưa có mô tả',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    news.publishedAt != null
                        ? '${news.publishedAt!.day}/${news.publishedAt!.month}/${news.publishedAt!.year}'
                        : 'Đang cập nhật',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
