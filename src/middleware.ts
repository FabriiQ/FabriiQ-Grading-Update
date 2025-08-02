import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// Enhanced caching for production performance
const institutionCache = new Map<string, { valid: boolean; timestamp: number }>();
const routeCache = new Map<string, { response: NextResponse; timestamp: number }>();
const INSTITUTION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for production
const ROUTE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for route decisions

// Precompiled regex patterns for better performance
const SKIP_PATTERNS = /^\/(api|_next|static|favicon\.ico|h5p|login|unauthorized|admin\/system)/;
const PUBLIC_PATTERNS = /^\/(login|api\/auth|unauthorized|h5p-test)/;
const TEACHER_PATTERNS = /^\/(teacher|worksheets)/;
const STUDENT_PATTERNS = /^\/student/;

function isValidInstitution(institutionId: string): boolean {
  const cached = institutionCache.get(institutionId);
  if (cached && Date.now() - cached.timestamp < INSTITUTION_CACHE_TTL) {
    return cached.valid;
  }

  // Optimized validation with precompiled regex
  const isValid = /^[a-zA-Z0-9-_]{1,50}$/.test(institutionId);

  // Cleanup old cache entries periodically
  if (institutionCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of institutionCache.entries()) {
      if (now - value.timestamp > INSTITUTION_CACHE_TTL) {
        institutionCache.delete(key);
      }
    }
  }

  institutionCache.set(institutionId, { valid: isValid, timestamp: Date.now() });
  return isValid;
}

/**
 * Optimized institution middleware with enhanced caching
 */
function institutionMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip for API routes, public assets, etc. - using precompiled regex
  if (SKIP_PATTERNS.test(pathname)) {
    return null;
  }

  // Check route cache for repeated requests
  const routeCacheKey = `route:${pathname}`;
  const cachedRoute = routeCache.get(routeCacheKey);
  if (cachedRoute && Date.now() - cachedRoute.timestamp < ROUTE_CACHE_TTL) {
    return cachedRoute.response;
  }

  // Extract the institution ID from the URL path
  const pathParts = pathname.split('/');
  const potentialInstitutionId = pathParts.length > 1 ? pathParts[1] : '';

  // If no institution ID or it's a root path, redirect to default institution
  if (!potentialInstitutionId || pathname === '/') {
    const defaultInstitution = process.env.DEFAULT_INSTITUTION || 'default';
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultInstitution}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // Validate institution ID using cache
  if (!isValidInstitution(potentialInstitutionId)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // Add the institution ID to the request headers for use in API routes
  const response = NextResponse.next();
  response.headers.set('x-institution-id', potentialInstitutionId);

  // Cache successful route decisions
  routeCache.set(routeCacheKey, { response, timestamp: Date.now() });

  return response;
}

// Production-optimized combined middleware
export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Skip middleware for static assets and API routes - using precompiled regex
    if (SKIP_PATTERNS.test(pathname)) {
      return NextResponse.next();
    }

    // Handle institution middleware
    const institutionResponse = institutionMiddleware(req);
    if (institutionResponse) {
      return institutionResponse;
    }

    // Allow public paths - using precompiled regex
    if (PUBLIC_PATTERNS.test(pathname)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Optimized role-based routing without additional DB queries
    const userType = token.userType as string;

    if (userType === 'CAMPUS_TEACHER' || userType === 'TEACHER') {
      if (!TEACHER_PATTERNS.test(pathname)) {
        return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
      }
    } else if (userType === 'CAMPUS_STUDENT' || userType === 'STUDENT') {
      if (!STUDENT_PATTERNS.test(pathname)) {
        return NextResponse.redirect(new URL('/student/classes', req.url));
      }
    } else {
      // Handle other user types or unauthorized access
      if (TEACHER_PATTERNS.test(pathname) || STUDENT_PATTERNS.test(pathname)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
      error: '/unauthorized'
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - h5p (H5P static files - now handled by Next.js static serving)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|h5p).*)',
  ]
};
