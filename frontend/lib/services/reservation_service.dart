import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../utils/http_helper.dart';

class ReservationService {
  final String baseUrl = 'https://cinemaapp-gkkn.onrender.com/api/reservations';
  final AuthProvider authProvider;

  ReservationService(this.authProvider);

  // Tạo reservation (giữ ghế)
  Future<Map<String, dynamic>> createReservation(
    int showtimeId,
    List<int> seatIds,
  ) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse(baseUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'showtimeId': showtimeId,
            'seatIds': seatIds,
          }),
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        
        // Dùng durationSeconds từ server để tính expiresAt chính xác
        DateTime expiresAt;
        if (data['durationSeconds'] != null) {
          // Tính expiresAt từ thời điểm hiện tại + duration
          expiresAt = DateTime.now().add(Duration(seconds: data['durationSeconds']));
        } else if (data['expiresAt'] != null) {
          // Fallback: parse expiresAt từ server
          expiresAt = DateTime.parse(data['expiresAt']).toLocal();
        } else {
          // Default: 10 phút từ bây giờ
          expiresAt = DateTime.now().add(const Duration(minutes: 10));
        }

        print('✅ Created reservation: ${data['reservations']?.length ?? 0} seats');
        print('✅ Duration from server: ${data['durationSeconds']} seconds');
        print('✅ Expires at (local): $expiresAt');

        return {
          'reservations': data['reservations'],
          'expiresAt': expiresAt,
        };
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to create reservation');
      }
    } catch (e) {
      print('❌ Error creating reservation: $e');
      rethrow;
    }
  }

  // Hủy reservation
  Future<void> releaseReservation(
    int showtimeId,
    List<int> seatIds,
  ) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/release'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'showtimeId': showtimeId,
            'seatIds': seatIds,
          }),
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        print('✅ Released reservation for ${seatIds.length} seats');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to release reservation');
      }
    } catch (e) {
      print('❌ Error releasing reservation: $e');
      rethrow;
    }
  }

  // Confirm reservation (sau thanh toán)
  Future<void> confirmReservation(
    int showtimeId,
    List<int> seatIds,
  ) async {
    try {
      final response = await httpHelper(
        () => http.post(
          Uri.parse('$baseUrl/confirm'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'showtimeId': showtimeId,
            'seatIds': seatIds,
          }),
        ),
        authProvider: authProvider,
      );

      if (response.statusCode == 200) {
        print('✅ Confirmed reservation for ${seatIds.length} seats');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to confirm reservation');
      }
    } catch (e) {
      print('❌ Error confirming reservation: $e');
      rethrow;
    }
  }
}
