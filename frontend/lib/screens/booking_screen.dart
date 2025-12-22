import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../providers/booking_provider.dart';
import '../models/cinema_room_model.dart';
import '../services/socket_service.dart';
import 'seat_selection_screen.dart';

class BookingScreen extends StatefulWidget {
  final int movieId;
  final String movieTitle;

  const BookingScreen({
    Key? key,
    required this.movieId,
    required this.movieTitle,
  }) : super(key: key);

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late ScrollController _dateScrollController;
  final Set<int> _expandedTheaters = {}; // Track expanded theater IDs
  
  // Socket listener reference for cleanup
  late void Function(int, String, String) _roomUpdatedListener;
  late void Function(int, int?) _showtimeCreatedListener;
  late void Function(int, int, int?) _showtimeUpdatedListener;
  late void Function(int, int, int?) _showtimeDeletedListener;

  @override
  void initState() {
    super.initState();
    _dateScrollController = ScrollController();
    _setupSocketListeners();

    // Load TẤT CẢ suất chiếu của phim này 1 lần duy nhất
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BookingProvider>(context, listen: false)
          .loadAllShowtimes(widget.movieId);
    });
  }

  @override
  void dispose() {
    _dateScrollController.dispose();
    // Remove socket listeners
    SocketService.instance.removeRoomUpdatedListener(_roomUpdatedListener);
    SocketService.instance.removeShowtimeCreatedListener(_showtimeCreatedListener);
    SocketService.instance.removeShowtimeUpdatedListener(_showtimeUpdatedListener);
    SocketService.instance.removeShowtimeDeletedListener(_showtimeDeletedListener);
    super.dispose();
  }

  void _setupSocketListeners() {
    // Listen for room updates - auto refresh data
    _roomUpdatedListener = (roomId, roomName, screenType) {
      debugPrint('[BookingScreen] Room updated: $roomId - $screenType ($roomName)');
      // Reload all showtimes to get updated room info
      Provider.of<BookingProvider>(context, listen: false)
          .loadAllShowtimes(widget.movieId);
    };
    SocketService.instance.addRoomUpdatedListener(_roomUpdatedListener);

    // Listen for showtime created event
    _showtimeCreatedListener = (movieId, theaterId) {
      debugPrint('[BookingScreen] Showtime created for movie: $movieId');
      // Only reload if this showtime is for current movie
      if (movieId == widget.movieId) {
        Provider.of<BookingProvider>(context, listen: false)
            .loadAllShowtimes(widget.movieId);
      }
    };
    SocketService.instance.addShowtimeCreatedListener(_showtimeCreatedListener);

    // Listen for showtime updated event
    _showtimeUpdatedListener = (showtimeId, movieId, theaterId) {
      debugPrint('[BookingScreen] Showtime updated: $showtimeId for movie: $movieId');
      if (movieId == widget.movieId) {
        Provider.of<BookingProvider>(context, listen: false)
            .loadAllShowtimes(widget.movieId);
      }
    };
    SocketService.instance.addShowtimeUpdatedListener(_showtimeUpdatedListener);

    // Listen for showtime deleted event
    _showtimeDeletedListener = (showtimeId, movieId, theaterId) {
      debugPrint('[BookingScreen] Showtime deleted: $showtimeId for movie: $movieId');
      if (movieId == widget.movieId) {
        Provider.of<BookingProvider>(context, listen: false)
            .loadAllShowtimes(widget.movieId);
      }
    };
    SocketService.instance.addShowtimeDeletedListener(_showtimeDeletedListener);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.movieTitle,
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),

                // ============================================
                // 1️⃣ SELECTION BAR (City + Theater) - Chỉ là bộ lọc
                // ============================================
                _buildSelectionBar(provider),
                const SizedBox(height: 20),

                // ============================================
                // 2️⃣ DATE PICKER - Chỉ lọc suất chiếu theo ngày
                // ============================================
                _buildDatePicker(provider),
                const SizedBox(height: 20),

                // ============================================
                // 3️⃣ DANH SÁCH RẠP + PHÒNG + SUẤT CHIẾU
                // ============================================
                if (provider.isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(color: Colors.blue),
                    ),
                  )
                else if (provider.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Center(
                      child: Text(
                        'Lỗi: ${provider.errorMessage}',
                        style: TextStyle(color: Colors.red[400], fontSize: 16),
                      ),
                    ),
                  )
                else if (provider.theatersWithFilteredShowtimes.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        vertical: 32.0, horizontal: 16.0),
                    child: Center(
                      child: Text(
                        'Không có suất chiếu nào',
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 16,
                        ),
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: _buildTheatersList(provider),
                  ),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  // ============================================
  // 1️⃣ SELECTION BAR (City + Theater)
  // ============================================
  Widget _buildSelectionBar(BookingProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        children: [
          // 🏙️ City Filter
          Expanded(
            child: GestureDetector(
              onTap: () => _showCitySheet(provider),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF16213E),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Khu Vực',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      provider.selectedCity ?? 'Tất cả',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // 🎬 Theater Filter
          Expanded(
            child: GestureDetector(
              onTap: () => _showTheaterSheet(provider),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF16213E),
                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rạp Chiếu',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      provider.selectedTheater?.name ?? 'Tất cả',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // 2️⃣ DATE PICKER (14 days)
  // ============================================
  Widget _buildDatePicker(BookingProvider provider) {
    final now = DateTime.now();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 12),
          child: Text(
            'Chọn Ngày',
            style: TextStyle(
              color: Colors.grey[700],
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          controller: _dateScrollController,
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: List.generate(14, (index) {
              final date = now.add(Duration(days: index));
              final isToday = date.year == now.year &&
                  date.month == now.month &&
                  date.day == now.day;
              final isSelected = provider.selectedDate?.year == date.year &&
                  provider.selectedDate?.month == date.month &&
                  provider.selectedDate?.day == date.day;

              return GestureDetector(
                onTap: () => provider.selectDate(date),
                child: Container(
                  margin: EdgeInsets.only(right: index < 13 ? 12 : 0),
                  decoration: BoxDecoration(
                    color: isSelected ? Color(0xFF044fa2) : Colors.grey[100],
                    border: Border.all(
                      color: isSelected
                          ? Color(0xFF044fa2)
                          : Colors.grey.withOpacity(0.3),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 16,
                  ),
                  child: Column(
                    children: [
                      Text(
                        isToday ? 'Hôm nay' : _getDayName(date.weekday),
                        style: TextStyle(
                          color: isSelected 
                            ? Colors.white 
                            : (isToday ? const Color(0xFF044fa2) : Colors.grey[700]),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${date.day}/${date.month}',
                        style: TextStyle(
                          color: isSelected ? Colors.white : (isToday ? const Color(0xFF044fa2) : Colors.black),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  String _getDayName(int weekday) {
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return days[weekday - 1];
  }

  // ============================================
  // 3️⃣ THEATERS + ROOMS + SHOWTIMES LIST
  // ============================================
  Widget _buildTheatersList(BookingProvider provider) {
    final theaters = provider.theatersWithFilteredShowtimes;
    final now = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: theaters.map((theater) {
        final isExpanded = _expandedTheaters.contains(theater.id);

        // Group showtimes by "screenType - showtimeType"
        // e.g., "Standard - 2D Phụ đề", "IMAX - 3D Phụ đề"
        final showtimeGroups = <String, List<Map<String, dynamic>>>{};
        for (final room in (theater.cinemaRooms ?? [])) {
          for (final showtime in (room.showtimes ?? [])) {
            final groupKey = '${room.screenType} - ${showtime.showtimeType}';
            if (!showtimeGroups.containsKey(groupKey)) {
              showtimeGroups[groupKey] = [];
            }
            showtimeGroups[groupKey]!.add({
              'showtime': showtime,
              'room': room,
            });
          }
        }
        
        // Sort groups by key
        final sortedGroupKeys = showtimeGroups.keys.toList()..sort();

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Colors.grey.withOpacity(0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Theater Header - Clickable to expand/collapse
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (isExpanded) {
                      _expandedTheaters.remove(theater.id);
                    } else {
                      _expandedTheaters.add(theater.id);
                    }
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 12,
                    horizontal: 16,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              theater.name,
                              style: const TextStyle(
                                color: Colors.black87,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${theater.city} • ${theater.address}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        isExpanded
                            ? Icons.expand_less
                            : Icons.expand_more,
                        color: Colors.grey[600],
                      ),
                    ],
                  ),
                ),
              ),

              // Screen Types + Showtimes (only if expanded)
              if (isExpanded) ...[
                Divider(
                  color: Colors.grey.withOpacity(0.3),
                  height: 1,
                  thickness: 1,
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: sortedGroupKeys
                        .map((groupKey) {
                          final items = showtimeGroups[groupKey]!;

                          // Filter future showtimes and sort by time
                          final futureItems = items
                              .where((item) {
                                final showtime = item['showtime'] as ShowtimeModel;
                                return showtime.startTime.isAfter(now);
                              })
                              .toList();
                          
                          futureItems.sort((a, b) {
                            final stA = a['showtime'] as ShowtimeModel;
                            final stB = b['showtime'] as ShowtimeModel;
                            return stA.startTime.compareTo(stB.startTime);
                          });

                          if (futureItems.isEmpty) {
                            return const SizedBox.shrink();
                          }

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Group Name: "Standard - 2D Phụ đề"
                              Text(
                                groupKey,
                                style: TextStyle(
                                  color: _getScreenTypeColor(groupKey),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Showtimes Grid
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: futureItems.map((item) {
                                  final showtime = item['showtime'] as ShowtimeModel;
                                  final timeStr = DateFormat('HH:mm').format(showtime.startTime);
                                  final color = _getScreenTypeColor(groupKey);

                                  return GestureDetector(
                                    onTap: () => _selectShowtime(showtime),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        border: Border.all(color: const Color(0xFFD2D2D2)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                        horizontal: 14,
                                      ),
                                      child: Text(
                                        timeStr,
                                        style: TextStyle(
                                          color: color,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        })
                        .toList(),
                  ),
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }

  IconData _getScreenTypeIcon(String groupKey) {
    if (groupKey.contains('3D')) return Icons.threed_rotation;
    return Icons.movie_outlined;
  }

  // Single color for all showtime types
  Color _getScreenTypeColor(String groupKey) {
    return Colors.black87;
  }

  // ============================================
  // ACTION SHEETS
  // ============================================
  void _showCitySheet(BookingProvider provider) {
    final cities = provider.cities;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF16213E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Chọn Khu Vực',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // "Tất cả" option
          ListTile(
            onTap: () {
              provider.selectCity(null);
              Navigator.pop(context);
            },
            title: Text(
              'Tất cả',
              style: TextStyle(
                color: provider.selectedCity == null
                    ? Colors.red
                    : Colors.white,
                fontWeight: provider.selectedCity == null
                    ? FontWeight.bold
                    : FontWeight.w500,
              ),
            ),
            trailing: provider.selectedCity == null
                ? const Icon(Icons.check, color: Colors.red)
                : null,
          ),

          // Cities list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: cities.length,
              itemBuilder: (context, index) {
                final city = cities[index];
                final isSelected = provider.selectedCity == city;

                return ListTile(
                  onTap: () {
                    provider.selectCity(city);
                    Navigator.pop(context);
                  },
                  title: Text(
                    city,
                    style: TextStyle(
                      color: isSelected ? Colors.red : Colors.white,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check, color: Colors.red)
                      : null,
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showTheaterSheet(BookingProvider provider) {
    final theaters = provider.filteredTheaters;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF16213E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Chọn Rạp Chiếu',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // "Tất cả" option
          ListTile(
            onTap: () {
              provider.selectTheater(null);
              Navigator.pop(context);
            },
            title: Text(
              'Tất cả',
              style: TextStyle(
                color: provider.selectedTheaterId == null
                    ? Colors.red
                    : Colors.white,
                fontWeight: provider.selectedTheaterId == null
                    ? FontWeight.bold
                    : FontWeight.w500,
              ),
            ),
            trailing: provider.selectedTheaterId == null
                ? const Icon(Icons.check, color: Colors.red)
                : null,
          ),

          // Theaters list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: theaters.length,
              itemBuilder: (context, index) {
                final theater = theaters[index];
                final isSelected = provider.selectedTheaterId == theater.id;

                return ListTile(
                  onTap: () {
                    provider.selectTheater(theater.id);
                    Navigator.pop(context);
                  },
                  title: Text(
                    theater.name,
                    style: TextStyle(
                      color: isSelected ? Colors.red : Colors.white,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    theater.city,
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check, color: Colors.red)
                      : null,
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _selectShowtime(ShowtimeModel showtime) {
    // Get theater and room info from provider
    final provider = Provider.of<BookingProvider>(context, listen: false);
    final theaters = provider.theatersWithFilteredShowtimes;
    
    String theaterName = '';
    String roomName = '';
    
    // Find theater and room containing this showtime
    for (final theater in theaters) {
      for (final room in theater.cinemaRooms ?? []) {
        final hasShowtime = room.showtimes?.any((s) => s.id == showtime.id) ?? false;
        if (hasShowtime) {
          theaterName = theater.name;
          roomName = room.displayName;
          break;
        }
      }
      if (theaterName.isNotEmpty) break;
    }

    // Navigate to seat selection
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SeatSelectionScreen(
          showtime: showtime,
          movieTitle: widget.movieTitle,
          theaterName: theaterName,
          roomName: roomName,
        ),
      ),
    );
  }
}
