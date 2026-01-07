import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/cinema_room_model.dart';
import '../providers/seat_selection_provider.dart';
import '../utils/snackbar_helper.dart';
import 'combo_selection_screen.dart';

class SeatSelectionScreen extends StatefulWidget {
  final ShowtimeModel showtime;
  final String movieTitle;
  final String theaterName;
  final String roomName;

  const SeatSelectionScreen({
    Key? key,
    required this.showtime,
    required this.movieTitle,
    required this.theaterName,
    required this.roomName,
  }) : super(key: key);

  @override
  State<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends State<SeatSelectionScreen> {
  bool _isNavigatingToCombo = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<SeatSelectionProvider>(context, listen: false);
      provider.loadSeats(widget.showtime.id);
      
      // Set booking info for payment screen
      provider.setBookingInfo(
        movie: {
          'title': widget.movieTitle,
          'age_rating': 'P', // Default, can be passed from booking screen
        },
        showtime: {
          'id': widget.showtime.id,
          'formatted_time': widget.showtime.startTime != null 
              ? DateFormat('HH:mm').format(widget.showtime.startTime!)
              : '',
          'formatted_date': widget.showtime.startTime != null 
              ? DateFormat('dd/MM/yyyy').format(widget.showtime.startTime!)
              : '',
        },
        theater: {
          'name': '${widget.theaterName} - ${widget.roomName}',
        },
      );
      
      // Set callback khi hết giờ
      provider.setOnExpiredCallback(() {
        _handleReservationExpired();
      });
    });
  }

  void _handleReservationExpired() async {
    if (!mounted) return;
    
    // Xóa reservation
    await Provider.of<SeatSelectionProvider>(context, listen: false)
        .clearSelection();
    
    // Hiển thông báo
    if (mounted) {
      SnackBarHelper.showError(context, 'Thời gian giữ ghế đã hết');
      
      // Back về booking screen (home)
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Không cho pop tự động
      onPopInvoked: (didPop) async {
        if (!didPop) {
          // Handle back button press
          await _handleBackPress();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => _handleBackPress(),
        ),
        title: const Text(
          'Chọn Ghế',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Consumer<SeatSelectionProvider>(
            builder: (context, provider, _) {
              if (provider.hasReservation && provider.remainingTime != null) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: _buildTimer(provider.remainingTime!),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<SeatSelectionProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: Colors.blue),
            );
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    provider.errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadSeats(widget.showtime.id),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              _buildMovieInfo(),
              const SizedBox(height: 16),
              _buildScreen(),
              const SizedBox(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildSeatMap(provider),
                ),
              ),
              _buildLegend(),
              _buildBottomBar(provider),
            ],
          );
        },
      ),
      ),
    );
  }

  // Timer widget
  Widget _buildTimer(Duration remaining) {
    final minutes = remaining.inMinutes;
    final seconds = remaining.inSeconds % 60;
    final isLowTime = remaining.inMinutes < 2;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isLowTime ? Colors.red : Colors.orange,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Giữ ghế',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
              Text(
                '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Movie & Showtime Info
  Widget _buildMovieInfo() {
    final timeStr = DateFormat('HH:mm, dd/MM/yyyy').format(widget.showtime.startTime);
    
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.movieTitle,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '${widget.theaterName} - ${widget.roomName}',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                timeStr,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Screen
  Widget _buildScreen() {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 40),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(50),
              bottomRight: Radius.circular(50),
            ),
          ),
          child: const Center(
            child: Text(
              'MÀN HÌNH',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.black54,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Seat Map
  Widget _buildSeatMap(SeatSelectionProvider provider) {
    final seatsByRow = provider.seatsByRow;
    if (seatsByRow.isEmpty) {
      return const Center(
        child: Text('Không có ghế'),
      );
    }

    return InteractiveViewer(
      minScale: 0.5,
      maxScale: 3.0,
      boundaryMargin: const EdgeInsets.all(20),
      child: Column(
        children: seatsByRow.entries.map((entry) {
          final rowLabel = entry.key;
          final seats = entry.value;

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                // Row Label
                SizedBox(
                  width: 30,
                  child: Text(
                    rowLabel,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Seats - fit to screen width
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: _buildSeatsWithGaps(seats, provider),
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // Build seats with gap detection
  List<Widget> _buildSeatsWithGaps(List<SeatModel> seats, SeatSelectionProvider provider) {
    if (seats.isEmpty) return [];
    
    List<Widget> widgets = [];
    
    // Lấy số cột lớn nhất để align tất cả các hàng
    final maxSeatNum = provider.maxSeatNumberInAllRows;
    
    // Tạo map seat number -> seat
    final seatMap = <int, SeatModel>{};
    for (final seat in seats) {
      final num = int.tryParse(seat.seatNumber.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      seatMap[num] = seat;
    }
    
    // Build từ 1 đến maxSeatNum để tất cả hàng có cùng số cột
    for (int i = 1; i <= maxSeatNum; i++) {
      if (seatMap.containsKey(i)) {
        widgets.add(_buildSeatItem(seatMap[i]!, provider));
      } else {
        // Ghế bị xóa hoặc không tồn tại - thêm ô trống
        widgets.add(_buildEmptySeat());
      }
    }
    
    return widgets;
  }

  // Empty seat placeholder (ô trống)
  Widget _buildEmptySeat() {
    return Container(
      width: 32,
      height: 32,
      margin: const EdgeInsets.only(right: 6),
      // Chỉ là khoảng trắng, không có viền hay icon
    );
  }

  Widget _buildSeatItem(SeatModel seat, SeatSelectionProvider provider) {
    final isSelected = provider.isSelected(seat.id);
    final isBooked = seat.status == 'Booked';
    
    Color backgroundColor;
    Color borderColor;
    Color textColor;

    if (isBooked) {
      backgroundColor = Colors.grey[300]!;
      borderColor = Colors.grey[400]!;
      textColor = Colors.grey[300]!; // Ẩn chữ (màu text = màu nền)
    } else if (isSelected) {
      backgroundColor = Colors.blue;
      borderColor = Colors.blue[700]!;
      textColor = Colors.white; // Hiện chữ khi chọn
    } else if (seat.seatType == 'VIP') {
      backgroundColor = Colors.orange[50]!;
      borderColor = Colors.orange;
      textColor = Colors.orange[50]!; // Ẩn chữ (màu text = màu nền)
    } else if (seat.seatType == 'Couple') {
      backgroundColor = Colors.pink[50]!;
      borderColor = Colors.pink;
      textColor = Colors.pink[50]!; // Ẩn chữ (màu text = màu nền)
    } else if (seat.seatType == 'Wheelchair') {
      backgroundColor = Colors.blue[50]!;
      borderColor = Colors.blue;
      textColor = Colors.blue[50]!; // Ẩn chữ (màu text = màu nền)
    } else {
      backgroundColor = Colors.white;
      borderColor = Colors.grey[400]!;
      textColor = Colors.white; // Ẩn chữ (màu text = màu nền)
    }

    return GestureDetector(
      onTap: isBooked
          ? null
          : () {
              // Kiểm tra giới hạn 8 ghế trước khi toggle
              if (!provider.isSelected(seat.id) &&
                  provider.selectedSeatIds.length >= 8) {
                SnackBarHelper.showWarning(context, 'Chỉ được chọn tối đa 8 ghế');
                return;
              }
              provider.toggleSeat(seat);
            },
      child: Container(
        width: 32,
        height: 32,
        margin: const EdgeInsets.only(right: 6),
        decoration: BoxDecoration(
          color: isBooked ? Colors.transparent : backgroundColor,
          border: isBooked ? null : Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(4),
        ),
        child: isBooked
            ? ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Image.asset(
                  'lib/assets/Absolute_Cinema.jpg',
                  fit: BoxFit.cover,
                  width: 32,
                  height: 32,
                ),
              )
            : Center(
                child: Text(
                  '${seat.rowLabel}${seat.seatNumber}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ),
      ),
    );
  }

  // Legend
  Widget _buildLegend() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      color: Colors.grey[50],
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 16,
        runSpacing: 8,
        direction: Axis.horizontal,
        children: [
          _buildLegendItem('Trống', bgColor: Colors.white, borderColor: Colors.grey[400]!),
          _buildLegendItem('Đang chọn', bgColor: Colors.blue, borderColor: Colors.blue[700]!),
          _buildLegendItem('Đã đặt', imagePath: 'lib/assets/Absolute_Cinema.jpg'),
          _buildLegendItem('VIP', bgColor: Colors.orange[50]!, borderColor: Colors.orange),
          _buildLegendItem('Couple', bgColor: Colors.pink[50]!, borderColor: Colors.pink),
          _buildLegendItem('Wheelchair', bgColor: Colors.blue[50]!, borderColor: Colors.blue),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    String label, {
    Color? bgColor,
    Color? borderColor,
    String? imagePath,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        imagePath != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: Image.asset(
                  imagePath,
                  width: 20,
                  height: 20,
                  fit: BoxFit.cover,
                ),
              )
            : Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: bgColor,
                  border: Border.all(color: borderColor!),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.black87),
        ),
      ],
    );
  }

  // Bottom Bar - Selected Seats & Total
  Widget _buildBottomBar(SeatSelectionProvider provider) {
    final selectedSeats = provider.selectedSeats;
    final total = provider.totalPrice;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selectedSeats.isNotEmpty) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ghế: ${selectedSeats.map((s) => '${s.rowLabel}${s.seatNumber}').join(', ')}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tổng tiền',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${NumberFormat('#,###').format(total)}đ',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF044fa2),
                      ),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: selectedSeats.isEmpty
                      ? null
                      : () => _confirmBooking(provider),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Tiếp tục',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmBooking(SeatSelectionProvider provider) async {
    // Gọi API tạo reservation
    final success = await provider.confirmSelection();
    
    if (success && mounted) {
      // Set flag để không clear khi navigate
      _isNavigatingToCombo = true;
      
      // Navigate to combo selection screen
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const ComboSelectionScreen(),
        ),
      );
      
      // Reset flag sau khi quay lại
      _isNavigatingToCombo = false;
    } else if (mounted && !success) {
      SnackBarHelper.showError(context, provider.errorMessage ?? 'Không thể giữ ghế');
    }
  }

  Future<void> _handleBackPress() async {
    // Chỉ clear khi back về booking (không phải khi quay lại từ combo)
    if (!_isNavigatingToCombo) {
      await Provider.of<SeatSelectionProvider>(context, listen: false)
          .clearSelection();
      print('🔴 Clearing reservation on back to booking');
    }
    
    if (mounted) {
      Navigator.pop(context);
    }
  }
}
