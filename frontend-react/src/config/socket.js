import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const SOCKET_EVENTS = {
  NEW_ORDER: 'new-order',
  ORDER_PAID: 'order-paid',
  ORDER_CANCELLED: 'order-cancelled',
  DASHBOARD_UPDATE: 'dashboard-update',
};

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join-admin');
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
