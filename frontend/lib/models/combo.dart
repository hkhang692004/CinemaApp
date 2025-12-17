class ComboItem {
  final int id;
  final String name;
  final int quantity;

  ComboItem({
    required this.id,
    required this.name,
    required this.quantity,
  });

  factory ComboItem.fromJson(Map<String, dynamic> json) {
    return ComboItem(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'quantity': quantity,
    };
  }
}

class Combo {
  final int id;
  final String name;
  final String? description;
  final String? imageUrl;
  final double price;
  final String? category;
  final List<ComboItem> items;

  Combo({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    required this.price,
    this.category,
    this.items = const [],
  });

  factory Combo.fromJson(Map<String, dynamic> json) {
    return Combo(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      imageUrl: json['image_url'],
      price: (json['price'] ?? 0).toDouble(),
      category: json['category'],
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => ComboItem.fromJson(item))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'price': price,
      'category': category,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }

  /// Tạo mô tả từ danh sách items
  String get itemsDescription {
    if (items.isEmpty) return description ?? '';
    return items.map((item) => '${item.quantity}x ${item.name}').join(', ');
  }
}
