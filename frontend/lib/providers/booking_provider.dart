// booking_provider.dart
import 'package:flutter/material.dart';
import '../models/theater_model.dart';
import '../models/cinema_room_model.dart';
import '../services/booking_service.dart';
import './auth_provider.dart';

class BookingProvider extends ChangeNotifier {
  late BookingService _bookingService;
  AuthProvider? _authProvider;

  // ✅ State - Lưu TẤT CẢ data từ API
  List<TheaterModel> allTheaters = []; // Tất cả rạp + phòng + suất chiếu
  
  // ✅ Filters (bộ lọc)
  String? selectedCity;
  int? selectedTheaterId;
  DateTime? selectedDate;
  int? currentMovieId;
  
  bool isLoading = false;
  String? errorMessage;

  BookingProvider(AuthProvider? authProvider) {
    _authProvider = authProvider;
    _bookingService = BookingService(authProvider: authProvider);
  }

  void updateAuthProvider(AuthProvider authProvider) {
    _authProvider = authProvider;
    _bookingService = BookingService(authProvider: authProvider);
    notifyListeners();
  }

  // ✅ Getters - Lọc từ allTheaters
  List<String> get cities {
    final citySet = <String>{};
    for (var theater in allTheaters) {
      citySet.add(theater.city);
    }
    return citySet.toList()..sort();
  }

  // ✅ Lọc theo city (nếu có)
  List<TheaterModel> get filteredTheaters {
    if (selectedCity == null) {
      return allTheaters; // Không filter = hiển thị tất cả
    }
    return allTheaters
        .where((theater) => theater.city == selectedCity)
        .toList();
  }

  // ✅ Lọc thêm theo theater (nếu có)
  List<TheaterModel> get theatersToDisplay {
    var theaters = filteredTheaters;
    
    if (selectedTheaterId != null) {
      theaters = theaters
          .where((t) => t.id == selectedTheaterId)
          .toList();
    }
    
    return theaters;
  }

  // ✅ Lọc suất chiếu theo ngày (trong mỗi theater)
  List<TheaterModel> get theatersWithFilteredShowtimes {
    return theatersToDisplay.map((theater) {
      final filteredRooms = (theater.cinemaRooms ?? []).map((room) {
        if (selectedDate == null) {
          return room; // Không filter date = hiển thị tất cả
        }

        // Filter showtimes theo ngày
        final filteredShowtimes = (room.showtimes ?? []).where((showtime) {
          final showtimeDate = showtime.startTime is DateTime
              ? showtime.startTime
              : DateTime.parse(showtime.startTime.toString()).toLocal();
          
          return showtimeDate.year == selectedDate!.year &&
              showtimeDate.month == selectedDate!.month &&
              showtimeDate.day == selectedDate!.day;
        }).toList();

        return CinemaRoomModel(
          id: room.id,
          theaterId: room.theaterId,
          name: room.name,
          seatCount: room.seatCount,
          screenType: room.screenType,
          isActive: room.isActive,
          showtimes: filteredShowtimes,
        );
      }).where((room) => (room.showtimes ?? []).isNotEmpty) // Chỉ giữ room có suất chiếu
        .toList();

      return TheaterModel(
        id: theater.id,
        name: theater.name,
        city: theater.city,
        address: theater.address,
        phone: theater.phone,
        email: theater.email,
        isActive: theater.isActive,
        cinemaRooms: filteredRooms,
      );
    }).where((theater) => (theater.cinemaRooms ?? []).isNotEmpty) // Chỉ giữ theater có phòng
      .toList();
  }

  // ✅ Load TẤT CẢ showtimes 1 lần duy nhất
  Future<void> loadAllShowtimes(int movieId) async {
    try {
      isLoading = true;
      errorMessage = null;
      currentMovieId = movieId;
      notifyListeners();

      // Gọi API mới - lấy tất cả rạp + phòng + suất chiếu
      allTheaters = await _bookingService.getAllShowtimesByMovie(movieId);
      
      print('[BookingProvider] Loaded ${allTheaters.length} theaters');
      
      // Debug log: kiểm tra dữ liệu nhận được
      for (var t in allTheaters) {
        print('[BookingProvider] Theater: ${t.name} (id=${t.id}) rooms=${t.cinemaRooms?.length ?? 0}');
        for (var r in (t.cinemaRooms ?? [])) {
          print('[BookingProvider]   Room: ${r.name} (id=${r.id}) showtimes=${r.showtimes?.length ?? 0}');
        }
      }
      
      // Default: chọn hôm nay
      selectedDate = DateTime.now();
      
      // Default: chọn city đầu tiên (optional)
      // if (cities.isNotEmpty) {
      //   selectedCity = cities.first;
      // }

      isLoading = false;
    } catch (e) {
      errorMessage = e.toString();
      isLoading = false;
    }
    notifyListeners();
  }

  // ✅ Filters - CHỈ cập nhật filter, KHÔNG gọi API
  void selectCity(String? city) {
    selectedCity = city;
    selectedTheaterId = null; // Reset theater khi đổi city
    notifyListeners();
  }

  void selectTheater(int? theaterId) {
    selectedTheaterId = theaterId;
    notifyListeners();
  }

  void selectDate(DateTime date) {
    selectedDate = date;
    notifyListeners();
  }

  void clearFilters() {
    selectedCity = null;
    selectedTheaterId = null;
    selectedDate = DateTime.now();
    notifyListeners();
  }
}