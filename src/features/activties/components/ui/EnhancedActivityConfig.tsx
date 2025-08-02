'use client';

/**
 * Enhanced Activity Configuration System
 * 
 * Streamlined, unified configuration system for all activity types that:
 * - Consolidates all configuration approaches
 * - Provides consistent UI/UX across all activities
 * - Integrates with enhanced submit system
 * - Supports all grading methods (auto, manual, hybrid, rubric)
 * - Includes achievement and points configuration
 * - Prevents configuration conflicts
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, BookOpen, Clock, Users, Target, Award, Zap, Lightbulb,
  CheckCircle, AlertCircle, Info, Save, Eye, Edit
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { useMemoryLeakPrevention } from '../../services/memory-leak-prevention.service';

/**
 * Unified Activity Configuration Interface
 */
export interface UnifiedActivityConfig {
  // Basic Information
  id?: string;
  title: string;
  description: string;
  instructions: string;
  activityType: string;
  
  // Academic Context
  subject: string;
  topic?: string;
  bloomsLevel: BloomsTaxonomyLevel;
  learningObjectives: string[];
  
  // Grading Configuration
  gradingConfig: {
    method: 'auto' | 'manual' | 'hybrid' | 'rubric';
    maxScore: number;
    passingScore: number;
    rubricId?: string;
    
    // AI Grading (for hybrid/AI methods)
    aiGrading?: {
      enabled: boolean;
      model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
      confidenceThreshold: number;
    };
    
    // Manual Grading
    manualGrading?: {
      requiresReview: boolean;
      allowTeacherOverride: boolean;
      deadlineHours?: number;
    };
  };
  
  // Submission Settings
  submissionConfig: {
    maxAttempts: number;
    timeLimit?: number; // in minutes
    allowLateSubmissions: boolean;
    latePenaltyPercent?: number;
    requireConfirmation: boolean;
    allowSaveProgress: boolean;
    autoSave: boolean;
  };
  
  // Achievement & Points
  achievementConfig: {
    enableAchievements: boolean;
    enablePointsAnimation: boolean;
    celebrationLevel: 'minimal' | 'standard' | 'enthusiastic';
    customPointsMultiplier: number;
    bonusPointsForPerfectScore: number;
    bonusPointsForSpeed: number;
  };
  
  // Display Settings
  displayConfig: {
    showRubricToStudents: boolean;
    showProgressIndicator: boolean;
    showTimeRemaining: boolean;
    showWordCount: boolean; // for text-based activities
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    singleQuestionMode: boolean;
  };
  
  // Accessibility & UX
  accessibilityConfig: {
    enableKeyboardNavigation: boolean;
    enableScreenReader: boolean;
    highContrastMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    enableHints: boolean;
    enableFeedback: boolean;
  };
  
  // Advanced Settings
  advancedConfig: {
    enableOfflineMode: boolean;
    enableAnalytics: boolean;
    enableMemoryOptimization: boolean;
    cacheStrategy: 'none' | 'basic' | 'aggressive';
    performanceMode: 'standard' | 'optimized';
  };
}

/**
 * Props for Enhanced Activity Config component
 */
export interface EnhancedActivityConfigProps {
  config: UnifiedActivityConfig;
  onChange: (config: UnifiedActivityConfig) => void;
  onSave?: (config: UnifiedActivityConfig) => void;
  onPreview?: (config: UnifiedActivityConfig) => void;
  mode?: 'create' | 'edit' | 'view';
  className?: string;
  showAdvancedSettings?: boolean;
}

/**
 * Enhanced Activity Configuration Component
 */
export function EnhancedActivityConfig({
  config,
  onChange,
  onSave,
  onPreview,
  mode = 'edit',
  className = '',
  showAdvancedSettings = false
}: EnhancedActivityConfigProps) {
  const { isMounted } = useMemoryLeakPrevention('enhanced-activity-config');
  const [activeTab, setActiveTab] = useState('basic');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Handle configuration changes with validation
   */
  const handleConfigChange = useCallback((updates: Partial<UnifiedActivityConfig>) => {
    if (!isMounted()) return;
    
    const newConfig = { ...config, ...updates };
    
    // Validate configuration
    const errors = validateConfiguration(newConfig);
    setValidationErrors(errors);
    
    onChange(newConfig);
  }, [config, onChange, isMounted]);

  /**
   * Validate configuration for consistency and completeness
   */
  const validateConfiguration = (cfg: UnifiedActivityConfig): string[] => {
    const errors: string[] = [];
    
    // Basic validation
    if (!cfg.title.trim()) errors.push('Title is required');
    if (!cfg.description.trim()) errors.push('Description is required');
    if (cfg.gradingConfig.maxScore <= 0) errors.push('Max score must be greater than 0');
    if (cfg.gradingConfig.passingScore > cfg.gradingConfig.maxScore) {
      errors.push('Passing score cannot exceed max score');
    }
    
    // Grading method validation
    if (cfg.gradingConfig.method === 'rubric' && !cfg.gradingConfig.rubricId) {
      errors.push('Rubric ID is required for rubric grading');
    }
    
    // Time limit validation
    if (cfg.submissionConfig.timeLimit && cfg.submissionConfig.timeLimit < 1) {
      errors.push('Time limit must be at least 1 minute');
    }
    
    return errors;
  };

  /**
   * Handle save with validation
   */
  const handleSave = useCallback(async () => {
    if (!isMounted()) return;
    
    setIsValidating(true);
    const errors = validateConfiguration(config);
    
    if (errors.length === 0) {
      onSave?.(config);
    } else {
      setValidationErrors(errors);
    }
    
    setIsValidating(false);
  }, [config, onSave, isMounted]);

  /**
   * Render configuration section with animation
   */
  const renderConfigSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Grading
          </TabsTrigger>
          <TabsTrigger value="submission" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Submission
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Display
          </TabsTrigger>
          {showAdvancedSettings && (
            <TabsTrigger value="advanced" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          )}
        </TabsList>

        {/* Basic Configuration */}
        <TabsContent value="basic" className="space-y-4">
          {renderConfigSection(
            'Basic Information',
            <BookOpen className="h-5 w-5" />,
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => handleConfigChange({ title: e.target.value })}
                    placeholder="Enter activity title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select
                    value={config.activityType}
                    onValueChange={(value) => handleConfigChange({ activityType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="matching">Matching</SelectItem>
                      <SelectItem value="drag-and-drop">Drag & Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => handleConfigChange({ description: e.target.value })}
                  placeholder="Describe what students will learn"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={config.instructions}
                  onChange={(e) => handleConfigChange({ instructions: e.target.value })}
                  placeholder="Provide clear instructions for students"
                  rows={3}
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Grading Configuration */}
        <TabsContent value="grading" className="space-y-4">
          {renderConfigSection(
            'Grading Configuration',
            <Target className="h-5 w-5" />,
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Grading Method</Label>
                  <Select
                    value={config.gradingConfig.method}
                    onValueChange={(value: any) => 
                      handleConfigChange({ 
                        gradingConfig: { ...config.gradingConfig, method: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="hybrid">Hybrid (AI + Manual)</SelectItem>
                      <SelectItem value="rubric">Rubric-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={config.gradingConfig.maxScore}
                    onChange={(e) => 
                      handleConfigChange({ 
                        gradingConfig: { ...config.gradingConfig, maxScore: parseInt(e.target.value) || 100 }
                      })
                    }
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Passing Score</Label>
                  <Input
                    type="number"
                    value={config.gradingConfig.passingScore}
                    onChange={(e) => 
                      handleConfigChange({ 
                        gradingConfig: { ...config.gradingConfig, passingScore: parseInt(e.target.value) || 60 }
                      })
                    }
                    min="1"
                    max={config.gradingConfig.maxScore}
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Achievement Configuration */}
        <TabsContent value="achievements" className="space-y-4">
          {renderConfigSection(
            'Achievement & Points Configuration',
            <Award className="h-5 w-5" />,
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Achievements</Label>
                    <p className="text-sm text-muted-foreground">
                      Show achievement badges and points when students complete activities
                    </p>
                  </div>
                  <Switch
                    checked={config.achievementConfig.enableAchievements}
                    onCheckedChange={(checked) =>
                      handleConfigChange({
                        achievementConfig: { ...config.achievementConfig, enableAchievements: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Points Animation</Label>
                    <p className="text-sm text-muted-foreground">
                      Show animated points and celebration effects
                    </p>
                  </div>
                  <Switch
                    checked={config.achievementConfig.enablePointsAnimation}
                    onCheckedChange={(checked) =>
                      handleConfigChange({
                        achievementConfig: { ...config.achievementConfig, enablePointsAnimation: checked }
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Celebration Level</Label>
                  <Select
                    value={config.achievementConfig.celebrationLevel}
                    onValueChange={(value: any) =>
                      handleConfigChange({
                        achievementConfig: { ...config.achievementConfig, celebrationLevel: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" onClick={() => onPreview(config)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {onSave && (
            <Button 
              onClick={handleSave} 
              disabled={isValidating || validationErrors.length > 0}
              className="min-w-[100px]"
            >
              {isValidating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Settings className="h-4 w-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
