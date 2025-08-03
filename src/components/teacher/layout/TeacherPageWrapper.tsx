'use client';

import React, { ReactNode } from 'react';
import { TeacherErrorBoundary } from '@/components/teacher/error/TeacherErrorBoundary';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import { QuickTeacherLoading } from '@/components/teacher/loading/TeacherLoadingState';

interface TeacherPageWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireTeacherRole?: boolean;
  showErrorDetails?: boolean;
  loadingConfig?: keyof typeof import('@/components/teacher/loading/TeacherLoadingState').teacherLoadingConfigs;
  customLoadingTitle?: string;
  customLoadingDescription?: string;
}

/**
 * Wrapper component for teacher portal pages
 * Provides consistent error handling, authentication checks, and loading states
 */
export function TeacherPageWrapper({
  children,
  requireAuth = true,
  requireTeacherRole = true,
  showErrorDetails = false,
  loadingConfig = 'dashboard',
  customLoadingTitle,
  customLoadingDescription,
}: TeacherPageWrapperProps) {
  const { data: session, status } = useSession();

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <QuickTeacherLoading
        configKey={loadingConfig}
        customTitle={customLoadingTitle}
        customDescription={customLoadingDescription}
      />
    );
  }

  // Check authentication if required
  if (requireAuth && status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You must be logged in to access the teacher portal. Please sign in to continue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check teacher role if required
  if (requireTeacherRole && session?.user) {
    const userType = session.user.userType;
    const isTeacher = userType === 'TEACHER' || userType === 'CAMPUS_TEACHER';
    
    if (!isTeacher) {
      return (
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access the teacher portal. 
              This area is restricted to teachers only.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // Wrap children in error boundary
  return (
    <TeacherErrorBoundary showDetails={showErrorDetails}>
      {children}
    </TeacherErrorBoundary>
  );
}

/**
 * Higher-order component for wrapping teacher pages
 */
export function withTeacherPageWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<TeacherPageWrapperProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <TeacherPageWrapper {...options}>
        <Component {...props} />
      </TeacherPageWrapper>
    );
  };

  WrappedComponent.displayName = `withTeacherPageWrapper(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for teacher page authentication and role checks
 */
export function useTeacherPageAuth(requireTeacherRole = true) {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isTeacher = session?.user?.userType === 'TEACHER' || session?.user?.userType === 'CAMPUS_TEACHER';

  const hasAccess = isAuthenticated && (!requireTeacherRole || isTeacher);

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isTeacher,
    hasAccess,
    user: session?.user,
  };
}

/**
 * Component for displaying access denied message
 */
export function TeacherAccessDenied({ 
  title = 'Access Denied',
  message = 'You do not have permission to access this page.',
  showHomeButton = true 
}: {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}) {
  return (
    <div className="container mx-auto py-8">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {message}
          {showHomeButton && (
            <div className="mt-4">
              <a 
                href="/teacher/dashboard" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Go to Teacher Dashboard
              </a>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Utility function to check if user has teacher permissions
 */
export function hasTeacherPermissions(userType?: string): boolean {
  return userType === 'TEACHER' || userType === 'CAMPUS_TEACHER';
}

/**
 * Utility function to get teacher-specific error messages
 */
export function getTeacherErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Customize error messages for common teacher portal errors
    if (error.message.includes('UNAUTHORIZED')) {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    
    if (error.message.includes('NOT_FOUND')) {
      return 'The requested resource was not found. It may have been deleted or moved.';
    }
    
    if (error.message.includes('FORBIDDEN')) {
      return 'Access to this resource is restricted. Please check your permissions.';
    }

    if (error.message.includes('INTERNAL_SERVER_ERROR')) {
      return 'An internal server error occurred. Please try again later or contact support.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
