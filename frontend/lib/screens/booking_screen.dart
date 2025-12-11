import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../providers/booking_provider.dart';
import '../models/cinema_room_model.dart';

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

  @override
  void initState() {
    super.initState();
    _dateScrollController = ScrollController();

    // Load TẤT CẢ suất chiếu của phim này 1 lần duy nhất
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BookingProvider>(context, listen: false)
          .loadAllShowtimes(widget.movieId);
    });
  }

  @override
  void dispose() {
    _dateScrollController.dispose();
    super.dispose();
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
                      'Tất cả',
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

        // Group rooms by screen_type
        final screenTypeGroups = <String, List<CinemaRoomModel>>{};
        for (final room in (theater.cinemaRooms ?? [])) {
          final screenType = room.screenType;
          if (!screenTypeGroups.containsKey(screenType)) {
            screenTypeGroups[screenType] = [];
          }
          screenTypeGroups[screenType]!.add(room);
        }

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
                    children: screenTypeGroups.entries
                        .map((entry) {
                          final screenType = entry.key;
                          final rooms = entry.value;

                          // Collect all showtimes from rooms with this screen type
                          final allShowtimes = <ShowtimeModel>[];
                          for (final room in rooms) {
                            allShowtimes.addAll(room.showtimes ?? []);
                          }

                          // Filter future showtimes
                          final futureShowtimes = allShowtimes
                              .where((showtime) {
                                final startTime =
                                    showtime.startTime is DateTime
                                        ? showtime.startTime
                                        : DateTime.parse(
                                            showtime.startTime
                                                .toString());
                                return startTime.isAfter(now);
                              })
                              .toList();

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Screen Type Name
                              Text(
                                screenType,
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Showtimes Grid
                              if (futureShowtimes.isEmpty)
                                Text(
                                  'Không có suất chiếu',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 11,
                                  ),
                                )
                              else
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: futureShowtimes
                                      .map((showtime) {
                                    final timeStr =
                                        DateFormat('HH:mm').format(
                                      showtime.startTime is DateTime
                                          ? showtime.startTime
                                          : DateTime.parse(
                                              showtime.startTime
                                                  .toString()),
                                    );

                                    return GestureDetector(
                                      onTap: () =>
                                          _selectShowtime(showtime),
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.blue
                                              .withOpacity(0.1),
                                          border: Border.all(
                                              color: Colors.blue
                                                  .withOpacity(0.5)),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        padding:
                                            const EdgeInsets.symmetric(
                                          vertical: 10,
                                          horizontal: 14,
                                        ),
                                        child: Text(
                                          timeStr,
                                          style: const TextStyle(
                                            color: Colors.blue,
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

  void _selectShowtime(dynamic showtime) {
    // TODO: Điều hướng đến màn hình chọn ghế
    final startStr = showtime.startTime is DateTime
        ? DateFormat('yyyy-MM-dd HH:mm').format(showtime.startTime)
        : showtime.startTime.toString();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Chọn suất chiếu lúc $startStr'),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
