/**
 * Social Wall Socket.IO Server
 * Integrated within the Next.js application for real-time communication
 */

import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/server/db';
import { logger } from '@/server/api/utils/logger';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from '../types/socket-events.types';

export class SocialWallSocketServer {
  private static instance: SocialWallSocketServer | null = null;
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
  private connectionCount = 0;
  private maxConnections = 1000; // Prevent too many connections
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 300000); // Every 5 minutes
  }

  public static getInstance(): SocialWallSocketServer {
    if (!SocialWallSocketServer.instance) {
      SocialWallSocketServer.instance = new SocialWallSocketServer();
    }
    return SocialWallSocketServer.instance;
  }

  public initialize(existingServer: SocketIOServer): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    if (this.io) {
      return this.io;
    }

    // Use the existing Socket.IO server instance
    this.io = existingServer as SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

    this.setupMiddleware();
    this.setupNamespaces();
    this.setupEventHandlers();

    logger.info('Social Wall Socket.IO server initialized with existing server');
    return this.io;
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Validate session token (you may need to adapt this based on your auth setup)
        const session = await this.validateSessionToken(token);
        
        if (!session || !session.user) {
          return next(new Error('Invalid authentication token'));
        }

        socket.data.user = session.user;
        socket.data.userId = session.user.id;
        
        logger.debug('Socket authenticated', { 
          userId: session.user.id, 
          socketId: socket.id 
        });
        
        next();
      } catch (error) {
        logger.error('Socket authentication error', { error });
        next(new Error('Authentication failed'));
      }
    });

    // Class access validation for class namespaces
    this.io.of(/^\/class-[\w]+$/).use(async (socket, next) => {
      try {
        const classId = socket.nsp.name.replace('/class-', '');
        const userId = socket.data.userId;

        if (!userId || !classId) {
          return next(new Error('Missing user or class information'));
        }

        const hasAccess = await this.validateClassAccess(userId, classId);
        
        if (!hasAccess) {
          return next(new Error('Access denied to class'));
        }

        socket.data.classId = classId;
        
        logger.debug('Socket class access validated', { 
          userId, 
          classId, 
          socketId: socket.id 
        });
        
        next();
      } catch (error) {
        logger.error('Socket class access validation error', { error });
        next(new Error('Class access validation failed'));
      }
    });
  }

  private setupNamespaces() {
    if (!this.io) return;

    // Dynamic namespace creation for each class
    this.io.of(/^\/class-[\w]+$/).on('connection', (socket) => {
      this.handleClassConnection(socket);
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      // Check connection limit
      this.connectionCount++;
      if (this.connectionCount > this.maxConnections) {
        logger.warn('Connection limit exceeded', {
          connectionCount: this.connectionCount,
          maxConnections: this.maxConnections
        });
        socket.disconnect(true);
        return;
      }

      logger.debug('Socket connected', {
        socketId: socket.id,
        connectionCount: this.connectionCount
      });

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socket.connected) {
          logger.warn('Socket connection timeout', { socketId: socket.id });
          socket.disconnect(true);
        }
      }, 300000); // 5 minutes

      socket.on('disconnect', (reason) => {
        this.connectionCount = Math.max(0, this.connectionCount - 1);
        clearTimeout(connectionTimeout);

        logger.debug('Socket disconnected', {
          socketId: socket.id,
          reason,
          connectionCount: this.connectionCount
        });
      });

      // Clear timeout on successful authentication
      socket.on('authenticated', () => {
        clearTimeout(connectionTimeout);
      });
    });
  }

  private handleClassConnection(socket: any) {
    const classId = socket.data.classId;
    const userId = socket.data.userId;
    const user = socket.data.user;

    logger.info('User joined class social wall', { 
      userId, 
      classId, 
      socketId: socket.id 
    });

    // Join the general class room
    socket.join(`class-${classId}`);

    // Join role-specific rooms
    if (user.userType === 'TEACHER' || user.userType === 'CAMPUS_COORDINATOR') {
      socket.join(`class-${classId}-teachers`);
      socket.join(`class-${classId}-moderation`);
    }

    // Notify others that user joined
    socket.to(`class-${classId}`).emit('user:joined', {
      type: 'user:joined',
      classId,
      user: {
        id: user.id,
        name: user.name || 'Unknown User',
        userType: user.userType,
      },
      timestamp: new Date(),
    });

    // Handle client events
    this.setupClientEventHandlers(socket);

    // Track activity
    socket.data.lastActivity = Date.now();

    // Update activity on any event
    const originalEmit = socket.emit;
    socket.emit = function(...args) {
      socket.data.lastActivity = Date.now();
      return originalEmit.apply(this, args);
    };

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('User left class social wall', {
        userId,
        classId,
        socketId: socket.id
      });

      socket.to(`class-${classId}`).emit('user:left', {
        type: 'user:left',
        classId,
        user: {
          id: user.id,
          name: user.name || 'Unknown User',
          userType: user.userType,
        },
        timestamp: new Date(),
      });
    });
  }

  private setupClientEventHandlers(socket: any) {
    const classId = socket.data.classId;
    const userId = socket.data.userId;

    // Helper to update activity and emit
    const emitWithActivity = (event: string, data: any) => {
      socket.data.lastActivity = Date.now();
      socket.to(`class-${classId}`).emit(event, data);
    };

    // Typing indicators
    socket.on('typing:start', (data) => {
      emitWithActivity('user:typing', {
        type: 'user:typing',
        classId,
        user: {
          id: userId,
          name: socket.data.user.name || 'Unknown User',
          userType: socket.data.user.userType,
        },
        context: data,
        timestamp: new Date(),
      });
    });

    socket.on('typing:stop', (data) => {
      emitWithActivity('user:stopped_typing', {
        type: 'user:stopped_typing',
        classId,
        user: {
          id: userId,
          name: socket.data.user.name || 'Unknown User',
          userType: socket.data.user.userType,
        },
        context: data,
        timestamp: new Date(),
      });
    });

    // User activity status
    socket.on('user:active', () => {
      emitWithActivity('user:status_changed', {
        type: 'user:status_changed',
        classId,
        user: {
          id: userId,
          name: socket.data.user.name || 'Unknown User',
          userType: socket.data.user.userType,
        },
        status: 'active',
        timestamp: new Date(),
      });
    });

    socket.on('user:idle', () => {
      socket.to(`class-${classId}`).emit('user:status_changed', {
        type: 'user:status_changed',
        classId,
        user: {
          id: userId,
          name: socket.data.user.name || 'Unknown User',
          userType: socket.data.user.userType,
        },
        status: 'idle',
        timestamp: new Date(),
      });
    });
  }

  // Public methods for broadcasting events
  public broadcastToClass(classId: string, event: string, data: any) {
    if (!this.io) return;

    (this.io.of(`/class-${classId}`) as any).emit(event, data);
    logger.debug('Broadcasted event to class', { classId, event });
  }

  public broadcastToTeachers(classId: string, event: string, data: any) {
    if (!this.io) return;

    (this.io.of(`/class-${classId}`).to(`class-${classId}-teachers`) as any).emit(event, data);
    logger.debug('Broadcasted event to teachers', { classId, event });
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    // Find all sockets for this user across all namespaces
    this.io.fetchSockets().then(sockets => {
      sockets.forEach(socket => {
        if (socket.data.userId === userId) {
          (socket as any).emit(event, data);
        }
      });
    });

    logger.debug('Broadcasted event to user', { userId, event });
  }

  // Helper methods
  private async validateSessionToken(token: string) {
    try {
      // This is a simplified validation - you may need to adapt based on your auth setup
      // For NextAuth.js, you might need to decode the JWT token or validate against the database
      
      // For now, we'll assume the token is the session ID and look it up
      const session = await prisma.session.findUnique({
        where: { id: token },
        include: {
          user: true,
        },
      });

      if (!session || session.expires < new Date()) {
        return null;
      }

      return {
        user: session.user,
        expires: session.expires,
      };
    } catch (error) {
      logger.error('Session validation error', { error });
      return null;
    }
  }

  private async validateClassAccess(userId: string, classId: string): Promise<boolean> {
    try {
      // Check if user is enrolled as student or assigned as teacher
      const [studentEnrollment, teacherAssignment] = await Promise.all([
        prisma.studentEnrollment.findFirst({
          where: {
            student: { userId },
            classId,
            status: 'ACTIVE',
          },
        }),
        prisma.teacherAssignment.findFirst({
          where: {
            teacher: { userId },
            classId,
            status: 'ACTIVE',
          },
        }),
      ]);

      return !!(studentEnrollment || teacherAssignment);
    } catch (error) {
      logger.error('Class access validation error', { error, userId, classId });
      return false;
    }
  }

  public getIO() {
    return this.io;
  }

  private performCleanup() {
    if (!this.io) return;

    try {
      // Get all connected sockets
      const sockets = this.io.sockets.sockets;
      let disconnectedCount = 0;

      // Disconnect inactive sockets
      sockets.forEach((socket) => {
        // Check if socket has been inactive for too long
        const lastActivity = socket.data.lastActivity || socket.handshake.time;
        const inactiveTime = Date.now() - lastActivity;

        if (inactiveTime > 1800000) { // 30 minutes
          socket.disconnect(true);
          disconnectedCount++;
        }
      });

      if (disconnectedCount > 0) {
        logger.info('Cleanup: Disconnected inactive sockets', {
          disconnectedCount,
          totalConnections: this.connectionCount
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      logger.error('Cleanup error', { error });
    }
  }

  public shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    this.connectionCount = 0;
    logger.info('Social Wall Socket Server shutdown complete');
  }
}

// Export singleton instance
export const socialWallSocketServer = SocialWallSocketServer.getInstance();
