class LoyaltyInfo {
  final int points;
  final String tier;
  final double totalSpent;
  final String maxDiscountInfo;

  LoyaltyInfo({
    required this.points,
    required this.tier,
    required this.totalSpent,
    required this.maxDiscountInfo,
  });

  factory LoyaltyInfo.fromJson(Map<String, dynamic> json) {
    return LoyaltyInfo(
      points: json['points'] ?? 0,
      tier: json['tier'] ?? 'Silver',
      totalSpent: double.tryParse(json['totalSpent'].toString()) ?? 0,
      maxDiscountInfo: json['maxDiscountInfo'] ?? '',
    );
  }
}

class OrderResult {
  final int orderId;
  final String orderCode;
  final double subtotal;
  final double loyaltyDiscount;
  final double totalAmount;
  final int ticketCount;
  final int comboCount;
  final bool isFreeOrder; // Đơn hàng miễn phí (không cần VNPay)

  OrderResult({
    required this.orderId,
    required this.orderCode,
    required this.subtotal,
    required this.loyaltyDiscount,
    required this.totalAmount,
    required this.ticketCount,
    required this.comboCount,
    this.isFreeOrder = false,
  });

  factory OrderResult.fromJson(Map<String, dynamic> json) {
    return OrderResult(
      orderId: json['orderId'] is int ? json['orderId'] : int.parse(json['orderId'].toString()),
      orderCode: json['orderCode'] ?? '',
      subtotal: double.tryParse(json['subtotal'].toString()) ?? 0,
      loyaltyDiscount: double.tryParse(json['loyaltyDiscount'].toString()) ?? 0,
      totalAmount: double.tryParse(json['totalAmount'].toString()) ?? 0,
      ticketCount: json['ticketCount'] ?? 0,
      comboCount: json['comboCount'] ?? 0,
      isFreeOrder: json['isFreeOrder'] == true,
    );
  }
}
