class MovieModel {
  final int id;
  final String title;
  final String? description;
  final String? trailerUrl;
  final String? posterUrl;
  final String? backdropUrl;
  final int? durationMin;
  final String? director;
  final List<String> actors;
  final List<String> genres;
  final String? country;
  final DateTime? releaseDate;
  final double avgRating;
  final String status;      
  final String ageRating;   

  MovieModel({
    required this.id,
    required this.title,
    this.description,
    this.trailerUrl,
    this.posterUrl,
    this.backdropUrl,
    this.durationMin,
    this.director,
    this.actors = const [],
    this.genres = const [],
    this.country,
    this.releaseDate,
    required this.avgRating,
    required this.status,
    required this.ageRating,
  });

  static List<String> _parseList(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) {
      // Nếu backend trả [{id,name}]
      if (raw.isNotEmpty && raw.first is Map) {
        return raw
            .map((e) => e['name']?.toString() ?? '')
            .where((e) => e.isNotEmpty)
            .toList();
      }
      // Nếu backend trả mảng string
      return raw.map((e) => e.toString()).toList();
    }
    if (raw is String) {
      return raw
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    return [];
  }

  factory MovieModel.fromJson(Map<String, dynamic> json) {
    final rawGenres = json['genres'] ?? json['Genres'];
    return MovieModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      trailerUrl: json['trailer_url'],
      posterUrl: json['poster_url'],
      backdropUrl: json['backdrop_url'],
      durationMin: json['duration_min'],
      director: json['director'],
      actors: _parseList(json['actors']),
      genres: _parseList(rawGenres),
      country: json['country'],
      releaseDate: json['release_date'] != null
          ? DateTime.parse(json['release_date'])
          : null,
      avgRating: json['avg_rating'] is num
          ? (json['avg_rating'] as num).toDouble()
          : double.tryParse(json['avg_rating']?.toString() ?? '0') ?? 0.0,
      status: json['status'],
      ageRating: json['age_rating'],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'trailer_url': trailerUrl,
      'poster_url': posterUrl,
      'backdrop_url': backdropUrl,
      'duration_min': durationMin,
      'director': director,
      'actors': actors.join(', '),
      'genres': genres.join(', '), // xuất ra chuỗi, tùy backend mà dùng
      'country': country,
      'release_date':
          releaseDate != null ? releaseDate!.toIso8601String() : null,
      'avg_rating': avgRating,
      'status': status,
      'age_rating': ageRating,
    };
  }
}