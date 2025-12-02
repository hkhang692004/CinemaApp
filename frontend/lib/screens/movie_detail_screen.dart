import 'package:cinema_app/models/movie.dart';
import 'package:flutter/material.dart';


class MovieDetailScreen extends StatelessWidget {
  final MovieModel movie;

  const MovieDetailScreen({super.key, required this.movie});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        title: Text(movie.title),
      ),
      body: Center(
        child: Text(
          'Chi tiết phim: ${movie.title}',
          style: const TextStyle(color: Colors.white, fontSize: 18),
        ),
      ),
    );
  }
}