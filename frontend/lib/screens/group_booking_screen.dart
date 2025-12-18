import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

import '../providers/auth_provider.dart';
import '../config/api_config.dart';
import '../utils/http_helper.dart';
import '../models/theater_model.dart';
import '../services/booking_service.dart';

class GroupBookingScreen extends StatefulWidget {
  const GroupBookingScreen({super.key});

  @override
  State<GroupBookingScreen> createState() => _GroupBookingScreenState();
}

class _GroupBookingScreenState extends State<GroupBookingScreen> {
  final _formKey = GlobalKey<FormState>();

  // Form controllers
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _companyController = TextEditingController();
  final _guestCountController = TextEditingController(text: '20');
  final _notesController = TextEditingController();

  // State
  List<TheaterModel> _theaters = [];
  List<String> _regions = [];
  String? _selectedRegion;
  TheaterModel? _selectedTheater;
  String _serviceType = 'group_booking';
  DateTime? _preferredDate; // Ngày mong muốn

  bool _isLoading = true;
  bool _isSubmitting = false;

  // Service types
  final List<Map<String, dynamic>> _serviceTypes = [
    {'value': 'group_booking', 'label': 'Group Booking', 'icon': Icons.groups, 'desc': 'Đặt vé cho nhóm lớn'},
    {'value': 'private_show', 'label': 'Private Show', 'icon': Icons.movie_filter, 'desc': 'Suất chiếu riêng'},
    {'value': 'hall_rental', 'label': 'Hall Rental', 'icon': Icons.meeting_room, 'desc': 'Thuê hội trường'},
    {'value': 'voucher', 'label': 'Mua Voucher', 'icon': Icons.card_giftcard, 'desc': 'Voucher số lượng lớn'},
  ];

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('vi_VN', null);
    _loadTheaters();
    _loadUserInfo();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _companyController.dispose();
    _guestCountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _loadUserInfo() {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.user != null) {
      _emailController.text = authProvider.user!.email;
      _fullNameController.text = authProvider.user!.fullName;
    }
  }

  Future<void> _loadTheaters() async {
    try {
      final authProvider = context.read<AuthProvider>();
      final bookingService = BookingService(authProvider: authProvider);
      final theaters = await bookingService.getTheaters();

      // Extract unique regions (cities)
      final regions = theaters.map((t) => t.city).toSet().toList();
      regions.sort();

      if (mounted) {
        setState(() {
          _theaters = theaters;
          _regions = regions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải danh sách rạp: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<TheaterModel> get _theatersInRegion {
    if (_selectedRegion == null) return [];
    return _theaters.where((t) => t.city == _selectedRegion).toList();
  }

  void _showRegionPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Chọn khu vực',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _regions.length,
                itemBuilder: (context, index) {
                  final region = _regions[index];
                  final isSelected = region == _selectedRegion;
                  final theaterCount = _theaters.where((t) => t.city == region).length;
                  
                  return ListTile(
                    leading: Icon(
                      Icons.location_city,
                      color: isSelected ? const Color(0xFFE53935) : Colors.grey,
                    ),
                    title: Text(
                      region,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? const Color(0xFFE53935) : Colors.black87,
                      ),
                    ),
                    subtitle: Text('$theaterCount rạp'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: Color(0xFFE53935))
                        : null,
                    onTap: () {
                      setState(() {
                        _selectedRegion = region;
                        _selectedTheater = null;
                      });
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showTheaterPicker() {
    if (_selectedRegion == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn khu vực trước'), backgroundColor: Colors.orange),
      );
      return;
    }

    final theatersInRegion = _theatersInRegion;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Rạp tại $_selectedRegion',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: theatersInRegion.length,
                itemBuilder: (context, index) {
                  final theater = theatersInRegion[index];
                  final isSelected = theater.id == _selectedTheater?.id;
                  
                  return ListTile(
                    leading: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFE53935).withOpacity(0.1) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.theaters,
                        color: isSelected ? const Color(0xFFE53935) : Colors.grey,
                      ),
                    ),
                    title: Text(
                      theater.name,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? const Color(0xFFE53935) : Colors.black87,
                      ),
                    ),
                    subtitle: Text(
                      theater.address,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: Color(0xFFE53935))
                        : const Icon(Icons.chevron_right, color: Colors.grey),
                    onTap: () {
                      setState(() => _selectedTheater = theater);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) return;

    // Validate minimum 20 guests
    final guestCount = int.tryParse(_guestCountController.text) ?? 0;
    if (guestCount < 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Dịch vụ này yêu cầu tối thiểu 20 khách'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final url = Uri.parse('${ApiConfig.baseURL}/group-bookings');
      final response = await httpHelper(
        () => http.post(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authProvider.accessToken}',
          },
          body: jsonEncode({
            'fullName': _fullNameController.text,
            'email': _emailController.text,
            'phone': _phoneController.text,
            'address': _addressController.text,
            'companyName': _companyController.text,
            'serviceType': _serviceType,
            'guestCount': int.tryParse(_guestCountController.text) ?? 0,
            'preferredDate': _preferredDate?.toIso8601String().split('T')[0],
            'region': _selectedRegion,
            'theaterId': _selectedTheater?.id,
            'notes': _notesController.text,
          }),
        ),
        authProvider: authProvider,
      );

      final data = jsonDecode(response.body);

      if (mounted) {
        setState(() => _isSubmitting = false);

        if (response.statusCode == 201) {
          _showSuccessDialog(data['message'] ?? 'Yêu cầu đã được gửi thành công!');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['message'] ?? 'Lỗi gửi yêu cầu'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showSuccessDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green[50],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.check_circle, color: Colors.green[600], size: 64),
            ),
            const SizedBox(height: 20),
            const Text(
              'Gửi yêu cầu thành công!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[700], fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.support_agent, color: Colors.blue[600], size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Chúng tôi sẽ liên hệ bạn',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue[800]),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'trong vòng 24h làm việc',
                          style: TextStyle(color: Colors.blue[700], fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE53935),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Đóng', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: const Color(0xFFE53935),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Đặt vé nhóm / Thuê rạp',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info card
                    _buildInfoCard(),

                    const SizedBox(height: 24),

                    // Contact Information Section
                    _buildSectionTitle('Thông tin liên hệ'),
                    const SizedBox(height: 12),

                    _buildTextField(
                      controller: _fullNameController,
                      label: 'Họ và tên *',
                      hint: 'Nhập họ và tên',
                      icon: Icons.person_outline,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Vui lòng nhập họ tên';
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    _buildTextField(
                      controller: _emailController,
                      label: 'Email *',
                      hint: 'email@example.com',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Vui lòng nhập email';
                        if (!value.contains('@')) return 'Email không hợp lệ';
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    _buildTextField(
                      controller: _phoneController,
                      label: 'Số điện thoại *',
                      hint: '0901234567',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Vui lòng nhập số điện thoại';
                        if (value.length < 10) return 'Số điện thoại không hợp lệ';
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    _buildTextField(
                      controller: _addressController,
                      label: 'Địa chỉ',
                      hint: 'Nhập địa chỉ của bạn',
                      icon: Icons.location_on_outlined,
                    ),

                    const SizedBox(height: 16),

                    _buildTextField(
                      controller: _companyController,
                      label: 'Tên công ty (nếu có)',
                      hint: 'Nhập tên công ty',
                      icon: Icons.business_outlined,
                    ),

                    const SizedBox(height: 24),

                    // Service Type Section
                    _buildSectionTitle('Loại dịch vụ'),
                    const SizedBox(height: 12),
                    _buildServiceTypeSelector(),

                    const SizedBox(height: 24),

                    // Guest Count
                    _buildTextField(
                      controller: _guestCountController,
                      label: 'Số lượng khách dự kiến *',
                      hint: 'VD: 50',
                      icon: Icons.people_outline,
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Vui lòng nhập số lượng khách';
                        final count = int.tryParse(value);
                        if (count == null || count <= 0) return 'Số lượng không hợp lệ';
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    // Preferred Date
                    _buildDatePicker(),

                    const SizedBox(height: 24),

                    // Location Section
                    _buildSectionTitle('Địa điểm mong muốn'),
                    const SizedBox(height: 12),

                    // Region Picker
                    _buildPickerButton(
                      label: 'Khu vực',
                      value: _selectedRegion,
                      placeholder: 'Chọn khu vực',
                      icon: Icons.map_outlined,
                      onTap: _showRegionPicker,
                    ),

                    const SizedBox(height: 12),

                    // Theater Picker
                    _buildPickerButton(
                      label: 'Rạp chiếu phim',
                      value: _selectedTheater?.name,
                      placeholder: 'Chọn rạp (không bắt buộc)',
                      icon: Icons.theaters_outlined,
                      onTap: _showTheaterPicker,
                      enabled: _selectedRegion != null,
                    ),

                    const SizedBox(height: 24),

                    // Notes Section
                    _buildSectionTitle('Ghi chú'),
                    const SizedBox(height: 12),

                    _buildTextField(
                      controller: _notesController,
                      label: 'Ghi chú thêm',
                      hint: 'VD: Ngày giờ mong muốn, yêu cầu đặc biệt...',
                      icon: Icons.note_alt_outlined,
                      maxLines: 4,
                    ),

                    const SizedBox(height: 24),

                    // Note info
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber[50],
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.amber[200]!),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.lightbulb_outline, color: Colors.amber[700], size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Sau khi gửi yêu cầu, nhân viên của chúng tôi sẽ liên hệ để tư vấn, thương lượng giá và sắp xếp suất chiếu phù hợp.',
                              style: TextStyle(color: Colors.amber[900], fontSize: 13, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitBooking,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE53935),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Gửi yêu cầu',
                                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange[400]!, Colors.deepOrange[500]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.groups, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Dịch vụ doanh nghiệp',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  'Đặt vé nhóm, thuê rạp, mua voucher\nvới ưu đãi đặc biệt',
                  style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF333333)),
    );
  }

  Widget _buildServiceTypeSelector() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
      ),
      itemCount: _serviceTypes.length,
      itemBuilder: (context, index) {
        final type = _serviceTypes[index];
        final isSelected = _serviceType == type['value'];

        return GestureDetector(
          onTap: () => setState(() => _serviceType = type['value']),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE53935).withOpacity(0.1) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? const Color(0xFFE53935) : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  type['icon'],
                  color: isSelected ? const Color(0xFFE53935) : Colors.grey[600],
                  size: 28,
                ),
                const SizedBox(height: 8),
                Text(
                  type['label'],
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isSelected ? const Color(0xFFE53935) : Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 2),
                Text(
                  type['desc'],
                  style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            prefixIcon: Icon(icon, color: Colors.grey),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE53935), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPickerButton({
    required String label,
    required String? value,
    required String placeholder,
    required IconData icon,
    required VoidCallback onTap,
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: enabled ? onTap : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: enabled ? Colors.white : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                Icon(icon, color: enabled ? Colors.grey : Colors.grey[400]),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    value ?? placeholder,
                    style: TextStyle(
                      color: value != null ? Colors.black87 : Colors.grey[400],
                      fontWeight: value != null ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                Icon(Icons.keyboard_arrow_down, color: enabled ? Colors.grey : Colors.grey[400]),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    final dateFormat = DateFormat('dd/MM/yyyy (EEEE)', 'vi');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ngày mong muốn *',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _preferredDate ?? DateTime.now().add(const Duration(days: 7)),
              firstDate: DateTime.now().add(const Duration(days: 1)),
              lastDate: DateTime.now().add(const Duration(days: 90)),
              helpText: 'Chọn ngày mong muốn',
              cancelText: 'Hủy',
              confirmText: 'Chọn',
            );
            if (picked != null) {
              setState(() => _preferredDate = picked);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _preferredDate != null ? const Color(0xFFE53935) : Colors.grey[300]!,
                width: _preferredDate != null ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_month_outlined,
                  color: _preferredDate != null ? const Color(0xFFE53935) : Colors.grey,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _preferredDate != null
                        ? dateFormat.format(_preferredDate!)
                        : 'Chọn ngày bạn muốn đặt',
                    style: TextStyle(
                      color: _preferredDate != null ? Colors.black87 : Colors.grey[400],
                      fontWeight: _preferredDate != null ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_drop_down,
                  color: _preferredDate != null ? const Color(0xFFE53935) : Colors.grey,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
