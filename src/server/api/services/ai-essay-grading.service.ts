/**
 * AI Essay Grading Service
 * 
 * Complete implementation of AI-powered essay grading with
 * OpenAI integration, comprehensive analysis, and quality assurance.
 */

import OpenAI from 'openai';
import { 
  EssayGradingResult, 
  EssayGradingRequest,
  EssayAIAnalysis,
  EssayGradingMethod 
} from '@/types/essay-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

export class AIEssayGradingService {
  private openai: OpenAI;
  private readonly MODEL = 'gpt-4-turbo-preview';
  private readonly MAX_TOKENS = 4000;
  private readonly TEMPERATURE = 0.3; // Lower for more consistent grading

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Grade an essay using AI with comprehensive analysis
   */
  async gradeEssay(request: EssayGradingRequest): Promise<EssayGradingResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateGradingRequest(request);

      // Perform AI analysis
      const analysis = await this.performAIAnalysis(
        request.essayContent,
        request.maxScore,
        request.gradingCriteria
      );

      // Calculate final score and confidence
      const { finalScore, confidence } = this.calculateFinalScore(analysis, request.maxScore);

      // Determine if manual review is required
      const requiresManualReview = this.shouldRequireManualReview(
        confidence,
        finalScore,
        analysis,
        request.requireManualReview
      );

      // Generate comprehensive feedback
      const feedback = this.generateFeedback(analysis, finalScore, request.maxScore);

      const processingTime = Date.now() - startTime;

      return {
        submissionId: request.submissionId,
        aiScore: finalScore,
        aiConfidence: confidence,
        aiFeedback: feedback,
        aiAnalysis: analysis,
        aiBloomsLevel: analysis.bloomsAnalysis.detectedLevel,
        requiresManualReview,
        reviewReasons: this.getReviewReasons(confidence, analysis),
        suggestedFinalScore: requiresManualReview ? undefined : finalScore,
        processingTime,
        modelVersion: this.MODEL,
        gradedAt: new Date(),
      };
    } catch (error) {
      console.error('Error in AI essay grading:', error);
      throw new Error(`AI grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform comprehensive AI analysis of the essay
   */
  private async performAIAnalysis(
    essayContent: string,
    maxScore: number,
    gradingCriteria?: any[]
  ): Promise<EssayAIAnalysis> {
    const prompt = this.buildAnalysisPrompt(essayContent, maxScore, gradingCriteria);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert essay grader with deep knowledge of writing assessment, Bloom\'s taxonomy, and educational standards. Provide detailed, constructive analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
        response_format: { type: 'json_object' }
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from AI');
      }

      return this.parseAIAnalysis(analysisText);
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw new Error('Failed to perform AI analysis');
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(
    essayContent: string,
    maxScore: number,
    gradingCriteria?: any[]
  ): string {
    const wordCount = essayContent.split(/\s+/).length;
    
    return `
Please analyze this essay comprehensively and provide a detailed assessment in JSON format.

ESSAY TO ANALYZE:
"""
${essayContent}
"""

ANALYSIS REQUIREMENTS:
- Word count: ${wordCount} words
- Maximum possible score: ${maxScore}
- Provide scores as percentages (0-100)

Please provide your analysis in the following JSON structure:

{
  "contentQuality": {
    "score": <0-100>,
    "feedback": "<detailed feedback on content quality>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>"]
  },
  "structure": {
    "score": <0-100>,
    "hasIntroduction": <boolean>,
    "hasConclusion": <boolean>,
    "paragraphCount": <number>,
    "coherence": <0-100>,
    "feedback": "<feedback on essay structure>"
  },
  "language": {
    "grammarScore": <0-100>,
    "vocabularyScore": <0-100>,
    "clarityScore": <0-100>,
    "grammarErrors": [
      {
        "type": "<error type>",
        "position": <character position>,
        "suggestion": "<correction suggestion>"
      }
    ],
    "feedback": "<feedback on language use>"
  },
  "bloomsAnalysis": {
    "detectedLevel": "<REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE>",
    "confidence": <0-1>,
    "evidence": ["<evidence 1>", "<evidence 2>"],
    "reasoning": "<explanation of Bloom's level detection>"
  },
  "overall": {
    "readabilityScore": <0-100>,
    "originalityScore": <0-100>,
    "relevanceScore": <0-100>
  }
}

GRADING CRITERIA:
${gradingCriteria ? JSON.stringify(gradingCriteria, null, 2) : 'Use standard academic essay criteria'}

Focus on:
1. Content depth and accuracy
2. Argument structure and logic
3. Writing mechanics and style
4. Critical thinking level (Bloom's taxonomy)
5. Overall coherence and flow

Be constructive and specific in your feedback.
`;
  }

  /**
   * Parse AI analysis response
   */
  private parseAIAnalysis(analysisText: string): EssayAIAnalysis {
    try {
      const parsed = JSON.parse(analysisText);
      
      // Validate required fields
      this.validateAnalysisStructure(parsed);
      
      return parsed as EssayAIAnalysis;
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Calculate final score and confidence
   */
  private calculateFinalScore(
    analysis: EssayAIAnalysis,
    maxScore: number
  ): { finalScore: number; confidence: number } {
    // Weighted average of different components
    const weights = {
      content: 0.4,
      structure: 0.25,
      language: 0.25,
      overall: 0.1
    };

    const contentScore = analysis.contentQuality.score;
    const structureScore = analysis.structure.score;
    const languageScore = (
      analysis.language.grammarScore + 
      analysis.language.vocabularyScore + 
      analysis.language.clarityScore
    ) / 3;
    const overallScore = (
      analysis.overall.readabilityScore + 
      analysis.overall.originalityScore + 
      analysis.overall.relevanceScore
    ) / 3;

    const weightedScore = (
      contentScore * weights.content +
      structureScore * weights.structure +
      languageScore * weights.language +
      overallScore * weights.overall
    );

    // Scale to max score
    const finalScore = Math.round((weightedScore / 100) * maxScore);

    // Calculate confidence based on consistency of scores
    const scores = [contentScore, structureScore, languageScore, overallScore];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(0.5, 1 - (standardDeviation / 50));

    return { 
      finalScore: Math.max(0, Math.min(finalScore, maxScore)), 
      confidence: Math.min(1, confidence) 
    };
  }

  /**
   * Determine if manual review is required
   */
  private shouldRequireManualReview(
    confidence: number,
    score: number,
    analysis: EssayAIAnalysis,
    forceReview?: boolean
  ): boolean {
    if (forceReview) return true;

    // Low confidence threshold
    if (confidence < 0.7) return true;

    // Very high or very low scores need review
    if (score >= 95 || score <= 30) return true;

    // Complex Bloom's levels need review
    if (['EVALUATE', 'CREATE'].includes(analysis.bloomsAnalysis.detectedLevel)) {
      return true;
    }

    // Many grammar errors
    if (analysis.language.grammarErrors.length > 5) return true;

    return false;
  }

  /**
   * Generate comprehensive feedback
   */
  private generateFeedback(
    analysis: EssayAIAnalysis,
    score: number,
    maxScore: number
  ): string {
    const percentage = Math.round((score / maxScore) * 100);
    
    let feedback = `Score: ${score}/${maxScore} (${percentage}%)\n\n`;
    
    feedback += `**Content Quality (${analysis.contentQuality.score}%):**\n`;
    feedback += `${analysis.contentQuality.feedback}\n\n`;
    
    if (analysis.contentQuality.strengths.length > 0) {
      feedback += `**Strengths:**\n`;
      analysis.contentQuality.strengths.forEach(strength => {
        feedback += `• ${strength}\n`;
      });
      feedback += '\n';
    }
    
    if (analysis.contentQuality.improvements.length > 0) {
      feedback += `**Areas for Improvement:**\n`;
      analysis.contentQuality.improvements.forEach(improvement => {
        feedback += `• ${improvement}\n`;
      });
      feedback += '\n';
    }
    
    feedback += `**Structure & Organization (${analysis.structure.score}%):**\n`;
    feedback += `${analysis.structure.feedback}\n\n`;
    
    feedback += `**Language & Mechanics:**\n`;
    feedback += `Grammar: ${analysis.language.grammarScore}% | `;
    feedback += `Vocabulary: ${analysis.language.vocabularyScore}% | `;
    feedback += `Clarity: ${analysis.language.clarityScore}%\n`;
    feedback += `${analysis.language.feedback}\n\n`;
    
    feedback += `**Critical Thinking Level:** ${analysis.bloomsAnalysis.detectedLevel}\n`;
    feedback += `${analysis.bloomsAnalysis.reasoning}\n\n`;
    
    if (analysis.language.grammarErrors.length > 0) {
      feedback += `**Grammar Suggestions:**\n`;
      analysis.language.grammarErrors.slice(0, 3).forEach(error => {
        feedback += `• ${error.type}: ${error.suggestion}\n`;
      });
    }
    
    return feedback;
  }

  /**
   * Get reasons for manual review
   */
  private getReviewReasons(confidence: number, analysis: EssayAIAnalysis): string[] {
    const reasons: string[] = [];
    
    if (confidence < 0.7) {
      reasons.push(`Low AI confidence (${Math.round(confidence * 100)}%)`);
    }
    
    if (['EVALUATE', 'CREATE'].includes(analysis.bloomsAnalysis.detectedLevel)) {
      reasons.push('High-level critical thinking detected');
    }
    
    if (analysis.language.grammarErrors.length > 5) {
      reasons.push('Multiple grammar issues require human review');
    }
    
    return reasons;
  }

  /**
   * Validate grading request
   */
  private validateGradingRequest(request: EssayGradingRequest): void {
    if (!request.essayContent || request.essayContent.trim().length === 0) {
      throw new Error('Essay content is required');
    }
    
    if (request.maxScore <= 0) {
      throw new Error('Max score must be positive');
    }
    
    const wordCount = request.essayContent.split(/\s+/).length;
    if (wordCount < 10) {
      throw new Error('Essay is too short for meaningful analysis');
    }
  }

  /**
   * Validate analysis structure
   */
  private validateAnalysisStructure(analysis: any): void {
    const required = [
      'contentQuality', 'structure', 'language', 
      'bloomsAnalysis', 'overall'
    ];
    
    for (const field of required) {
      if (!analysis[field]) {
        throw new Error(`Missing required analysis field: ${field}`);
      }
    }
  }
}
