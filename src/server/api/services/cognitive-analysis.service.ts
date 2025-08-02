/**
 * AI-Powered Cognitive Analysis Service
 * 
 * Automatically detects Bloom's taxonomy levels from student work,
 * tracks cognitive progression, and provides learning insights.
 */

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

export interface CognitiveAnalysisResult {
  detectedLevel: BloomsTaxonomyLevel;
  confidence: number;
  evidence: string[];
  reasoning: string;
  skillsAssessment: {
    criticalThinking: number;
    problemSolving: number;
    creativity: number;
    analysis: number;
    synthesis: number;
    evaluation: number;
  };
  cognitiveComplexity: 'low' | 'medium' | 'high' | 'very_high';
  recommendations: string[];
}

export interface CognitiveProgression {
  studentId: string;
  currentLevel: BloomsTaxonomyLevel;
  levelHistory: Array<{
    level: BloomsTaxonomyLevel;
    confidence: number;
    date: Date;
    activityType: string;
  }>;
  progressionTrend: 'improving' | 'stable' | 'declining';
  nextRecommendedLevel: BloomsTaxonomyLevel;
  readinessScore: number; // 0-100 score for next level readiness
  cognitiveGaps: string[];
  strengthAreas: string[];
}

export interface LearningPattern {
  patternType: 'sequential' | 'global' | 'visual' | 'verbal' | 'active' | 'reflective';
  confidence: number;
  indicators: string[];
  recommendations: string[];
}

export class CognitiveAnalysisService {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private readonly MODEL = 'gpt-4-turbo-preview';

  constructor(prisma: PrismaClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.prisma = prisma;
  }

  /**
   * Analyze student work to detect Bloom's taxonomy level
   */
  async analyzeCognitiveLevel(
    studentWork: string,
    activityType: string,
    expectedLevel?: BloomsTaxonomyLevel
  ): Promise<CognitiveAnalysisResult> {
    try {
      const prompt = this.buildCognitiveAnalysisPrompt(studentWork, activityType, expectedLevel);

      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational psychologist specializing in Bloom\'s taxonomy and cognitive assessment. Analyze student work to determine demonstrated cognitive levels with high accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2, // Lower temperature for more consistent analysis
        response_format: { type: 'json_object' }
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from AI');
      }

      return this.parseAnalysisResult(analysisText);
    } catch (error) {
      console.error('Error in cognitive analysis:', error);
      throw new Error('Failed to analyze cognitive level');
    }
  }

  /**
   * Track cognitive progression for a student
   */
  async trackCognitiveProgression(
    studentId: string,
    classId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<CognitiveProgression> {
    try {
      const where: any = {
        studentId,
        bloomsLevel: { not: null },
        gradedAt: { not: null }
      };

      if (classId) {
        where.activity = { classId };
      }

      if (timeframe) {
        where.gradedAt = {
          gte: timeframe.start,
          lte: timeframe.end
        };
      }

      const submissions = await this.prisma.activityGrade.findMany({
        where,
        include: {
          activity: {
            select: {
              title: true,
              content: true
            }
          }
        },
        orderBy: {
          gradedAt: 'asc'
        }
      });

      if (submissions.length === 0) {
        throw new Error('No graded submissions found for student');
      }

      return this.analyzeProgression(submissions);
    } catch (error) {
      console.error('Error tracking cognitive progression:', error);
      throw new Error('Failed to track cognitive progression');
    }
  }

  /**
   * Detect learning patterns from student behavior
   */
  async detectLearningPatterns(
    studentId: string,
    classId?: string
  ): Promise<LearningPattern[]> {
    try {
      const submissions = await this.prisma.activityGrade.findMany({
        where: {
          studentId,
          ...(classId && { activity: { classId } })
        },
        include: {
          activity: {
            select: {
              title: true,
              content: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 50 // Analyze recent submissions
      });

      return this.analyzeLearningPatterns(submissions);
    } catch (error) {
      console.error('Error detecting learning patterns:', error);
      throw new Error('Failed to detect learning patterns');
    }
  }

  /**
   * Generate cognitive insights for a class
   */
  async generateClassCognitiveInsights(
    classId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    overallProgression: 'positive' | 'neutral' | 'concerning';
    bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
    cognitiveGaps: Array<{
      level: BloomsTaxonomyLevel;
      studentCount: number;
      percentage: number;
    }>;
    recommendations: string[];
    studentsNeedingSupport: Array<{
      studentId: string;
      studentName: string;
      currentLevel: BloomsTaxonomyLevel;
      concerns: string[];
    }>;
  }> {
    try {
      const where: any = {
        activity: { classId },
        bloomsLevel: { not: null },
        gradedAt: { not: null }
      };

      if (timeframe) {
        where.gradedAt = {
          gte: timeframe.start,
          lte: timeframe.end
        };
      }

      const submissions = await this.prisma.activityGrade.findMany({
        where,
        include: {
          student: {
            include: {
              user: true
            }
          },
          activity: {
            select: {
              title: true,
              content: true
            }
          }
        }
      });

      return this.analyzeClassCognitiveInsights(submissions);
    } catch (error) {
      console.error('Error generating class cognitive insights:', error);
      throw new Error('Failed to generate class cognitive insights');
    }
  }

  /**
   * Build cognitive analysis prompt
   */
  private buildCognitiveAnalysisPrompt(
    studentWork: string,
    activityType: string,
    expectedLevel?: BloomsTaxonomyLevel
  ): string {
    return `
Analyze this student work to determine the demonstrated Bloom's taxonomy cognitive level.

STUDENT WORK:
"""
${studentWork}
"""

ACTIVITY TYPE: ${activityType}
${expectedLevel ? `EXPECTED LEVEL: ${expectedLevel}` : ''}

Please provide your analysis in the following JSON format:

{
  "detectedLevel": "<REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE>",
  "confidence": <0-1>,
  "evidence": ["<evidence 1>", "<evidence 2>", "<evidence 3>"],
  "reasoning": "<detailed explanation of why this level was detected>",
  "skillsAssessment": {
    "criticalThinking": <0-100>,
    "problemSolving": <0-100>,
    "creativity": <0-100>,
    "analysis": <0-100>,
    "synthesis": <0-100>,
    "evaluation": <0-100>
  },
  "cognitiveComplexity": "<low|medium|high|very_high>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

BLOOM'S TAXONOMY LEVELS:
- REMEMBER: Recall facts, basic concepts, answers
- UNDERSTAND: Explain ideas, concepts, interpret information
- APPLY: Use information in new situations, solve problems
- ANALYZE: Draw connections, examine relationships, compare/contrast
- EVALUATE: Justify decisions, critique, assess value
- CREATE: Produce new work, combine elements, design solutions

Look for specific indicators:
- REMEMBER: Lists, definitions, basic recall
- UNDERSTAND: Explanations, summaries, interpretations
- APPLY: Problem-solving, using concepts in new contexts
- ANALYZE: Comparisons, cause-effect relationships, breaking down complex ideas
- EVALUATE: Judgments, critiques, assessments with criteria
- CREATE: Original ideas, new solutions, innovative combinations

Consider the depth of thinking, originality, complexity of reasoning, and quality of connections made.
`;
  }

  /**
   * Parse AI analysis result
   */
  private parseAnalysisResult(analysisText: string): CognitiveAnalysisResult {
    try {
      const parsed = JSON.parse(analysisText);
      
      // Validate required fields
      if (!parsed.detectedLevel || !parsed.confidence || !parsed.evidence) {
        throw new Error('Missing required analysis fields');
      }

      return parsed as CognitiveAnalysisResult;
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      throw new Error('Failed to parse cognitive analysis result');
    }
  }

  /**
   * Analyze cognitive progression from submissions
   */
  private analyzeProgression(submissions: any[]): CognitiveProgression {
    const levelHistory = submissions.map(sub => {
      const content = sub.activity?.content as any;
      return {
        level: sub.bloomsLevel as BloomsTaxonomyLevel,
        confidence: sub.aiConfidence || 0.8,
        date: sub.gradedAt,
        activityType: content?.activityType || sub.activity?.title || 'unknown'
      };
    });

    const currentLevel = levelHistory[levelHistory.length - 1]?.level || BloomsTaxonomyLevel.REMEMBER;
    
    // Analyze progression trend
    const recentLevels = levelHistory.slice(-5).map(h => this.getBloomsLevelOrder(h.level));
    const trend = this.calculateProgressionTrend(recentLevels);
    
    // Calculate readiness for next level
    const readinessScore = this.calculateReadinessScore(levelHistory, currentLevel);
    
    // Determine next recommended level
    const nextRecommendedLevel = this.getNextRecommendedLevel(currentLevel, readinessScore);
    
    // Identify gaps and strengths
    const { cognitiveGaps, strengthAreas } = this.identifyGapsAndStrengths(levelHistory);

    return {
      studentId: submissions[0].studentId,
      currentLevel,
      levelHistory,
      progressionTrend: trend,
      nextRecommendedLevel,
      readinessScore,
      cognitiveGaps,
      strengthAreas
    };
  }

  /**
   * Analyze learning patterns from submissions
   */
  private analyzeLearningPatterns(submissions: any[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    // Analyze activity type preferences
    const activityTypes = submissions.map(s => {
      const content = s.activity?.content as any;
      return content?.activityType || s.activity?.title || 'unknown';
    });
    const typeFrequency = this.calculateFrequency(activityTypes);

    // Detect sequential vs global learning
    if (this.detectSequentialPattern(submissions)) {
      patterns.push({
        patternType: 'sequential',
        confidence: 0.8,
        indicators: ['Consistent step-by-step approach', 'Better performance on structured activities'],
        recommendations: ['Provide clear step-by-step instructions', 'Use scaffolded learning approaches']
      });
    }
    
    // Detect visual vs verbal preferences
    if (typeFrequency['visual'] > typeFrequency['text']) {
      patterns.push({
        patternType: 'visual',
        confidence: 0.7,
        indicators: ['Better performance on visual activities', 'Preference for diagrams and images'],
        recommendations: ['Include more visual elements', 'Use mind maps and diagrams']
      });
    }

    return patterns;
  }

  /**
   * Analyze class cognitive insights
   */
  private analyzeClassCognitiveInsights(submissions: any[]) {
    const bloomsDistribution: Record<BloomsTaxonomyLevel, number> = {} as any;
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      bloomsDistribution[level] = submissions.filter(s => s.bloomsLevel === level).length;
    });

    const totalStudents = new Set(submissions.map(s => s.studentId)).size;
    const cognitiveGaps = this.identifyClassCognitiveGaps(bloomsDistribution, totalStudents);
    
    const overallProgression = this.assessOverallProgression(submissions);
    const studentsNeedingSupport = this.identifyStudentsNeedingSupport(submissions);
    const recommendations = this.generateClassRecommendations(cognitiveGaps, overallProgression);

    return {
      overallProgression,
      bloomsDistribution,
      cognitiveGaps,
      recommendations,
      studentsNeedingSupport
    };
  }

  // Helper methods
  private getBloomsLevelOrder(level: BloomsTaxonomyLevel): number {
    const order = {
      [BloomsTaxonomyLevel.REMEMBER]: 1,
      [BloomsTaxonomyLevel.UNDERSTAND]: 2,
      [BloomsTaxonomyLevel.APPLY]: 3,
      [BloomsTaxonomyLevel.ANALYZE]: 4,
      [BloomsTaxonomyLevel.EVALUATE]: 5,
      [BloomsTaxonomyLevel.CREATE]: 6
    };
    return order[level] || 1;
  }

  private calculateProgressionTrend(recentLevels: number[]): 'improving' | 'stable' | 'declining' {
    if (recentLevels.length < 3) return 'stable';
    
    const first = recentLevels.slice(0, Math.floor(recentLevels.length / 2));
    const second = recentLevels.slice(Math.floor(recentLevels.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    if (secondAvg > firstAvg + 0.5) return 'improving';
    if (secondAvg < firstAvg - 0.5) return 'declining';
    return 'stable';
  }

  private calculateReadinessScore(levelHistory: any[], currentLevel: BloomsTaxonomyLevel): number {
    const currentOrder = this.getBloomsLevelOrder(currentLevel);
    const recentPerformance = levelHistory.slice(-10);
    
    // Calculate consistency at current level
    const currentLevelCount = recentPerformance.filter(h => 
      this.getBloomsLevelOrder(h.level) === currentOrder
    ).length;
    
    const consistency = currentLevelCount / Math.min(recentPerformance.length, 10);
    
    // Calculate average confidence
    const avgConfidence = recentPerformance.reduce((sum, h) => sum + h.confidence, 0) / recentPerformance.length;
    
    return Math.round((consistency * 0.6 + avgConfidence * 0.4) * 100);
  }

  private getNextRecommendedLevel(currentLevel: BloomsTaxonomyLevel, readinessScore: number): BloomsTaxonomyLevel {
    if (readinessScore < 70) return currentLevel;
    
    const levels = Object.values(BloomsTaxonomyLevel);
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    return currentLevel;
  }

  private identifyGapsAndStrengths(levelHistory: any[]) {
    const levelCounts: Record<string, number> = {};
    levelHistory.forEach(h => {
      levelCounts[h.level] = (levelCounts[h.level] || 0) + 1;
    });

    const cognitiveGaps: string[] = [];
    const strengthAreas: string[] = [];

    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const count = levelCounts[level] || 0;
      if (count === 0) {
        cognitiveGaps.push(`No demonstrated experience with ${level} level tasks`);
      } else if (count >= 3) {
        strengthAreas.push(`Strong performance in ${level} level tasks`);
      }
    });

    return { cognitiveGaps, strengthAreas };
  }

  private calculateFrequency(items: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return frequency;
  }

  private detectSequentialPattern(submissions: any[]): boolean {
    // Simple heuristic: check if student performs better on structured activities
    const structuredTypes = ['quiz', 'multiple-choice', 'fill-in-the-blanks'];
    const structuredScores = submissions
      .filter(s => {
        const content = s.activity?.content as any;
        const activityType = content?.activityType || s.activity?.title || 'unknown';
        return structuredTypes.includes(activityType);
      })
      .map(s => s.score || 0);

    const otherScores = submissions
      .filter(s => {
        const content = s.activity?.content as any;
        const activityType = content?.activityType || s.activity?.title || 'unknown';
        return !structuredTypes.includes(activityType);
      })
      .map(s => s.score || 0);

    if (structuredScores.length === 0 || otherScores.length === 0) return false;

    const structuredAvg = structuredScores.reduce((a, b) => a + b, 0) / structuredScores.length;
    const otherAvg = otherScores.reduce((a, b) => a + b, 0) / otherScores.length;

    return structuredAvg > otherAvg + 10; // 10 point difference threshold
  }

  private identifyClassCognitiveGaps(distribution: Record<BloomsTaxonomyLevel, number>, totalStudents: number) {
    return Object.entries(distribution)
      .filter(([_, count]) => count < totalStudents * 0.3) // Less than 30% of students
      .map(([level, count]) => ({
        level: level as BloomsTaxonomyLevel,
        studentCount: count,
        percentage: Math.round((count / totalStudents) * 100)
      }));
  }

  private assessOverallProgression(submissions: any[]): 'positive' | 'neutral' | 'concerning' {
    const recentSubmissions = submissions.slice(-20); // Last 20 submissions
    const scores = recentSubmissions.map(s => s.score || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avgScore >= 80) return 'positive';
    if (avgScore >= 60) return 'neutral';
    return 'concerning';
  }

  private identifyStudentsNeedingSupport(submissions: any[]) {
    const studentPerformance: Record<string, any> = {};
    
    submissions.forEach(sub => {
      if (!studentPerformance[sub.studentId]) {
        studentPerformance[sub.studentId] = {
          studentId: sub.studentId,
          studentName: sub.student.user.name || 'Unknown',
          scores: [],
          levels: []
        };
      }
      
      studentPerformance[sub.studentId].scores.push(sub.score || 0);
      studentPerformance[sub.studentId].levels.push(sub.bloomsLevel);
    });

    return Object.values(studentPerformance)
      .filter((student: any) => {
        const avgScore = student.scores.reduce((a: number, b: number) => a + b, 0) / student.scores.length;
        return avgScore < 60; // Students with average score below 60%
      })
      .map((student: any) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        currentLevel: student.levels[student.levels.length - 1] || BloomsTaxonomyLevel.REMEMBER,
        concerns: ['Low average performance', 'May need additional support']
      }));
  }

  private generateClassRecommendations(cognitiveGaps: any[], overallProgression: string): string[] {
    const recommendations: string[] = [];
    
    if (overallProgression === 'concerning') {
      recommendations.push('Consider reviewing fundamental concepts and providing additional support');
      recommendations.push('Implement more scaffolded learning approaches');
    }
    
    if (cognitiveGaps.length > 0) {
      recommendations.push(`Focus on developing ${cognitiveGaps.map(g => g.level).join(', ')} level skills`);
      recommendations.push('Provide more activities targeting identified cognitive gaps');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue current teaching approach - students are progressing well');
      recommendations.push('Consider introducing more challenging activities to promote growth');
    }
    
    return recommendations;
  }
}
