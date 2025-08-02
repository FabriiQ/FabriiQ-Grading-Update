/**
 * Standardized Activity Configuration Display
 * 
 * Unified component for displaying activity configurations consistently
 * across all activity types and contexts. Eliminates duplicate displays
 * and ensures consistent UI patterns.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  BookOpen,
  Clock,
  Users,
  Target,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Edit,
  Eye,
  Save
} from 'lucide-react';

// Unified configuration interface
export interface ActivityConfiguration {
  // Basic Information
  title: string;
  description: string;
  instructions: string;
  
  // Academic Context
  subject: string;
  topic?: string;
  bloomsLevel: string;
  
  // Activity Settings
  activityType: string;
  gradingType: 'manual' | 'auto' | 'hybrid';
  maxScore: number;
  passingScore: number;
  
  // Timing & Availability
  timeLimit?: number;
  maxAttempts: number;
  dueDate?: Date;
  
  // Submission Settings
  allowLateSubmissions: boolean;
  allowFileUpload: boolean;
  allowTextSubmission: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  
  // Display Settings
  showRubricToStudents: boolean;
  randomizeQuestions: boolean;
  isPublished: boolean;
  
  // Advanced Settings
  rubricId?: string;
  customSettings?: Record<string, any>;
}

interface StandardizedActivityConfigProps {
  configuration: ActivityConfiguration;
  mode: 'view' | 'edit' | 'preview';
  onEdit?: () => void;
  onSave?: (config: ActivityConfiguration) => void;
  className?: string;
  showAdvanced?: boolean;
}

export function StandardizedActivityConfig({
  configuration,
  mode = 'view',
  onEdit,
  onSave,
  className = '',
  showAdvanced = false
}: StandardizedActivityConfigProps) {
  const [activeTab, setActiveTab] = useState('basic');

  // Configuration validation
  const validateConfiguration = () => {
    const issues: string[] = [];
    
    if (!configuration.title?.trim()) issues.push('Title is required');
    if (!configuration.description?.trim()) issues.push('Description is required');
    if (!configuration.instructions?.trim()) issues.push('Instructions are required');
    if (configuration.passingScore >= configuration.maxScore) {
      issues.push('Passing score must be less than maximum score');
    }
    
    return issues;
  };

  const validationIssues = validateConfiguration();
  const isValid = validationIssues.length === 0;

  // Get configuration status
  const getConfigurationStatus = () => {
    if (!isValid) return { status: 'error', message: 'Configuration has issues' };
    if (!configuration.isPublished) return { status: 'draft', message: 'Draft - not published' };
    return { status: 'published', message: 'Published and active' };
  };

  const configStatus = getConfigurationStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Activity Configuration</h2>
          </div>
          
          <Badge 
            variant={
              configStatus.status === 'published' ? 'default' :
              configStatus.status === 'error' ? 'destructive' : 'secondary'
            }
          >
            {configStatus.message}
          </Badge>
        </div>

        {mode === 'view' && onEdit && (
          <Button onClick={onEdit} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Configuration
          </Button>
        )}
      </div>

      {/* Validation Issues */}
      {!isValid && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-red-800">Configuration Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-700">{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="submission" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Submission
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Core activity details and academic context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Title</h4>
                  <p className="font-medium">{configuration.title || 'Untitled Activity'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Activity Type</h4>
                  <Badge variant="outline">{configuration.activityType}</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Subject</h4>
                  <p>{configuration.subject}</p>
                </div>
                
                {configuration.topic && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Topic</h4>
                    <p>{configuration.topic}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Bloom's Level</h4>
                  <Badge variant="secondary">{configuration.bloomsLevel}</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Grading Type</h4>
                  <Badge variant={configuration.gradingType === 'auto' ? 'default' : 'outline'}>
                    {configuration.gradingType.charAt(0).toUpperCase() + configuration.gradingType.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-sm leading-relaxed">{configuration.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Instructions</h4>
                <p className="text-sm leading-relaxed">{configuration.instructions}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Activity Settings
              </CardTitle>
              <CardDescription>
                Scoring, timing, and behavior configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{configuration.maxScore}</div>
                  <div className="text-sm text-muted-foreground">Maximum Score</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{configuration.passingScore}</div>
                  <div className="text-sm text-muted-foreground">Passing Score</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{configuration.maxAttempts}</div>
                  <div className="text-sm text-muted-foreground">Max Attempts</div>
                </div>
              </div>

              {configuration.timeLimit && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Time limit: <strong>{configuration.timeLimit} minutes</strong>
                  </span>
                </div>
              )}

              {configuration.dueDate && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Due date: <strong>{configuration.dueDate.toLocaleDateString()}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Display Settings</h4>
                <div className="flex flex-wrap gap-2">
                  {configuration.showRubricToStudents && (
                    <Badge variant="secondary">Rubric visible to students</Badge>
                  )}
                  {configuration.randomizeQuestions && (
                    <Badge variant="secondary">Questions randomized</Badge>
                  )}
                  {configuration.allowLateSubmissions && (
                    <Badge variant="secondary">Late submissions allowed</Badge>
                  )}
                  {configuration.isPublished && (
                    <Badge variant="default">Published</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submission Tab */}
        <TabsContent value="submission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Settings
              </CardTitle>
              <CardDescription>
                How students can submit their work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Submission Methods</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {configuration.allowTextSubmission ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Text submission</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {configuration.allowFileUpload ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">File upload</span>
                    </div>
                  </div>
                </div>

                {configuration.allowFileUpload && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">File Upload Settings</h4>
                    <div className="space-y-2 text-sm">
                      {configuration.maxFileSize && (
                        <div>Max file size: <strong>{configuration.maxFileSize}MB</strong></div>
                      )}
                      {configuration.allowedFileTypes && (
                        <div>
                          Allowed types: <strong>{configuration.allowedFileTypes.join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Additional settings and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configuration.rubricId && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">Grading Rubric</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rubric ID: {configuration.rubricId}
                  </p>
                </div>
              )}

              {configuration.customSettings && Object.keys(configuration.customSettings).length > 0 && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium text-sm">Custom Settings</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(configuration.customSettings).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!configuration.rubricId && (!configuration.customSettings || Object.keys(configuration.customSettings).length === 0)) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No advanced settings configured for this activity.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons for Edit Mode */}
      {mode === 'edit' && onSave && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setActiveTab('basic')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={() => onSave(configuration)}
            disabled={!isValid}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component for configuration summary
export function ActivityConfigSummary({ 
  configuration, 
  className = '' 
}: { 
  configuration: ActivityConfiguration; 
  className?: string; 
}) {
  return (
    <div className={`p-4 border rounded-lg space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{configuration.title}</h4>
        <Badge variant="outline">{configuration.activityType}</Badge>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {configuration.subject} • {configuration.bloomsLevel} • {configuration.maxScore} points
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={configuration.gradingType === 'auto' ? 'default' : 'secondary'}>
          {configuration.gradingType}
        </Badge>
        {configuration.isPublished && (
          <Badge variant="default">Published</Badge>
        )}
        {configuration.timeLimit && (
          <Badge variant="outline">{configuration.timeLimit}min</Badge>
        )}
      </div>
    </div>
  );
}
