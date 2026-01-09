import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Notifications WebSocket Gateway
 *
 * Handles real-time notification delivery using Socket.io
 * - On connection: User joins their personal notification room
 * - On notification: Server broadcasts to user's room
 * - On disconnect: Cleanup
 *
 * Usage:
 * ```typescript
 * this.notificationsGateway.notifyUser(userId, notification)
 * ```
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001'
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userConnections = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) { }

  /**
   * Handle client connection
   * Authenticates via JWT and joins user's notification room
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn('Invalid token payload');
        client.disconnect();
        return;
      }

      // Join user's personal notification room
      const userRoom = `user:${userId}`;
      client.join(userRoom);

      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      const userSockets = this.userConnections.get(userId);
      if (userSockets) {
        userSockets.add(client.id);
      }

      client.data.userId = userId;

      this.logger.log(
        `✓ User ${userId} connected (Socket: ${client.id}), Total: ${userSockets?.size || 0}`,
      );

      // Emit connection acknowledgement
      client.emit('connected', {
        message: 'Connected to notifications',
        userId,
        socketId: client.id,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Connection error: ${msg}`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   * Cleanup user connections tracking
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSockets = this.userConnections.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);

        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
          this.logger.log(`✗ User ${userId} fully disconnected`);
        } else {
          this.logger.log(
            `✗ User ${userId} socket disconnected (Socket: ${client.id}), Remaining: ${userSockets.size}`,
          );
        }
      }
    }
  }

  /**
   * Send notification to specific user
   * Called by NotificationsService when creating notification
   */
  notifyUser(userId: string, notification: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('notification', {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      notificationType: notification.notificationType,
      relatedEntityId: notification.relatedEntityId,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
    });

    const connectedCount = this.userConnections.get(userId)?.size || 0;
    this.logger.debug(
      `📬 Notification sent to user ${userId} (${connectedCount} socket(s))`,
    );
  }

  /**
   * Broadcast notification to multiple users
   * Called for system-wide notifications
   */
  notifyUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => this.notifyUser(userId, notification));
  }

  /**
   * Broadcast to all connected clients (admin notifications)
   */
  broadcastToAll(notification: any) {
    this.server.emit('notification', {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      notificationType: notification.notificationType,
      sentAt: notification.sentAt,
    });

    this.logger.debug('📣 Broadcast notification to all users');
  }

  /**
   * Client acknowledges receipt of notification
   */
  @SubscribeMessage('notification-ack')
  handleNotificationAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    this.logger.debug(
      `✓ User ${client.data.userId} acknowledged notification ${data.notificationId}`,
    );
  }

  /**
   * Get connection status
   */
  isUserConnected(userId: string): boolean {
    return (
      this.userConnections.has(userId) &&
      (this.userConnections.get(userId)?.size ?? 0) > 0
    );
  }

  /**
   * Get user connection count
   */
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
}
