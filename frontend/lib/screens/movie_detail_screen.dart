import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cinema_app/models/movie.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/screens/booking_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class MovieDetailScreen extends StatefulWidget {
  final MovieModel movie;

  const MovieDetailScreen({super.key, required this.movie});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  late MovieModel _movie;
  bool _loadingDetail = false;
  bool _showPageLoading = true; // Loading overlay toàn trang
  String? _detailError;
  YoutubePlayerController? _youtubeController;
  // Scroll controller to track scroll offset so overlay can follow backdrop
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _movie = widget.movie;
    _initYoutubeController(_movie.trailerUrl);
    _scrollController.addListener(() {
      if (!mounted) return;
      setState(() {
        _scrollOffset = _scrollController.offset;
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDetail();
      // Hiển thị loading overlay 1s để ảnh load vào cache
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          setState(() {
            _showPageLoading = false;
          });
        }
      });
    });
  }

  void _initYoutubeController(String? trailerUrl) {
    _youtubeController?.dispose();
    _youtubeController = null;

    if (trailerUrl == null || trailerUrl.isEmpty) {
      debugPrint('Trailer URL trống');
      return;
    }

    try {
      final videoId = YoutubePlayer.convertUrlToId(trailerUrl);
      if (videoId != null && videoId.isNotEmpty) {
        _youtubeController = YoutubePlayerController(
          initialVideoId: videoId,
          flags: const YoutubePlayerFlags(
            autoPlay: true,
            mute: false,
            hideControls: false,
            hideThumbnail: true,
            enableCaption: false,
            useHybridComposition: true,
          ),
        );
        debugPrint('YouTube controller initialized: $videoId');
      }
    } catch (e) {
      debugPrint('Lỗi khởi tạo YouTube controller: $e');
    }
  }

  @override
  void dispose() {
    _youtubeController?.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final movie = _movie;
    // Height of the poster/meta overlay. We use this to center the overlay
    // so it overlaps the bottom of the backdrop and the top of the white content.
    final double overlayHeight = 140.0;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              // Backdrop SliverAppBar (lấn lên toàn bộ top)
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                elevation: 0,
                backgroundColor: Colors.black87,
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Backdrop ảnh
                      CachedNetworkImage(
                        imageUrl: _movie.backdropUrl ?? '',
                        fit: BoxFit.cover,
                        memCacheHeight: 1080,
                        memCacheWidth: 1920,
                        maxHeightDiskCache: 1080,
                        maxWidthDiskCache: 1920,
                        placeholder: (_, __) => Container(
                          color: Colors.grey[300],
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.broken_image, size: 40),
                        ),
                      ),
                      // Dark overlay
                      Container(
                        color: Colors.black.withValues(alpha: 0.4),
                      ),
                      // Play button
                      Center(
                        child: GestureDetector(
                          onTap: () {
                            if (_movie.trailerUrl == null || _movie.trailerUrl!.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Không có trailer cho phim này')),
                              );
                              return;
                            }

                            final videoId = YoutubePlayer.convertUrlToId(_movie.trailerUrl!);
                            if (videoId == null || videoId.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('URL trailer không hợp lệ')),
                              );
                              return;
                            }

                            if (!mounted) return;
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => _YoutubePlayerFullScreen(
                                  videoId: videoId,
                                  title: _movie.title,
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.play_arrow, color: Colors.white, size: 36),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              // Content
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_loadingDetail)
                      const LinearProgressIndicator(minHeight: 2)
                    else if (_detailError != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Text(
                          'Không tải được chi tiết: $_detailError',
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    // Reserve space for the poster overlay (rendered above the backdrop)
                    SizedBox(height: overlayHeight / 2),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        movie.description ?? 'Đang cập nhật nội dung...',
                        style: const TextStyle(fontSize: 14, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _infoRow('Kiểm duyệt', movie.ageRating),
                    _infoRow('Thể loại', movie.genres.isNotEmpty ? movie.genres.join(', ') : 'Đang cập nhật'),
                    _infoRow('Đạo diễn', movie.director ?? 'Đang cập nhật'),
                    _infoRow('Diễn viên', movie.actors.isNotEmpty ? movie.actors.join(', ') : 'Đang cập nhật'),
                    const SizedBox(height: 20),
                    // Show booking button only if movie is now showing
                    if (movie.status == 'now_showing')
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE53935),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              // Điều hướng tới flow đặt vé
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => BookingScreen(
                                    movieId: movie.id,
                                    movieTitle: movie.title,
                                  ),
                                ),
                              );
                            },
                            child: const Text(
                              'Đặt vé',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),

          Positioned(
            top: () {
              final double expandedHeight = 265.0;
              final double statusBar = MediaQuery.of(context).padding.top;
              final double minToolbar = kToolbarHeight;
              final double flexibleHeight = (expandedHeight - _scrollOffset).clamp(minToolbar, expandedHeight).toDouble();
              final double backdropBottom = statusBar + flexibleHeight;
              return backdropBottom - (overlayHeight / 2);
            }(),
            left: 16,
            right: 16,
            child: Material(
              color: Colors.transparent,
              elevation: 18,
              shadowColor: Colors.black,
              borderRadius: BorderRadius.circular(10),
              child: Container(
                height: overlayHeight,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.black.withValues(alpha: 0.07),
                ),
                child: _buildPosterAndMeta(),
              ),
            ),

          ),
          // Loading overlay toàn trang trong 1s để ảnh load vào cache
          if (_showPageLoading)
            Container(
              color: Colors.white,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFFE53935),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Đang tải thông tin phim...',
                      style: TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPosterAndMeta() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: _movie.posterUrl ?? '',
            width: 90,
            height: 130,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(
              width: 90,
              height: 130,
              color: Colors.grey[300],
              child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            errorWidget: (_, __, ___) => Container(
              width: 90,
              height: 130,
              color: Colors.grey[300],
              child: const Icon(Icons.broken_image, size: 32),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _movie.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  shadows: [
                    Shadow(blurRadius: 6, color: Colors.black45, offset: Offset(0, 2)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.schedule, size: 16, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    '${_movie.durationMin ?? 0} phút',
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.event, size: 16, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    _movie.releaseDate != null
                        ? _movie.releaseDate!.toIso8601String().split('T').first
                        : 'Đang cập nhật',
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Additional metadata: average rating and age rating
              Row(
                children: [
                  const Icon(Icons.star, size: 16, color: Colors.amber),
                  const SizedBox(width: 6),
                  Text(
                    _movie.avgRating.toStringAsFixed(1),
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : 'Đang cập nhật',
              style: const TextStyle(color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loadingDetail = true;
      _detailError = null;
    });

    try {
      final movieProvider = context.read<MovieProvider>();
      // Gọi qua provider để update _selectedMovie và preload images
      await movieProvider.getDetailMovie(_movie.id);

      if (!mounted) return;

      final detail = movieProvider.selectedMovie;
      if (detail != null) {
        final trailerChanged = _movie.trailerUrl != detail.trailerUrl;

        setState(() {
          _movie = detail;
        });
        
        // Chỉ re-init controller nếu trailer URL khác
        if (trailerChanged) {
          _initYoutubeController(_movie.trailerUrl);
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _detailError = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingDetail = false;
        });
      }
    }
  }
}

// Màn hình YouTube player full screen
class _YoutubePlayerFullScreen extends StatefulWidget {
  final String videoId;
  final String title;

  const _YoutubePlayerFullScreen({
    required this.videoId,
    required this.title,
  });

  @override
  State<_YoutubePlayerFullScreen> createState() => _YoutubePlayerFullScreenState();
}

class _YoutubePlayerFullScreenState extends State<_YoutubePlayerFullScreen> {
  late YoutubePlayerController _controller;
  Timer? _endCheckTimer;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController(
      initialVideoId: widget.videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        hideControls: false,
        hideThumbnail: true,
        useHybridComposition: true, // Fix CORS issue
      ),
    );
    // Monitor video progress and auto-close when ended or skipped to end
    _endCheckTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (!mounted) return;
      final duration = _controller.metadata.duration.inSeconds;
      final current = _controller.value.position.inSeconds;
      // Auto-pop if video reached end (either by playing or by seeking/skipping)
      if (duration > 0 && current >= duration ) {
        _endCheckTimer?.cancel();
        if (mounted) {
          Navigator.pop(context);
        }
      }
    });
  }

  @override
  void dispose() {
    _endCheckTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          style: const TextStyle(color: Colors.white),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: Center(
        child: YoutubePlayer(
          controller: _controller,
          showVideoProgressIndicator: true,
          progressColors: const ProgressBarColors(
            playedColor: Colors.red,
            handleColor: Colors.redAccent,
          ),
          onReady: () {
            debugPrint('YouTube Player Ready');
          },
        ),
      ),
    );
  }
}