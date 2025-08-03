/**
 * Custom Next.js Server with Socket.IO Integration
 * This server integrates Socket.IO with the Next.js application
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO with error handling and timeout protection
  console.log('Initializing Socket.IO server...');

  try {
    const io = new Server(server, {
      path: '/api/socket/social-wall',
      cors: {
        origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Store Socket.IO instance globally for access in API routes
    global.__socialWallSocketIO = io;
    console.log('Socket.IO server created successfully');

    // Set up dynamic namespaces for class-specific connections
    io.of(/^\/class-[\w]+$/).on('connection', (socket) => {
      const classId = socket.nsp.name.replace('/class-', '');
      console.log(`User connected to class ${classId}:`, socket.id);

      // Handle social wall posts
      socket.on('new-post', (data) => {
        socket.to(socket.nsp.name).emit('post-created', data);
        console.log(`New post in class ${classId}:`, data.id);
      });

      // Handle post updates
      socket.on('update-post', (data) => {
        socket.to(socket.nsp.name).emit('post-updated', data);
        console.log(`Post updated in class ${classId}:`, data.id);
      });

      // Handle post deletions
      socket.on('delete-post', (data) => {
        socket.to(socket.nsp.name).emit('post-deleted', data);
        console.log(`Post deleted in class ${classId}:`, data.id);
      });

      // Handle reactions
      socket.on('add-reaction', (data) => {
        socket.to(socket.nsp.name).emit('reaction-added', data);
      });

      socket.on('remove-reaction', (data) => {
        socket.to(socket.nsp.name).emit('reaction-removed', data);
      });

      // Handle comments
      socket.on('new-comment', (data) => {
        socket.to(socket.nsp.name).emit('comment-created', data);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected from class ${classId}:`, socket.id);
      });
    });

    // Basic connection handler for non-namespace connections
    io.on('connection', (socket) => {
      console.log('User connected to main namespace:', socket.id);

      socket.on('disconnect', () => {
        console.log('User disconnected from main namespace:', socket.id);
      });
    });

    console.log('Socket.IO namespaces and event handlers set up successfully');

  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    // Store a dummy Socket.IO instance to prevent crashes
    global.__socialWallSocketIO = {
      emit: () => {},
      to: () => ({ emit: () => {} }),
      on: () => {},
    };
  }

  // Start the server
  server
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running on path: /api/socket/social-wall`);

      // Initialize optimized server components
      if (process.env.FAST_STARTUP !== 'true') {
        console.log('Starting server initialization...');
      }

      // Only enable memory monitoring in production or when explicitly enabled
      const enableMemoryMonitoring = process.env.NODE_ENV === 'production' ||
                                    process.env.ENABLE_MEMORY_MONITORING === 'true';

      if (enableMemoryMonitoring) {
        // Use setTimeout to avoid blocking the main thread
        setTimeout(() => {
          try {
            console.log('Initializing memory monitoring...');

            // Basic memory monitoring with longer intervals for better performance
            setInterval(() => {
              const memUsage = process.memoryUsage();
              const memUsageMB = {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
              };

              // Only log if memory usage is concerning
              if (memUsageMB.heapUsed > 512) {
                console.log('Memory usage (MB):', memUsageMB);
              }

              // Trigger GC if memory usage is high
              if (memUsageMB.heapUsed > 1000) {
                console.warn('High memory usage detected:', memUsageMB);
                if (global.gc) {
                  global.gc();
                  console.log('Forced garbage collection');
                }
              }
            }, 600000); // 10 minutes interval for better performance

          } catch (error) {
            console.error('Memory monitoring initialization failed:', error);
          }
        }, 2000); // 2 second delay
      } else {
        // In development, just log initial memory usage and set up basic monitoring
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        console.log(`Initial memory usage: ${memUsageMB}MB (monitoring disabled)`);

        // Set up basic memory monitoring in development to catch memory leaks
        if (memUsageMB > 200) {
          console.warn('High initial memory usage detected. Consider restarting the development server.');
        }

        // Force garbage collection if available and memory is high
        if (global.gc && memUsageMB > 300) {
          global.gc();
          console.log('Forced garbage collection due to high memory usage');
        }

        console.log('Server startup completed successfully');
      }

      console.log('Exiting server listen callback...');
    });

  console.log('Setting up graceful shutdown handlers...');

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);

    try {
      // Try to gracefully shutdown socket server if it exists
      if (global.socialWallSocketServer && typeof global.socialWallSocketServer.shutdown === 'function') {
        global.socialWallSocketServer.shutdown();
      }
    } catch (error) {
      console.error('Error during socket server shutdown:', error);
    }

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle memory issues
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });

  console.log('All event handlers set up. Server initialization complete.');
});

console.log('Server setup complete, waiting for app.prepare()...');
