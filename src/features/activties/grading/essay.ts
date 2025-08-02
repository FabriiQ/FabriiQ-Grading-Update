/**
 * Essay Activity Grading Service
 * 
 * This service provides comprehensive essay grading capabilities including:
 * - AI-powered automated grading with confidence scoring
 * - Manual teacher review and override capabilities
 * - Bloom's taxonomy level detection and scoring
 * - Rubric-based evaluation support
 * - Hybrid grading workflows (AI + Manual)
 * - Real-time analytics integration
 * 
 * The service supports multiple AI models and provides detailed feedback
 * generation with confidence scoring to determine when manual review is needed.
 */

import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EssayActivity } from '../models/essay';
import { GradingResult } from '../models/base';
import { AIEssayGradingService } from '@/server/api/services/ai-essay-grading.service';
import { EssayGradingDatabaseService } from '@/server/api/services/essay-grading-database.service';
import {
  EssayGradingRequest,
  EssayGradingMethod,
  EssayGradingResult as AIEssayGradingResult
} from '@/types/essay-grading';

/**
 * Essay submission data structure
 * Contains all information needed for grading an essay
 */
export interface EssaySubmissionData {
  essayText: string;                    // The student's essay content
  wordCount: number;                    // Calculated word count
  timeSpent: number;                    // Time spent writing (seconds)
  revisionCount: number;                // Number of revisions made
  submittedAt: Date;                    // Submission timestamp
  startedAt: Date;                      // When student started writing
  metadata?: {
    writingProcess?: {                  // Optional writing process analytics
      keystrokeCount: number;
      pauseCount: number;
      averagePauseLength: number;
      typingSpeed: number;              // Words per minute
    };
    versionHistory?: Array<{            // Version history if enabled
      content: string;
      timestamp: Date;
      wordCount: number;
    }>;
    collaborators?: string[];           // If collaborative essay
  };
}

/**
 * AI grading result with detailed scoring and feedback
 */
export interface AIGradingResult {
  overallScore: number;                 // Overall score (0-100)
  confidence: number;                   // AI confidence (0-1)
  
  // Detailed criterion scores
  criteriaScores: Array<{
    criterionId: string;
    name: string;
    score: number;                      // Score for this criterion (0-100)
    feedback: string;                   // Specific feedback for this criterion
    bloomsLevel?: BloomsTaxonomyLevel;  // Detected Bloom's level
  }>;
  
  // Bloom's taxonomy analysis
  bloomsAnalysis: {
    detectedLevel: BloomsTaxonomyLevel;
    levelScores: Record<BloomsTaxonomyLevel, number>;
    levelEvidence: Record<BloomsTaxonomyLevel, string[]>; // Evidence for each level
  };
  
  // Comprehensive feedback
  feedback: {
    strengths: string[];                // What the student did well
    improvements: string[];             // Areas for improvement
    suggestions: string[];              // Specific suggestions
    overallComment: string;             // General feedback comment
  };
  
  // Quality indicators
  qualityMetrics: {
    coherence: number;                  // Logical flow and organization (0-100)
    clarity: number;                    // Clarity of expression (0-100)
    depth: number;                      // Depth of analysis (0-100)
    originality: number;                // Originality of thought (0-100)
    evidenceUse: number;                // Use of evidence/examples (0-100)
  };
  
  // Technical analysis
  technicalAnalysis: {
    grammarScore: number;               // Grammar quality (0-100)
    vocabularyLevel: number;            // Vocabulary sophistication (0-100)
    sentenceVariety: number;            // Sentence structure variety (0-100)
    readabilityScore: number;           // Readability level
  };
  
  // Metadata
  gradingModel: string;                 // AI model used
  gradingTime: number;                  // Time taken to grade (ms)
  tokensUsed: number;                   // AI tokens consumed
}

/**
 * Complete essay grading result extending the base GradingResult
 * Aligns with existing grading architecture
 */
export interface EssayGradingResult extends GradingResult {
  // Essay-specific grading components
  aiResult?: AIGradingResult;           // AI grading result (if used)
  manualScore?: number;                 // Manual score (if provided)
  manualFeedback?: string;              // Manual feedback (if provided)

  // Grading metadata
  gradingType: 'AI' | 'MANUAL' | 'HYBRID';
  requiresManualReview: boolean;        // Whether manual review is needed
  confidence: number;                   // Overall confidence in the grade

  // Essay-specific results
  criteriaResults: Array<{              // Results for each grading criterion
    criterionId: string;
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;

  // Analytics data
  analytics: {
    wordCount: number;
    timeSpent: number;
    revisionCount: number;
    writingSpeed: number;               // Words per minute
    engagementScore: number;            // Calculated engagement (0-100)
  };
}

/**
 * Main essay grading function
 * Handles both AI and manual grading workflows based on configuration
 * Follows the established pattern from other activity grading functions
 */
export function gradeEssayActivity(
  activity: EssayActivity,
  submissionData: EssaySubmissionData
): EssayGradingResult {
  try {
    console.log('Starting essay grading process', {
      activityId: activity.id,
      wordCount: submissionData.wordCount,
      gradingWorkflow: activity.settings.manualGrading.gradingWorkflow,
    });

    // Validate submission meets requirements
    validateEssaySubmission(submissionData, activity);

    // Calculate basic analytics
    const analytics = calculateEssayAnalytics(submissionData);

    // For now, provide a basic grading implementation
    // TODO: Implement full AI grading integration
    const score = calculateBasicScore(submissionData, activity);
    const maxScore = 100; // Default max score
    const percentage = (score / maxScore) * 100;
    const passed = percentage >= (activity.settings.passingPercentage ?? 60);

    // Create basic Bloom's level scores
    const bloomsLevelScores: Record<BloomsTaxonomyLevel, number> = {
      [BloomsTaxonomyLevel.REMEMBER]: Math.max(0, score - 20),
      [BloomsTaxonomyLevel.UNDERSTAND]: Math.max(0, score - 15),
      [BloomsTaxonomyLevel.APPLY]: Math.max(0, score - 10),
      [BloomsTaxonomyLevel.ANALYZE]: score,
      [BloomsTaxonomyLevel.EVALUATE]: Math.max(0, score - 5),
      [BloomsTaxonomyLevel.CREATE]: Math.max(0, score - 10),
    };

    const demonstratedLevel = determineDemonstratedBloomsLevel(bloomsLevelScores);

    // Generate basic feedback
    const feedback = generateBasicFeedback(submissionData, activity, score);

    // Build criteria results
    const criteriaResults = activity.settings.aiGrading.gradingCriteria.map(criterion => ({
      criterionId: criterion.id,
      name: criterion.name,
      score: Math.round(score * criterion.weight),
      maxScore: criterion.maxPoints,
      feedback: `Performance in ${criterion.name.toLowerCase()} meets expectations.`,
    }));

    const result: EssayGradingResult = {
      // Base GradingResult fields
      score,
      maxScore,
      percentage,
      passed,
      questionResults: [], // Essays don't have individual questions
      overallFeedback: feedback,
      completedAt: new Date(),

      // Essay-specific fields
      gradingType: activity.settings.aiGrading.enabled ? 'AI' : 'MANUAL',
      requiresManualReview: activity.settings.manualGrading.requiresManualReview,
      confidence: 0.8, // Default confidence
      criteriaResults,

      analytics: {
        ...analytics,
        engagementScore: calculateEngagementScore(submissionData, analytics),
      },
    };

    console.log('Essay grading completed successfully', {
      activityId: activity.id,
      score,
      percentage,
      gradingType: result.gradingType,
      requiresManualReview: result.requiresManualReview,
    });

    return result;

  } catch (error) {
    console.error('Error grading essay activity:', error);
    throw new Error(`Essay grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered essay grading function
 * Uses the new AI grading service for comprehensive essay analysis
 */
export async function gradeEssayActivityWithAI(
  activity: EssayActivity,
  submissionData: EssaySubmissionData,
  submissionId: string,
  prisma: any // PrismaClient
): Promise<EssayGradingResult> {
  try {
    console.log('Starting AI-powered essay grading process', {
      activityId: activity.id,
      submissionId,
      wordCount: submissionData.wordCount,
      aiEnabled: activity.settings.aiGrading.enabled
    });

    // Validate submission meets requirements
    validateEssaySubmission(submissionData, activity);

    // Initialize services
    const aiGradingService = new AIEssayGradingService();
    const databaseService = new EssayGradingDatabaseService(prisma);

    // Prepare AI grading request
    const gradingRequest: EssayGradingRequest = {
      submissionId,
      essayContent: submissionData.essayText,
      maxScore: 100, // Default max score
      gradingCriteria: activity.settings.aiGrading.gradingCriteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight,
        maxPoints: criterion.maxPoints,
        rubricLevels: [] // Add empty rubric levels for now
      })),
      requireManualReview: activity.settings.manualGrading.requiresManualReview
    };

    // Perform AI grading
    const aiResult: AIEssayGradingResult = await aiGradingService.gradeEssay(gradingRequest);

    // Save AI grading result to database
    await databaseService.saveAIGradingResult(submissionId, aiResult);

    // Update word count in database
    await databaseService.updateEssayWordCount(submissionId, submissionData.wordCount);

    // Update points and scoring system
    await updateActivityPointsAndAnalytics(submissionId, aiResult.aiScore, aiResult.aiBloomsLevel, activity, prisma);

    // Calculate basic analytics
    const analytics = calculateEssayAnalytics(submissionData);

    // Convert AI result to EssayGradingResult format
    const percentage = (aiResult.aiScore / gradingRequest.maxScore) * 100;
    const passed = percentage >= (activity.settings.passingPercentage ?? 60);

    // Build criteria results from AI analysis
    const criteriaResults = aiResult.criteriaScores?.map(criteria => ({
      criterionId: criteria.criteriaId,
      name: activity.settings.aiGrading.gradingCriteria.find(c => c.id === criteria.criteriaId)?.name || 'Unknown',
      score: criteria.score,
      maxScore: activity.settings.aiGrading.gradingCriteria.find(c => c.id === criteria.criteriaId)?.maxPoints || 100,
      feedback: criteria.feedback,
    })) || [];

    const result: EssayGradingResult = {
      // Base GradingResult fields
      score: aiResult.aiScore,
      maxScore: gradingRequest.maxScore,
      percentage,
      passed,
      questionResults: [], // Essays don't have individual questions
      overallFeedback: aiResult.aiFeedback,
      completedAt: aiResult.gradedAt,

      // Essay-specific fields
      gradingType: aiResult.requiresManualReview ? EssayGradingMethod.HYBRID : EssayGradingMethod.AI,
      requiresManualReview: aiResult.requiresManualReview,
      confidence: aiResult.aiConfidence,
      criteriaResults,

      analytics: {
        ...analytics,
        engagementScore: calculateEngagementScore(submissionData, analytics),
      },
    };

    console.log('AI essay grading completed successfully', {
      activityId: activity.id,
      submissionId,
      score: aiResult.aiScore,
      confidence: aiResult.aiConfidence,
      requiresManualReview: aiResult.requiresManualReview,
      bloomsLevel: aiResult.aiBloomsLevel,
      processingTime: aiResult.processingTime
    });

    return result;

  } catch (error) {
    console.error('Error in AI essay grading:', error);
    throw new Error(`AI essay grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate basic essay analytics
 */
function calculateEssayAnalytics(submission: EssaySubmissionData) {
  const timeSpentMinutes = submission.timeSpent / 60;
  const writingSpeed = timeSpentMinutes > 0 ? submission.wordCount / timeSpentMinutes : 0;

  return {
    wordCount: submission.wordCount,
    timeSpent: submission.timeSpent,
    revisionCount: submission.revisionCount,
    writingSpeed: Math.round(writingSpeed * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Determine demonstrated Bloom's level from scores
 */
function determineDemonstratedBloomsLevel(
  levelScores: Record<BloomsTaxonomyLevel, number>
): BloomsTaxonomyLevel {
  // Find the highest scoring level above 70% threshold
  const threshold = 70;
  let highestLevel = BloomsTaxonomyLevel.REMEMBER;
  let highestScore = 0;

  for (const [level, score] of Object.entries(levelScores)) {
    if (score >= threshold && score > highestScore) {
      highestLevel = level as BloomsTaxonomyLevel;
      highestScore = score;
    }
  }

  return highestLevel;
}

/**
 * Calculate engagement score based on writing behavior
 */
function calculateEngagementScore(
  submission: EssaySubmissionData,
  analytics: { writingSpeed: number; revisionCount: number; }
): number {
  let score = 50; // Base score

  // Factor in writing speed (optimal range: 20-40 WPM)
  if (analytics.writingSpeed >= 20 && analytics.writingSpeed <= 40) {
    score += 20;
  } else if (analytics.writingSpeed > 10) {
    score += 10;
  }

  // Factor in revision count (shows engagement)
  if (analytics.revisionCount > 0) {
    score += Math.min(analytics.revisionCount * 5, 20);
  }

  // Factor in time spent (reasonable time shows engagement)
  const timeSpentMinutes = submission.timeSpent / 60;
  if (timeSpentMinutes >= 10 && timeSpentMinutes <= 120) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate basic score for essay based on word count and time spent
 * This is a placeholder implementation until full AI grading is implemented
 */
function calculateBasicScore(
  submission: EssaySubmissionData,
  activity: EssayActivity
): number {
  let score = 60; // Base passing score

  // Word count scoring (40% of total)
  const { minWords, maxWords } = activity.settings;
  const wordCount = submission.wordCount;

  if (wordCount >= minWords && wordCount <= maxWords) {
    score += 25; // Full points for meeting word count
  } else if (wordCount >= minWords * 0.8) {
    score += 15; // Partial points for close to minimum
  } else if (wordCount >= minWords * 0.6) {
    score += 10; // Minimal points for significant shortfall
  }

  // Time spent scoring (15% of total)
  const timeSpentMinutes = submission.timeSpent / 60;
  if (timeSpentMinutes >= 10) {
    score += 15; // Reasonable time spent
  } else if (timeSpentMinutes >= 5) {
    score += 10; // Some effort shown
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate basic feedback for essay submission
 * This is a placeholder implementation until full AI grading is implemented
 */
function generateBasicFeedback(
  submission: EssaySubmissionData,
  activity: EssayActivity,
  score: number
): string {
  const { minWords, maxWords } = activity.settings;
  const wordCount = submission.wordCount;

  let feedback = `Your essay has been graded with a score of ${score}/100.\n\n`;

  // Word count feedback
  if (wordCount >= minWords && wordCount <= maxWords) {
    feedback += `✓ Word count (${wordCount}) meets the requirements (${minWords}-${maxWords} words).\n`;
  } else if (wordCount < minWords) {
    feedback += `⚠ Word count (${wordCount}) is below the minimum requirement of ${minWords} words. Consider expanding your ideas.\n`;
  } else {
    feedback += `⚠ Word count (${wordCount}) exceeds the maximum limit of ${maxWords} words. Consider being more concise.\n`;
  }

  // Time spent feedback
  const timeSpentMinutes = Math.round(submission.timeSpent / 60);
  feedback += `⏱ Time spent: ${timeSpentMinutes} minutes.\n`;

  // Revision feedback
  if (submission.revisionCount > 0) {
    feedback += `✓ Good job making ${submission.revisionCount} revision(s) to improve your work.\n`;
  }

  // Overall performance feedback
  if (score >= 90) {
    feedback += `\n🎉 Excellent work! Your essay demonstrates strong understanding and communication skills.`;
  } else if (score >= 80) {
    feedback += `\n👍 Good work! Your essay shows solid understanding with room for improvement.`;
  } else if (score >= 70) {
    feedback += `\n📝 Satisfactory work. Consider reviewing the prompt and expanding your analysis.`;
  } else if (score >= 60) {
    feedback += `\n⚠ Your essay meets basic requirements but needs significant improvement.`;
  } else {
    feedback += `\n❌ Your essay needs substantial revision to meet the assignment requirements.`;
  }

  return feedback;
}

/**
 * Validate essay submission meets activity requirements
 * Simplified version aligned with existing architecture
 */
function validateEssaySubmission(
  submission: EssaySubmissionData,
  activity: EssayActivity
): void {
  const { minWords, maxWords } = activity.settings;

  // Check word count requirements
  if (submission.wordCount < minWords) {
    throw new Error(`Essay is too short. Minimum ${minWords} words required, got ${submission.wordCount}`);
  }

  if (submission.wordCount > maxWords) {
    throw new Error(`Essay is too long. Maximum ${maxWords} words allowed, got ${submission.wordCount}`);
  }

  // Validate essay content
  if (!submission.essayText || submission.essayText.trim().length === 0) {
    throw new Error('Essay content cannot be empty');
  }
}

/**
 * Update activity points and analytics after grading
 */
async function updateActivityPointsAndAnalytics(
  submissionId: string,
  score: number,
  bloomsLevel: BloomsTaxonomyLevel,
  activity: EssayActivity,
  prisma: any
): Promise<void> {
  try {
    // Calculate points based on score (using standard 100-point scale)
    const pointsEarned = Math.round(score);

    // Update the activity grade with points and Bloom's level
    await prisma.activityGrade.update({
      where: { id: submissionId },
      data: {
        pointsEarned,
        bloomsLevel: bloomsLevel,
        gradedAt: new Date(),
      }
    });

    console.log('Activity points and analytics updated successfully', {
      submissionId,
      pointsEarned,
      bloomsLevel,
      score
    });
  } catch (error) {
    console.error('Error updating activity points and analytics:', error);
    // Don't throw - this is a background operation
  }
}
