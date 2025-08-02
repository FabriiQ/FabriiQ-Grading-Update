/**
 * Minimal Next.js Server for Testing
 * This server has minimal functionality to test if the basic Next.js setup works
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

console.log('Starting minimal Next.js server...');
console.log('Environment:', { dev, hostname, port });

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('Next.js app created, preparing...');

app.prepare().then(() => {
  console.log('Next.js app prepared successfully');
  
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

  console.log('HTTP server created, starting to listen...');

  // Start the server
  server
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Minimal server ready on http://${hostname}:${port}`);
      console.log('🎉 Server is working! You can now test the application.');
    });

  // Simple graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});

console.log('Server setup initiated...');
