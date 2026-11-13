import { useContext } from 'react';
import { SocketContext, type SocketContextValue } from '@/context/SocketContext';

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
