import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

// Derive WebSocket URL from API URL (strip /api suffix)
const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

export function useWebSocket() {
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    if (!userId || socket) return;

    socket = io(WS_URL, {
      auth: { userId }
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      socket = null;
    });
  }, [userId]);

  return socket;
}

export function getSocket() {
  return socket;
}