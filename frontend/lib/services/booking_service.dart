import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/theater_model.dart';
import '../models/cinema_room_model.dart';
import '../utils/http_helper.dart';
import '../providers/auth_provider.dart';
import 'package:cinema_app/config/api_config.dart';

class BookingService {

  late AuthProvider authProvider;

  BookingService({AuthProvider? authProvider}) {
    this.authProvider = authProvider ?? AuthProvider();
  }

  /// Lấy danh sách tất cả rạp (đang hoạt động)
  Future<List<TheaterModel>> getTheaters() async {
    try {
      // Thêm query param active=true để chỉ lấy rạp đang hoạt động
      final url=Uri.parse("${ApiConfig.baseURL}${ApiConfig.theaters}?active=true");
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final theaters = (data['theaters'] as List)
            .map((theater) => TheaterModel.fromJson(theater))
            .toList();
        return theaters;
      } else {
        throw Exception('Failed to load theaters: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading theaters: $e');
    }
  }

  /// Lấy showtimes và rooms của một rạp cho một bộ phim
  Future<TheaterModel> getShowtimes(int theaterId, int movieId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.theaters}/$theaterId/showtimes/$movieId');

      print('[BookingService] GET $url');

      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      print('[BookingService] status=${response.statusCode}');

      if (response.statusCode == 200) {
        final body = response.body;
        print('[BookingService] body=${body}');

        try {
          final data = jsonDecode(body) as Map<String, dynamic>;

          final rawRooms = (data['rooms'] as List?) ?? [];
          print('[BookingService] rawRooms extracted: ${rawRooms.length} items');

          final rooms = rawRooms
              .map((room) {
                print('[BookingService] parsing room: $room');
                return CinemaRoomModel.fromJson(room);
              })
              .toList();

          print('[BookingService] parsed rooms=${rooms.length}');
          for (var r in rooms) {
            final count = (r.showtimes ?? []).length;
            print('[BookingService] room=${r.name} id=${r.id} showtimes=$count');
          }

          final result = TheaterModel(
            id: theaterId,
            name: '',
            city: '',
            address: '',
            phone: '',
            email: '',
            isActive: true,
            cinemaRooms: rooms,
          );
          print('[BookingService] returning TheaterModel with ${result.cinemaRooms?.length ?? 0} rooms');
          return result;
        } catch (parseError) {
          print('[BookingService] ERROR parsing response: $parseError');
          rethrow;
        }
      } else {
        throw Exception('Failed to load showtimes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading showtimes: $e');
    }
  }

  /// Lấy danh sách ghế cho một suất chiếu
  Future<List<SeatModel>> getSeats(int showtimeId) async {
    try {
      final url = Uri.parse('${ApiConfig.baseURL}${ApiConfig.showtimes}/$showtimeId/seats');
      final response = await httpHelper(
            () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final seats = (data['seats'] as List)
            .map((seat) => SeatModel.fromJson(seat))
            .toList();
        return seats;
      } else {
        throw Exception('Failed to load seats: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading seats: $e');
    }
  }

  Future<List<TheaterModel>> getAllShowtimesByMovie(int movieId, {int days = 7}) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}/theaters/movies/$movieId/showtimes?days=$days'
      );

      print('[BookingService] GET $url');

      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final body = response.body;
        print('[BookingService] response body=${body.substring(0, 200)}...');
        
        final data = jsonDecode(body) as Map<String, dynamic>;
        final theaters = (data['theaters'] as List)
            .map((json) {
              print('[BookingService] parsing theater: id=${json['id']} name=${json['name']} cinemaRooms=${(json['CinemaRooms'] as List?)?.length ?? 0}');
              return TheaterModel.fromJson(json);
            })
            .toList();

        print('[BookingService] Loaded ${theaters.length} theaters');
        for (var t in theaters) {
          print('[BookingService] Theater: ${t.name} id=${t.id} rooms=${t.cinemaRooms?.length ?? 0}');
        }
        return theaters;
      } else {
        throw Exception('Failed to load showtimes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading showtimes: $e');
    }
  }

  /// Lấy danh sách phim đang chiếu tại một rạp
  Future<List<Map<String, dynamic>>> getMoviesByTheater(int theaterId, {int days = 7}) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}/theaters/$theaterId/movies?days=$days'
      );

      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final movies = (data['movies'] as List).cast<Map<String, dynamic>>();
        return movies;
      } else {
        throw Exception('Failed to load movies: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading movies by theater: $e');
    }
  }

  /// Lấy showtimes của một phim tại một rạp cụ thể
  Future<List<CinemaRoomModel>> getShowtimesForMovieAtTheater(int theaterId, int movieId, {int days = 7}) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseURL}/theaters/$theaterId/movies/$movieId/showtimes?days=$days'
      );

      final response = await httpHelper(
        () => http.get(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}'
          },
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final rooms = (data['rooms'] as List)
            .map((room) => CinemaRoomModel.fromJson(room))
            .toList();
        return rooms;
      } else {
        throw Exception('Failed to load showtimes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error loading showtimes: $e');
    }
  }
}
