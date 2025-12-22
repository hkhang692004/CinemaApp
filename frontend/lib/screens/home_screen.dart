import 'dart:async';
import 'dart:ui';
import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/screens/login_screen.dart';
import 'package:cinema_app/providers/news_provider.dart';
import 'package:cinema_app/screens/news_detail_screen.dart';
import 'package:cinema_app/screens/movie_detail_screen.dart';
import 'package:cinema_app/screens/all_movies_screen.dart';
import 'package:cinema_app/screens/all_news_screen.dart';
import 'package:cinema_app/screens/my_tickets_screen.dart';
import 'package:cinema_app/screens/theaters_screen.dart';
import 'package:cinema_app/screens/account_screen.dart';
import 'package:cinema_app/services/socket_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

class HomeScreen extends StatefulWidget {
  final int initialTabIndex;
  
  const HomeScreen({super.key, this.initialTabIndex = 0});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late TabController _tabController;
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;
  PageController? _bannerPageController;
  int _bannerInitialPage = 0; // Dùng cho hiệu ứng loop mượt mà
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0.0;
  late int _currentBottomNavIndex; // Track bottom nav selection
  
  // Store listener reference for removal
  late void Function(int) _newsUpdatedListener;

  // Giữ các widget không bị dispose khi chuyển tab
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _currentBottomNavIndex = widget.initialTabIndex;
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabChange);
    _scrollController.addListener(() {
      if (mounted) {
        setState(() {
          _scrollOffset = _scrollController.offset;
        });
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NewsProvider>().loadBannerNews();
    });

    // Setup socket listeners for banner updates
    _setupBannerSocketListeners();

    _bannerInitialPage = 1000; // số lớn để tránh nhảy về đầu
    _bannerPageController = PageController(initialPage: _bannerInitialPage);


    // Load movies khi mở màn hình
    Future.microtask(() {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      if (auth.accessToken != null) {
        final movieProvider = context.read<MovieProvider>();
        movieProvider.loadNowShowingMovies();
        movieProvider.loadComingSoonMovies();
      }
    });
  }

  void _startBannerAutoPlay(){
    if (!mounted) return; // ✅ Kiểm tra mounted

    final newsProvider = context.read<NewsProvider>();
    if(newsProvider.bannerNews.length <= 1) return;

    _bannerTimer?.cancel();
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer){
      if (!mounted) { // ✅ Kiểm tra mounted trong timer
        timer.cancel();
        return;
      }

      if (_bannerPageController != null && _bannerPageController!.hasClients) {
        // Lấy current page thực tế (có thể là số lớn)
        final currentPage = _bannerPageController!.page?.round() ?? _bannerInitialPage;
        _bannerPageController!.animateToPage(
          currentPage + 1, // Tăng 1 trang, PageView.builder sẽ loop nhờ modulo
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _pauseBannerAutoPlay() {
    _bannerTimer?.cancel();
  }

  void _resumeBannerAutoPlay() {
    _startBannerAutoPlay();
  }

  void _setupBannerSocketListeners() {
    // Lắng nghe khi banner được cập nhật từ admin
    SocketService.instance.onBannerUpdated = () {
      if (mounted) {
        debugPrint('🖼️ Banner updated, refreshing...');
        context.read<NewsProvider>().loadBannerNews();
      }
    };
    
    // Lắng nghe khi thứ tự banner thay đổi
    SocketService.instance.onBannersReordered = () {
      if (mounted) {
        debugPrint('🖼️ Banners reordered, refreshing...');
        context.read<NewsProvider>().loadBannerNews();
      }
    };
    
    // Lắng nghe khi tin tức được cập nhật (bao gồm thay đổi linkedMovie)
    _newsUpdatedListener = (newsId) {
      if (mounted) {
        // Refresh banner list vì tin tức có thể là banner
        debugPrint('📰 News $newsId updated, refreshing banners...');
        context.read<NewsProvider>().loadBannerNews();
      }
    };
    SocketService.instance.addNewsUpdatedListener(_newsUpdatedListener);
  }

  void _handleTabChange() {
    if (!_tabController.indexIsChanging) {
      setState(() {}); // Rebuild UI khi tab thay đổi
      final auth = context.read<AuthProvider>();
      if (auth.accessToken != null) {
        final movieProvider = context.read<MovieProvider>();
        if (_tabController.index == 0) {
          if (movieProvider.nowShowingMovies.isEmpty) {
            movieProvider.loadNowShowingMovies(); // Bỏ accessToken parameter
          }
        } else {
          if (movieProvider.comingSoonMovies.isEmpty) {
            movieProvider.loadComingSoonMovies(); // Bỏ accessToken parameter
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerPageController?.dispose();
    _scrollController.dispose();
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    // Clear socket callbacks
    SocketService.instance.onBannerUpdated = null;
    SocketService.instance.onBannersReordered = null;
    SocketService.instance.removeNewsUpdatedListener(_newsUpdatedListener);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return Scaffold(
      backgroundColor: Colors.white,
      body: IndexedStack(
        index: _currentBottomNavIndex,
        children: [
          _buildHomeContent(),      // Index 0: Trang chủ
          const AllNewsScreen(),    // Index 1: Tin tức
          const MyTicketsScreen(),  // Index 2: Vé
          const TheatersScreen(),   // Index 3: Rạp chiếu
          const AccountScreen(),    // Index 4: Tài khoản
        ],
      ),
      bottomNavigationBar: _bottomNavigationBar(),
    );
  }

  Widget _buildHomeContent() {
    final newsProvider = context.watch<NewsProvider>();
    final movieProvider = context.watch<MovieProvider>();
    
    // Trang chủ (mặc định)
    final bannerNews = newsProvider.bannerNews;
    final currentBannerImage = bannerNews.isNotEmpty && _currentBannerIndex < bannerNews.length
        ? bannerNews[_currentBannerIndex].imageUrl
        : (bannerNews.isNotEmpty ? bannerNews[0].imageUrl : null);

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        // Backdrop SliverAppBar với Banner nằm lên trên background
        SliverAppBar(
          expandedHeight: 320,
          pinned: true,
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,

          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                // Backdrop ảnh banner
                if (currentBannerImage != null && currentBannerImage.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: currentBannerImage,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.grey[800]),
                    errorWidget: (_, __, ___) => Container(color: Colors.grey[800]),
                  )
                else
                  Container(color: Colors.grey[800]),
                // Blur effect
                BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 3, sigmaY: 3),
                  child: Container(color: Colors.transparent),
                ),

                Container(color: Colors.black.withValues(alpha: 0.1)),
                // Banner PageView nằm giữa background
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 60,
                    left: 0,
                    right: 0,
                    height: 200,
                    child: _buildBannerPageView(),
                  ),
                  // Indicator dots dưới banner
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 270,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: _buildBannerIndicator(),
                    ),
                  ),
                ],
              ),
            ),
            leading: const SizedBox(width: 0),
            leadingWidth: 0,
            centerTitle: true,
            title: SafeArea(
              bottom: false,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE53935),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.movie, size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Absolute Cinema',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _scrollOffset > 100 ? Colors.black : Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverTabBarDelegate(
              child: _buildTabBar(),
            ),
          ),
          movieProvider.isLoading
              ? SliverFillRemaining(
            child: const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFE53935),
              ),
            ),
          )
              : _buildMoviesGrid(movieProvider),
        ],
      );
  }

  Widget _buildBannerPageView() {
    final newsProvider = context.watch<NewsProvider>();
    final bannerNews = newsProvider.bannerNews;

    _bannerPageController ??= PageController();


    if (newsProvider.isLoading && bannerNews.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (bannerNews.isEmpty) {
      return const SizedBox.shrink(); // Ẩn nếu không có banner
    }

    // ✅ Chỉ start auto-play nếu timer chưa chạy hoặc đã bị cancel
    if(bannerNews.isNotEmpty && (_bannerTimer == null || !_bannerTimer!.isActive)){
      WidgetsBinding.instance.addPostFrameCallback((_){
        if (mounted) {
          _startBannerAutoPlay();
        }
      });
    }

    // Nếu chưa có controller (trường hợp hot-reload), khởi tạo với initialPage
    _bannerPageController ??= PageController(initialPage: _bannerInitialPage);

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollStartNotification) {
          _pauseBannerAutoPlay(); // ✅ Pause khi user bắt đầu swipe
        } else if (notification is ScrollEndNotification) {
          _resumeBannerAutoPlay(); // ✅ Resume sau khi swipe xong
        }
        return false;
      },
      child: PageView.builder(
        controller: _bannerPageController,
        onPageChanged: (index) {
          // index có thể rất lớn; dùng mod để tính indicator
          final effectiveIndex = index % bannerNews.length;
          setState(() {
            _currentBannerIndex = effectiveIndex;
          });
          // ✅ Không cần resume ở đây nữa vì đã có trong ScrollEndNotification
        },
        itemBuilder: (context, index) {
          // Sử dụng modulo để loop vô hạn
          final effectiveIndex = index % bannerNews.length;
          final news = bannerNews[effectiveIndex];
          return GestureDetector(
            onTap: () {
              // ✅ Xử lý click: nếu có linkedMovie → MovieDetail, không có → NewsDetail
              if (news.linkedMovie != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        MovieDetailScreen(movie: news.linkedMovie!),
                  ),
                );
              } else {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => NewsDetailScreen(news: news),
                  ),
                );
              }
            },
            child: Container(
              margin: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Colors.grey[900], // ✅ Background color để che phần crop
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: news.imageUrl != null && news.imageUrl!.isNotEmpty
                    ? Stack(
                  fit: StackFit.expand,
                  children: [
                    // ✅ Ảnh banner với cover để fill container
                    CachedNetworkImage(
                      imageUrl: news.imageUrl!,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover, // ✅ Fill container, crop phần thừa
                      placeholder: (context, url) => Container(
                        color: Colors.grey[800],
                        child: const Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFFE53935),
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.grey[800],
                        child: const Center(
                          child: Icon(
                            Icons.image_not_supported,
                            color: Colors.grey,
                            size: 50,
                          ),
                        ),
                      ),
                    ),

                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.4),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                )
                    : Container(
                  color: Colors.grey[800],
                  child: const Center(
                    child: Icon(
                      Icons.image_not_supported,
                      color: Colors.grey,
                      size: 50,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBannerIndicator() {
    final newsProvider = context.watch<NewsProvider>();
    final bannerNews = newsProvider.bannerNews;

    if (bannerNews.isEmpty) {
      return const SizedBox.shrink();
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        bannerNews.length,
            (index) => Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: _currentBannerIndex == index ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: _currentBannerIndex == index
                ? const Color(0xFFE53935)
                : Colors.white.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFFFF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(borderRadius: BorderRadius.circular(12)),
        labelColor: const Color(0xFF3772D3),
        unselectedLabelColor: Colors.black54,
        labelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        tabs: const [
          Tab(text: 'Đang chiếu'),
          Tab(text: 'Sắp chiếu'),
        ],
      ),
    );
  }

  Widget _buildMoviesGrid(MovieProvider movieProvider) {
    return SliverToBoxAdapter(
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        switchInCurve: Curves.easeInOut,
        switchOutCurve: Curves.easeInOut,
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(
            opacity: animation,
            child: SizeTransition(
              sizeFactor: animation,
              axisAlignment: -1, // Bắt đầu từ trên
              child: child,
            ),
          );
        },
        layoutBuilder: (currentChild, previousChildren) {
          return Stack(
            alignment: Alignment.topCenter,
            children: <Widget>[
              ...previousChildren,
              if (currentChild != null) currentChild,
            ],
          );
        },
        child: Padding(
          key: ValueKey(_tabController.index),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: _buildMoviesContent(movieProvider),
        ),
      ),
    );
  }

  Widget _buildMoviesContent(MovieProvider movieProvider) {
    final movies = _tabController.index == 0
        ? movieProvider.nowShowingMovies
        : movieProvider.comingSoonMovies;

    if (movies.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(
          child: Text('Chưa có phim', style: TextStyle(color: Colors.grey)),
        ),
      );
    }

    // Chỉ hiển thị 6 phim đầu tiên
    final displayMovies = movies.take(6).toList();
    final hasMore = movies.length > 6;

    return Column(
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.6,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: displayMovies.length,
          // Chỉ 6 phim
          itemBuilder: (context, index) {
            return _buildMovieCard(displayMovies[index]);
          },
        ),
        // Nút "Xem thêm" nếu có nhiều hơn 6 phim
        if (hasMore)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => AllMoviesScreen(
                      type: _tabController.index == 0
                          ? 'now_showing'
                          : 'coming_soon',
                      title: _tabController.index == 0
                          ? 'Tất cả phim đang chiếu'
                          : 'Tất cả phim sắp chiếu',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE53935),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Xem thêm',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildMovieCard(MovieModel movie) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => MovieDetailScreen(movie: movie)),
        );
      },
      child: Container(
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
            // Poster
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(12),
                    ),
                    child: movie.posterUrl != null
                        ? CachedNetworkImage(
                      imageUrl: movie.posterUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
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
                    )
                        : Container(
                      color: Colors.grey[300],
                      child: const Icon(
                        Icons.image_not_supported,
                        color: Colors.grey,
                        size: 50,
                      ),
                    ),
                  ),
                  // Age Rating Badge (góc trên bên phải)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFC107),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        movie.ageRating,
                        style: const TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  // Rating Badge (góc trên bên trái)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            spreadRadius: 1,
                            blurRadius: 2,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.star,
                            color: Color(0xFFFFC107),
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            movie.avgRating.toStringAsFixed(1),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(
              height: 62,
              child: Padding(
                padding: const EdgeInsets.all(12),

                child: Text(
                  movie.title,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bottomNavigationBar() {
    return Theme(
      data: Theme.of(context).copyWith(
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
      ),
      child: BottomNavigationBar(
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFFE53935),
        unselectedItemColor: Colors.grey,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
        enableFeedback: false,
        currentIndex: _currentBottomNavIndex,
        onTap: (index) {
          if (index != _currentBottomNavIndex) {
            setState(() {
              _currentBottomNavIndex = index;
            });
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.newspaper), label: 'Tin tức'),
          BottomNavigationBarItem(
            icon: Icon(Icons.confirmation_number),
            label: 'Vé',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.movie_outlined), label: 'Rạp chiếu'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Tài khoản'),
        ],
      ),
    );
  }
}

// Delegate for SliverPersistentHeader to make TabBar sticky
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _SliverTabBarDelegate({required this.child});

  @override
  double get minExtent => 56; // Height of TabBar
  @override
  double get maxExtent => 56;

  @override
  Widget build(
      BuildContext context,
      double shrinkOffset,
      bool overlapsContent,
      ) {
    return Container(
      color: Colors.white,
      child: child,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return oldDelegate.child != child;
  }
}

