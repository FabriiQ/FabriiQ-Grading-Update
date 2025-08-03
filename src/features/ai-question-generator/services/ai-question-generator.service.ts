/**
 * AI Question Generator Service
 * 
 * Uses Google Gemini to generate questions based on topics, learning outcomes,
 * Bloom's taxonomy levels, and action verbs for assessments and activities.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

export interface QuestionGenerationRequest {
  topics: string[];
  learningOutcomes: string[];
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  questionCount: number;
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-blank' | 'matching';
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  subject?: string;
  gradeLevel?: string;
  customPrompt?: string;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: string;
  bloomsLevel: BloomsTaxonomyLevel;
  topic: string;
  learningOutcome: string;
  actionVerb: string;
  difficulty: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  metadata: {
    totalGenerated: number;
    requestedCount: number;
    generationTime: number;
    model: string;
  };
}

export class AIQuestionGeneratorService {
  private genAI: GoogleGenerativeAI;
  private readonly MODEL = 'gemini-2.0-flash';
  private readonly TEMPERATURE = 0.7;
  private readonly MAX_TOKENS = 2000;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Generative AI API key not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate questions based on the provided parameters
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      const questions = this.parseResponse(response, request);

      return {
        questions,
        metadata: {
          totalGenerated: questions.length,
          requestedCount: request.questionCount,
          generationTime: Date.now() - startTime,
          model: this.MODEL
        }
      };
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error(`Failed to generate questions: ${(error as Error).message}`);
    }
  }

  /**
   * Build the prompt for question generation
   */
  private buildPrompt(request: QuestionGenerationRequest): string {
    const {
      topics,
      learningOutcomes,
      bloomsLevel,
      actionVerbs,
      questionCount,
      questionType = 'multiple-choice',
      difficultyLevel = 'medium',
      subject,
      gradeLevel,
      customPrompt
    } = request;

    const basePrompt = `You are an expert educational content creator specializing in question generation. Generate ${questionCount} high-quality ${questionType} questions based on the following parameters:

**Topics:** ${topics.join(', ')}
**Learning Outcomes:** ${learningOutcomes.join(', ')}
**Bloom's Taxonomy Level:** ${bloomsLevel}
**Action Verbs to Use:** ${actionVerbs.join(', ')}
**Question Type:** ${questionType}
**Difficulty Level:** ${difficultyLevel}
${subject ? `**Subject:** ${subject}` : ''}
${gradeLevel ? `**Grade Level:** ${gradeLevel}` : ''}

**Requirements:**
1. Each question must align with the specified Bloom's taxonomy level (${bloomsLevel})
2. Use the provided action verbs naturally in the questions
3. Questions should directly assess the learning outcomes
4. Maintain appropriate difficulty level (${difficultyLevel})
5. Ensure questions are clear, unambiguous, and educationally sound
6. For multiple-choice questions, provide 4 options with one correct answer
7. Include brief explanations for correct answers

**Bloom's Taxonomy Guidelines:**
- Remember: Recall facts, terms, basic concepts
- Understand: Explain ideas, concepts, interpret information
- Apply: Use information in new situations, solve problems
- Analyze: Draw connections, examine relationships, break down information
- Evaluate: Justify decisions, critique, assess value
- Create: Produce new work, combine elements, design solutions

${customPrompt ? `**Additional Instructions:** ${customPrompt}` : ''}

**Output Format:**
Return a valid JSON array with the following structure for each question:
{
  "id": "unique_id",
  "question": "The question text",
  "type": "${questionType}",
  "bloomsLevel": "${bloomsLevel}",
  "topic": "relevant topic from the list",
  "learningOutcome": "relevant learning outcome",
  "actionVerb": "action verb used in the question",
  "difficulty": "${difficultyLevel}",
  ${questionType === 'multiple-choice' ? '"options": ["A", "B", "C", "D"],' : ''}
  "correctAnswer": "correct answer",
  "explanation": "brief explanation of the correct answer",
  "points": 1
}

Generate exactly ${questionCount} questions and return only the JSON array, no additional text.`;

    return basePrompt;
  }

  /**
   * Call the Gemini API with the generated prompt
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.MODEL,
        generationConfig: {
          temperature: this.TEMPERATURE,
          maxOutputTokens: this.MAX_TOKENS,
          responseMimeType: 'application/json',
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response received from AI model');
      }

      return text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(`Failed to call AI model: ${(error as Error).message}`);
    }
  }

  /**
   * Parse the AI response and validate the generated questions
   */
  private parseResponse(response: string, request: QuestionGenerationRequest): GeneratedQuestion[] {
    try {
      const questions = JSON.parse(response);

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      return questions.map((q: any, index: number) => ({
        id: q.id || `generated_${Date.now()}_${index}`,
        question: q.question || '',
        type: q.type || request.questionType || 'multiple-choice',
        bloomsLevel: q.bloomsLevel || request.bloomsLevel,
        topic: q.topic || request.topics[0] || '',
        learningOutcome: q.learningOutcome || request.learningOutcomes[0] || '',
        actionVerb: q.actionVerb || request.actionVerbs[0] || '',
        difficulty: q.difficulty || request.difficultyLevel || 'medium',
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        points: q.points || 1
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Validate question generation request
   */
  validateRequest(request: QuestionGenerationRequest): string[] {
    const errors: string[] = [];

    if (!request.topics || request.topics.length === 0) {
      errors.push('At least one topic is required');
    }

    if (!request.learningOutcomes || request.learningOutcomes.length === 0) {
      errors.push('At least one learning outcome is required');
    }

    if (!request.actionVerbs || request.actionVerbs.length === 0) {
      errors.push('At least one action verb is required');
    }

    if (!request.questionCount || request.questionCount < 1 || request.questionCount > 50) {
      errors.push('Question count must be between 1 and 50');
    }

    if (!request.bloomsLevel) {
      errors.push('Bloom\'s taxonomy level is required');
    }

    return errors;
  }
}

// Export singleton instance
export const aiQuestionGeneratorService = new AIQuestionGeneratorService();
