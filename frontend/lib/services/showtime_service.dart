import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/cinema_room_model.dart';
import '../providers/auth_provider.dart';
import '../utils/http_helper.dart';

class ShowtimeService {
  final String baseUrl = 'https://cinemaapp-gkkn.onrender.com/api/showtimes';
  final AuthProvider authProvider;

  ShowtimeService(this.authProvider);

  Future<Map<String, dynamic>> getSeatsByShowtime(int showtimeId) async {
    try {
      final response = await httpHelper(
        () => http.get(
          Uri.parse('$baseUrl/$showtimeId/seats'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
        ),
        authProvider: authProvider,
      );
      
      print('📍 Seats API Response: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Parse seats
        final rawSeats = data['seats'] ?? [];
        final seats = (rawSeats as List)
            .map((seatJson) => SeatModel.fromJson(seatJson))
            .toList();

        // Get base price from showtime
        final basePrice = data['showtime']?['base_price'] != null
            ? double.parse(data['showtime']['base_price'].toString())
            : 100000.0;

        print('✅ Loaded ${seats.length} seats, base price: $basePrice');

        return {
          'seats': seats,
          'basePrice': basePrice,
          'showtime': data['showtime'],
        };
      } else {
        throw Exception('Failed to load seats: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error loading seats: $e');
      rethrow;
    }
  }
}
