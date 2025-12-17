import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../models/theater_model.dart';
import '../models/cinema_room_model.dart';
import '../providers/auth_provider.dart';
import '../services/booking_service.dart';
import 'seat_selection_screen.dart';

class TheaterDetailScreen extends StatefulWidget {
  final TheaterModel theater;

  const TheaterDetailScreen({super.key, required this.theater});

  @override
  State<TheaterDetailScreen> createState() => _TheaterDetailScreenState();
}

class _TheaterDetailScreenState extends State<TheaterDetailScreen> {
  List<Map<String, dynamic>> _movies = [];
  bool _isLoading = true;
  String? _error;
  
  // For showtime selection
  int? _selectedMovieId;
  List<CinemaRoomModel> _showtimes = [];
  bool _isLoadingShowtimes = false;
  DateTime _selectedDate = DateTime.now();
  late List<DateTime> _availableDates;

  @override
  void initState() {
    super.initState();
    _initDates();
    _loadMovies();
  }

  void _initDates() {
    _availableDates = List.generate(7, (i) => DateTime.now().add(Duration(days: i)));
  }

  Future<void> _loadMovies() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final bookingService = BookingService(authProvider: authProvider);
      final movies = await bookingService.getMoviesByTheater(widget.theater.id);

      if (mounted) {
        setState(() {
          _movies = movies;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadShowtimes(int movieId) async {
    setState(() {
      _selectedMovieId = movieId;
      _isLoadingShowtimes = true;
      _showtimes = [];
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final bookingService = BookingService(authProvider: authProvider);
      final rooms = await bookingService.getShowtimesForMovieAtTheater(
        widget.theater.id,
        movieId,
      );

      // Debug log
      print('[TheaterDetail] Loaded ${rooms.length} rooms');
      for (var room in rooms) {
        print('[TheaterDetail] Room: ${room.name}, showtimes: ${room.showtimes?.length ?? 0}');
        for (var st in room.showtimes ?? []) {
          print('[TheaterDetail] - Showtime: ${st.startTime} (local)');
        }
      }
      print('[TheaterDetail] Selected date: $_selectedDate');

      // Tự động chọn ngày đầu tiên có suất chiếu
      DateTime? firstShowtimeDate;
      for (var room in rooms) {
        for (var st in room.showtimes ?? []) {
          if (firstShowtimeDate == null || st.startTime.isBefore(firstShowtimeDate)) {
            firstShowtimeDate = st.startTime;
          }
        }
      }
      
      if (firstShowtimeDate != null) {
        // Tìm ngày trong _availableDates gần với firstShowtimeDate nhất
        for (var date in _availableDates) {
          if (_isSameDay(date, firstShowtimeDate)) {
            _selectedDate = date;
            break;
          }
        }
      }

      if (mounted) {
        setState(() {
          _showtimes = rooms;
          _isLoadingShowtimes = false;
        });
      }
    } catch (e) {
      print('[TheaterDetail] Error: $e');
      if (mounted) {
        setState(() {
          _isLoadingShowtimes = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: CustomScrollView(
        slivers: [
          // Header with theater info
          SliverAppBar(
            expandedHeight: 130,
            pinned: true,
            backgroundColor: const Color(0xFFE53935),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFFE53935), Color(0xFFD32F2F)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.movie_outlined,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.theater.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on, 
                                        color: Colors.white70, size: 14),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          widget.theater.address,
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 13,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Content
          _isLoading
              ? const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              : _error != null
                  ? SliverFillRemaining(child: _buildErrorWidget())
                  : _movies.isEmpty
                      ? SliverFillRemaining(child: _buildEmptyWidget())
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              if (index == 0) {
                                return Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Text(
                                    'Phim đang chiếu (${_movies.length})',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF044FA2),
                                    ),
                                  ),
                                );
                              }
                              return _buildMovieCard(_movies[index - 1]);
                            },
                            childCount: _movies.length + 1,
                          ),
                        ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Không thể tải danh sách phim',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadMovies,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.movie_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Không có phim đang chiếu tại rạp này',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildMovieCard(Map<String, dynamic> movie) {
    final movieId = movie['id'] as int;
    final isExpanded = _selectedMovieId == movieId;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: Colors.white,
      child: Column(
        children: [
          // Movie Info
          InkWell(
            onTap: () {
              if (isExpanded) {
                setState(() {
                  _selectedMovieId = null;
                  _showtimes = [];
                });
              } else {
                _loadShowtimes(movieId);
              }
            },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Poster
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: movie['poster_url'] ?? '',
                      width: 80,
                      height: 120,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.movie, size: 40),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.movie, size: 40),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          movie['title'] ?? '',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Text(
                              '${movie['duration_min'] ?? 0} phút',
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                            ),
                            const SizedBox(width: 16),
                            if (movie['age_rating'] != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _getAgeRatingColor(movie['age_rating']),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  movie['age_rating'],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (movie['average_rating'] != null && movie['average_rating'] > 0)
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                movie['average_rating'].toStringAsFixed(1),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 8),
                        Text(
                          '${movie['showtime_count'] ?? 0} suất chiếu',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Expand Icon
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ),

          // Expanded Showtimes
          if (isExpanded) ...[
            const Divider(height: 1),
            _buildShowtimesSection(movie),
          ],
        ],
      ),
    );
  }

  Widget _buildShowtimesSection(Map<String, dynamic> movie) {
    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Date Picker
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _availableDates.length,
              itemBuilder: (context, index) {
                final date = _availableDates[index];
                final isSelected = _isSameDay(date, _selectedDate);
                return _buildDateChip(date, isSelected);
              },
            ),
          ),
          const SizedBox(height: 12),

          // Showtimes
          if (_isLoadingShowtimes)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_showtimes.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Không có suất chiếu',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
            )
          else
            _buildShowtimesGrid(movie),
        ],
      ),
    );
  }

  Widget _buildDateChip(DateTime date, bool isSelected) {
    final dayName = _getDayName(date);
    final dayNum = date.day.toString();
    final monthName = 'Th${date.month}';

    return GestureDetector(
      onTap: () {
        print('[TheaterDetail] Date tapped: $date');
        setState(() {
          _selectedDate = date;
        });
        print('[TheaterDetail] _selectedDate after setState: $_selectedDate');
      },
      child: Container(
        width: 60,
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF044FA2) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF044FA2) : Colors.grey[300]!,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              dayName,
              style: TextStyle(
                color: isSelected ? Colors.white70 : Colors.grey[600],
                fontSize: 11,
              ),
            ),
            Text(
              dayNum,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              monthName,
              style: TextStyle(
                color: isSelected ? Colors.white70 : Colors.grey[600],
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShowtimesGrid(Map<String, dynamic> movie) {
    // Group showtimes by room and filter by selected date
    print('[TheaterDetail] _buildShowtimesGrid called');
    print('[TheaterDetail] _selectedDate: $_selectedDate');
    print('[TheaterDetail] Total rooms: ${_showtimes.length}');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _showtimes.map((room) {
        print('[TheaterDetail] Room ${room.name}: ${room.showtimes?.length ?? 0} showtimes');
        
        final filteredShowtimes = (room.showtimes ?? []).where((st) {
          final isSame = _isSameDay(st.startTime, _selectedDate);
          print('[TheaterDetail]   Showtime ${st.startTime} vs $_selectedDate = $isSame');
          return isSame;
        }).toList();
        
        print('[TheaterDetail] Room ${room.name}: ${filteredShowtimes.length} filtered showtimes');

        if (filteredShowtimes.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Room name
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(Icons.meeting_room, size: 16, color: Color(0xFF044FA2)),
                  const SizedBox(width: 6),
                  Text(
                    room.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF044FA2),
                    ),
                  ),
                  if (room.screenType.isNotEmpty && room.screenType != 'Standard') ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        room.screenType,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.orange,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Showtime buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: filteredShowtimes.map((showtime) {
                final time = DateFormat('HH:mm').format(showtime.startTime);
                final isPast = showtime.startTime.isBefore(DateTime.now());

                return GestureDetector(
                  onTap: isPast
                      ? null
                      : () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SeatSelectionScreen(
                                showtime: showtime,
                                movieTitle: movie['title'] ?? '',
                                theaterName: widget.theater.name,
                                roomName: room.name,
                              ),
                            ),
                          );
                        },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isPast ? Colors.grey[200] : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isPast ? Colors.grey[300]! : const Color(0xFF044FA2),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          time,
                          style: TextStyle(
                            color: isPast ? Colors.grey : const Color(0xFF044FA2),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          '${NumberFormat('#,###').format(showtime.basePrice.toInt())}đ',
                          style: TextStyle(
                            color: isPast ? Colors.grey : Colors.grey[600],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
          ],
        );
      }).toList(),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _getDayName(DateTime date) {
    final now = DateTime.now();
    if (_isSameDay(date, now)) return 'Hôm nay';
    if (_isSameDay(date, now.add(const Duration(days: 1)))) return 'Ngày mai';
    
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.weekday % 7];
  }

  Color _getAgeRatingColor(String rating) {
    switch (rating.toUpperCase()) {
      case 'P':
        return Colors.green;
      case 'C13':
      case 'T13':
        return Colors.blue;
      case 'C16':
      case 'T16':
        return Colors.orange;
      case 'C18':
      case 'T18':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
