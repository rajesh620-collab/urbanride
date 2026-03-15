import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useWebSocket() {
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    if (!userId || socket) return;

    socket = io("http://localhost:5001", {
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