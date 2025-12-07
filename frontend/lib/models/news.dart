import 'package:cinema_app/models/movie.dart';

class NewsModel {
  final int id;
  final String title;
  final String? summary;
  final String content;
  final String? imageUrl;
  final DateTime? publishedAt;
  final String? author;
  final bool isActive;
  final bool isBanner;
  final int? bannerOrder;
  final MovieModel? linkedMovie;

  NewsModel({
    required this.id,
    required this.title,
    this.summary,
    required this.content,
    this.imageUrl,
    this.publishedAt,
    this.author,
    required this.isActive,
    required this.isBanner,
    this.bannerOrder,
    this.linkedMovie,
  });

  factory NewsModel.fromJson(Map<String, dynamic> json) {
    return NewsModel(
      id: json['id'],
      title: json['title'],
      summary: json['summary'],
      content: json['content'],
      imageUrl: json['image_url'],
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'])
          : null,
      author: json['author'],
      isActive: json['is_active'],
      isBanner: json['is_banner'],
      bannerOrder: json['banner_order'],
      linkedMovie: json['linkedMovie'] != null
          ? MovieModel.fromJson(json['linkedMovie'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'summary': summary,
      'content': content,
      'image_url': imageUrl,
      'published_at': publishedAt?.toIso8601String(),
      'author': author,
      'is_active': isActive,
      'is_banner': isBanner,
      'banner_order': bannerOrder,
      'linkedMovie': linkedMovie?.toJson(),
    };
  }
}
