import 'package:flutter/material.dart';
import 'package:cinema_app/config/navigator_key.dart';
import 'screens/splash_screen.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey, // Thêm navigatorKey để có thể navigate từ bất kỳ đâu
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(), // Bắt đầu từ SplashScreen
    );
  }
}