import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from "@/server/api/utils/logger";
import { Session } from "next-auth";

// Augmented session type that includes the userId property for backward compatibility
interface AugmentedSession extends Session {
  userId?: string;
}

// In-memory session cache to reduce database calls
const sessionCache = new Map<string, { session: AugmentedSession; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      sessionCache.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export async function getSessionCache(): Promise<AugmentedSession | null> {
  try {
    // Create a cache key based on request context
    // In a real implementation, you'd want to use a more specific key
    const cacheKey = 'current-session';

    // Check cache first
    const cached = sessionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.session;
    }

    // Get session from NextAuth
    const session = await getServerSession(authOptions) as AugmentedSession | null;

    if (!session?.user?.id) {
      return null;
    }

    // Add backward compatibility
    if (!session.userId) {
      session.userId = session.user.id;
    }

    // Cache the session
    if (sessionCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = sessionCache.keys().next().value;
      sessionCache.delete(firstKey);
    }

    sessionCache.set(cacheKey, {
      session,
      timestamp: Date.now()
    });

    return session;
  } catch (error) {
    logger.error("Error getting session", { error: String(error) });
    return null;
  }
}

/**
 * Clear session cache - useful for logout or session updates
 */
export function clearSessionCache(): void {
  sessionCache.clear();
}

/**
 * Get session cache stats for monitoring
 */
export function getSessionCacheStats() {
  return {
    size: sessionCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL
  };
}
