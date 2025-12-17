import 'package:cinema_app/providers/news_provider.dart';
import 'package:cinema_app/providers/movie_provider.dart';
import 'package:cinema_app/providers/booking_provider.dart';
import 'package:cinema_app/providers/seat_selection_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
        ChangeNotifierProxyProvider<AuthProvider, MovieProvider>(
          create: (_) => MovieProvider(null),
          // Tạm thời null, sẽ được inject sau
          update: (_, authProvider, previous) {
            if (previous == null) {
              // Tạo mới MovieProvider với authProvider
              return MovieProvider(authProvider);
            } else {
              // Update authProvider nếu chưa có
              previous.updateAuthProvider(authProvider);
              return previous;
            }
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, NewsProvider>(
          create: (_) => NewsProvider(null),
          update: (_, authProvider, previous) {
            if (previous == null) {
              return NewsProvider(authProvider);
            } else {
              previous.updateAuthProvider(authProvider);
              return previous;
            }
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, BookingProvider>(
          create: (_) => BookingProvider(null),
          update: (_, authProvider, previous) {
            if (previous == null) {
              return BookingProvider(authProvider);
            } else {
              previous.updateAuthProvider(authProvider);
              return previous;
            }
          },
        ),
        ChangeNotifierProxyProvider<AuthProvider, SeatSelectionProvider>(
          create: (_) => SeatSelectionProvider(AuthProvider()),
          update: (_, authProvider, previous) {
            if (previous == null) {
              return SeatSelectionProvider(authProvider);
            } else {
              // Update authProvider in existing instance
              return SeatSelectionProvider(authProvider);
            }
          },
        ),
      ],
      child: const App(),
    ),
  );
}
