import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

console.log('🔌 Socket URL:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Track if already joined admin room
let hasJoinedAdmin = false;

export const SOCKET_EVENTS = {
  NEW_ORDER: 'new-order',
  ORDER_PAID: 'order-paid',
  ORDER_CANCELLED: 'order-cancelled',
  ORDER_REFUNDED: 'order-refunded',
  POINTS_RESTORED: 'points-restored',
  DASHBOARD_UPDATE: 'dashboard-update',
  // Combo events
  COMBO_CREATED: 'combo-created',
  COMBO_UPDATED: 'combo-updated',
  COMBO_DELETED: 'combo-deleted',
  // Group Booking events
  GROUP_BOOKING_CREATED: 'group-booking-created',
  GROUP_BOOKING_UPDATED: 'group-booking-updated',
  // Seat Reservation events (realtime)
  SEAT_HELD: 'seat-held',
  SEAT_RELEASED: 'seat-released',
  // Statistics events
  STATS_UPDATED: 'stats-updated',
};

export const joinAdminRoom = () => {
  if (socket.connected && !hasJoinedAdmin) {
    socket.emit('join-admin');
    hasJoinedAdmin = true;
    console.log('📡 Joined admin room');
  }
};

export const connectSocket = () => {
  if (!socket.connected) {
    hasJoinedAdmin = false;
    socket.connect();
  }
};

// Reset flag when disconnected
socket.on('disconnect', () => {
  hasJoinedAdmin = false;
});

// Auto join admin when connected
socket.on('connect', () => {
  joinAdminRoom();
});

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    hasJoinedAdmin = false;
  }
};

export default socket;
