import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static SocketService? _instance;
  io.Socket? _socket;
  
  // Callbacks for movie events
  VoidCallback? onMovieCreated;
  void Function(int movieId)? onMovieUpdated;
  void Function(int movieId)? onMovieDeleted;
  
  // Callbacks for theater events
  void Function(int theaterId, String theaterName, String message)? onTheaterClosed;
  void Function(int theaterId)? onTheaterUpdated;
  
  // Callbacks for room events - using list to support multiple listeners
  final List<void Function(int roomId, String roomName, String screenType)> _roomUpdatedListeners = [];
  
  // Callback for room closed (maintenance) event
  void Function(int roomId, int theaterId, String roomName, String message)? onRoomClosed;
  
  // Callbacks for news/banner events
  VoidCallback? onNewsCreated;
  final List<void Function(int newsId)> _newsUpdatedListeners = [];
  final List<void Function(int newsId)> _newsDeletedListeners = [];
  VoidCallback? onBannerUpdated;
  VoidCallback? onBannersReordered;

  // Callbacks for seat reservation events (realtime)
  final List<void Function(int showtimeId, List<int> seatIds, int userId)> _seatHeldListeners = [];
  final List<void Function(int showtimeId, List<int> seatIds, int userId)> _seatReleasedListeners = [];

  // Callbacks for showtime events
  final List<void Function(int movieId, int? theaterId)> _showtimeCreatedListeners = [];
  final List<void Function(int showtimeId, int movieId, int? theaterId)> _showtimeUpdatedListeners = [];
  final List<void Function(int showtimeId, int movieId, int? theaterId)> _showtimeDeletedListeners = [];

  SocketService._();

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  bool get isConnected => _socket?.connected ?? false;

  // Add listener for room updated event
  void addRoomUpdatedListener(void Function(int roomId, String roomName, String screenType) listener) {
    if (!_roomUpdatedListeners.contains(listener)) {
      _roomUpdatedListeners.add(listener);
    }
  }

  // Remove listener for room updated event
  void removeRoomUpdatedListener(void Function(int roomId, String roomName, String screenType) listener) {
    _roomUpdatedListeners.remove(listener);
  }

  // Add listener for news updated event
  void addNewsUpdatedListener(void Function(int newsId) listener) {
    if (!_newsUpdatedListeners.contains(listener)) {
      _newsUpdatedListeners.add(listener);
    }
  }

  // Remove listener for news updated event
  void removeNewsUpdatedListener(void Function(int newsId) listener) {
    _newsUpdatedListeners.remove(listener);
  }

  // Add listener for news deleted event
  void addNewsDeletedListener(void Function(int newsId) listener) {
    if (!_newsDeletedListeners.contains(listener)) {
      _newsDeletedListeners.add(listener);
    }
  }

  // Remove listener for news deleted event
  void removeNewsDeletedListener(void Function(int newsId) listener) {
    _newsDeletedListeners.remove(listener);
  }

  // Add listener for seat held event
  void addSeatHeldListener(void Function(int showtimeId, List<int> seatIds, int userId) listener) {
    if (!_seatHeldListeners.contains(listener)) {
      _seatHeldListeners.add(listener);
    }
  }

  // Remove listener for seat held event
  void removeSeatHeldListener(void Function(int showtimeId, List<int> seatIds, int userId) listener) {
    _seatHeldListeners.remove(listener);
  }

  // Add listener for seat released event
  void addSeatReleasedListener(void Function(int showtimeId, List<int> seatIds, int userId) listener) {
    if (!_seatReleasedListeners.contains(listener)) {
      _seatReleasedListeners.add(listener);
    }
  }

  // Remove listener for seat released event
  void removeSeatReleasedListener(void Function(int showtimeId, List<int> seatIds, int userId) listener) {
    _seatReleasedListeners.remove(listener);
  }

  // Add listener for showtime created event
  void addShowtimeCreatedListener(void Function(int movieId, int? theaterId) listener) {
    if (!_showtimeCreatedListeners.contains(listener)) {
      _showtimeCreatedListeners.add(listener);
    }
  }

  // Remove listener for showtime created event
  void removeShowtimeCreatedListener(void Function(int movieId, int? theaterId) listener) {
    _showtimeCreatedListeners.remove(listener);
  }

  // Add listener for showtime updated event
  void addShowtimeUpdatedListener(void Function(int showtimeId, int movieId, int? theaterId) listener) {
    if (!_showtimeUpdatedListeners.contains(listener)) {
      _showtimeUpdatedListeners.add(listener);
    }
  }

  // Remove listener for showtime updated event
  void removeShowtimeUpdatedListener(void Function(int showtimeId, int movieId, int? theaterId) listener) {
    _showtimeUpdatedListeners.remove(listener);
  }

  // Add listener for showtime deleted event
  void addShowtimeDeletedListener(void Function(int showtimeId, int movieId, int? theaterId) listener) {
    if (!_showtimeDeletedListeners.contains(listener)) {
      _showtimeDeletedListeners.add(listener);
    }
  }

  // Remove listener for showtime deleted event
  void removeShowtimeDeletedListener(void Function(int showtimeId, int movieId, int? theaterId) listener) {
    _showtimeDeletedListeners.remove(listener);
  }

  void connect() {
    if (_socket != null && _socket!.connected) {
      debugPrint('🔌 Socket already connected');
      return;
    }

    // URL của backend production
    const String socketUrl = 'https://cinemaapp-gkkn.onrender.com';

    _socket = io.io(
      socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('🔌 Socket connected: ${_socket!.id}');
      // Join client room để nhận updates
      _socket!.emit('join-client');
    });

    _socket!.onDisconnect((_) {
      debugPrint('❌ Socket disconnected');
    });

    _socket!.onConnectError((error) {
      debugPrint('❌ Socket connection error: $error');
    });

    _socket!.onError((error) {
      debugPrint('❌ Socket error: $error');
    });

    // Listen for movie events
    _socket!.on('movie-created', (data) {
      debugPrint('📽️ Movie created event received');
      onMovieCreated?.call();
    });

    _socket!.on('movie-updated', (data) {
      debugPrint('📽️ Movie updated event received: $data');
      int? movieId;
      if (data != null && data['movie'] != null) {
        movieId = data['movie']['id'];
      }
      onMovieUpdated?.call(movieId ?? 0);
    });

    _socket!.on('movie-deleted', (data) {
      debugPrint('📽️ Movie deleted event received: $data');
      int? movieId;
      if (data != null && data['movieId'] != null) {
        movieId = data['movieId'];
      }
      onMovieDeleted?.call(movieId ?? 0);
    });

    // Listen for theater events
    _socket!.on('theater-closed', (data) {
      debugPrint('🏢 Theater closed event received: $data');
      if (data != null) {
        final theaterId = data['theaterId'] ?? 0;
        final theaterName = data['theaterName'] ?? '';
        final message = data['message'] ?? 'Rạp đã tạm đóng';
        onTheaterClosed?.call(theaterId, theaterName, message);
      }
    });

    _socket!.on('theater-updated', (data) {
      debugPrint('🏢 Theater updated event received: $data');
      int? theaterId;
      if (data != null && data['theater'] != null) {
        theaterId = data['theater']['id'];
      }
      onTheaterUpdated?.call(theaterId ?? 0);
    });

    // Listen for room events
    _socket!.on('room-closed', (data) {
      debugPrint('🚪 Room closed (maintenance) event received: $data');
      if (data != null) {
        final roomId = data['roomId'] ?? 0;
        final theaterId = data['theaterId'] ?? 0;
        final roomName = data['roomName'] ?? '';
        final message = data['message'] ?? 'Phòng đang bảo trì';
        onRoomClosed?.call(roomId, theaterId, roomName, message);
      }
    });

    _socket!.on('room-updated', (data) {
      debugPrint('🚪 Room updated event received: $data');
      if (data != null && data['room'] != null) {
        final room = data['room'];
        final roomId = room['id'] ?? 0;
        final roomName = room['name'] ?? '';
        final screenType = room['screen_type'] ?? 'Standard';
        // Notify all listeners
        for (final listener in _roomUpdatedListeners) {
          listener(roomId, roomName, screenType);
        }
      }
    });

    // Listen for news events
    _socket!.on('news-created', (data) {
      debugPrint('📰 News created event received: $data');
      onNewsCreated?.call();
    });

    _socket!.on('news-updated', (data) {
      debugPrint('📰 News updated event received: $data');
      int? newsId;
      if (data != null && data['news'] != null) {
        newsId = data['news']['id'];
      }
      // Notify all listeners
      for (final listener in _newsUpdatedListeners) {
        listener(newsId ?? 0);
      }
    });

    _socket!.on('news-deleted', (data) {
      debugPrint('📰 News deleted event received: $data');
      int? newsId;
      if (data != null && data['id'] != null) {
        newsId = data['id'];
      }
      // Notify all listeners
      for (final listener in _newsDeletedListeners) {
        listener(newsId ?? 0);
      }
    });

    // Listen for banner events
    _socket!.on('banner-updated', (data) {
      debugPrint('🖼️ Banner updated event received: $data');
      onBannerUpdated?.call();
    });

    _socket!.on('banners-reordered', (data) {
      debugPrint('🖼️ Banners reordered event received: $data');
      onBannersReordered?.call();
    });

    // Listen for seat reservation events (realtime)
    _socket!.on('seat-held', (data) {
      debugPrint('🪑 Seat held event received: $data');
      if (data != null) {
        final showtimeId = data['showtimeId'] ?? 0;
        final seatIds = (data['seatIds'] as List?)?.map((e) => e as int).toList() ?? [];
        final userId = data['userId'] ?? 0;
        // Notify all listeners
        for (final listener in _seatHeldListeners) {
          listener(showtimeId, seatIds, userId);
        }
      }
    });

    _socket!.on('seat-released', (data) {
      debugPrint('🪑 Seat released event received: $data');
      if (data != null) {
        final showtimeId = data['showtimeId'] ?? 0;
        final seatIds = (data['seatIds'] as List?)?.map((e) => e as int).toList() ?? [];
        final userId = data['userId'] ?? 0;
        // Notify all listeners
        for (final listener in _seatReleasedListeners) {
          listener(showtimeId, seatIds, userId);
        }
      }
    });

    // Listen for showtime events
    _socket!.on('showtime-created', (data) {
      debugPrint('🎬 Showtime created event received: $data');
      if (data != null) {
        final movieId = data['movieId'] ?? 0;
        final theaterId = data['theaterId'];
        // Notify all listeners
        for (final listener in _showtimeCreatedListeners) {
          listener(movieId, theaterId);
        }
      }
    });

    _socket!.on('showtime-updated', (data) {
      debugPrint('🎬 Showtime updated event received: $data');
      if (data != null) {
        final showtime = data['showtime'];
        final showtimeId = showtime?['id'] ?? 0;
        final movieId = data['movieId'] ?? 0;
        final theaterId = data['theaterId'];
        // Notify all listeners
        for (final listener in _showtimeUpdatedListeners) {
          listener(showtimeId, movieId, theaterId);
        }
      }
    });

    _socket!.on('showtime-deleted', (data) {
      debugPrint('🎬 Showtime deleted event received: $data');
      if (data != null) {
        final showtimeId = data['showtimeId'] ?? 0;
        final movieId = data['movieId'] ?? 0;
        final theaterId = data['theaterId'];
        // Notify all listeners
        for (final listener in _showtimeDeletedListeners) {
          listener(showtimeId, movieId, theaterId);
        }
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    debugPrint('🔌 Socket disconnected and disposed');
  }

  void dispose() {
    disconnect();
    _instance = null;
  }
}
