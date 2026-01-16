import { io, Socket } from 'socket.io-client';
import { Logger } from '@/lib/logger';
import type { NotificationResponse } from '@/lib/api/notificationsApi';

const logger = Logger.create('NotificationSocket');

let socket: Socket | null = null;

/**
 * Initialize Socket.io connection for notifications
 * Must be called after user is authenticated
 */
export function initializeNotificationSocket(token: string): Socket {
  if (socket?.connected) {
    logger.debug('Socket already connected, reusing existing connection');
    return socket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  socket = io(`${socketUrl}/notifications`, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // Connection events
  socket.on('connect', () => {
    logger.log(`✓ Connected to notifications (Socket ID: ${socket!.id})`);
  });

  socket.on('disconnect', (reason) => {
    logger.warn(`✗ Disconnected from notifications: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error: ${error}`);
  });

  return socket;
}

/**
 * Get existing socket instance
 */
export function getNotificationSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectNotificationSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.log('Socket disconnected');
  }
}

/**
 * Subscribe to notifications
 */
export function subscribeToNotifications(
  callback: (notification: NotificationResponse) => void,
): () => void {
  if (!socket) {
    logger.error('Socket not initialized');
    return () => {};
  }

  socket.on('notification', callback);

  // Return unsubscribe function
  return () => {
    if (socket) {
      socket.off('notification', callback);
    }
  };
}

/**
 * Acknowledge notification receipt
 */
export function acknowledgeNotification(notificationId: string): void {
  if (!socket) {
    logger.error('Socket not initialized');
    return;
  }

  socket.emit('notification-ack', { notificationId });
}

/**
 * Check if socket is connected
 */
export function isNotificationSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Wait for socket to be ready
 */
export function waitForSocketReady(timeout = 5000): Promise<Socket> {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve(socket);
      return;
    }

    if (!socket) {
      reject(new Error('Socket not initialized'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, timeout);

    socket.once('connected', () => {
      clearTimeout(timer);
      resolve(socket!);
    });
  });
}
