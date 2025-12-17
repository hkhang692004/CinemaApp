class CinemaRoomModel {
  final int id;
  final int theaterId;
  final String name;
  final int seatCount;
  final String screenType;
  final bool isActive;
  final List<ShowtimeModel>? showtimes;

  CinemaRoomModel({
    required this.id,
    required this.theaterId,
    required this.name,
    required this.seatCount,
    required this.screenType,
    required this.isActive,
    this.showtimes,
  });

  factory CinemaRoomModel.fromJson(Map<String, dynamic> json) {
    // Accept either 'Showtimes' (Sequelize include alias) or 'showtimes'
    final rawShowtimes = json['Showtimes'] ?? json['showtimes'];

    return CinemaRoomModel(
      id: json['id'] ?? 0,
      theaterId: json['theater_id'] ?? 0,
      name: json['name'] ?? '',
      seatCount: json['seat_count'] ?? 0,
      screenType: json['screen_type'] ?? 'Standard',
      isActive: json['is_active'] ?? true,
      showtimes: (rawShowtimes as List?)
          ?.map((showtime) => ShowtimeModel.fromJson(showtime))
          .toList(),
    );
  }
}

class ShowtimeModel {
  final int id;
  final int movieId;
  final int roomId;
  final DateTime startTime;
  final DateTime endTime;
  final double basePrice;
  final String status;

  ShowtimeModel({
    required this.id,
    required this.movieId,
    required this.roomId,
    required this.startTime,
    required this.endTime,
    required this.basePrice,
    required this.status,
  });

  factory ShowtimeModel.fromJson(Map<String, dynamic> json) {
    // Parse times as UTC-aware then convert to local to make date comparisons consistent
    DateTime parseToLocal(String? s) {
      if (s == null) return DateTime.fromMillisecondsSinceEpoch(0);
      try {
        final dt = DateTime.parse(s);
        return dt.toLocal();
      } catch (e) {
        return DateTime.fromMillisecondsSinceEpoch(0);
      }
    }

    // Parse base_price: handle both String and num types
    double parseBasePrice(dynamic price) {
      if (price == null) return 0.0;
      if (price is double) return price;
      if (price is int) return price.toDouble();
      if (price is String) {
        try {
          return double.parse(price);
        } catch (e) {
          return 0.0;
        }
      }
      return 0.0;
    }

    return ShowtimeModel(
      id: json['id'] ?? 0,
      movieId: json['movie_id'] ?? 0,
      roomId: json['room_id'] ?? 0,
      startTime: parseToLocal(json['start_time']?.toString()),
      endTime: parseToLocal(json['end_time']?.toString()),
      basePrice: parseBasePrice(json['base_price']),
      status: json['status'] ?? 'Scheduled',
    );
  }
}

class SeatModel {
  final int id;
  final int roomId;
  final String rowLabel;
  final String seatNumber;
  final String seatType;
  final bool isActive;
  final bool reserved;
  final String status; // 'Available' or 'Booked'
  final double price; // Giá từ server (đã tính theo seat_type)

  SeatModel({
    required this.id,
    required this.roomId,
    required this.rowLabel,
    required this.seatNumber,
    required this.seatType,
    required this.isActive,
    required this.reserved,
    this.status = 'Available',
    this.price = 0,
  });

  factory SeatModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      if (val is String) return double.tryParse(val) ?? 0.0;
      return 0.0;
    }
    
    return SeatModel(
      id: json['id'],
      roomId: json['room_id'],
      rowLabel: json['row_label'],
      seatNumber: json['seat_number'],
      seatType: json['seat_type'] ?? 'Standard',
      isActive: json['is_active'] ?? true,
      reserved: json['reserved'] ?? false,
      status: json['status'] ?? 'Available',
      price: parsePrice(json['price']),
    );
  }
}
