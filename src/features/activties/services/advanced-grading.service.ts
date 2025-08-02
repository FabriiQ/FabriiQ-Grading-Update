/**
 * Advanced Grading Service
 * 
 * Provides advanced grading capabilities including batch grading, rubric-based assessment,
 * AI-powered feedback generation, and sophisticated grading workflows.
 */

import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { CognitiveAnalysisService } from '@/server/api/services/cognitive-analysis.service';

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100
  levels: Array<{
    level: number; // 1-4 (Excellent, Good, Satisfactory, Needs Improvement)
    name: string;
    description: string;
    points: number;
  }>;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  bloomsAlignment?: Record<BloomsTaxonomyLevel, number>; // Weight distribution
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchGradingRequest {
  submissionIds: string[];
  gradingMethod: 'ai_only' | 'rubric_only' | 'hybrid';
  rubricId?: string;
  aiSettings?: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
    confidenceThreshold: number;
    generateFeedback: boolean;
    bloomsAnalysis: boolean;
  };
  gradingOptions?: {
    allowPartialCredit: boolean;
    roundToNearest: number; // 0.1, 0.5, 1
    applyLatePenalty: boolean;
    latePenaltyPercent: number;
  };
}

export interface GradingResult {
  submissionId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  rubricResults?: Array<{
    criterionId: string;
    level: number;
    points: number;
    feedback: string;
  }>;
  aiAnalysis?: {
    bloomsLevel: BloomsTaxonomyLevel;
    confidence: number;
    strengths: string[];
    improvementAreas: string[];
    detailedFeedback: string;
  };
  overallFeedback: string;
  gradingMethod: string;
  gradedAt: Date;
  gradedBy: string;
  timeSpent?: number; // milliseconds
}

export interface BatchGradingResult {
  requestId: string;
  totalSubmissions: number;
  successfulGradings: number;
  failedGradings: number;
  results: GradingResult[];
  errors: Array<{
    submissionId: string;
    error: string;
  }>;
  summary: {
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
    gradingTime: number; // milliseconds
  };
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  description: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  scoreRange: { min: number; max: number };
  templates: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    encouragement: string[];
  };
  variables: string[]; // Placeholders like {studentName}, {score}, {topic}
}

export class AdvancedGradingService {
  private prisma: PrismaClient;
  private cognitiveAnalysis: CognitiveAnalysisService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cognitiveAnalysis = new CognitiveAnalysisService(prisma);
  }

  /**
   * Create a new rubric for assessment
   */
  async createRubric(rubric: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rubric> {
    try {
      const totalPoints = rubric.criteria.reduce((sum, criterion) => {
        const maxPoints = Math.max(...criterion.levels.map(l => l.points));
        return sum + (maxPoints * criterion.weight / 100);
      }, 0);

      const newRubric = await this.prisma.rubric.create({
        data: {
          title: rubric.name,
          description: rubric.description,
          maxScore: totalPoints,
          bloomsDistribution: JSON.stringify({
            criteria: rubric.criteria,
            bloomsAlignment: rubric.bloomsAlignment,
            totalPoints
          }) as any,
          createdById: rubric.createdBy,
          type: 'HOLISTIC'
        }
      });

      return {
        id: newRubric.id,
        name: newRubric.title,
        description: newRubric.description || '',
        criteria: rubric.criteria,
        totalPoints,
        bloomsAlignment: rubric.bloomsAlignment,
        createdBy: newRubric.createdById,
        createdAt: newRubric.createdAt,
        updatedAt: newRubric.updatedAt
      };
    } catch (error) {
      console.error('Error creating rubric:', error);
      throw new Error('Failed to create rubric');
    }
  }

  /**
   * Perform batch grading on multiple submissions
   */
  async performBatchGrading(
    request: BatchGradingRequest,
    gradedBy: string
  ): Promise<BatchGradingResult> {
    const startTime = Date.now();
    const requestId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const results: GradingResult[] = [];
      const errors: Array<{ submissionId: string; error: string }> = [];

      // Get submissions
      const submissions = await this.prisma.activityGrade.findMany({
        where: {
          id: { in: request.submissionIds }
        },
        include: {
          activity: {
            select: {
              title: true,
              content: true
            }
          }
        }
      });

      // Get rubric if specified
      let rubric: Rubric | null = null;
      if (request.rubricId) {
        rubric = await this.getRubric(request.rubricId);
      }

      // Process each submission
      for (const submission of submissions) {
        try {
          const gradingResult = await this.gradeSubmission(
            submission,
            request.gradingMethod,
            rubric,
            request.aiSettings,
            request.gradingOptions,
            gradedBy
          );
          
          results.push(gradingResult);
        } catch (error) {
          console.error(`Error grading submission ${submission.id}:`, error);
          errors.push({
            submissionId: submission.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Calculate summary statistics
      const summary = this.calculateBatchSummary(results, Date.now() - startTime);

      return {
        requestId,
        totalSubmissions: request.submissionIds.length,
        successfulGradings: results.length,
        failedGradings: errors.length,
        results,
        errors,
        summary
      };
    } catch (error) {
      console.error('Error performing batch grading:', error);
      throw new Error('Failed to perform batch grading');
    }
  }

  /**
   * Generate AI-powered feedback for a submission
   */
  async generateAIFeedback(
    submissionContent: string,
    activityType: string,
    score: number,
    bloomsLevel?: BloomsTaxonomyLevel,
    rubricResults?: any[]
  ): Promise<{
    strengths: string[];
    improvementAreas: string[];
    detailedFeedback: string;
    suggestions: string[];
  }> {
    try {
      // Use cognitive analysis service for AI feedback
      const analysis = await this.cognitiveAnalysis.analyzeCognitiveLevel(
        submissionContent,
        activityType,
        bloomsLevel
      );

      // Generate contextual feedback based on score and analysis
      const strengths = this.extractStrengths(analysis, score);
      const improvementAreas = this.extractImprovementAreas(analysis, score);
      const suggestions = this.generateSuggestions(analysis, bloomsLevel);
      const detailedFeedback = this.generateDetailedFeedback(
        analysis,
        score,
        strengths,
        improvementAreas,
        suggestions
      );

      return {
        strengths,
        improvementAreas,
        detailedFeedback,
        suggestions
      };
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      throw new Error('Failed to generate AI feedback');
    }
  }

  /**
   * Create feedback template for consistent grading
   */
  async createFeedbackTemplate(template: Omit<FeedbackTemplate, 'id'>): Promise<FeedbackTemplate> {
    try {
      // Store template in rubric table with special type
      const newTemplate = await this.prisma.rubric.create({
        data: {
          title: template.name,
          description: template.description,
          maxScore: 100,
          bloomsDistribution: JSON.stringify({
            bloomsLevel: template.bloomsLevel,
            scoreRange: template.scoreRange,
            templates: template.templates,
            variables: template.variables
          }) as any,
          createdById: 'system',
          type: 'HOLISTIC'
        }
      });

      return {
        id: newTemplate.id,
        ...template
      };
    } catch (error) {
      console.error('Error creating feedback template:', error);
      throw new Error('Failed to create feedback template');
    }
  }

  /**
   * Apply feedback template to generate personalized feedback
   */
  async applyFeedbackTemplate(
    templateId: string,
    variables: Record<string, string>,
    score: number
  ): Promise<string> {
    try {
      const template = await this.getFeedbackTemplate(templateId);
      
      if (score < template.scoreRange.min || score > template.scoreRange.max) {
        throw new Error('Score outside template range');
      }

      // Select appropriate feedback based on score
      const feedbackLevel = this.determineFeedbackLevel(score, template.scoreRange);
      let feedback = this.selectFeedbackFromTemplate(template, feedbackLevel);

      // Replace variables
      template.variables.forEach(variable => {
        const placeholder = `{${variable}}`;
        const value = variables[variable] || placeholder;
        feedback = feedback.replace(new RegExp(placeholder, 'g'), value);
      });

      return feedback;
    } catch (error) {
      console.error('Error applying feedback template:', error);
      throw new Error('Failed to apply feedback template');
    }
  }

  /**
   * Get grading analytics for a class or teacher
   */
  async getGradingAnalytics(
    classId?: string,
    teacherId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalGraded: number;
    averageScore: number;
    gradingMethods: Record<string, number>;
    bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
    rubricUsage: Array<{
      rubricId: string;
      rubricName: string;
      usageCount: number;
      averageScore: number;
    }>;
    gradingTrends: Array<{
      date: Date;
      count: number;
      averageScore: number;
    }>;
  }> {
    try {
      const where: any = {};
      
      if (classId) {
        where.activity = { classId };
      }
      if (teacherId) {
        where.gradedBy = teacherId;
      }
      if (timeframe) {
        where.gradedAt = {
          gte: timeframe.start,
          lte: timeframe.end
        };
      }

      const grades = await this.prisma.activityGrade.findMany({
        where: { ...where, gradedAt: { not: null } },
        include: {
          activity: {
            select: {
              title: true,
              classId: true
            }
          }
        }
      });

      return this.calculateGradingAnalytics(grades);
    } catch (error) {
      console.error('Error getting grading analytics:', error);
      throw new Error('Failed to get grading analytics');
    }
  }

  // Private helper methods

  private async getRubric(rubricId: string): Promise<Rubric> {
    const rubric = await this.prisma.rubric.findUnique({
      where: { id: rubricId }
    });

    if (!rubric) {
      throw new Error('Rubric not found');
    }

    const content = rubric.bloomsDistribution as any;
    return {
      id: rubric.id,
      name: rubric.title,
      description: rubric.description || '',
      criteria: content.criteria || [],
      totalPoints: rubric.maxScore,
      bloomsAlignment: content.bloomsAlignment,
      createdBy: rubric.createdById,
      createdAt: rubric.createdAt,
      updatedAt: rubric.updatedAt
    };
  }

  private async gradeSubmission(
    submission: any,
    gradingMethod: string,
    rubric: Rubric | null,
    aiSettings?: any,
    gradingOptions?: any,
    gradedBy?: string
  ): Promise<GradingResult> {
    const startTime = Date.now();
    
    let score = 0;
    let maxScore = 100;
    let rubricResults: any[] = [];
    let aiAnalysis: any = null;

    // Apply grading method
    switch (gradingMethod) {
      case 'rubric_only':
        if (!rubric) throw new Error('Rubric required for rubric-only grading');
        ({ score, maxScore, rubricResults } = await this.applyRubricGrading(submission, rubric));
        break;
        
      case 'ai_only':
        ({ score, maxScore, aiAnalysis } = await this.applyAIGrading(submission, aiSettings));
        break;
        
      case 'hybrid':
        if (!rubric) throw new Error('Rubric required for hybrid grading');
        const rubricGrading = await this.applyRubricGrading(submission, rubric);
        const aiGrading = await this.applyAIGrading(submission, aiSettings);
        
        // Combine scores (weighted average)
        score = (rubricGrading.score * 0.7) + (aiGrading.score * 0.3);
        maxScore = rubricGrading.maxScore;
        rubricResults = rubricGrading.rubricResults;
        aiAnalysis = aiGrading.aiAnalysis;
        break;
    }

    // Apply grading options
    if (gradingOptions) {
      score = this.applyGradingOptions(score, gradingOptions, submission);
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = percentage >= 60; // Default passing threshold

    // Generate overall feedback
    const overallFeedback = await this.generateOverallFeedback(
      score,
      percentage,
      aiAnalysis,
      rubricResults
    );

    // Update submission in database
    await this.updateSubmissionGrade(submission.id, {
      score,
      percentage,
      feedback: overallFeedback,
      rubricResults,
      aiAnalysis,
      gradedBy: gradedBy || 'system',
      gradedAt: new Date()
    });

    return {
      submissionId: submission.id,
      score,
      maxScore,
      percentage,
      passed,
      rubricResults,
      aiAnalysis,
      overallFeedback,
      gradingMethod,
      gradedAt: new Date(),
      gradedBy: gradedBy || 'system',
      timeSpent: Date.now() - startTime
    };
  }

  private async applyRubricGrading(submission: any, rubric: Rubric) {
    // Implementation for rubric-based grading
    const rubricResults: any[] = [];
    let totalScore = 0;
    
    // For now, apply a simple scoring algorithm
    // In production, this would involve more sophisticated analysis
    for (const criterion of rubric.criteria) {
      const level = Math.floor(Math.random() * 4) + 1; // Random for demo
      const points = criterion.levels.find(l => l.level === level)?.points || 0;
      const weightedPoints = (points * criterion.weight) / 100;
      
      rubricResults.push({
        criterionId: criterion.id,
        level,
        points: weightedPoints,
        feedback: `Performance at level ${level} for ${criterion.name}`
      });
      
      totalScore += weightedPoints;
    }

    return {
      score: totalScore,
      maxScore: rubric.totalPoints,
      rubricResults
    };
  }

  private async applyAIGrading(submission: any, aiSettings?: any) {
    // Use cognitive analysis for AI grading
    const content = submission.content as any;
    const submissionText = content?.text || content?.answer || '';
    
    const analysis = await this.cognitiveAnalysis.analyzeCognitiveLevel(
      submissionText,
      'essay' // Default activity type
    );

    // Convert analysis to score
    const bloomsLevelScores = {
      [BloomsTaxonomyLevel.REMEMBER]: 60,
      [BloomsTaxonomyLevel.UNDERSTAND]: 70,
      [BloomsTaxonomyLevel.APPLY]: 75,
      [BloomsTaxonomyLevel.ANALYZE]: 80,
      [BloomsTaxonomyLevel.EVALUATE]: 85,
      [BloomsTaxonomyLevel.CREATE]: 90
    };

    const baseScore = bloomsLevelScores[analysis.detectedLevel] || 70;
    const confidenceAdjustment = (analysis.confidence - 0.5) * 20; // -10 to +10
    const score = Math.max(0, Math.min(100, baseScore + confidenceAdjustment));

    return {
      score,
      maxScore: 100,
      aiAnalysis: {
        bloomsLevel: analysis.detectedLevel,
        confidence: analysis.confidence,
        strengths: analysis.evidence,
        improvementAreas: analysis.recommendations,
        detailedFeedback: analysis.reasoning
      }
    };
  }

  private applyGradingOptions(score: number, options: any, submission: any): number {
    let adjustedScore = score;

    // Apply late penalty
    if (options.applyLatePenalty && submission.submittedAt > submission.activity.dueDate) {
      adjustedScore *= (1 - options.latePenaltyPercent / 100);
    }

    // Round to nearest
    if (options.roundToNearest) {
      adjustedScore = Math.round(adjustedScore / options.roundToNearest) * options.roundToNearest;
    }

    return Math.max(0, adjustedScore);
  }

  private async generateOverallFeedback(
    score: number,
    percentage: number,
    aiAnalysis?: any,
    rubricResults?: any[]
  ): Promise<string> {
    let feedback = `Score: ${score.toFixed(1)} (${percentage.toFixed(1)}%)\n\n`;

    if (aiAnalysis) {
      feedback += `Cognitive Level: ${aiAnalysis.bloomsLevel}\n`;
      feedback += `AI Confidence: ${(aiAnalysis.confidence * 100).toFixed(1)}%\n\n`;
      feedback += `Detailed Analysis: ${aiAnalysis.detailedFeedback}\n\n`;
    }

    if (rubricResults && rubricResults.length > 0) {
      feedback += 'Rubric Assessment:\n';
      rubricResults.forEach(result => {
        feedback += `- ${result.feedback}\n`;
      });
    }

    return feedback;
  }

  private async updateSubmissionGrade(submissionId: string, gradeData: any) {
    await this.prisma.activityGrade.update({
      where: { id: submissionId },
      data: {
        score: gradeData.score,
        feedback: gradeData.feedback,
        gradedAt: gradeData.gradedAt,
        content: JSON.stringify({
          ...gradeData,
          gradingMethod: 'advanced'
        }) as any
      }
    });
  }

  private calculateBatchSummary(results: GradingResult[], gradingTime: number) {
    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);
    const passCount = results.filter(r => r.passed).length;

    const bloomsDistribution: Record<BloomsTaxonomyLevel, number> = {} as any;
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      bloomsDistribution[level] = results.filter(r => 
        r.aiAnalysis?.bloomsLevel === level
      ).length;
    });

    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      passRate: (passCount / results.length) * 100,
      bloomsDistribution,
      gradingTime
    };
  }

  private extractStrengths(analysis: any, score: number): string[] {
    const strengths = [...analysis.evidence];
    
    if (score >= 80) {
      strengths.push('Demonstrates strong understanding of the topic');
    }
    if (analysis.confidence > 0.8) {
      strengths.push('Clear and well-structured response');
    }
    
    return strengths;
  }

  private extractImprovementAreas(analysis: any, score: number): string[] {
    const areas = [...analysis.recommendations];
    
    if (score < 70) {
      areas.push('Consider reviewing fundamental concepts');
    }
    if (analysis.confidence < 0.6) {
      areas.push('Work on clarity and organization of ideas');
    }
    
    return areas;
  }

  private generateSuggestions(analysis: any, bloomsLevel?: BloomsTaxonomyLevel): string[] {
    const suggestions: string[] = [];

    if (bloomsLevel && analysis.detectedLevel !== bloomsLevel) {
      suggestions.push(`Try to demonstrate ${bloomsLevel} level thinking in your response`);
    }

    suggestions.push('Review the learning objectives for this activity');
    suggestions.push('Consider seeking feedback from peers or instructors');

    return suggestions;
  }

  private generateDetailedFeedback(
    analysis: any,
    score: number,
    strengths: string[],
    improvementAreas: string[],
    suggestions: string[]
  ): string {
    let feedback = `Your submission demonstrates ${analysis.detectedLevel} level thinking. `;
    feedback += `${analysis.reasoning}\n\n`;
    
    if (strengths.length > 0) {
      feedback += `Strengths:\n${strengths.map(s => `• ${s}`).join('\n')}\n\n`;
    }
    
    if (improvementAreas.length > 0) {
      feedback += `Areas for Improvement:\n${improvementAreas.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    if (suggestions.length > 0) {
      feedback += `Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`;
    }
    
    return feedback;
  }

  private async getFeedbackTemplate(templateId: string): Promise<FeedbackTemplate> {
    const template = await this.prisma.rubric.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Feedback template not found');
    }

    const content = template.bloomsDistribution as any;
    return {
      id: template.id,
      name: template.title,
      description: template.description || '',
      bloomsLevel: content.bloomsLevel,
      scoreRange: content.scoreRange || { min: 0, max: 100 },
      templates: content.templates || { strengths: [], improvements: [], suggestions: [], encouragement: [] },
      variables: content.variables || []
    };
  }

  private determineFeedbackLevel(score: number, scoreRange: { min: number; max: number }): string {
    const percentage = (score - scoreRange.min) / (scoreRange.max - scoreRange.min);
    
    if (percentage >= 0.9) return 'excellent';
    if (percentage >= 0.8) return 'good';
    if (percentage >= 0.7) return 'satisfactory';
    return 'needs_improvement';
  }

  private selectFeedbackFromTemplate(template: FeedbackTemplate, level: string): string {
    // Simple template selection logic
    const templates = template.templates;
    
    switch (level) {
      case 'excellent':
        return `${templates.strengths[0]} ${templates.encouragement[0]}`;
      case 'good':
        return `${templates.strengths[0]} ${templates.suggestions[0]}`;
      case 'satisfactory':
        return `${templates.improvements[0]} ${templates.suggestions[0]}`;
      default:
        return `${templates.improvements[0]} ${templates.suggestions[0]}`;
    }
  }

  private calculateGradingAnalytics(grades: any[]) {
    const totalGraded = grades.length;
    const averageScore = grades.reduce((sum, g) => sum + (g.score || 0), 0) / totalGraded;
    
    const gradingMethods: Record<string, number> = {};
    const bloomsDistribution: Record<BloomsTaxonomyLevel, number> = {} as any;
    
    grades.forEach(grade => {
      const content = grade.content as any;
      const method = content?.gradingMethod || 'manual';
      gradingMethods[method] = (gradingMethods[method] || 0) + 1;
      
      const bloomsLevel = content?.aiAnalysis?.bloomsLevel;
      if (bloomsLevel) {
        bloomsDistribution[bloomsLevel] = (bloomsDistribution[bloomsLevel] || 0) + 1;
      }
    });

    return {
      totalGraded,
      averageScore,
      gradingMethods,
      bloomsDistribution,
      rubricUsage: [], // Placeholder
      gradingTrends: [] // Placeholder
    };
  }
}
