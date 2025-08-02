/**
 * React Hook for Social Wall Socket.IO Integration
 * Provides real-time communication capabilities for the Social Wall
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { logger } from '@/server/api/utils/logger';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '../types/socket-events.types';

interface UseSocialWallSocketProps {
  classId: string;
  enabled?: boolean;
  autoConnect?: boolean;
}

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

export function useSocialWallSocket({ 
  classId, 
  enabled = true, 
  autoConnect = true 
}: UseSocialWallSocketProps) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    lastConnectedAt: null,
    reconnectAttempts: 0,
  });

  // Event listeners registry
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!enabled || !session?.user || !classId || socketRef.current?.connected) {
      return;
    }

    setSocketState(prev => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      // Create socket connection to class namespace
      const socket = io(`/class-${classId}`, {
        path: '/api/socket/social-wall',
        auth: {
          token: session.user.id, // Use user ID as token for now
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        setSocketState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          lastConnectedAt: new Date(),
          reconnectAttempts: 0,
        }));
        
        logger.info('Connected to Social Wall', { classId, socketId: socket.id });
      });

      socket.on('disconnect', (reason) => {
        setSocketState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
        
        logger.info('Disconnected from Social Wall', { classId, reason });
      });

      socket.on('connect_error', (error) => {
        setSocketState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionError: error.message,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
        
        logger.error('Socket connection error', { classId, error: error.message });
      });

      socket.on('reconnect', (attemptNumber) => {
        setSocketState(prev => ({
          ...prev,
          reconnectAttempts: attemptNumber,
        }));
        
        logger.info('Socket reconnected', { classId, attemptNumber });
      });

      socket.on('reconnect_error', (error) => {
        logger.error('Socket reconnection error', { classId, error: error.message });
      });

      // Authentication error handling
      socket.on('auth_error', (data) => {
        setSocketState(prev => ({
          ...prev,
          connectionError: data.message || 'Authentication failed',
        }));
        
        logger.error('Socket authentication error', { classId, error: data.message });
      });

    } catch (error) {
      setSocketState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Connection failed',
      }));
      
      logger.error('Socket initialization error', { classId, error });
    }
  }, [classId, enabled, session]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    }
  }, []);

  // Subscribe to events
  const subscribe = useCallback(<T>(event: string, handler: (data: T) => void) => {
    if (!socketRef.current) {
      logger.warn('Attempted to subscribe to event without socket connection', { event });
      return () => {};
    }

    // Add to event listeners registry
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)!.push(handler);

    // Add socket listener
    (socketRef.current as any).on(event, handler);
    
    logger.debug('Subscribed to socket event', { event, classId });

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        (socketRef.current as any).off(event, handler);
      }
      
      // Remove from registry
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        const index = listeners.indexOf(handler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          eventListenersRef.current.delete(event);
        }
      }
      
      logger.debug('Unsubscribed from socket event', { event, classId });
    };
  }, [classId]);

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && socketState.isConnected) {
      (socketRef.current as any).emit(event, data);
      logger.debug('Emitted socket event', { event, classId });
    } else {
      logger.warn('Attempted to emit event without connection', { event, classId });
    }
  }, [socketState.isConnected, classId]);

  // Typing indicators
  const startTyping = useCallback((context: { postId?: string; commentId?: string }) => {
    emit('typing:start', context);
  }, [emit]);

  const stopTyping = useCallback((context: { postId?: string; commentId?: string }) => {
    emit('typing:stop', context);
  }, [emit]);

  // User activity status
  const setUserActive = useCallback(() => {
    emit('user:active');
  }, [emit]);

  const setUserIdle = useCallback(() => {
    emit('user:idle');
  }, [emit]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && enabled && session?.user && classId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, enabled, session?.user, classId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all event listeners
      eventListenersRef.current.clear();
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Auto activity tracking with memory leak prevention
  useEffect(() => {
    if (!socketState.isConnected) return;

    let activityTimer: NodeJS.Timeout | undefined;
    let idleTimer: NodeJS.Timeout | undefined;
    let isCleanedUp = false;

    const resetActivityTimer = () => {
      if (isCleanedUp) return; // Prevent operations after cleanup

      if (activityTimer) clearTimeout(activityTimer);
      if (idleTimer) clearTimeout(idleTimer);

      setUserActive();

      // Set user as idle after 10 minutes of inactivity (increased from 5 to reduce frequency)
      idleTimer = setTimeout(() => {
        if (!isCleanedUp) {
          setUserIdle();
        }
      }, 10 * 60 * 1000);
    };

    // Track user activity with throttling to reduce memory usage
    let lastActivity = 0;
    const throttledResetActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 30000) { // Throttle to once per 30 seconds
        lastActivity = now;
        resetActivityTimer();
      }
    };

    const events = ['mousedown', 'keypress', 'scroll', 'touchstart']; // Removed mousemove to reduce frequency
    events.forEach(event => {
      document.addEventListener(event, throttledResetActivity, { passive: true });
    });

    // Initial activity
    resetActivityTimer();

    return () => {
      isCleanedUp = true;
      events.forEach(event => {
        document.removeEventListener(event, throttledResetActivity);
      });
      if (activityTimer) clearTimeout(activityTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [socketState.isConnected, setUserActive, setUserIdle]);

  return {
    // Connection state
    ...socketState,
    
    // Connection methods
    connect,
    disconnect,
    
    // Event methods
    subscribe,
    emit,
    
    // Convenience methods
    startTyping,
    stopTyping,
    setUserActive,
    setUserIdle,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
    
    // Helper properties
    isReady: socketState.isConnected && !socketState.isConnecting,
    hasError: !!socketState.connectionError,
  };
}

export default useSocialWallSocket;
