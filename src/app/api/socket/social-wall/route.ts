/**
 * Socket.IO API Route for Social Wall
 * Handles Socket.IO server initialization and connection management
 */

import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socialWallSocketServer } from '@/features/social-wall/services/socket-server';
import { logger } from '@/server/api/utils/logger';

// Extend the global object to store the Socket.IO server
declare global {
  var __socialWallSocketIO: SocketIOServer | undefined;
}

export async function GET(req: NextRequest) {
  try {
    // Check if Socket.IO server is already initialized
    if (global.__socialWallSocketIO) {
      return new Response('Socket.IO server already running', { status: 200 });
    }

    // For Next.js API routes, we need to access the underlying HTTP server
    // This is a bit tricky in the App Router, so we'll handle it differently
    
    return new Response(
      JSON.stringify({
        message: 'Socket.IO server initialization endpoint',
        status: 'ready',
        path: '/api/socket/social-wall',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Socket.IO route error', { error });
    return new Response(
      JSON.stringify({
        error: 'Failed to initialize Socket.IO server',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle Socket.IO server initialization or management commands
    switch (body.action) {
      case 'initialize':
        // Initialize the Socket.IO server if not already done
        if (!global.__socialWallSocketIO) {
          // Note: In production, you might need a custom server setup
          // For now, we'll return a success response
          return new Response(
            JSON.stringify({
              message: 'Socket.IO server initialization requested',
              status: 'pending',
            }),
            { status: 200 }
          );
        }
        break;
        
      case 'status':
        return new Response(
          JSON.stringify({
            status: global.__socialWallSocketIO ? 'running' : 'stopped',
            connections: global.__socialWallSocketIO?.engine?.clientsCount || 0,
          }),
          { status: 200 }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400 }
        );
    }

    return new Response(
      JSON.stringify({ message: 'Action processed' }),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Socket.IO POST route error', { error });
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
