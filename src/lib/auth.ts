import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma, cachedQueries } from "@/server/db";
import { compare } from "bcryptjs";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { ensureUserPrimaryCampus } from "@/server/api/utils/user-helpers";

// Advanced session caching with LRU
import { LRUCache } from 'lru-cache';

// Session cache with 10-minute TTL for production performance
const sessionCache = new LRUCache<string, any>({
  max: 5000, // Support 5000 concurrent sessions
  ttl: 10 * 60 * 1000, // 10 minutes
});

// JWT token cache to avoid repeated database lookups
const jwtCache = new LRUCache<string, any>({
  max: 10000,
  ttl: 15 * 60 * 1000, // 15 minutes
});

/**
 * NextAuth configuration
 *
 * This configuration handles authentication and session management for the application.
 * It includes custom callbacks for JWT, session, and redirect handling.
 *
 * IMPORTANT: The redirect callback is critical for ensuring users are directed to the
 * appropriate dashboard based on their role without any intermediate redirects.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          logger.warn("[AUTH] Missing credentials", {});
          return null;
        }

        // Use optimized query with composite index
        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username,
            status: "ACTIVE"
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            password: true,
            userType: true,
            status: true
          }
        });

        if (!user || user.status !== "ACTIVE") {
          logger.warn("[AUTH] User not found or inactive", { username: credentials.username });
          return null;
        }

        // In development, skip password check for mock users
        const isValidPassword = process.env.NODE_ENV === "development"
          ? true
          : await compare(credentials.password, user.password || "");

        if (!isValidPassword) {
          logger.warn("[AUTH] Invalid password for user", { username: credentials.username });
          return null;
        }

        logger.debug("[AUTH] User authenticated successfully", {
          userId: user.id,
          username: user.username,
          userType: user.userType
        });

        // Update last login time in background
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(err => logger.error("Failed to update last login time:", { error: String(err) }));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          userType: user.userType
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      // Use JWT cache to avoid repeated processing
      const cacheKey = `jwt:${token.sub}:${Date.now() - (Date.now() % (5 * 60 * 1000))}`;
      const cached = jwtCache.get(cacheKey);
      if (cached && !user) {
        return cached;
      }

      // Add user type to JWT token
      if (user) {
        token.userType = user.userType;
        token.username = user.username;
        token.primaryCampusId = user.primaryCampusId;
        token.name = user.name;
        token.email = user.email;
        token.status = user.status;
        token.institutionId = user.institutionId;

        logger.debug("[AUTH] JWT token created", { userId: user.id, userType: user.userType });

        // If this is a new sign-in, ensure the user has a primary campus ID
        try {
          // For CAMPUS_ADMIN and COORDINATOR users, ensure they have a primary campus
          if (user.userType === "CAMPUS_ADMIN" || user.userType === "COORDINATOR" || user.userType === "CAMPUS_COORDINATOR") {
            const primaryCampusId = await ensureUserPrimaryCampus(user.id);

            if (primaryCampusId) {
              token.primaryCampusId = primaryCampusId;
              logger.debug("[AUTH] Set primary campus ID in JWT", {
                userId: user.id,
                primaryCampusId
              });
            }
          }
        } catch (error) {
          logger.error("[AUTH] Error ensuring primary campus ID for JWT", { error, userId: user.id });
        }
      }

      // Cache the token for 5 minutes
      jwtCache.set(cacheKey, token);
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!token || !session.user) return session;

      // Use session cache to avoid repeated processing
      const sessionCacheKey = `session:${token.sub}:${Date.now() - (Date.now() % (2 * 60 * 1000))}`;
      const cachedSession = sessionCache.get(sessionCacheKey);
      if (cachedSession) {
        return cachedSession;
      }

      // Build session from JWT token data (no DB calls needed for most data)
      session.user.id = token.sub as string;
      session.user.userType = token.userType as UserType;
      session.user.username = token.username as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      (session.user as any).primaryCampusId = token.primaryCampusId as string;
      (session.user as any).status = token.status as string;
      (session.user as any).institutionId = token.institutionId as string;

      logger.debug("[AUTH] Session created", {
        userId: session.user.id,
        userType: session.user.userType,
        hasPrimaryCampus: !!session.user.primaryCampusId
      });

      // Only fetch fresh user data if token is older than 10 minutes (reduce DB calls)
      const tokenAge = Date.now() - ((token.iat as number) || 0) * 1000;
      if (tokenAge > 10 * 60 * 1000) {
        try {
          const userData = await cachedQueries.getUserWithCache(token.sub as string);
          if (userData && userData.status !== token.status) {
            // Update session with fresh status only if changed
            (session.user as any).status = userData.status;
            (session.user as any).primaryCampusId = userData.primaryCampusId;
            (session.user as any).institutionId = userData.institutionId;

            if (userData.status !== "ACTIVE") {
              logger.warn("[AUTH] Inactive user accessed session", {
                userId: session.user.id,
                userType: session.user.userType,
                status: userData.status
              });
            }
          }
        } catch (error) {
          logger.error("[AUTH] Error fetching cached session data", { error });
        }
      }

      // Cache the session for 2 minutes
      sessionCache.set(sessionCacheKey, session);
      return session;
    },
    /**
     * Optimized redirect callback for NextAuth
     *
     * This simplified function handles redirects after authentication:
     * 1. Uses role-specific URLs directly when provided
     * 2. Redirects to /dashboard for role determination when needed
     * 3. Eliminates complex session checking that causes delays
     *
     * @param params The redirect parameters from NextAuth
     * @returns The URL to redirect to
     */
    async redirect(params: { url: string; baseUrl: string }) {
      const { url, baseUrl } = params;

      logger.debug("[AUTH] Redirect callback", { url, baseUrl });

      // If the URL is already absolute, return it as is
      if (url.startsWith("http")) return url;

      // For relative URLs starting with /
      if (url.startsWith("/")) {
        // If it's already a role-specific URL, use it directly
        const isRoleSpecificUrl =
          url.startsWith("/teacher/") ||
          url.startsWith("/student/") ||
          url.startsWith("/admin/") ||
          url.startsWith("/parent/");

        if (isRoleSpecificUrl) {
          logger.debug("[AUTH] Using role-specific URL directly", { url });
          return `${baseUrl}${url}`;
        }

        // For /dashboard or root, always redirect to /dashboard
        // Let the dashboard page handle the role-based redirect
        if (url === "/" || url.startsWith("/dashboard")) {
          logger.debug("[AUTH] Redirecting to dashboard for role determination");
          return `${baseUrl}/dashboard`;
        }
      }

      // Default fallback
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  events: {
    async signIn({ user }) {
      logger.debug("[AUTH] User signed in", { userId: user.id, userType: user.userType });
    },
    async signOut({ token }) {
      logger.debug("[AUTH] User signed out", { userId: token.sub });
    },
    async session({ token }) {
      logger.debug("[AUTH] Session accessed", { userId: token.sub });
    }
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code: string, metadata: any) {
      logger.error(`[AUTH] Error: ${code}`, metadata);
    },
    warn(code: string) {
      logger.warn(`[AUTH] Warning: ${code}`);
    },
    debug(code: string, metadata: any) {
      logger.debug(`[AUTH] Debug: ${code}`, metadata);
    }
  }
};
