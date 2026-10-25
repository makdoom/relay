import type { Server as BaseServer, Socket as BaseSocket } from 'socket.io';

export interface SocketUser {
  id: string;
}

export interface SocketData {
  user: SocketUser;
}

// Client to server events map
export type ClientToServerEvents = {};

// Server to client events map
export type ServerToClientEvents = {};

// Internal server events
export type InterServerEvents = {};

export type AppSocket = BaseSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocketServer = BaseServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface SocketAuthError extends Error {
  code?: string;
  data?: {
    code: string;
    statusCode: number;
  };
}
