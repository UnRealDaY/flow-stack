import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function connectSocket(workspaceId: string): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join', { workspaceId });
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}
