'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ServerPong {
  status: string;
  client_timestamp?: number;
  server_timestamp?: number;
  message?: string;
}

export function useSocket(serverUrl: string = 'http://localhost:5000') {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastPong, setLastPong] = useState<ServerPong | null>(null);
  const pingTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    const s: Socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Cerberus Socket] Connected to backend on', serverUrl, 'SID:', s.id);
      setIsConnected(true);
      setConnectionState('connected');
      
      // Perform initial ping immediately
      const now = Date.now();
      pingTimestampRef.current = now;
      s.emit('ping', { timestamp: now });
    });

    s.on('disconnect', (reason) => {
      console.warn('[Cerberus Socket] Disconnected:', reason);
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    s.on('connect_error', (err) => {
      console.warn('[Cerberus Socket] Connection Error:', err.message);
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    s.on('pong', (data: ServerPong) => {
      if (data?.client_timestamp) {
        const rtt = Date.now() - data.client_timestamp;
        setLatency(rtt);
      } else if (pingTimestampRef.current) {
        const rtt = Date.now() - pingTimestampRef.current;
        setLatency(rtt);
      }
      setLastPong(data);
    });

    setSocket(s);

    // Periodic heartbeat ping every 10s
    const pingInterval = setInterval(() => {
      if (s.connected) {
        const now = Date.now();
        pingTimestampRef.current = now;
        s.emit('ping', { timestamp: now });
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      s.disconnect();
    };
  }, [serverUrl]);

  const sendPing = useCallback(() => {
    if (socket && socket.connected) {
      const now = Date.now();
      pingTimestampRef.current = now;
      socket.emit('ping', { timestamp: now });
    }
  }, [socket]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    connectionState,
    latency,
    lastPong,
    sendPing,
    emit
  };
}
