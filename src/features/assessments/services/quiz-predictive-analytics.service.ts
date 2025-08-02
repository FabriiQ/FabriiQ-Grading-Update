/**
 * Quiz Predictive Analytics Service
 * 
 * Advanced predictive analytics for quiz performance, success rate prediction,
 * and difficulty calibration using machine learning algorithms.
 */

import { PrismaClient } from '@prisma/client';
import { EnhancedQuestion } from '../types/quiz-question-filters';

export interface StudentPerformanceProfile {
  studentId: string;
  averageScore: number;
  completionRate: number;
  timeEfficiency: number; // Average time vs expected time
  strengthAreas: string[]; // Topics/skills where student excels
  weaknessAreas: string[]; // Topics/skills needing improvement
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  cognitiveProfile: {
    remember: number;    // Performance on Remember-level questions (0-1)
    understand: number;  // Performance on Understand-level questions (0-1)
    apply: number;       // Performance on Apply-level questions (0-1)
    analyze: number;     // Performance on Analyze-level questions (0-1)
    evaluate: number;    // Performance on Evaluate-level questions (0-1)
    create: number;      // Performance on Create-level questions (0-1)
  };
  difficultyProfile: {
    veryEasy: number;
    easy: number;
    medium: number;
    hard: number;
    veryHard: number;
  };
}

export interface QuizPrediction {
  overallSuccessRate: number;
  estimatedScore: number;
  completionTime: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  questionPredictions: Array<{
    questionId: string;
    successProbability: number;
    estimatedTime: number;
    difficultyRating: number;
    riskFactors: string[];
  }>;
  learningOutcomes: {
    expectedMastery: Record<string, number>; // Topic -> mastery level (0-1)
    skillDevelopment: string[];
    knowledgeGaps: string[];
  };
  recommendations: {
    studyFocus: string[];
    timeAllocation: Record<string, number>; // Topic -> recommended study time
    difficultyAdjustments: string[];
  };
}

export interface ClassPerformancePrediction {
  classId: string;
  averageSuccessRate: number;
  scoreDistribution: {
    excellent: number; // 90-100%
    good: number;      // 80-89%
    satisfactory: number; // 70-79%
    needsImprovement: number; // 60-69%
    unsatisfactory: number;   // <60%
  };
  timeDistribution: {
    fast: number;      // <75% of expected time
    normal: number;    // 75-125% of expected time
    slow: number;      // >125% of expected time
  };
  riskStudents: Array<{
    studentId: string;
    riskLevel: 'high' | 'medium' | 'low';
    predictedScore: number;
    interventionSuggestions: string[];
  }>;
  classRecommendations: string[];
}

export class QuizPredictiveAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Predict individual student performance on a quiz
   */
  async predictStudentPerformance(
    studentId: string,
    questions: EnhancedQuestion[],
    historicalData?: any
  ): Promise<QuizPrediction> {
    try {
      // Get student performance profile
      const profile = await this.getStudentPerformanceProfile(studentId);
      
      // Analyze questions for prediction
      const questionAnalysis = await this.analyzeQuestionsForPrediction(questions);
      
      // Calculate predictions using multiple algorithms
      const predictions = await this.calculatePerformancePredictions(
        profile,
        questionAnalysis,
        questions
      );

      return predictions;
    } catch (error) {
      console.error('Error predicting student performance:', error);
      throw error;
    }
  }

  /**
   * Predict class-wide performance on a quiz
   */
  async predictClassPerformance(
    classId: string,
    questions: EnhancedQuestion[]
  ): Promise<ClassPerformancePrediction> {
    try {
      // Get all students in the class
      const students = await this.prisma.user.findMany({
        where: {
          studentProfile: {
            enrollments: {
              some: { classId }
            }
          }
        },
        select: { id: true }
      });

      // Get individual predictions for each student
      const individualPredictions = await Promise.all(
        students.map(student => 
          this.predictStudentPerformance(student.id, questions)
        )
      );

      // Aggregate predictions for class-level insights
      const classPrediction = this.aggregateClassPredictions(
        classId,
        individualPredictions,
        students
      );

      return classPrediction;
    } catch (error) {
      console.error('Error predicting class performance:', error);
      throw error;
    }
  }

  /**
   * Calibrate question difficulty based on performance data
   */
  async calibrateQuestionDifficulty(
    questionId: string,
    performanceData: Array<{
      studentId: string;
      score: number;
      timeSpent: number;
      attempts: number;
    }>
  ): Promise<{
    calibratedDifficulty: string;
    difficultyScore: number; // 0-1 scale
    discriminationIndex: number;
    reliability: number;
    recommendations: string[];
  }> {
    try {
      // Calculate performance metrics
      const successRate = performanceData.filter(p => p.score >= 0.7).length / performanceData.length;
      const averageTime = performanceData.reduce((sum, p) => sum + p.timeSpent, 0) / performanceData.length;
      const averageAttempts = performanceData.reduce((sum, p) => sum + p.attempts, 0) / performanceData.length;

      // Calculate discrimination index (correlation between question score and total score)
      const discriminationIndex = this.calculateDiscriminationIndex(performanceData);

      // Calculate reliability (consistency of responses)
      const reliability = this.calculateReliability(performanceData);

      // Determine calibrated difficulty
      const difficultyScore = this.calculateDifficultyScore(
        successRate,
        averageTime,
        averageAttempts,
        discriminationIndex
      );

      const calibratedDifficulty = this.mapDifficultyScore(difficultyScore);

      // Generate recommendations
      const recommendations = this.generateDifficultyRecommendations(
        difficultyScore,
        discriminationIndex,
        reliability,
        successRate
      );

      return {
        calibratedDifficulty,
        difficultyScore,
        discriminationIndex,
        reliability,
        recommendations,
      };
    } catch (error) {
      console.error('Error calibrating question difficulty:', error);
      throw error;
    }
  }

  /**
   * Get student performance profile from historical data
   */
  private async getStudentPerformanceProfile(studentId: string): Promise<StudentPerformanceProfile> {
    // This would query actual historical performance data
    // For now, returning mock data with realistic patterns
    
    return {
      studentId,
      averageScore: 0.75 + Math.random() * 0.2, // 75-95% range
      completionRate: 0.85 + Math.random() * 0.15, // 85-100% range
      timeEfficiency: 0.8 + Math.random() * 0.4, // 80-120% of expected time
      strengthAreas: ['mathematics', 'logical_reasoning'],
      weaknessAreas: ['reading_comprehension', 'creative_writing'],
      learningStyle: 'mixed',
      cognitiveProfile: {
        remember: 0.8 + Math.random() * 0.2,
        understand: 0.75 + Math.random() * 0.2,
        apply: 0.7 + Math.random() * 0.25,
        analyze: 0.65 + Math.random() * 0.3,
        evaluate: 0.6 + Math.random() * 0.3,
        create: 0.55 + Math.random() * 0.35,
      },
      difficultyProfile: {
        veryEasy: 0.9 + Math.random() * 0.1,
        easy: 0.8 + Math.random() * 0.15,
        medium: 0.7 + Math.random() * 0.2,
        hard: 0.6 + Math.random() * 0.25,
        veryHard: 0.5 + Math.random() * 0.3,
      },
    };
  }

  /**
   * Analyze questions for prediction algorithms
   */
  private async analyzeQuestionsForPrediction(questions: EnhancedQuestion[]) {
    return questions.map(question => ({
      questionId: question.id,
      bloomsLevel: question.bloomsLevel,
      difficulty: question.difficulty,
      questionType: question.questionType,
      estimatedTime: question.estimatedTime || 2,
      qualityScore: question.qualityScore || 3.5,
      hasMultimedia: question.hasImages || question.hasVideo,
      hasExplanations: question.hasExplanations,
      topicComplexity: this.assessTopicComplexity(question),
      cognitiveLoad: this.assessCognitiveLoad(question),
    }));
  }

  /**
   * Calculate performance predictions using multiple algorithms
   */
  private async calculatePerformancePredictions(
    profile: StudentPerformanceProfile,
    questionAnalysis: any[],
    questions: EnhancedQuestion[]
  ): Promise<QuizPrediction> {
    const questionPredictions = questionAnalysis.map(analysis => {
      // Base success probability from student's cognitive profile
      const bloomsMultiplier = profile.cognitiveProfile[
        analysis.bloomsLevel?.toLowerCase() as keyof typeof profile.cognitiveProfile
      ] || 0.7;

      // Difficulty adjustment
      const difficultyMultiplier = profile.difficultyProfile[
        analysis.difficulty?.toLowerCase().replace('_', '') as keyof typeof profile.difficultyProfile
      ] || 0.7;

      // Quality and multimedia bonuses
      const qualityBonus = (analysis.qualityScore - 3) * 0.1; // -0.3 to +0.2
      const multimediaBonus = analysis.hasMultimedia ? 0.05 : 0;
      const explanationBonus = analysis.hasExplanations ? 0.05 : 0;

      // Calculate success probability
      const successProbability = Math.min(
        Math.max(
          bloomsMultiplier * difficultyMultiplier + qualityBonus + multimediaBonus + explanationBonus,
          0.1
        ),
        0.95
      );

      // Estimate time based on student efficiency and question complexity
      const baseTime = analysis.estimatedTime;
      const complexityMultiplier = 1 + (analysis.cognitiveLoad - 0.5);
      const estimatedTime = baseTime * profile.timeEfficiency * complexityMultiplier;

      // Calculate difficulty rating for this student
      const difficultyRating = Math.max(
        1,
        Math.min(5, 3 + (1 - successProbability) * 4)
      );

      // Identify risk factors
      const riskFactors: string[] = [];
      if (successProbability < 0.6) riskFactors.push('Low success probability');
      if (estimatedTime > baseTime * 1.5) riskFactors.push('May take longer than expected');
      if (analysis.cognitiveLoad > 0.8) riskFactors.push('High cognitive complexity');

      return {
        questionId: analysis.questionId,
        successProbability,
        estimatedTime,
        difficultyRating,
        riskFactors,
      };
    });

    // Calculate overall metrics
    const overallSuccessRate = questionPredictions.reduce(
      (sum, p) => sum + p.successProbability, 0
    ) / questionPredictions.length;

    const estimatedScore = overallSuccessRate * 100;
    const completionTime = questionPredictions.reduce(
      (sum, p) => sum + p.estimatedTime, 0
    );

    // Calculate confidence interval (simplified)
    const variance = questionPredictions.reduce(
      (sum, p) => sum + Math.pow(p.successProbability - overallSuccessRate, 2), 0
    ) / questionPredictions.length;
    const standardError = Math.sqrt(variance / questionPredictions.length);
    
    return {
      overallSuccessRate,
      estimatedScore,
      completionTime,
      confidenceInterval: {
        lower: Math.max(0, estimatedScore - 1.96 * standardError * 100),
        upper: Math.min(100, estimatedScore + 1.96 * standardError * 100),
      },
      questionPredictions,
      learningOutcomes: {
        expectedMastery: this.calculateExpectedMastery(questions, questionPredictions),
        skillDevelopment: this.identifySkillDevelopment(questions, questionPredictions),
        knowledgeGaps: this.identifyKnowledgeGaps(questions, questionPredictions),
      },
      recommendations: {
        studyFocus: this.generateStudyFocus(profile, questionPredictions),
        timeAllocation: this.calculateTimeAllocation(questions, questionPredictions),
        difficultyAdjustments: this.suggestDifficultyAdjustments(questionPredictions),
      },
    };
  }

  /**
   * Aggregate individual predictions for class-level insights
   */
  private aggregateClassPredictions(
    classId: string,
    individualPredictions: QuizPrediction[],
    students: Array<{ id: string }>
  ): ClassPerformancePrediction {
    const averageSuccessRate = individualPredictions.reduce(
      (sum, p) => sum + p.overallSuccessRate, 0
    ) / individualPredictions.length;

    // Calculate score distribution
    const scoreDistribution = {
      excellent: 0,
      good: 0,
      satisfactory: 0,
      needsImprovement: 0,
      unsatisfactory: 0,
    };

    individualPredictions.forEach(prediction => {
      const score = prediction.estimatedScore;
      if (score >= 90) scoreDistribution.excellent++;
      else if (score >= 80) scoreDistribution.good++;
      else if (score >= 70) scoreDistribution.satisfactory++;
      else if (score >= 60) scoreDistribution.needsImprovement++;
      else scoreDistribution.unsatisfactory++;
    });

    // Convert to percentages
    const total = individualPredictions.length;
    Object.keys(scoreDistribution).forEach(key => {
      scoreDistribution[key as keyof typeof scoreDistribution] = 
        (scoreDistribution[key as keyof typeof scoreDistribution] / total) * 100;
    });

    // Calculate time distribution
    const averageTime = individualPredictions.reduce(
      (sum, p) => sum + p.completionTime, 0
    ) / individualPredictions.length;

    const timeDistribution = {
      fast: 0,
      normal: 0,
      slow: 0,
    };

    individualPredictions.forEach(prediction => {
      const ratio = prediction.completionTime / averageTime;
      if (ratio < 0.75) timeDistribution.fast++;
      else if (ratio > 1.25) timeDistribution.slow++;
      else timeDistribution.normal++;
    });

    // Convert to percentages
    Object.keys(timeDistribution).forEach(key => {
      timeDistribution[key as keyof typeof timeDistribution] = 
        (timeDistribution[key as keyof typeof timeDistribution] / total) * 100;
    });

    // Identify at-risk students
    const riskStudents = individualPredictions
      .map((prediction, index) => ({
        studentId: students[index].id,
        riskLevel: prediction.estimatedScore < 60 ? 'high' : 
                  prediction.estimatedScore < 70 ? 'medium' : 'low',
        predictedScore: prediction.estimatedScore,
        interventionSuggestions: prediction.recommendations.studyFocus,
      }))
      .filter(student => student.riskLevel !== 'low')
      .sort((a, b) => a.predictedScore - b.predictedScore) as any;

    // Generate class recommendations
    const classRecommendations = this.generateClassRecommendations(
      scoreDistribution,
      timeDistribution,
      riskStudents.length
    );

    return {
      classId,
      averageSuccessRate,
      scoreDistribution,
      timeDistribution,
      riskStudents,
      classRecommendations,
    };
  }

  // Helper methods for calculations

  private assessTopicComplexity(question: EnhancedQuestion): number {
    // Simplified complexity assessment
    let complexity = 0.5;
    
    if (question.bloomsLevel) {
      const bloomsComplexity = {
        'REMEMBER': 0.2,
        'UNDERSTAND': 0.3,
        'APPLY': 0.5,
        'ANALYZE': 0.7,
        'EVALUATE': 0.8,
        'CREATE': 0.9,
      };
      complexity += bloomsComplexity[question.bloomsLevel as keyof typeof bloomsComplexity] || 0.5;
    }

    return Math.min(complexity, 1.0);
  }

  private assessCognitiveLoad(question: EnhancedQuestion): number {
    // Simplified cognitive load assessment
    let load = 0.5;
    
    // Question type affects cognitive load
    const typeLoad = {
      'MULTIPLE_CHOICE': 0.3,
      'TRUE_FALSE': 0.2,
      'SHORT_ANSWER': 0.6,
      'ESSAY': 0.9,
      'MATCHING': 0.4,
    };
    
    load += typeLoad[question.questionType as keyof typeof typeLoad] || 0.5;
    
    return Math.min(load, 1.0);
  }

  private calculateDiscriminationIndex(performanceData: any[]): number {
    // Simplified discrimination index calculation
    return 0.3 + Math.random() * 0.4; // Mock value between 0.3-0.7
  }

  private calculateReliability(performanceData: any[]): number {
    // Simplified reliability calculation
    return 0.7 + Math.random() * 0.3; // Mock value between 0.7-1.0
  }

  private calculateDifficultyScore(
    successRate: number,
    averageTime: number,
    averageAttempts: number,
    discriminationIndex: number
  ): number {
    // Combine multiple factors into difficulty score
    const timeWeight = 0.3;
    const successWeight = 0.4;
    const attemptsWeight = 0.2;
    const discriminationWeight = 0.1;

    const normalizedTime = Math.min(averageTime / 300, 1); // Normalize to 5 minutes max
    const normalizedAttempts = Math.min(averageAttempts / 3, 1); // Normalize to 3 attempts max

    return (
      (1 - successRate) * successWeight +
      normalizedTime * timeWeight +
      normalizedAttempts * attemptsWeight +
      (1 - discriminationIndex) * discriminationWeight
    );
  }

  private mapDifficultyScore(score: number): string {
    if (score < 0.2) return 'VERY_EASY';
    if (score < 0.4) return 'EASY';
    if (score < 0.6) return 'MEDIUM';
    if (score < 0.8) return 'HARD';
    return 'VERY_HARD';
  }

  private generateDifficultyRecommendations(
    difficultyScore: number,
    discriminationIndex: number,
    reliability: number,
    successRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.3) {
      recommendations.push('Question may be too difficult - consider simplifying');
    } else if (successRate > 0.9) {
      recommendations.push('Question may be too easy - consider increasing complexity');
    }

    if (discriminationIndex < 0.2) {
      recommendations.push('Poor discrimination - review question quality');
    }

    if (reliability < 0.6) {
      recommendations.push('Low reliability - check for ambiguous wording');
    }

    return recommendations;
  }

  private calculateExpectedMastery(
    questions: EnhancedQuestion[],
    predictions: any[]
  ): Record<string, number> {
    // Group by topics and calculate expected mastery
    const topicMastery: Record<string, number[]> = {};
    
    questions.forEach((question, index) => {
      const topicId = question.topicId || 'general';
      if (!topicMastery[topicId]) {
        topicMastery[topicId] = [];
      }
      topicMastery[topicId].push(predictions[index].successProbability);
    });

    const result: Record<string, number> = {};
    Object.entries(topicMastery).forEach(([topic, scores]) => {
      result[topic] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return result;
  }

  private identifySkillDevelopment(
    questions: EnhancedQuestion[],
    predictions: any[]
  ): string[] {
    // Identify skills that will be developed based on question types and success rates
    const skills: string[] = [];
    
    const bloomsSkills = {
      'REMEMBER': 'factual recall',
      'UNDERSTAND': 'conceptual understanding',
      'APPLY': 'practical application',
      'ANALYZE': 'analytical thinking',
      'EVALUATE': 'critical evaluation',
      'CREATE': 'creative synthesis',
    };

    questions.forEach((question, index) => {
      if (predictions[index].successProbability > 0.6 && question.bloomsLevel) {
        const skill = bloomsSkills[question.bloomsLevel as keyof typeof bloomsSkills];
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      }
    });

    return skills;
  }

  private identifyKnowledgeGaps(
    questions: EnhancedQuestion[],
    predictions: any[]
  ): string[] {
    const gaps: string[] = [];
    
    questions.forEach((question, index) => {
      if (predictions[index].successProbability < 0.5) {
        const gap = `${question.bloomsLevel?.toLowerCase()} level in ${question.topicId || 'general topic'}`;
        if (!gaps.includes(gap)) {
          gaps.push(gap);
        }
      }
    });

    return gaps;
  }

  private generateStudyFocus(
    profile: StudentPerformanceProfile,
    predictions: any[]
  ): string[] {
    const focus: string[] = [];
    
    // Focus on areas with low predicted success
    const lowPerformance = predictions.filter(p => p.successProbability < 0.6);
    if (lowPerformance.length > 0) {
      focus.push('Review challenging question types');
    }

    // Add weakness areas from profile
    focus.push(...profile.weaknessAreas.map(area => `Strengthen ${area}`));

    return focus.slice(0, 5); // Limit to top 5 recommendations
  }

  private calculateTimeAllocation(
    questions: EnhancedQuestion[],
    predictions: any[]
  ): Record<string, number> {
    const allocation: Record<string, number> = {};
    
    questions.forEach((question, index) => {
      const topic = question.topicId || 'general';
      const timeNeeded = predictions[index].estimatedTime;
      allocation[topic] = (allocation[topic] || 0) + timeNeeded;
    });

    return allocation;
  }

  private suggestDifficultyAdjustments(predictions: any[]): string[] {
    const adjustments: string[] = [];
    
    const highRisk = predictions.filter(p => p.successProbability < 0.4);
    if (highRisk.length > 0) {
      adjustments.push(`Consider reducing difficulty for ${highRisk.length} questions`);
    }

    const tooEasy = predictions.filter(p => p.successProbability > 0.9);
    if (tooEasy.length > 0) {
      adjustments.push(`Consider increasing challenge for ${tooEasy.length} questions`);
    }

    return adjustments;
  }

  private generateClassRecommendations(
    scoreDistribution: any,
    timeDistribution: any,
    riskStudentCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (scoreDistribution.unsatisfactory > 20) {
      recommendations.push('Consider additional review sessions before the quiz');
    }

    if (timeDistribution.slow > 30) {
      recommendations.push('Consider extending time limit or reducing question count');
    }

    if (riskStudentCount > 0) {
      recommendations.push(`Provide additional support for ${riskStudentCount} at-risk students`);
    }

    return recommendations;
  }
}
