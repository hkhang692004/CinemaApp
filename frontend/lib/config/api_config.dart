class ApiConfig {
  static const String baseURL = "http://10.0.2.2:5001/api";
//Auth
  static const String signUp = "/auth/signup";
  static const String signIn = "/auth/signin";
  static const String refreshToken = "/auth/refresh-token";
  static const String signOut = "/auth/signout";
  static const String sendOTP = "/auth/send-otp";
  static const String forgotPassword = "/auth/reset-password";
//Movies
  static const String nowShowingMovies = "/movies/now-showing";
  static const String comingSoonMovies = "/movies/coming-soon";
  static const String movie= "/movies";
  static const String searchMovies = "/movies/search";
  //News
  static const String bannerNews = "/news/banners";
  static const String newsDetail = "/news";
  static const String allNews = "/news/allnews";
  static const Duration timeout = Duration(seconds: 30);
}
