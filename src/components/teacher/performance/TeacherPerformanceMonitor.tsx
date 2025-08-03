'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Clock,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerformanceData {
  componentName: string;
  renderCount: number;
  apiCallCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  timeSinceMount: number;
}

interface TeacherPerformanceMonitorProps {
  performanceData: PerformanceData[];
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

/**
 * Performance monitoring component for teacher portal
 * Shows real-time performance metrics and optimization suggestions
 */
export function TeacherPerformanceMonitor({
  performanceData,
  showDetails = false,
  onToggleDetails,
  className = '',
}: TeacherPerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Calculate overall performance score
  const overallScore = React.useMemo(() => {
    if (performanceData.length === 0) return 100;

    let score = 100;
    
    performanceData.forEach(data => {
      // Penalize excessive renders
      if (data.renderCount > 20 && data.timeSinceMount < 10000) {
        score -= 10;
      }

      // Penalize slow API responses
      if (data.averageResponseTime > 2000) {
        score -= 15;
      }

      // Reward good cache hit rates
      if (data.cacheHitRate > 0.8) {
        score += 5;
      } else if (data.cacheHitRate < 0.3) {
        score -= 10;
      }

      // Penalize high memory usage (if available)
      if (data.memoryUsage > 50 * 1024 * 1024) { // 50MB
        score -= 5;
      }
    });

    return Math.max(0, Math.min(100, score));
  }, [performanceData]);

  // Get performance status
  const getPerformanceStatus = (score: number) => {
    if (score >= 90) return { status: 'excellent', color: 'green', icon: CheckCircle };
    if (score >= 70) return { status: 'good', color: 'blue', icon: TrendingUp };
    if (score >= 50) return { status: 'fair', color: 'yellow', icon: Activity };
    return { status: 'poor', color: 'red', icon: AlertTriangle };
  };

  const performanceStatus = getPerformanceStatus(overallScore);
  const StatusIcon = performanceStatus.icon;

  // Performance suggestions
  const getSuggestions = () => {
    const suggestions: string[] = [];

    performanceData.forEach(data => {
      if (data.renderCount > 20 && data.timeSinceMount < 10000) {
        suggestions.push(`${data.componentName}: Consider memoization to reduce re-renders`);
      }

      if (data.averageResponseTime > 2000) {
        suggestions.push(`${data.componentName}: API responses are slow, consider caching`);
      }

      if (data.cacheHitRate < 0.3 && data.apiCallCount > 5) {
        suggestions.push(`${data.componentName}: Low cache hit rate, review caching strategy`);
      }
    });

    return suggestions;
  };

  const suggestions = getSuggestions();

  // Only show in development or when explicitly enabled
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development' || showDetails);
  }, [showDetails]);

  if (!isVisible) return null;

  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 text-${performanceStatus.color}-500`} />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={overallScore >= 70 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {overallScore}/100
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Overall Performance Score */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Overall Performance</span>
            <span className={`text-${performanceStatus.color}-600 font-medium`}>
              {performanceStatus.status.toUpperCase()}
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Component Metrics */}
        {showDetails && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Component Metrics</h4>
            {performanceData.map((data, index) => (
              <div key={index} className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                <div className="font-medium">{data.componentName}</div>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {data.renderCount} renders
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {data.apiCallCount} API calls
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {Math.round(data.cacheHitRate * 100)}% cache hit
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(data.averageResponseTime)}ms avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Suggestions</h4>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Alert key={index} className="py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {suggestion}
                </AlertDescription>
              </Alert>
            ))}
            {suggestions.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{suggestions.length - 3} more suggestions
              </div>
            )}
          </div>
        )}

        {/* Toggle Details Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDetails}
          className="w-full h-7 text-xs"
        >
          {showDetails ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show Details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to collect performance data from multiple components
 */
export function usePerformanceDataCollector() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const addPerformanceData = React.useCallback((data: PerformanceData) => {
    setPerformanceData(prev => {
      const existing = prev.find(item => item.componentName === data.componentName);
      if (existing) {
        return prev.map(item => 
          item.componentName === data.componentName ? data : item
        );
      }
      return [...prev, data];
    });
  }, []);

  const removePerformanceData = React.useCallback((componentName: string) => {
    setPerformanceData(prev => prev.filter(item => item.componentName !== componentName));
  }, []);

  const clearPerformanceData = React.useCallback(() => {
    setPerformanceData([]);
  }, []);

  return {
    performanceData,
    addPerformanceData,
    removePerformanceData,
    clearPerformanceData,
  };
}

/**
 * Performance monitoring provider for teacher portal
 */
export function TeacherPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [showMonitor, setShowMonitor] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { performanceData } = usePerformanceDataCollector();

  // Show monitor in development or when performance issues detected
  useEffect(() => {
    const hasPerformanceIssues = performanceData.some(data => 
      data.renderCount > 20 || 
      data.averageResponseTime > 2000 ||
      data.cacheHitRate < 0.3
    );

    setShowMonitor(process.env.NODE_ENV === 'development' || hasPerformanceIssues);
  }, [performanceData]);

  return (
    <>
      {children}
      {showMonitor && (
        <TeacherPerformanceMonitor
          performanceData={performanceData}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />
      )}
    </>
  );
}
