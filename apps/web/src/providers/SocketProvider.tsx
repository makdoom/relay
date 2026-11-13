import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { refreshAuthTokens } from '@/api/auth.api';
import { SocketContext, type SocketContextValue } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import type { ConnectionStatus } from '@/types/socket';

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    // Initialize Socket.IO client passing HttpOnly auth cookies (ADR-002, Phase 3.6)
    const client = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['polling', 'websocket'],
    });

    client.on('connect', () => {
      setConnectionStatus('connected');
    });

    client.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    client.on('connect_error', async (err) => {
      setConnectionStatus('disconnected');
      console.warn('Socket connection error:', err.message);

      // If handshake was rejected due to expired access token, rotate tokens and reconnect
      const isAuthError =
        err.message.includes('token') ||
        err.message.includes('Authentication') ||
        err.message.includes('Unauthorized');

      if (isAuthError) {
        try {
          await refreshAuthTokens();
          client.connect();
        } catch {
          // Token refresh failure will be handled by AuthContext onAuthFailure
        }
      }
    });

    client.io.on('reconnect_attempt', () => {
      setConnectionStatus('connecting');
    });

    client.io.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    setSocket(client);

    return () => {
      client.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
    };
  }, [isAuthenticated]);

  const reconnect = useCallback(() => {
    if (socket) {
      setConnectionStatus('connecting');
      socket.connect();
    }
  }, [socket]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      connectionStatus,
      reconnect,
    }),
    [socket, connectionStatus, reconnect]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
