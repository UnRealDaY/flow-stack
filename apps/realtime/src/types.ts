// Typed socket.io event maps — keeps all event shapes in one place

export interface ClientToServerEvents {
  'workspace:join':  (workspaceId: string) => void;
  'workspace:leave': (workspaceId: string) => void;
  'heartbeat':       (workspaceId: string) => void;
}

export interface ServerToClientEvents {
  'presence:join':    (data: { userId: string }) => void;
  'presence:leave':   (data: { userId: string }) => void;
  'presence:list':    (data: { userIds: string[] }) => void;
  'heartbeat:ack':    () => void;
  'file:processed':   (data: { fileId: string; status: string; key?: string }) => void;
  'payment:updated':  (data: { status: string; plan?: string }) => void;
  'error':            (data: { code: string; message: string }) => void;
}

export interface SocketData {
  userId: string;
}
