import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/combo.dart';
import '../providers/auth_provider.dart';
import '../providers/seat_selection_provider.dart';
import '../services/combo_service.dart';
import '../utils/snackbar_helper.dart';
import 'payment_screen.dart';

class ComboSelectionScreen extends StatefulWidget {
  const ComboSelectionScreen({Key? key}) : super(key: key);

  @override
  State<ComboSelectionScreen> createState() => _ComboSelectionScreenState();
}

class _ComboSelectionScreenState extends State<ComboSelectionScreen> {
  List<Combo> _combos = [];
  bool _isLoading = true;
  String? _errorMessage;
  
  // Map để lưu số lượng đã chọn cho mỗi combo
  Map<int, int> _selectedCombos = {};
  
  @override
  void initState() {
    super.initState();
    
    // Set callback khi hết giờ
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SeatSelectionProvider>(context, listen: false)
          .setOnExpiredCallback(() {
        _handleReservationExpired();
      });
      _loadCombos();
    });
  }

  Future<void> _loadCombos() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final comboService = ComboService(authProvider);
      final combos = await comboService.getAllCombos();
      
      setState(() {
        _combos = combos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Không thể tải danh sách combo';
        _isLoading = false;
      });
    }
  }

  void _handleReservationExpired() async {
    if (!mounted) return;
    
    // Xóa reservation
    await Provider.of<SeatSelectionProvider>(context, listen: false)
        .clearSelection();
    
    // Hiển thị thông báo
    if (mounted) {
      SnackBarHelper.showError(context, 'Thời gian giữ ghế đã hết');
      
      // Back về booking screen (home)
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  void _updateComboQuantity(int comboId, int delta) {
    setState(() {
      final current = _selectedCombos[comboId] ?? 0;
      final newValue = current + delta;
      if (newValue <= 0) {
        _selectedCombos.remove(comboId);
      } else {
        _selectedCombos[comboId] = newValue;
      }
    });
  }

  double get _comboTotal {
    double total = 0;
    _selectedCombos.forEach((comboId, quantity) {
      final combo = _combos.firstWhere((c) => c.id == comboId);
      total += combo.price * quantity;
    });
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvoked: (didPop) {
        // Khi back về seat selection, không clear reservation
        // Reservation vẫn được giữ
      },
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Chọn Combo',
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
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? _buildErrorView()
                : _buildComboList(),
        bottomNavigationBar: _buildBottomBar(),
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
            _errorMessage!,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadCombos,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildComboList() {
    if (_combos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.fastfood_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Không có combo nào',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _combos.length,
      itemBuilder: (context, index) {
        return _buildComboItem(_combos[index]);
      },
    );
  }

  Widget _buildComboItem(Combo combo) {
    final quantity = _selectedCombos[combo.id] ?? 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Combo Image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: combo.imageUrl != null && combo.imageUrl!.isNotEmpty
                  ? Image.network(
                      combo.imageUrl!,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildPlaceholderImage();
                      },
                    )
                  : _buildPlaceholderImage(),
            ),
            const SizedBox(width: 12),
            // Combo Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category badge
                  if (combo.category != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(combo.category!),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        combo.category!.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  const SizedBox(height: 6),
                  // Name
                  Text(
                    combo.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Description / Items
                  Text(
                    combo.itemsDescription,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Price and quantity controls
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${NumberFormat('#,###').format(combo.price)}đ',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF044fa2),
                        ),
                      ),
                      // Quantity controls
                      Row(
                        children: [
                          _buildQuantityButton(
                            icon: Icons.remove,
                            onPressed: quantity > 0
                                ? () => _updateComboQuantity(combo.id, -1)
                                : null,
                          ),
                          Container(
                            width: 36,
                            alignment: Alignment.center,
                            child: Text(
                              '$quantity',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          _buildQuantityButton(
                            icon: Icons.add,
                            onPressed: () => _updateComboQuantity(combo.id, 1),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.fastfood,
        size: 40,
        color: Colors.grey[400],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    VoidCallback? onPressed,
  }) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: onPressed != null ? const Color(0xFF044fa2) : Colors.grey[300],
        borderRadius: BorderRadius.circular(6),
      ),
      child: IconButton(
        padding: EdgeInsets.zero,
        icon: Icon(icon, size: 18, color: Colors.white),
        onPressed: onPressed,
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'combo':
        return Colors.orange;
      case 'bắp':
      case 'popcorn':
        return Colors.amber;
      case 'nước':
      case 'drink':
        return Colors.blue;
      case 'snack':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Widget _buildBottomBar() {
    final seatProvider = Provider.of<SeatSelectionProvider>(context);
    final seatTotal = seatProvider.totalPrice;
    final grandTotal = seatTotal + _comboTotal;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Price breakdown
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Ghế (${seatProvider.selectedSeats.length})',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                Text(
                  '${NumberFormat('#,###').format(seatTotal)}đ',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
            if (_comboTotal > 0) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Combo (${_selectedCombos.values.fold(0, (a, b) => a + b)})',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  Text(
                    '${NumberFormat('#,###').format(_comboTotal)}đ',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ],
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tổng cộng',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${NumberFormat('#,###').format(grandTotal)}đ',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF044fa2),
                      ),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: () {
                    // Prepare selected combos data
                    final selectedCombosList = <Map<String, dynamic>>[];
                    _selectedCombos.forEach((comboId, quantity) {
                      final combo = _combos.firstWhere((c) => c.id == comboId);
                      selectedCombosList.add({
                        'comboId': combo.id,
                        'name': combo.name,
                        'price': combo.price,
                        'quantity': quantity,
                      });
                    });

                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PaymentScreen(
                          seatTotal: seatTotal,
                          comboTotal: _comboTotal,
                          selectedCombos: selectedCombosList,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF044fa2),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Thanh toán',
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
}
