'use client';

import React from 'react';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { teacherEducationalFacts, getRandomTeacherFacts } from '@/data/teacher-educational-facts';
import { useLoadingFacts } from '@/hooks/useLoadingFacts';

interface TeacherLoadingStateProps {
  title: string;
  description?: string;
  loadingSteps: Array<{
    label: string;
    duration: number;
    weight: number;
  }>;
  totalEstimatedTime?: number;
  showEducationalFacts?: boolean;
  factCategory?: 'pedagogy' | 'classroom-management' | 'assessment' | 'technology' | 'psychology' | 'research';
  className?: string;
}

/**
 * Comprehensive loading state component for teacher portal
 * Combines educational facts with labor illusion loader
 */
export function TeacherLoadingState({
  title,
  description,
  loadingSteps,
  totalEstimatedTime,
  showEducationalFacts = true,
  factCategory,
  className = ''
}: TeacherLoadingStateProps) {
  // Use teacher-specific facts
  const { currentFact } = useLoadingFacts({
    isLoading: true,
    autoRotate: true,
    interval: 6000,
    customFacts: factCategory 
      ? teacherEducationalFacts.filter(fact => fact.category === factCategory)
      : teacherEducationalFacts
  });

  return (
    <div className={`container mx-auto p-6 space-y-8 ${className}`}>
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Educational Fact */}
      {showEducationalFacts && (
        <div className="mb-8">
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">💡</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary mb-2">Teaching Insight</h3>
                  <p className="text-foreground leading-relaxed">
                    {currentFact?.fact || 'Loading educational insights...'}
                  </p>
                  {currentFact?.source && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      Source: {currentFact.source}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Labor Illusion Loader */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preparing Your Dashboard</h2>
          <LaborIllusionLoader
            isLoading={true}
            showTimeRemaining={true}
            totalEstimatedTime={totalEstimatedTime}
            steps={loadingSteps}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Predefined loading configurations for common teacher portal pages
 */
export const teacherLoadingConfigs = {
  dashboard: {
    title: 'Teacher Dashboard',
    description: 'Your teaching command center',
    factCategory: 'pedagogy' as const,
    totalEstimatedTime: 8,
    loadingSteps: [
      { label: 'Loading your classes...', duration: 1.5, weight: 15 },
      { label: 'Fetching student progress data...', duration: 2, weight: 20 },
      { label: 'Calculating class analytics...', duration: 1.5, weight: 15 },
      { label: 'Preparing activity recommendations...', duration: 2, weight: 20 },
      { label: 'Loading recent submissions...', duration: 1.5, weight: 15 },
      { label: 'Finalizing your dashboard...', duration: 1.5, weight: 15 },
    ]
  },
  
  classes: {
    title: 'My Classes',
    description: 'Manage your classes and students',
    factCategory: 'classroom-management' as const,
    totalEstimatedTime: 7,
    loadingSteps: [
      { label: 'Loading class information...', duration: 1.5, weight: 20 },
      { label: 'Fetching enrollment data...', duration: 1.5, weight: 20 },
      { label: 'Calculating class statistics...', duration: 2, weight: 25 },
      { label: 'Loading recent activities...', duration: 1.5, weight: 20 },
      { label: 'Finalizing class data...', duration: 1, weight: 15 },
    ]
  },
  
  assessments: {
    title: 'Assessments',
    description: 'Create and manage student assessments',
    factCategory: 'assessment' as const,
    totalEstimatedTime: 6,
    loadingSteps: [
      { label: 'Loading assessment data...', duration: 1.5, weight: 20 },
      { label: 'Fetching rubrics and criteria...', duration: 1.5, weight: 20 },
      { label: 'Processing student submissions...', duration: 2, weight: 30 },
      { label: 'Calculating grade distributions...', duration: 1, weight: 15 },
      { label: 'Preparing assessment tools...', duration: 1, weight: 15 },
    ]
  },
  
  grades: {
    title: 'Class Gradebook',
    description: 'Track and manage student grades',
    factCategory: 'assessment' as const,
    totalEstimatedTime: 9,
    loadingSteps: [
      { label: 'Loading gradebook data...', duration: 1.5, weight: 15 },
      { label: 'Fetching student grades...', duration: 2, weight: 20 },
      { label: 'Calculating grade statistics...', duration: 2, weight: 20 },
      { label: 'Processing activity scores...', duration: 1.5, weight: 15 },
      { label: 'Loading assessment results...', duration: 1.5, weight: 15 },
      { label: 'Finalizing gradebook view...', duration: 1.5, weight: 15 },
    ]
  },
  
  activities: {
    title: 'Class Activities',
    description: 'Manage learning activities and assignments',
    factCategory: 'pedagogy' as const,
    totalEstimatedTime: 7,
    loadingSteps: [
      { label: 'Loading activity library...', duration: 1.5, weight: 20 },
      { label: 'Fetching student progress...', duration: 2, weight: 25 },
      { label: 'Processing completion data...', duration: 1.5, weight: 20 },
      { label: 'Loading activity analytics...', duration: 1.5, weight: 20 },
      { label: 'Preparing activity tools...', duration: 1, weight: 15 },
    ]
  },
  
  reports: {
    title: 'Class Reports',
    description: 'Analyze student performance and progress',
    factCategory: 'research' as const,
    totalEstimatedTime: 10,
    loadingSteps: [
      { label: 'Gathering performance data...', duration: 2, weight: 20 },
      { label: 'Processing analytics...', duration: 2.5, weight: 25 },
      { label: 'Generating visualizations...', duration: 2, weight: 20 },
      { label: 'Calculating trends...', duration: 1.5, weight: 15 },
      { label: 'Preparing report summaries...', duration: 1.5, weight: 15 },
      { label: 'Finalizing reports...', duration: 1, weight: 5 },
    ]
  },
  
  schedule: {
    title: 'Teaching Schedule',
    description: 'View your classes and appointments',
    factCategory: 'classroom-management' as const,
    totalEstimatedTime: 5,
    loadingSteps: [
      { label: 'Loading schedule data...', duration: 1.5, weight: 25 },
      { label: 'Fetching class timetables...', duration: 1.5, weight: 25 },
      { label: 'Processing appointments...', duration: 1.5, weight: 25 },
      { label: 'Finalizing calendar view...', duration: 1, weight: 25 },
    ]
  },

  studentProgress: {
    title: 'Student Progress',
    description: 'Track individual student performance',
    factCategory: 'assessment' as const,
    totalEstimatedTime: 8,
    loadingSteps: [
      { label: 'Loading student profiles...', duration: 1.5, weight: 15 },
      { label: 'Fetching activity completions...', duration: 2, weight: 25 },
      { label: 'Calculating progress metrics...', duration: 2, weight: 25 },
      { label: 'Processing assessment scores...', duration: 1.5, weight: 15 },
      { label: 'Generating progress reports...', duration: 1.5, weight: 15 },
      { label: 'Finalizing student data...', duration: 1, weight: 5 },
    ]
  },

  contentStudio: {
    title: 'AI Content Studio',
    description: 'Create and manage educational content',
    factCategory: 'technology' as const,
    totalEstimatedTime: 6,
    loadingSteps: [
      { label: 'Initializing AI content tools...', duration: 1.5, weight: 20 },
      { label: 'Loading content templates...', duration: 1.5, weight: 20 },
      { label: 'Preparing AI models...', duration: 2, weight: 30 },
      { label: 'Setting up content library...', duration: 1, weight: 15 },
      { label: 'Finalizing studio interface...', duration: 1, weight: 15 },
    ]
  },

  communications: {
    title: 'Communications',
    description: 'Manage student and parent communications',
    factCategory: 'classroom-management' as const,
    totalEstimatedTime: 5,
    loadingSteps: [
      { label: 'Loading message threads...', duration: 1.5, weight: 25 },
      { label: 'Fetching contact information...', duration: 1.5, weight: 25 },
      { label: 'Processing notifications...', duration: 1.5, weight: 25 },
      { label: 'Preparing communication tools...', duration: 1, weight: 25 },
    ]
  }
};

/**
 * Quick loading component for specific teacher portal sections
 */
export function QuickTeacherLoading({ 
  configKey, 
  customTitle, 
  customDescription 
}: { 
  configKey: keyof typeof teacherLoadingConfigs;
  customTitle?: string;
  customDescription?: string;
}) {
  const config = teacherLoadingConfigs[configKey];
  
  return (
    <TeacherLoadingState
      title={customTitle || config.title}
      description={customDescription || config.description}
      factCategory={config.factCategory}
      totalEstimatedTime={config.totalEstimatedTime}
      loadingSteps={config.loadingSteps}
    />
  );
}
