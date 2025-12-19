import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit event đến tất cả admin
export const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};

// Events
export const SOCKET_EVENTS = {
  NEW_ORDER: 'new-order',
  ORDER_PAID: 'order-paid',
  ORDER_CANCELLED: 'order-cancelled',
  DASHBOARD_UPDATE: 'dashboard-update',
};

export { io };
