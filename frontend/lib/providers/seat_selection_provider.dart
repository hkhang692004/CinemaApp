import 'package:flutter/foundation.dart';
import 'dart:async';
import '../models/cinema_room_model.dart';
import '../services/showtime_service.dart';
import '../services/reservation_service.dart';
import '../services/socket_service.dart';
import 'auth_provider.dart';

class SeatSelectionProvider with ChangeNotifier {
  AuthProvider _authProvider;
  late ShowtimeService _showtimeService;
  late ReservationService _reservationService;
  Timer? _countdownTimer;
  Function? _onExpired; // Callback khi hết giờ

  SeatSelectionProvider(this._authProvider) {
    _showtimeService = ShowtimeService(_authProvider);
    _reservationService = ReservationService(_authProvider);
    _setupSocketListeners();
  }

  // Update auth provider without recreating instance
  void updateAuthProvider(AuthProvider newAuthProvider) {
    print('🟢 SeatSelectionProvider.updateAuthProvider called - keeping existing instance');
    print('🟢 Current state: selectedSeats=${_selectedSeatIds.length}, remainingTime=$_remainingTime');
    _authProvider = newAuthProvider;
    _showtimeService = ShowtimeService(_authProvider);
    _reservationService = ReservationService(_authProvider);
    // Don't call notifyListeners() to avoid rebuild
  }

  AuthProvider get authProvider => _authProvider;

  List<SeatModel> _allSeats = [];
  final Set<int> _selectedSeatIds = {};
  final Set<int> _reservedSeatIds = {}; // Ghế đã reserve bởi user hiện tại
  bool _isLoading = false;
  String? _errorMessage;
  double _basePrice = 100000;
  int? _currentShowtimeId;
  DateTime? _reservationExpiresAt;
  Duration? _remainingTime;
  
  // Movie, showtime, theater info
  Map<String, dynamic>? _movie;
  Map<String, dynamic>? _showtime;
  Map<String, dynamic>? _theater;

  // Getters
  List<SeatModel> get allSeats => _allSeats;

  Set<int> get selectedSeatIds => _selectedSeatIds;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  DateTime? get reservationExpiresAt => _reservationExpiresAt;

  Duration? get remainingTime => _remainingTime;

  bool get hasReservation => _reservedSeatIds.isNotEmpty;

  int? get showtimeId => _currentShowtimeId;
  
  double get ticketPrice => _basePrice;
  
  Map<String, dynamic>? get movie => _movie;
  
  Map<String, dynamic>? get showtime => _showtime;
  
  Map<String, dynamic>? get theater => _theater;

  List<SeatModel> get selectedSeats {
    return _allSeats
        .where((seat) => _selectedSeatIds.contains(seat.id))
        .toList();
  }

  Map<String, List<SeatModel>> get seatsByRow {
    final Map<String, List<SeatModel>> grouped = {};
    for (final seat in _allSeats) {
      if (!grouped.containsKey(seat.rowLabel)) {
        grouped[seat.rowLabel] = [];
      }
      grouped[seat.rowLabel]!.add(seat);
    }

    // Sort by row label then seat number (parse number from string)
    final sortedKeys = grouped.keys.toList()..sort();
    final result = <String, List<SeatModel>>{};
    for (final key in sortedKeys) {
      result[key] = grouped[key]!
        ..sort((a, b) {
          // Extract number from seat_number (e.g., "1" from "a1")
          final numA = int.tryParse(a.seatNumber.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
          final numB = int.tryParse(b.seatNumber.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
          return numA.compareTo(numB);
        });
    }
    return result;
  }

  // Tìm số cột lớn nhất để tất cả hàng align đúng
  int get maxSeatNumberInAllRows {
    int maxNum = 0;
    for (final seat in _allSeats) {
      final num = int.tryParse(seat.seatNumber.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      if (num > maxNum) maxNum = num;
    }
    return maxNum;
  }

  double get totalPrice {
    double total = 0;
    for (final seat in selectedSeats) {
      // Sử dụng giá từ server (đã tính theo seat_type)
      // Nếu server chưa trả về price, fallback về tính cũ
      if (seat.price > 0) {
        total += seat.price;
      } else {
        double seatPrice = _basePrice;
        if (seat.seatType == 'VIP') {
          seatPrice = _basePrice * 1.5;
        } else if (seat.seatType == 'Couple') {
          seatPrice = _basePrice * 2;
        }
        total += seatPrice;
      }
    }
    return total;
  }

  bool isSelected(int seatId) {
    return _selectedSeatIds.contains(seatId);
  }

  // Set booking info (movie, showtime, theater)
  void setBookingInfo({
    Map<String, dynamic>? movie,
    Map<String, dynamic>? showtime,
    Map<String, dynamic>? theater,
  }) {
    _movie = movie;
    _showtime = showtime;
    _theater = theater;
    notifyListeners();
  }

  // Load seats from API
  Future<void> loadSeats(int showtimeId) async {
    _isLoading = true;
    _errorMessage = null;
    _currentShowtimeId = showtimeId;
    notifyListeners();

    try {
      final response = await _showtimeService.getSeatsByShowtime(showtimeId);
      _allSeats = response['seats'] ?? [];
      _basePrice = response['basePrice'] ?? 100000;
      _selectedSeatIds.clear();
      _reservedSeatIds.clear();
      _reservationExpiresAt = null;
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'Không thể tải danh sách ghế: $e';
      _allSeats = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Toggle seat selection (UI only, no API call)
  void toggleSeat(SeatModel seat) {
    if (seat.status == 'Booked') return;

    final wasSelected = _selectedSeatIds.contains(seat.id);

    if (wasSelected) {
      // Bỏ chọn
      _selectedSeatIds.remove(seat.id);
      notifyListeners();
    } else {
      // Kiểm tra giới hạn 8 ghế
      if (_selectedSeatIds.length >= 8) {
        // Không cho chọn nữa, hiển toast bên ngoài
        return;
      }
      
      // Chọn ghế
      _selectedSeatIds.add(seat.id);
      notifyListeners();
    }
  }

  // Confirm selection and create reservation (when click "Tiếp tục")
  Future<bool> confirmSelection() async {
    if (_selectedSeatIds.isEmpty || _currentShowtimeId == null) {
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Nếu đã có reservation trước đó (back từ combo), release trước
      if (_reservedSeatIds.isNotEmpty) {
        print('🔄 Releasing old reservation before creating new one');
        try {
          await _reservationService.releaseReservation(
            _currentShowtimeId!,
            _reservedSeatIds.toList(),
          );
          print('✅ Released old reservation');
        } catch (e) {
          print('⚠️ Failed to release old reservation: $e');
        }
        _reservedSeatIds.clear();
        _countdownTimer?.cancel();
      }

      final result = await _reservationService.createReservation(
        _currentShowtimeId!,
        _selectedSeatIds.toList(),
      );
      _reservedSeatIds.addAll(_selectedSeatIds);
      _reservationExpiresAt = result['expiresAt'];
      print('✅ Reserved ${_selectedSeatIds.length} seats, expires: $_reservationExpiresAt');
      
      // Start countdown timer
      _startCountdown();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Không thể giữ ghế: $e';
      _isLoading = false;
      notifyListeners();
      print('❌ Failed to create reservation: $e');
      return false;
    }
  }

  // Set callback khi hết giờ
  void setOnExpiredCallback(Function callback) {
    _onExpired = callback;
  }

  // Start countdown timer
  void _startCountdown() {
    _countdownTimer?.cancel();
    
    if (_reservationExpiresAt == null) return;
    
    // Set initial remaining time ngay lập tức (không đợi 1s đầu tiên)
    final now = DateTime.now();
    _remainingTime = _reservationExpiresAt!.difference(now);
    notifyListeners();
    
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final now = DateTime.now();
      final difference = _reservationExpiresAt!.difference(now);
      
      if (difference.isNegative || difference.inSeconds <= 0) {
        // Hết giờ
        timer.cancel();
        _remainingTime = Duration.zero;
        notifyListeners();
        
        // Gọi callback để clear và navigate
        if (_onExpired != null) {
          _onExpired!();
        }
      } else {
        _remainingTime = difference;
        notifyListeners();
      }
    });
  }

  // Clear selection (release reservation if exists)
  Future<void> clearSelection() async {
    print('🔵 clearSelection called');
    print('🔵 _reservedSeatIds: $_reservedSeatIds');
    print('🔵 _selectedSeatIds: $_selectedSeatIds');
    print('🔵 _currentShowtimeId: $_currentShowtimeId');
    
    // Cancel timer
    _countdownTimer?.cancel();
    _countdownTimer = null;
    _remainingTime = null;
    
    // Nếu đã tạo reservation (sau khi nhấn Tiếp tục), thì release
    if (_reservedSeatIds.isNotEmpty && _currentShowtimeId != null) {
      try {
        print('🔴 Calling API to release ${_reservedSeatIds.length} seats');
        await _reservationService.releaseReservation(
          _currentShowtimeId!,
          _reservedSeatIds.toList(),
        );
        print('✅ Released ${_reservedSeatIds.length} reserved seats');
      } catch (e) {
        print('⚠️ Failed to release reservations: $e');
      }
    } else {
      print('⚠️ No reservation to release (reservedSeatIds is empty or no showtimeId)');
    }

    _selectedSeatIds.clear();
    _reservedSeatIds.clear();
    _reservationExpiresAt = null;
    notifyListeners();
  }

  // Clear selection without API call (for successful payment)
  void clearSelectionWithoutApi() {
    _countdownTimer?.cancel();
    _countdownTimer = null;
    _remainingTime = null;
    _selectedSeatIds.clear();
    _reservedSeatIds.clear();
    _reservationExpiresAt = null;
    notifyListeners();
  }

  // Reset state
  Future<void> reset() async {
    await clearSelection();
    _allSeats = [];
    _isLoading = false;
    _errorMessage = null;
    _basePrice = 100000;
    _currentShowtimeId = null;
    _movie = null;
    _showtime = null;
    _theater = null;
    notifyListeners();
  }

  // Setup socket listeners for realtime seat updates
  void _setupSocketListeners() {
    final socketService = SocketService.instance;
    
    socketService.addSeatHeldListener(_onSeatHeld);
    socketService.addSeatReleasedListener(_onSeatReleased);
  }

  // Handle seat held event from other users
  void _onSeatHeld(int showtimeId, List<int> seatIds, int heldByUserId) {
    // Chỉ xử lý nếu đang xem cùng showtime
    if (showtimeId != _currentShowtimeId) return;
    
    // Bỏ qua event của chính mình
    final currentUserId = _authProvider.user?.id;
    debugPrint('🪑 _onSeatHeld: currentUserId=$currentUserId, heldByUserId=$heldByUserId');
    
    if (currentUserId != null && heldByUserId == currentUserId) {
      debugPrint('🪑 Ignoring own seat held event: $seatIds');
      return;
    }
    
    // Nếu ghế đang được chọn bởi user hiện tại, bỏ qua 
    // (đây là event của chính mình nhưng currentUserId chưa load)
    final isOwnSeats = seatIds.every((id) => _selectedSeatIds.contains(id));
    if (isOwnSeats && seatIds.isNotEmpty) {
      debugPrint('🪑 Ignoring seat held event for own selected seats: $seatIds');
      return;
    }
    
    debugPrint('🪑 Seats held by other user: $seatIds for showtime $showtimeId (by userId: $heldByUserId)');
    
    // Update seat status to unavailable
    for (final seat in _allSeats) {
      if (seatIds.contains(seat.id)) {
        seat.status = 'Booked';
      }
    }
    
    // Remove from selected if user had selected these seats (only partial overlap = other user)
    _selectedSeatIds.removeWhere((id) => seatIds.contains(id));
    
    notifyListeners();
  }

  // Handle seat released event from other users
  void _onSeatReleased(int showtimeId, List<int> seatIds, int releasedByUserId) {
    // Chỉ xử lý nếu đang xem cùng showtime
    if (showtimeId != _currentShowtimeId) return;
    
    // Bỏ qua event của chính mình
    final currentUserId = _authProvider.user?.id;
    if (currentUserId != null && releasedByUserId == currentUserId) {
      debugPrint('🪑 Ignoring own seat released event: $seatIds');
      return;
    }
    
    debugPrint('🪑 Seats released by other user: $seatIds for showtime $showtimeId (by userId: $releasedByUserId)');
    
    // Update seat status to available
    for (final seat in _allSeats) {
      if (seatIds.contains(seat.id)) {
        seat.status = 'Available';
      }
    }
    
    notifyListeners();
  }

  // Remove socket listeners
  void _removeSocketListeners() {
    final socketService = SocketService.instance;
    socketService.removeSeatHeldListener(_onSeatHeld);
    socketService.removeSeatReleasedListener(_onSeatReleased);
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _removeSocketListeners();
    super.dispose();
  }
}
