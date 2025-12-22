import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/auth_provider.dart';
import '../services/payment_service.dart';

class MyTicketsScreen extends StatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  State<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _upcomingTickets = [];
  List<Map<String, dynamic>> _pastTickets = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadTickets();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTickets() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      
      // Double check - nếu chưa login thì return
      if (authProvider.accessToken == null) {
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final paymentService = PaymentService(authProvider);
      
      final tickets = await paymentService.getMyTickets();
      
      final now = DateTime.now();
      final upcoming = <Map<String, dynamic>>[];
      final past = <Map<String, dynamic>>[];

      for (var ticket in tickets) {
        // Parse showtime date
        final showtimeStr = ticket['showtime']?['start_time'];
        if (showtimeStr != null) {
          final showtime = DateTime.tryParse(showtimeStr);
          if (showtime != null) {
            if (showtime.isAfter(now)) {
              upcoming.add(ticket);
            } else {
              past.add(ticket);
            }
          } else {
            past.add(ticket);
          }
        } else {
          past.add(ticket);
        }
      }

      // Sort by date
      upcoming.sort((a, b) {
        final aTime = DateTime.tryParse(a['showtime']?['start_time'] ?? '') ?? DateTime.now();
        final bTime = DateTime.tryParse(b['showtime']?['start_time'] ?? '') ?? DateTime.now();
        return aTime.compareTo(bTime);
      });

      past.sort((a, b) {
        final aTime = DateTime.tryParse(a['showtime']?['start_time'] ?? '') ?? DateTime.now();
        final bTime = DateTime.tryParse(b['showtime']?['start_time'] ?? '') ?? DateTime.now();
        return bTime.compareTo(aTime); // Newest first
      });

      setState(() {
        _upcomingTickets = upcoming;
        _pastTickets = past;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch AuthProvider để tự động rebuild khi auth state thay đổi
    final authProvider = context.watch<AuthProvider>();
    
    // Nếu chưa đăng nhập, hiển thị UI yêu cầu đăng nhập
    if (authProvider.accessToken == null) {
      return Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: const Text(
            'Vé của tôi',
            style: TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_outline, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                'Vui lòng đăng nhập',
                style: TextStyle(fontSize: 18, color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              Text(
                'Đăng nhập để xem vé của bạn',
                style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          'Vé của tôi',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFFE53935),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFFE53935),
          tabs: [
            Tab(text: 'Sắp chiếu (${_upcomingTickets.length})'),
            Tab(text: 'Đã xem (${_pastTickets.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFE53935)),
            )
          : _error != null
              ? _buildErrorView()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildTicketList(_upcomingTickets, isUpcoming: true),
                    _buildTicketList(_pastTickets, isUpcoming: false),
                  ],
                ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Không thể tải vé',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _loadTickets,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketList(List<Map<String, dynamic>> tickets, {required bool isUpcoming}) {
    if (tickets.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isUpcoming ? Icons.confirmation_number_outlined : Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming ? 'Chưa có vé sắp chiếu' : 'Chưa có lịch sử xem phim',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            if (isUpcoming) ...[
              const SizedBox(height: 8),
              Text(
                'Đặt vé ngay để xem phim hay!',
                style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadTickets,
      color: const Color(0xFFE53935),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: tickets.length,
        itemBuilder: (context, index) {
          return _buildTicketCard(tickets[index], isUpcoming: isUpcoming);
        },
      ),
    );
  }

  Widget _buildTicketCard(Map<String, dynamic> ticket, {required bool isUpcoming}) {
    final showtime = ticket['showtime'];
    final seats = ticket['seats'] as List<dynamic>? ?? [];
    final combos = ticket['combos'] as List<dynamic>? ?? [];
    final movie = showtime?['movie'];
    final room = showtime?['cinema_room'];
    final theater = room?['Theater'];

    final movieTitle = movie?['title'] ?? 'Không rõ phim';
    final posterUrl = movie?['poster_url'];
    final theaterName = theater?['name'] ?? 'Không rõ rạp';
    // Display name format: "IMAX (Phòng 5)"
    final screenType = room?['screen_type'] ?? 'Standard';
    final roomNameRaw = room?['name'] ?? '';
    final roomName = roomNameRaw.isNotEmpty ? '$screenType ($roomNameRaw)' : '';
    final status = ticket['status'] ?? 'Paid';
    final orderCode = ticket['order_code'] ?? '';
    final ticketCount = ticket['ticket_count'] ?? seats.length;

    // Gộp tên ghế
    final seatNames = seats.map((s) => '${s['row_label']}${s['seat_number']}').join(', ');

    // Parse showtime
    DateTime? showtimeDate;
    String dateStr = '';
    String timeStr = '';
    if (showtime?['start_time'] != null) {
      showtimeDate = DateTime.tryParse(showtime['start_time']);
      if (showtimeDate != null) {
        dateStr = DateFormat('dd/MM/yyyy').format(showtimeDate);
        timeStr = DateFormat('HH:mm').format(showtimeDate);
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with movie info
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Poster
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                ),
                child: posterUrl != null
                    ? Image.network(
                        posterUrl,
                        width: 100,
                        height: 140,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 100,
                          height: 140,
                          color: Colors.grey[300],
                          child: const Icon(Icons.movie, size: 40),
                        ),
                      )
                    : Container(
                        width: 100,
                        height: 140,
                        color: Colors.grey[300],
                        child: const Icon(Icons.movie, size: 40),
                      ),
              ),
              // Info
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _getStatusText(status),
                          style: TextStyle(
                            color: _getStatusColor(status),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Movie title
                      Text(
                        movieTitle,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      // Theater
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              theaterName,
                              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      // Date & Time
                      Row(
                        children: [
                          Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            '$timeStr - $dateStr',
                            style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Divider with dashed line effect
          Row(
            children: List.generate(
              30,
              (index) => Expanded(
                child: Container(
                  height: 1,
                  color: index % 2 == 0 ? Colors.grey[300] : Colors.transparent,
                ),
              ),
            ),
          ),
          // Footer with seat and order info
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Seat info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ghế ($ticketCount vé)',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                      Text(
                        '$roomName - $seatNames',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Order code
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Mã đơn hàng',
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                    Text(
                      orderCode,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFE53935),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Show QR button for upcoming tickets
          if (isUpcoming && status == 'Paid')
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: Show QR code
                  _showQRCode(ticket);
                },
                icon: const Icon(Icons.qr_code, size: 18),
                label: const Text('Hiện mã QR'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Paid':
        return Colors.green;
      case 'Booked':
        return Colors.orange;
      case 'CheckedIn':
        return Colors.blue;
      case 'Cancelled':
        return Colors.red;
      case 'Refunded':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'Paid':
        return 'Đã thanh toán';
      case 'Booked':
        return 'Chờ thanh toán';
      case 'CheckedIn':
        return 'Đã check-in';
      case 'Cancelled':
        return 'Đã hủy';
      case 'Refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  }

  void _showQRCode(Map<String, dynamic> ticket) {
    final qrCode = ticket['qr_code'];
    final orderCode = ticket['order_code'] ?? '';
    final seats = ticket['seats'] as List<dynamic>? ?? [];
    final seatNames = seats.map((s) => '${s['row_label']}${s['seat_number']}').join(', ');

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Mã QR Check-in',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Đưa mã này cho nhân viên để check-in',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            // QR Code
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: qrCode != null && qrCode.isNotEmpty
                  ? QrImageView(
                      data: qrCode,
                      version: QrVersions.auto,
                      size: 180,
                      backgroundColor: Colors.white,
                      errorCorrectionLevel: QrErrorCorrectLevel.M,
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_2, size: 80, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text(
                          orderCode,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 24),
            Text(
              'Mã đơn hàng: $orderCode',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
            if (seatNames.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Ghế: $seatNames',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
