# Social Wall Real-Time Specification

## Overview

This document defines the Socket.IO implementation for real-time communication in the Social Wall feature, including server setup, client integration, event handling, and scalability considerations.

## Socket.IO Architecture

### Server Configuration

```typescript
// src/features/social-wall/services/socket-server.ts
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class SocialWallSocketServer {
  private io: SocketIOServer;
  private redisClient?: ReturnType<typeof createClient>;

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupRedisAdapter();
    this.setupNamespaces();
    this.setupMiddleware();
  }

  private setupRedisAdapter() {
    if (process.env.REDIS_URL) {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      this.io.adapter(createAdapter(pubClient, subClient));
      this.redisClient = pubClient;
    }
  }

  private setupNamespaces() {
    // Dynamic namespace creation for each class
    this.io.of(/^\/class-[\w]+$/).on('connection', (socket) => {
      this.handleClassConnection(socket);
    });
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.authenticateUser(token);
        
        if (!user) {
          return next(new Error('Authentication failed'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Class access validation
    this.io.of(/^\/class-[\w]+$/).use(async (socket, next) => {
      try {
        const classId = socket.nsp.name.replace('/class-', '');
        const hasAccess = await this.validateClassAccess(socket.data.user.id, classId);
        
        if (!hasAccess) {
          return next(new Error('Access denied to class'));
        }

        socket.data.classId = classId;
        next();
      } catch (error) {
        next(new Error('Class access validation failed'));
      }
    });
  }
}
```

### Namespace Structure

```typescript
// Class-specific namespaces
const classNamespace = `/class-${classId}`;

// Namespace rooms for different content types
const NAMESPACE_ROOMS = {
  GENERAL: 'general',           // All class members
  TEACHERS: 'teachers',         // Teachers and coordinators only
  MODERATION: 'moderation',     // Moderation events
  NOTIFICATIONS: 'notifications' // User-specific notifications
} as const;
```

## Event Definitions

### Client-to-Server Events

```typescript
interface ClientToServerEvents {
  // Connection management
  'join:class': (data: { classId: string }) => void;
  'leave:class': (data: { classId: string }) => void;
  
  // Real-time interactions
  'typing:start': (data: { postId?: string; commentId?: string }) => void;
  'typing:stop': (data: { postId?: string; commentId?: string }) => void;
  
  // Presence
  'user:active': () => void;
  'user:idle': () => void;
  
  // Content subscriptions
  'subscribe:post': (data: { postId: string }) => void;
  'unsubscribe:post': (data: { postId: string }) => void;
}
```

### Server-to-Client Events

```typescript
interface ServerToClientEvents {
  // Post events
  'post:created': (data: PostCreatedEvent) => void;
  'post:updated': (data: PostUpdatedEvent) => void;
  'post:deleted': (data: PostDeletedEvent) => void;
  'post:moderated': (data: PostModeratedEvent) => void;
  
  // Comment events
  'comment:created': (data: CommentCreatedEvent) => void;
  'comment:updated': (data: CommentUpdatedEvent) => void;
  'comment:deleted': (data: CommentDeletedEvent) => void;
  
  // Reaction events
  'reaction:added': (data: ReactionEvent) => void;
  'reaction:removed': (data: ReactionEvent) => void;
  'reaction:updated': (data: ReactionSummaryEvent) => void;
  
  // User interaction events
  'user:tagged': (data: UserTaggedEvent) => void;
  'user:typing': (data: TypingEvent) => void;
  'user:stopped_typing': (data: TypingEvent) => void;
  
  // Presence events
  'user:joined': (data: UserPresenceEvent) => void;
  'user:left': (data: UserPresenceEvent) => void;
  'user:status_changed': (data: UserStatusEvent) => void;
  
  // Moderation events
  'moderation:action': (data: ModerationEvent) => void;
  'content:flagged': (data: ContentFlaggedEvent) => void;
  
  // System events
  'notification:new': (data: NotificationEvent) => void;
  'error': (data: ErrorEvent) => void;
  'connection:status': (data: ConnectionStatusEvent) => void;
}
```

## Event Data Structures

### Post Events

```typescript
interface PostCreatedEvent {
  type: 'post:created';
  classId: string;
  post: {
    id: string;
    content: string;
    contentType: PostContentType;
    mediaUrls?: string[];
    author: UserSummary;
    postType: PostType;
    taggedUsers: UserSummary[];
    createdAt: Date;
  };
  metadata: {
    isAnnouncement: boolean;
    priority: 'low' | 'medium' | 'high';
  };
}

interface PostUpdatedEvent {
  type: 'post:updated';
  classId: string;
  postId: string;
  changes: {
    content?: string;
    mediaUrls?: string[];
    updatedAt: Date;
  };
  editor: UserSummary;
}

interface PostDeletedEvent {
  type: 'post:deleted';
  classId: string;
  postId: string;
  deletedBy: UserSummary;
  reason?: string;
  timestamp: Date;
}
```

### Reaction Events

```typescript
interface ReactionEvent {
  type: 'reaction:added' | 'reaction:removed';
  classId: string;
  targetId: string; // postId or commentId
  targetType: 'post' | 'comment';
  reaction: {
    type: ReactionType;
    user: UserSummary;
  };
  newCounts: Record<ReactionType, number>;
  timestamp: Date;
}

interface ReactionSummaryEvent {
  type: 'reaction:updated';
  classId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  summary: {
    total: number;
    breakdown: Record<ReactionType, number>;
    recentUsers: UserSummary[];
  };
}
```

### User Interaction Events

```typescript
interface TypingEvent {
  type: 'user:typing' | 'user:stopped_typing';
  classId: string;
  user: UserSummary;
  context: {
    postId?: string;
    commentId?: string;
    location: 'post' | 'comment' | 'reply';
  };
  timestamp: Date;
}

interface UserTaggedEvent {
  type: 'user:tagged';
  classId: string;
  taggedUser: UserSummary;
  tagger: UserSummary;
  context: {
    postId?: string;
    commentId?: string;
    content: string;
    position: number;
  };
  timestamp: Date;
}
```

## Client Implementation

### React Hook for Socket.IO

```typescript
// src/features/social-wall/hooks/useSocialWallSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface UseSocialWallSocketProps {
  classId: string;
  enabled?: boolean;
}

export function useSocialWallSocket({ classId, enabled = true }: UseSocialWallSocketProps) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user || !classId) {
      return;
    }

    // Create socket connection
    const socket = io(`/class-${classId}`, {
      auth: {
        token: session.accessToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log(`Connected to class ${classId} social wall`);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`Disconnected from class ${classId}:`, reason);
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classId, enabled, session]);

  // Event subscription helper
  const subscribe = useCallback(<T>(event: string, handler: (data: T) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      
      // Return unsubscribe function
      return () => {
        socketRef.current?.off(event, handler);
      };
    }
    return () => {};
  }, []);

  // Event emission helper
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    subscribe,
    emit,
    socket: socketRef.current,
  };
}
```

### Real-Time Post Feed Component

```typescript
// src/features/social-wall/components/RealTimePostFeed.tsx
export function RealTimePostFeed({ classId }: { classId: string }) {
  const [posts, setPosts] = useState<PostWithEngagement[]>([]);
  const { subscribe, isConnected } = useSocialWallSocket({ classId });

  useEffect(() => {
    // Subscribe to real-time events
    const unsubscribers = [
      subscribe<PostCreatedEvent>('post:created', (event) => {
        setPosts(prev => [event.post, ...prev]);
        // Show notification toast
        toast.success(`New post from ${event.post.author.name}`);
      }),

      subscribe<PostUpdatedEvent>('post:updated', (event) => {
        setPosts(prev => prev.map(post => 
          post.id === event.postId 
            ? { ...post, ...event.changes }
            : post
        ));
      }),

      subscribe<PostDeletedEvent>('post:deleted', (event) => {
        setPosts(prev => prev.filter(post => post.id !== event.postId));
      }),

      subscribe<ReactionEvent>('reaction:added', (event) => {
        if (event.targetType === 'post') {
          setPosts(prev => prev.map(post =>
            post.id === event.targetId
              ? { ...post, reactionCount: Object.values(event.newCounts).reduce((a, b) => a + b, 0) }
              : post
          ));
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  return (
    <div className="space-y-4">
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            Connecting to real-time updates...
          </p>
        </div>
      )}
      
      {posts.map(post => (
        <PostCard key={post.id} post={post} classId={classId} />
      ))}
    </div>
  );
}
```

## Performance Optimizations

### Connection Management

```typescript
// Connection pooling and optimization
const CONNECTION_CONFIG = {
  maxConnections: 1000,
  connectionTimeout: 20000,
  heartbeatInterval: 25000,
  heartbeatTimeout: 60000,
  
  // Adaptive polling
  pollingDuration: 30000,
  upgradeTimeout: 10000,
  
  // Compression
  compression: true,
  perMessageDeflate: {
    threshold: 1024,
    concurrencyLimit: 10,
  },
} as const;
```

### Event Batching

```typescript
// Batch similar events to reduce client updates
class EventBatcher {
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();

  batchEvent(type: string, data: any, delay = 100) {
    if (!this.batches.has(type)) {
      this.batches.set(type, []);
    }
    
    this.batches.get(type)!.push(data);
    
    // Clear existing timer
    if (this.timers.has(type)) {
      clearTimeout(this.timers.get(type)!);
    }
    
    // Set new timer
    this.timers.set(type, setTimeout(() => {
      this.flushBatch(type);
    }, delay));
  }

  private flushBatch(type: string) {
    const batch = this.batches.get(type);
    if (batch && batch.length > 0) {
      // Emit batched event
      this.io.to(this.roomId).emit(`${type}:batch`, batch);
      
      // Clear batch
      this.batches.set(type, []);
      this.timers.delete(type);
    }
  }
}
```

## Scalability Considerations

### Horizontal Scaling

```typescript
// Redis adapter for multi-server deployment
const redisAdapter = createAdapter(
  createClient({ url: process.env.REDIS_URL }),
  createClient({ url: process.env.REDIS_URL })
);

// Sticky sessions for WebSocket connections
const stickySessionConfig = {
  key: 'io',
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};
```

### Resource Management

```typescript
// Memory usage monitoring
const MEMORY_LIMITS = {
  maxRoomsPerNamespace: 100,
  maxSocketsPerRoom: 500,
  maxEventListeners: 50,
  connectionCleanupInterval: 300000, // 5 minutes
} as const;

// Automatic cleanup of inactive connections
setInterval(() => {
  this.io.of(/^\/class-[\w]+$/).adapter.rooms.forEach((sockets, room) => {
    if (sockets.size === 0) {
      // Clean up empty rooms
      this.io.of(room.split('-')[0]).adapter.del(room);
    }
  });
}, MEMORY_LIMITS.connectionCleanupInterval);
```

## Error Handling and Resilience

### Client-Side Reconnection

```typescript
// Automatic reconnection with exponential backoff
const reconnectionConfig = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 10,
  timeout: 20000,
  forceNew: false,
};
```

### Server-Side Error Handling

```typescript
// Graceful error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  // Log error for monitoring
  logger.error('Social Wall Socket Error', {
    userId: socket.data.user?.id,
    classId: socket.data.classId,
    error: error.message,
    stack: error.stack,
  });
  
  // Emit error to client
  socket.emit('error', {
    type: 'SOCKET_ERROR',
    message: 'An error occurred with the real-time connection',
    code: 'SOCKET_001',
  });
});
```

This real-time specification provides a comprehensive foundation for implementing robust, scalable real-time communication in the Social Wall feature.
