class AuthResponse {
  final String message;
  final String? accessToken;
  final String? refreshToken;

  final Map<String, dynamic>? user;

  AuthResponse({
    required this.message,
    this.accessToken,
    this.refreshToken,
    this.user,
  });

  factory AuthResponse.fromJson(Map<String,dynamic> json){
    return AuthResponse(
    message: json['message'],
    accessToken: json['accessToken'],
    refreshToken: json['refreshToken'],
    user: json['user'],
    );

  }
}
