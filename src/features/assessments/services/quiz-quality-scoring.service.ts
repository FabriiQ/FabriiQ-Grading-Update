/**
 * Quiz Quality Scoring Service
 * 
 * Advanced quality scoring algorithm for questions based on multiple factors
 * including performance metrics, content analysis, and educational value.
 */

import { PrismaClient } from '@prisma/client';
import { EnhancedQuestion } from '../types/quiz-question-filters';

export interface QualityFactors {
  contentClarity: number;        // 0-1: How clear and well-written the question is
  educationalValue: number;      // 0-1: Educational effectiveness and alignment
  performanceMetrics: number;    // 0-1: Based on success rate, discrimination index
  multimediaRichness: number;    // 0-1: Presence of images, videos, interactivity
  explanationQuality: number;    // 0-1: Quality of explanations and feedback
  recency: number;              // 0-1: How recently the question was updated
  usageBalance: number;         // 0-1: Optimal usage frequency (not too high/low)
}

export interface QualityWeights {
  contentClarity: number;
  educationalValue: number;
  performanceMetrics: number;
  multimediaRichness: number;
  explanationQuality: number;
  recency: number;
  usageBalance: number;
}

export interface QuestionQualityResult {
  questionId: string;
  overallScore: number;         // 1-5 final quality score
  factors: QualityFactors;
  confidence: number;           // 0-1 confidence in the scoring
  reasoning: string[];          // Detailed reasoning for the score
  recommendations: string[];    // Suggestions for improvement
}

export class QuizQualityScoringService {
  private defaultWeights: QualityWeights = {
    contentClarity: 0.25,
    educationalValue: 0.25,
    performanceMetrics: 0.20,
    multimediaRichness: 0.15,
    explanationQuality: 0.15,
    recency: 0.05,
    usageBalance: 0.05,
  };

  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate quality score for a single question
   */
  async calculateQuestionQuality(
    question: EnhancedQuestion,
    weights: Partial<QualityWeights> = {}
  ): Promise<QuestionQualityResult> {
    const finalWeights = { ...this.defaultWeights, ...weights };
    
    // Calculate individual factors
    const factors = await this.calculateQualityFactors(question);
    
    // Calculate weighted overall score
    const weightedScore = 
      factors.contentClarity * finalWeights.contentClarity +
      factors.educationalValue * finalWeights.educationalValue +
      factors.performanceMetrics * finalWeights.performanceMetrics +
      factors.multimediaRichness * finalWeights.multimediaRichness +
      factors.explanationQuality * finalWeights.explanationQuality +
      factors.recency * finalWeights.recency +
      factors.usageBalance * finalWeights.usageBalance;

    // Convert to 1-5 scale
    const overallScore = 1 + (weightedScore * 4);

    // Generate reasoning and recommendations
    const reasoning = this.generateReasoning(factors, finalWeights);
    const recommendations = this.generateRecommendations(factors);
    const confidence = this.calculateConfidence(factors, question);

    return {
      questionId: question.id,
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      factors,
      confidence,
      reasoning,
      recommendations,
    };
  }

  /**
   * Calculate quality scores for multiple questions
   */
  async calculateBatchQuality(
    questions: EnhancedQuestion[],
    weights: Partial<QualityWeights> = {}
  ): Promise<QuestionQualityResult[]> {
    const results = await Promise.all(
      questions.map(question => this.calculateQuestionQuality(question, weights))
    );

    return results.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get quality distribution for a set of questions
   */
  async getQualityDistribution(questions: EnhancedQuestion[]): Promise<{
    distribution: Record<string, number>;
    averageQuality: number;
    qualityTrend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
  }> {
    const qualityResults = await this.calculateBatchQuality(questions);
    
    // Calculate distribution
    const distribution = {
      '5': 0, '4': 0, '3': 0, '2': 0, '1': 0
    };

    qualityResults.forEach(result => {
      const bucket = Math.floor(result.overallScore).toString();
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    // Calculate average
    const averageQuality = qualityResults.reduce((sum, r) => sum + r.overallScore, 0) / qualityResults.length;

    // Determine trend (simplified - would use historical data)
    const qualityTrend = averageQuality > 3.5 ? 'improving' : averageQuality < 2.5 ? 'declining' : 'stable';

    // Generate recommendations
    const recommendations = this.generateDistributionRecommendations(distribution, averageQuality);

    return {
      distribution,
      averageQuality,
      qualityTrend,
      recommendations,
    };
  }

  /**
   * Calculate individual quality factors
   */
  private async calculateQualityFactors(question: EnhancedQuestion): Promise<QualityFactors> {
    return {
      contentClarity: this.assessContentClarity(question),
      educationalValue: this.assessEducationalValue(question),
      performanceMetrics: this.assessPerformanceMetrics(question),
      multimediaRichness: this.assessMultimediaRichness(question),
      explanationQuality: this.assessExplanationQuality(question),
      recency: this.assessRecency(question),
      usageBalance: this.assessUsageBalance(question),
    };
  }

  /**
   * Assess content clarity based on text analysis
   */
  private assessContentClarity(question: EnhancedQuestion): number {
    const content = question.content as any;
    let score = 0.5; // Base score

    // Check question length (not too short, not too long)
    const questionLength = question.title.length;
    if (questionLength >= 20 && questionLength <= 200) {
      score += 0.2;
    }

    // Check for clear language indicators
    if (content?.text && !content.text.includes('???') && !content.text.includes('unclear')) {
      score += 0.2;
    }

    // Check for proper grammar and structure (simplified)
    if (question.title.endsWith('?') || question.title.includes('What') || question.title.includes('How')) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Assess educational value and curriculum alignment
   */
  private assessEducationalValue(question: EnhancedQuestion): number {
    let score = 0.4; // Base score

    // Bloom's taxonomy level (higher levels get bonus)
    if (question.bloomsLevel) {
      const bloomsBonus = {
        'REMEMBER': 0.1,
        'UNDERSTAND': 0.2,
        'APPLY': 0.3,
        'ANALYZE': 0.4,
        'EVALUATE': 0.5,
        'CREATE': 0.6,
      };
      score += bloomsBonus[question.bloomsLevel as keyof typeof bloomsBonus] || 0.1;
    }

    // Learning outcome alignment
    if (question.learningOutcomeIds && question.learningOutcomeIds.length > 0) {
      score += 0.2;
    }

    // Topic relevance
    if (question.topicId) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Assess performance metrics
   */
  private assessPerformanceMetrics(question: EnhancedQuestion): number {
    if (!question.performanceMetrics) {
      return 0.5; // Default if no metrics available
    }

    const metrics = question.performanceMetrics;
    let score = 0;

    // Success rate (optimal range: 60-80%)
    const successRate = metrics.successRate;
    if (successRate >= 0.6 && successRate <= 0.8) {
      score += 0.4;
    } else if (successRate >= 0.5 && successRate <= 0.9) {
      score += 0.3;
    } else {
      score += 0.1;
    }

    // Discrimination index (higher is better, optimal > 0.3)
    const discrimination = metrics.discriminationIndex;
    if (discrimination > 0.3) {
      score += 0.3;
    } else if (discrimination > 0.2) {
      score += 0.2;
    } else {
      score += 0.1;
    }

    // Reliability index
    const reliability = metrics.reliabilityIndex;
    if (reliability > 0.7) {
      score += 0.3;
    } else if (reliability > 0.5) {
      score += 0.2;
    } else {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Assess multimedia richness
   */
  private assessMultimediaRichness(question: EnhancedQuestion): number {
    let score = 0.2; // Base score for text-only

    if (question.hasImages) {
      score += 0.3;
    }

    if (question.hasVideo) {
      score += 0.4;
    }

    if (question.hasExplanations) {
      score += 0.2;
    }

    // Interactive elements (if available in content)
    const content = question.content as any;
    if (content?.interactive || content?.simulation) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Assess explanation quality
   */
  private assessExplanationQuality(question: EnhancedQuestion): number {
    const content = question.content as any;
    let score = 0.2; // Base score

    if (question.hasExplanations) {
      score += 0.4;

      // Check explanation length and quality
      if (content?.explanation && content.explanation.length > 50) {
        score += 0.2;
      }

      // Check for detailed feedback
      if (content?.feedback || content?.detailedExplanation) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Assess recency (how recently updated)
   */
  private assessRecency(question: EnhancedQuestion): number {
    const now = Date.now();
    const updatedAt = new Date(question.updatedAt).getTime();
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 30) {
      return 1.0;
    } else if (daysSinceUpdate < 90) {
      return 0.8;
    } else if (daysSinceUpdate < 180) {
      return 0.6;
    } else if (daysSinceUpdate < 365) {
      return 0.4;
    } else {
      return 0.2;
    }
  }

  /**
   * Assess usage balance (not overused, not underused)
   */
  private assessUsageBalance(question: EnhancedQuestion): number {
    const usageCount = question.usageCount || 0;
    const totalUsage = question.usageStats?.totalUsage || 0;

    // Optimal usage range (not too high, not too low)
    if (totalUsage >= 10 && totalUsage <= 50) {
      return 1.0;
    } else if (totalUsage >= 5 && totalUsage <= 100) {
      return 0.8;
    } else if (totalUsage >= 1 && totalUsage <= 200) {
      return 0.6;
    } else if (totalUsage === 0) {
      return 0.4; // New questions get moderate score
    } else {
      return 0.2; // Overused questions get lower score
    }
  }

  /**
   * Generate reasoning for the quality score
   */
  private generateReasoning(factors: QualityFactors, weights: QualityWeights): string[] {
    const reasoning: string[] = [];

    // Identify strongest factors
    const factorEntries = Object.entries(factors).sort(([,a], [,b]) => b - a);
    const topFactors = factorEntries.slice(0, 3);

    topFactors.forEach(([factor, score]) => {
      if (score > 0.7) {
        reasoning.push(`Strong ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${(score * 100).toFixed(0)}%`);
      } else if (score < 0.4) {
        reasoning.push(`Needs improvement in ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${(score * 100).toFixed(0)}%`);
      }
    });

    return reasoning;
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations(factors: QualityFactors): string[] {
    const recommendations: string[] = [];

    if (factors.contentClarity < 0.6) {
      recommendations.push('Improve question clarity and wording');
    }

    if (factors.educationalValue < 0.6) {
      recommendations.push('Align better with learning outcomes and curriculum standards');
    }

    if (factors.performanceMetrics < 0.5) {
      recommendations.push('Review question difficulty and discrimination power');
    }

    if (factors.multimediaRichness < 0.4) {
      recommendations.push('Consider adding images, videos, or interactive elements');
    }

    if (factors.explanationQuality < 0.5) {
      recommendations.push('Add detailed explanations and feedback');
    }

    return recommendations;
  }

  /**
   * Calculate confidence in the quality scoring
   */
  private calculateConfidence(factors: QualityFactors, question: EnhancedQuestion): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence if we have performance metrics
    if (question.performanceMetrics) {
      confidence += 0.3;
    }

    // Higher confidence if question has been used
    if (question.usageCount && question.usageCount > 5) {
      confidence += 0.2;
    }

    // Higher confidence if recently updated
    if (factors.recency > 0.8) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate recommendations for quality distribution
   */
  private generateDistributionRecommendations(
    distribution: Record<string, number>,
    averageQuality: number
  ): string[] {
    const recommendations: string[] = [];
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    // Check for low quality questions
    const lowQuality = (distribution['1'] + distribution['2']) / total;
    if (lowQuality > 0.3) {
      recommendations.push('Consider reviewing or replacing low-quality questions (1-2 stars)');
    }

    // Check for lack of high quality questions
    const highQuality = (distribution['4'] + distribution['5']) / total;
    if (highQuality < 0.4) {
      recommendations.push('Aim to increase the proportion of high-quality questions (4-5 stars)');
    }

    // Overall quality recommendations
    if (averageQuality < 3.0) {
      recommendations.push('Overall question quality needs improvement - focus on content clarity and educational value');
    } else if (averageQuality > 4.0) {
      recommendations.push('Excellent question quality - maintain current standards');
    }

    return recommendations;
  }
}
