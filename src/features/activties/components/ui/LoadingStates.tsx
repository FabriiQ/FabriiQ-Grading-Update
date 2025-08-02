/**
 * Comprehensive Loading States
 * 
 * Production-ready loading components with skeleton screens,
 * progress indicators, and contextual loading messages.
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  BookOpen,
  Settings,
  BarChart3
} from 'lucide-react';

// Loading state types
export type LoadingType = 
  | 'spinner'
  | 'skeleton'
  | 'progress'
  | 'dots'
  | 'pulse'
  | 'custom';

export interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generic loading component
export function LoadingState({ 
  type = 'spinner', 
  message = 'Loading...', 
  progress,
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
            <span className="text-sm text-muted-foreground">{message}</span>
          </div>
        );
      
      case 'progress':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{message}</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-muted-foreground ml-2">{message}</span>
          </div>
        );
      
      case 'pulse':
        return (
          <div className="flex items-center space-x-2">
            <div className={`bg-primary rounded-full animate-pulse ${sizeClasses[size]}`}></div>
            <span className="text-sm text-muted-foreground">{message}</span>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
            <span className="text-sm text-muted-foreground">{message}</span>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      {renderLoader()}
    </div>
  );
}

// Activity-specific loading components

export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center space-x-2 mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ActivityDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-8 w-14" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GradingInterfaceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Grading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Contextual loading states with icons and messages

export function ActivityLoadingState({ 
  action = 'loading',
  context = 'activities'
}: { 
  action?: string;
  context?: string;
}) {
  const getIcon = () => {
    switch (context) {
      case 'activities': return <BookOpen className="h-5 w-5" />;
      case 'grading': return <FileText className="h-5 w-5" />;
      case 'analytics': return <BarChart3 className="h-5 w-5" />;
      case 'students': return <Users className="h-5 w-5" />;
      case 'settings': return <Settings className="h-5 w-5" />;
      default: return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getMessage = () => {
    const messages = {
      loading: `Loading ${context}...`,
      saving: `Saving ${context}...`,
      deleting: `Deleting ${context}...`,
      processing: `Processing ${context}...`,
      uploading: `Uploading ${context}...`,
      generating: `Generating ${context}...`
    };
    return messages[action as keyof typeof messages] || `${action} ${context}...`;
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <span className="text-sm font-medium">{getMessage()}</span>
      </div>
    </div>
  );
}

// Progress-based loading for long operations

export function ProgressLoadingState({
  title,
  steps,
  currentStep,
  progress,
  message
}: {
  title: string;
  steps: string[];
  currentStep: number;
  progress: number;
  message?: string;
}) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h3 className="text-lg font-semibold text-center">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : index === currentStep ? (
                <Clock className="h-4 w-4 text-blue-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className={`text-sm ${
                index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {message && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Batch operation loading state

export function BatchOperationLoading({
  operation,
  total,
  completed,
  failed,
  current
}: {
  operation: string;
  total: number;
  completed: number;
  failed: number;
  current?: string;
}) {
  const progress = ((completed + failed) / total) * 100;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <h3 className="text-lg font-semibold">{operation}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        
        <div className="flex items-center justify-between text-sm">
          <span>Progress: {completed + failed} of {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">{completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{total - completed - failed}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>

        {current && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Currently processing: <span className="font-medium">{current}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state component (related to loading states)

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// Loading overlay for existing content

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  children
}: {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
