/**
 * Database Health Check Utility
 * Provides utilities to check database connectivity and handle connection issues gracefully
 */

import { PrismaClient } from '@prisma/client';

export interface DatabaseHealthStatus {
  isConnected: boolean;
  error?: string;
  latency?: number;
}

/**
 * Check database connectivity
 */
export async function checkDatabaseHealth(prisma: PrismaClient): Promise<DatabaseHealthStatus> {
  try {
    const startTime = Date.now();
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      isConnected: true,
      latency,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Check if error is a database connection error
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const connectionErrorPatterns = [
    'database server',
    'connection refused',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'Can\'t reach database server',
    'Connection terminated',
  ];
  
  return connectionErrorPatterns.some(pattern => 
    error.message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Get fallback data for when database is unavailable
 */
export function getFallbackData<T>(type: 'mastery' | 'attendance' | 'analytics', classId?: string): T {
  switch (type) {
    case 'mastery':
      return {
        classId: classId || '',
        className: 'Class',
        totalStudents: 0,
        averageMastery: 0,
        masteryDistribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        topicMasteries: [],
        studentMasteries: [],
        trends: [],
      } as T;
      
    case 'attendance':
      return [] as T;
      
    case 'analytics':
      return {
        classId: classId || '',
        totalStudents: 0,
        totalActivities: 0,
        averageCompletion: 0,
        averageScore: 0,
        studentPerformance: [],
      } as T;
      
    default:
      return {} as T;
  }
}
