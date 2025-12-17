
import 'cinema_room_model.dart';

class TheaterModel {
  final int id;
  final String name;
  final String city;
  final String address;
  final String phone;
  final String email;
  final bool isActive;
  final String? imageUrl;
  final List<CinemaRoomModel>? cinemaRooms;

  TheaterModel({
    required this.id,
    required this.name,
    required this.city,
    required this.address,
    required this.phone,
    required this.email,
    required this.isActive,
    this.imageUrl,
    this.cinemaRooms,
  });

  factory TheaterModel.fromJson(Map<String, dynamic> json) {
    // Backend trả về 'CinemaRooms' (capitalized)
    final rawRooms = json['CinemaRooms'] ?? json['cinemaRooms'] ?? [];
    final cinemaRooms = (rawRooms as List)
        .map((room) => CinemaRoomModel.fromJson(room))
        .toList();

    return TheaterModel(
      id: json['id'],
      name: json['name'],
      city: json['city'],
      address: json['address'],
      phone: json['phone'],
      email: json['email'],
      isActive: json['is_active'] ?? true,
      imageUrl: json['image_url'],
      cinemaRooms: cinemaRooms.isNotEmpty ? cinemaRooms : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'city': city,
      'address': address,
      'phone': phone,
      'email': email,
      'is_active': isActive,
      'image_url': imageUrl,
    };
  }
}
