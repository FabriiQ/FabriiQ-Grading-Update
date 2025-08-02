'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface EarlyWarning {
  type: 'performance_decline' | 'engagement_drop' | 'cognitive_overload' | 'motivation_loss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  predictions: string[];
  interventions: string[];
  timeline: string;
}

interface EarlyWarningSystemProps {
  warnings: EarlyWarning[];
  isLoading?: boolean;
  classId?: string;
}

const warningIcons = {
  performance_decline: TrendingDown,
  engagement_drop: Clock,
  cognitive_overload: Zap,
  motivation_loss: Activity
};

const severityColors = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive'
} as const;

const severityIcons = {
  low: Info,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: XCircle
};

export function EarlyWarningSystem({ warnings, isLoading, classId }: EarlyWarningSystemProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!classId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Select a class to view early warning indicators
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!warnings || warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            All Clear
          </CardTitle>
          <CardDescription>
            No early warning indicators detected for this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Students appear to be performing well with no immediate concerns identified.
            Continue monitoring for any changes in learning patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group warnings by severity
  const warningsBySeverity = warnings.reduce((acc, warning) => {
    if (!acc[warning.severity]) acc[warning.severity] = [];
    acc[warning.severity].push(warning);
    return acc;
  }, {} as Record<string, EarlyWarning[]>);

  const criticalWarnings = warningsBySeverity.critical || [];
  const highWarnings = warningsBySeverity.high || [];
  const mediumWarnings = warningsBySeverity.medium || [];
  const lowWarnings = warningsBySeverity.low || [];

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      {(criticalWarnings.length > 0 || highWarnings.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Immediate Attention Required:</strong> {criticalWarnings.length + highWarnings.length} 
            {criticalWarnings.length + highWarnings.length === 1 ? ' student needs' : ' students need'} urgent intervention.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalWarnings.length}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highWarnings.length}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumWarnings.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{lowWarnings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Warnings */}
      <div className="space-y-4">
        {warnings
          .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
          })
          .map((warning, index) => {
            const WarningIcon = warningIcons[warning.type];
            const SeverityIcon = severityIcons[warning.severity];
            
            return (
              <Card key={index} className={`border-l-4 ${
                warning.severity === 'critical' ? 'border-l-red-500' :
                warning.severity === 'high' ? 'border-l-orange-500' :
                warning.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WarningIcon className="h-5 w-5" />
                      <span className="capitalize">
                        {warning.type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant={severityColors[warning.severity]} className="flex items-center gap-1">
                      <SeverityIcon className="h-3 w-3" />
                      {warning.severity}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Expected timeline: {warning.timeline}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Indicators */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Warning Indicators</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {warning.indicators.map((indicator, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Predictions */}
                  {warning.predictions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Predicted Outcomes</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {warning.predictions.map((prediction, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{prediction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interventions */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Recommended Interventions</h4>
                    <ul className="text-sm space-y-1">
                      {warning.interventions.map((intervention, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{intervention}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      Contact Student
                    </Button>
                    <Button size="sm" variant="outline">
                      Schedule Meeting
                    </Button>
                    <Button size="sm" variant="outline">
                      Mark Addressed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
