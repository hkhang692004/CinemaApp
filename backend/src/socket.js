import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', process.env.CLIENT_URL].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Admin join room để nhận updates
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('👤 Admin joined:', socket.id);
    });

    // Mobile app join room để nhận updates
    socket.on('join-client', () => {
      socket.join('client-room');
      console.log('📱 Mobile client joined:', socket.id);
    });

    // User join personal room (for personal notifications)
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined personal room:`, socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit event đến tất cả admin
export const emitToAdmin = (event, data) => {
  if (io) {
    console.log(`📤 emitToAdmin: ${event}`, data);
    io.to('admin-room').emit(event, data);
  } else {
    console.log('⚠️ Socket.io not initialized, cannot emit:', event);
  }
};

// Emit event đến tất cả mobile clients
export const emitToClients = (event, data) => {
  if (io) {
    io.to('client-room').emit(event, data);
  }
};

// Emit event đến tất cả (admin + clients)
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Emit event đến 1 user cụ thể (theo user_id)
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

// Events
export const SOCKET_EVENTS = {
  NEW_ORDER: 'new-order',
  ORDER_PAID: 'order-paid',
  ORDER_CANCELLED: 'order-cancelled',
  ORDER_REFUNDED: 'order-refunded',
  POINTS_RESTORED: 'points-restored',
  DASHBOARD_UPDATE: 'dashboard-update',
  // Movie events
  MOVIE_CREATED: 'movie-created',
  MOVIE_UPDATED: 'movie-updated',
  MOVIE_DELETED: 'movie-deleted',
  // Theater events
  THEATER_UPDATED: 'theater-updated',
  THEATER_CLOSED: 'theater-closed',
  // Room events
  ROOM_UPDATED: 'room-updated',
  ROOM_CLOSED: 'room-closed',
  // News events
  NEWS_CREATED: 'news-created',
  NEWS_UPDATED: 'news-updated',
  NEWS_DELETED: 'news-deleted',
  // Banner events
  BANNER_UPDATED: 'banner-updated',
  BANNERS_REORDERED: 'banners-reordered',
  // Combo events
  COMBO_CREATED: 'combo-created',
  COMBO_UPDATED: 'combo-updated',
  COMBO_DELETED: 'combo-deleted',
  // Showtime events
  SHOWTIME_CREATED: 'showtime-created',
  SHOWTIME_UPDATED: 'showtime-updated',
  SHOWTIME_DELETED: 'showtime-deleted',
  // Group Booking events
  GROUP_BOOKING_CREATED: 'group-booking-created',
  GROUP_BOOKING_UPDATED: 'group-booking-updated',
  // Seat Reservation events (realtime)
  SEAT_HELD: 'seat-held',
  SEAT_RELEASED: 'seat-released',
  // Statistics events
  STATS_UPDATED: 'stats-updated',
};

export { io };
