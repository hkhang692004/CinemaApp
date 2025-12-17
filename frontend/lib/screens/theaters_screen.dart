import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/theater_model.dart';
import '../providers/auth_provider.dart';
import '../services/booking_service.dart';
import 'theater_detail_screen.dart';

class TheatersScreen extends StatefulWidget {
  const TheatersScreen({super.key});

  @override
  State<TheatersScreen> createState() => _TheatersScreenState();
}

class _TheatersScreenState extends State<TheatersScreen> {
  List<TheaterModel> _theaters = [];
  bool _isLoading = true;
  String? _error;
  String _selectedCity = 'Tất cả';

  @override
  void initState() {
    super.initState();
    _loadTheaters();
  }

  Future<void> _loadTheaters() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final bookingService = BookingService(authProvider: authProvider);
      final theaters = await bookingService.getTheaters();
      
      if (mounted) {
        setState(() {
          _theaters = theaters;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  List<String> get _cities {
    final cities = _theaters.map((t) => t.city).toSet().toList();
    cities.sort();
    return ['Tất cả', ...cities];
  }

  List<TheaterModel> get _filteredTheaters {
    if (_selectedCity == 'Tất cả') return _theaters;
    return _theaters.where((t) => t.city == _selectedCity).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFFFFF),
        elevation: 0,
        title: const Text(
          'Rạp chiếu phim',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget()
              : _buildContent(),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Không thể tải danh sách rạp',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadTheaters,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF044FA2),
            ),
            child: const Text('Thử lại', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        // City Filter
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _cities.map((city) => _buildCityChip(city)).toList(),
            ),
          ),
        ),
        
        // Theater List
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadTheaters,
            child: _filteredTheaters.isEmpty
                ? Center(
                    child: Text(
                      'Không có rạp nào',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredTheaters.length,
                    itemBuilder: (context, index) {
                      return _buildTheaterCard(_filteredTheaters[index]);
                    },
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildCityChip(String city) {
    final isSelected = _selectedCity == city;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(city),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.grey[700],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.grey[200],
        selectedColor: const Color(0xFFE53935),
        checkmarkColor: Colors.white,
        onSelected: (selected) {
          setState(() {
            _selectedCity = city;
          });
        },
      ),
    );
  }

  Widget _buildTheaterCard(TheaterModel theater) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TheaterDetailScreen(theater: theater),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Theater Image
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: const Color(0xFF044FA2).withValues(alpha: 0.1),
                ),
                clipBehavior: Clip.antiAlias,
                child: theater.imageUrl != null && theater.imageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: theater.imageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.movie_outlined,
                          color: Color(0xFF044FA2),
                          size: 32,
                        ),
                      )
                    : const Icon(
                        Icons.movie_outlined,
                        color: Color(0xFF044FA2),
                        size: 32,
                      ),
              ),
              const SizedBox(width: 16),
              
              // Theater Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      theater.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F1F1F),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            theater.address,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        theater.city,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.orange,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Arrow
              Icon(Icons.chevron_right, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}
