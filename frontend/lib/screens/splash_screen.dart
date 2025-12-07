import 'package:cinema_app/providers/auth_provider.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/screens/home_screen.dart';
import 'package:cinema_app/screens/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      final authProvider = context.read<AuthProvider>();
      
      // Chờ AuthProvider initialize (load token từ storage)
      await authProvider.initialize();
      
      // Đợi một chút để splash screen hiển thị (UX tốt hơn)
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (!mounted) return;
      
      if (authProvider.accessToken != null) {
        // Đã đăng nhập → Load và preload movies
        final movieProvider = context.read<MovieProvider>();
        
        // Chờ load movies VÀ preload ảnh xong (best practice)
        await movieProvider.loadNowShowingMovies();
        await movieProvider.loadComingSoonMovies();
        
        if (!mounted) return;
        
        // Navigate đến HomeScreen (ảnh đã có trong cache)
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      } else {
        // Chưa đăng nhập → Navigate đến LoginScreen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } catch (e) {
      debugPrint('Lỗi khởi tạo app: $e');
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo hoặc icon
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFE53935),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.movie,
                size: 60,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            // Tên app
            const Text(
              'Absolute Cinema',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 32),
            // Loading indicator
            const CircularProgressIndicator(
              color: Color(0xFFE53935),
            ),
            const SizedBox(height: 16),
            const Text(
              'Đang tải...',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

