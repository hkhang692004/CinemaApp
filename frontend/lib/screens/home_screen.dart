import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/screens/login_screen.dart';
import 'package:cinema_app/providers/news_provider.dart';
import 'package:cinema_app/screens/news_detail_screen.dart';
import 'package:cinema_app/screens/movie_detail_screen.dart';
import 'package:cinema_app/screens/all_movies_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentBannerIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabChange);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NewsProvider>().loadBannerNews();
    });

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
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final movieProvider = context.watch<MovieProvider>();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            _buildAppBar(authProvider),

            SliverToBoxAdapter(child: _buildBanner()),

            SliverToBoxAdapter(child: _buildTabBar()),

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
        ),
      ),
      bottomNavigationBar: _bottomNavigationBar(),
    );
  }

  Widget _buildAppBar(AuthProvider authProvider) {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.white,
      elevation: 1,
      title: Row(
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
          const Text(
            'Absolute Cinema',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.black87),
          onPressed: () {
            // TODO: Search screen
          },
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.person, color: Colors.black87),
          color: Colors.white,
          onSelected: (value) {
            if (value == 'logout') {
              _handleLogout(authProvider);
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'profile',
              child: Row(
                children: [
                  const Icon(Icons.person, color: Colors.black87, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    authProvider.user?.email ?? 'Profile',
                    style: const TextStyle(color: Colors.black87),
                  ),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'settings',
              child: Row(
                children: [
                  Icon(Icons.settings, color: Colors.black87, size: 20),
                  SizedBox(width: 12),
                  Text('Cài đặt', style: TextStyle(color: Colors.black87)),
                ],
              ),
            ),
            const PopupMenuDivider(),
            const PopupMenuItem(
              value: 'logout',
              child: Row(
                children: [
                  Icon(Icons.logout, color: Color(0xFFE53935), size: 20),
                  SizedBox(width: 12),
                  Text('Đăng xuất', style: TextStyle(color: Color(0xFFE53935))),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBanner() {
    final newsProvider = context.watch<NewsProvider>();
    final bannerNews = newsProvider.bannerNews;

    if (newsProvider.isLoading && bannerNews.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (bannerNews.isEmpty) {
      return const SizedBox.shrink(); // Ẩn nếu không có banner
    }

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PageView.builder(
            itemCount: bannerNews.length,
            onPageChanged: (index) {
              setState(() {
                _currentBannerIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final news = bannerNews[index];
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
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: news.imageUrl != null && news.imageUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: news.imageUrl!,
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
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
        ),
        const SizedBox(height: 8),
        Row(
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
                    : Colors.grey,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
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
          padding: const EdgeInsets.all(16),
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
              color: Colors.grey.withOpacity(0.1),
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
    return BottomNavigationBar(
      backgroundColor: Colors.white,
      selectedItemColor: const Color(0xFFE53935),
      unselectedItemColor: Colors.grey,
      elevation: 8,
      type: BottomNavigationBarType.fixed,
      currentIndex: 0,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
        BottomNavigationBarItem(icon: Icon(Icons.movie), label: 'Phim'),
        BottomNavigationBarItem(
          icon: Icon(Icons.confirmation_number),
          label: 'Vé',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.receipt), label: 'Hóa đơn'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Tài khoản'),
      ],
    );
  }

  void _handleLogout(AuthProvider authProvider) async {
    await authProvider.signOut();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }
}
