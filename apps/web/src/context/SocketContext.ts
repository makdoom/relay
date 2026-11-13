import { createContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { ConnectionStatus } from '@/types/socket';

export interface SocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

export const SocketContext = createContext<SocketContextValue | null>(null);
