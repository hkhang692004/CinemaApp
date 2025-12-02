import 'package:cinema_app/providers/movie_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(providers: [
      ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
      ChangeNotifierProvider(create: (_) => MovieProvider()),
       ],
      child: const App(),
    ),
  );
}
