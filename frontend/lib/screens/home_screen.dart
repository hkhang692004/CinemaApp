import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/screens/login_screen.dart';
import 'package:cinema_app/screens/movie_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

    // Load movies khi mở màn hình
    Future.microtask(() {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      if (auth.accessToken != null) {
        final movieProvider = context.read<MovieProvider>();
        movieProvider.loadNowShowingMovies(auth.accessToken!);
        movieProvider.loadComingSoonMovies(auth.accessToken!);
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
            movieProvider.loadNowShowingMovies(auth.accessToken!);
          }
        } else {
          if (movieProvider.comingSoonMovies.isEmpty) {
            movieProvider.loadComingSoonMovies(auth.accessToken!);
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
      backgroundColor: const Color(0xFF1A1A1A),
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
      backgroundColor: const Color(0xFF1A1A1A),
      elevation: 0,
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
              color: Colors.white,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.white),
          onPressed: () {
            // TODO: Search screen
          },
        ),
        PopupMenuButton<String>(
          icon: const Icon(Icons.person, color: Colors.white),
          color: const Color(0xFF2A2A2A),
          onSelected: (value) {
            if (value == 'logout') {
              _handleLogout(authProvider);
            }
          },
          itemBuilder: (context) =>
          [
            PopupMenuItem(
              value: 'profile',
              child: Row(
                children: [
                  const Icon(Icons.person, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    authProvider.user?.email ?? 'Profile',
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'settings',
              child: Row(
                children: [
                  Icon(Icons.settings, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Text('Cài đặt', style: TextStyle(color: Colors.white)),
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
    final banners = [
      'https://via.placeholder.com/800x300/E53935/FFFFFF?text=Banner+1',
      'https://via.placeholder.com/800x300/1976D2/FFFFFF?text=Banner+2',
      'https://via.placeholder.com/800x300/388E3C/FFFFFF?text=Banner+3',
    ];

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PageView.builder(
            itemCount: banners.length,
            onPageChanged: (index) {
              setState(() {
                _currentBannerIndex = index;
              });
            },
            itemBuilder: (context, index) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: DecorationImage(
                    image: NetworkImage(banners[index]),
                    fit: BoxFit.cover,
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
            banners.length,
                (index) =>
                Container(
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
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey,
        labelStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
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
        duration: const Duration(milliseconds: 300),
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(
            opacity: animation,
            child: child,

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
          child: Text(
            'Chưa có phim',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.6,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: movies.length,
      itemBuilder: (context, index) {
        return _buildMovieCard(movies[index]);
      },
    );
  }

  Widget _buildMovieCard(MovieModel movie) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => MovieDetailScreen(movie: movie),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Poster
            Expanded(
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(12),
                      ),
                      image: DecorationImage(
                        image: movie.posterUrl != null
                            ? NetworkImage(movie.posterUrl!)
                            : const NetworkImage(
                          'https://via.placeholder.com/300x450/2A2A2A/FFFFFF?text=No+Image',
                        ) as ImageProvider,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  // Age Rating Badge
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
                ],
              ),
            ),
            // Title & Rating
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    movie.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        color: Color(0xFFFFC107),
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        movie.avgRating.toStringAsFixed(1),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bottomNavigationBar() {
    return BottomNavigationBar(
      backgroundColor: const Color(0xFF1A1A1A),
      selectedItemColor: const Color(0xFFE53935),
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      currentIndex: 0,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'Trang chủ',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.movie),
          label: 'Phim',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.confirmation_number),
          label: 'Vé',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.receipt),
          label: 'Hóa đơn',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Tài khoản',
        ),
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
