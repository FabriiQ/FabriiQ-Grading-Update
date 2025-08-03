/**
 * Activity AI Generator Service
 * 
 * Provides AI generation capabilities for all activity types,
 * generating content that matches each activity's exact schema.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

export interface ActivityGenerationRequest {
  activityType: string;
  topics: string[];
  learningOutcomes: string[];
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  itemCount: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  subject?: string;
  gradeLevel?: string;
  customPrompt?: string;
  additionalContext?: Record<string, any>;
}

export interface GeneratedActivityContent {
  activityType: string;
  content: any; // Schema-specific content
  metadata: {
    totalGenerated: number;
    requestedCount: number;
    generationTime: number;
    model: string;
    bloomsLevel: BloomsTaxonomyLevel;
  };
}

export class ActivityAIGeneratorService {
  private genAI: GoogleGenerativeAI;
  private readonly MODEL = 'gemini-2.0-flash';
  private readonly TEMPERATURE = 0.7;
  private readonly MAX_TOKENS = 3000;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Generative AI API key not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate activity content based on type and parameters
   */
  async generateActivityContent(request: ActivityGenerationRequest): Promise<GeneratedActivityContent> {
    const startTime = Date.now();

    try {
      const prompt = this.buildActivityPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      const content = this.parseActivityResponse(response, request);

      return {
        activityType: request.activityType,
        content,
        metadata: {
          totalGenerated: this.getGeneratedItemCount(content, request.activityType),
          requestedCount: request.itemCount,
          generationTime: Date.now() - startTime,
          model: this.MODEL,
          bloomsLevel: request.bloomsLevel
        }
      };
    } catch (error) {
      console.error('Error generating activity content:', error);
      throw new Error(`Failed to generate ${request.activityType} content: ${(error as Error).message}`);
    }
  }

  /**
   * Build activity-specific prompt
   */
  private buildActivityPrompt(request: ActivityGenerationRequest): string {
    const {
      activityType,
      topics,
      learningOutcomes,
      bloomsLevel,
      actionVerbs,
      itemCount,
      difficultyLevel = 'medium',
      subject,
      gradeLevel,
      customPrompt,
      additionalContext
    } = request;

    const basePrompt = `You are an expert educational content creator. Generate ${itemCount} high-quality items for a ${activityType} activity based on the following parameters:

**Activity Type:** ${activityType}
**Topics:** ${topics.join(', ')}
**Learning Outcomes:** ${learningOutcomes.join(', ')}
**Bloom's Taxonomy Level:** ${bloomsLevel}
**Action Verbs to Use:** ${actionVerbs.join(', ')}
**Difficulty Level:** ${difficultyLevel}
${subject ? `**Subject:** ${subject}` : ''}
${gradeLevel ? `**Grade Level:** ${gradeLevel}` : ''}

**Requirements:**
1. Generate content that aligns with the specified Bloom's taxonomy level (${bloomsLevel})
2. Use the provided action verbs naturally in the content
3. Content should directly assess the learning outcomes
4. Maintain appropriate difficulty level (${difficultyLevel})
5. Ensure content is educationally sound and age-appropriate
6. Follow the exact schema format for ${activityType} activities

${this.getActivitySpecificInstructions(activityType, itemCount, additionalContext)}

${customPrompt ? `**Additional Instructions:** ${customPrompt}` : ''}

Generate exactly ${itemCount} items and return only the JSON response, no additional text.`;

    return basePrompt;
  }

  /**
   * Get activity-specific instructions and schema
   */
  private getActivitySpecificInstructions(activityType: string, itemCount: number, additionalContext?: Record<string, any>): string {
    switch (activityType) {
      case 'multiple-choice':
        return `**Multiple Choice Activity Schema:**
Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Question text",
      "options": [
        { "id": "opt_1", "text": "Option 1", "isCorrect": false, "feedback": "Feedback text" },
        { "id": "opt_2", "text": "Option 2", "isCorrect": true, "feedback": "Correct! Explanation..." },
        { "id": "opt_3", "text": "Option 3", "isCorrect": false, "feedback": "Feedback text" },
        { "id": "opt_4", "text": "Option 4", "isCorrect": false, "feedback": "Feedback text" }
      ],
      "explanation": "Detailed explanation of the correct answer",
      "hint": "Optional hint for students",
      "points": 1
    }
  ]
}`;

      case 'true-false':
        return `**True/False Activity Schema:**
Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Statement to evaluate",
      "isTrue": true,
      "explanation": "Explanation of why this is true/false",
      "hint": "Optional hint",
      "points": 1
    }
  ]
}`;

      case 'fill-in-the-blanks':
        return `**Fill in the Blanks Activity Schema:**
Return a JSON object with this structure:
{
  "passages": [
    {
      "id": "unique_id",
      "text": "Text with _____ blanks where students fill in answers",
      "blanks": [
        {
          "id": "blank_1",
          "position": 0,
          "correctAnswers": ["answer1", "answer2"],
          "caseSensitive": false,
          "hint": "Optional hint"
        }
      ],
      "explanation": "Explanation of the passage and answers"
    }
  ]
}`;

      case 'matching':
        return `**Matching Activity Schema:**
Return a JSON object with this structure:
{
  "matchingSets": [
    {
      "id": "unique_id",
      "title": "Set title",
      "leftItems": [
        { "id": "left_1", "text": "Item to match", "media": null }
      ],
      "rightItems": [
        { "id": "right_1", "text": "Matching item", "media": null }
      ],
      "correctPairs": [
        { "leftId": "left_1", "rightId": "right_1" }
      ],
      "explanation": "Explanation of the matches"
    }
  ]
}`;

      case 'sequence':
        return `**Sequence/Ordering Activity Schema:**
Return a JSON object with this structure:
{
  "sequences": [
    {
      "id": "unique_id",
      "title": "Sequence title",
      "items": [
        {
          "id": "item_1",
          "text": "Item text",
          "correctPosition": 1,
          "media": null
        }
      ],
      "explanation": "Explanation of the correct sequence"
    }
  ]
}`;

      case 'drag-and-drop':
        return `**Drag and Drop Activity Schema:**
Return a JSON object with this structure:
{
  "dragDropSets": [
    {
      "id": "unique_id",
      "title": "Activity title",
      "draggableItems": [
        {
          "id": "drag_1",
          "text": "Draggable item",
          "media": null,
          "correctDropZoneId": "drop_1"
        }
      ],
      "dropZones": [
        {
          "id": "drop_1",
          "label": "Drop zone label",
          "acceptsMultiple": false
        }
      ],
      "explanation": "Explanation of correct placements"
    }
  ]
}`;

      case 'essay':
        return `**Essay Activity Schema:**
Return a JSON object with this structure:
{
  "prompts": [
    {
      "id": "unique_id",
      "title": "Essay title",
      "prompt": "Essay prompt/question",
      "instructions": "Detailed instructions for students",
      "wordLimit": { "min": 200, "max": 500 },
      "timeLimit": 30,
      "rubric": [
        {
          "criterion": "Content Knowledge",
          "description": "Demonstrates understanding of topic",
          "points": 25,
          "levels": [
            { "name": "Excellent", "description": "Comprehensive understanding", "score": 25 },
            { "name": "Good", "description": "Good understanding", "score": 20 },
            { "name": "Fair", "description": "Basic understanding", "score": 15 },
            { "name": "Poor", "description": "Limited understanding", "score": 10 }
          ]
        }
      ],
      "sampleAnswer": "Sample answer for reference",
      "keywordsConcepts": ["keyword1", "keyword2"]
    }
  ]
}`;

      case 'numeric':
        return `**Numeric Activity Schema:**
Return a JSON object with this structure:
{
  "problems": [
    {
      "id": "unique_id",
      "text": "Math problem text",
      "correctAnswer": 42,
      "tolerance": 0.1,
      "unit": "meters",
      "explanation": "Step-by-step solution",
      "hint": "Optional hint",
      "points": 1
    }
  ]
}`;

      case 'flash-cards':
        return `**Flash Cards Activity Schema:**
Return a JSON object with this structure:
{
  "cards": [
    {
      "id": "unique_id",
      "front": {
        "text": "Front of card (question/term)",
        "media": null
      },
      "back": {
        "text": "Back of card (answer/definition)",
        "media": null
      },
      "category": "Category name",
      "difficulty": "medium"
    }
  ]
}`;

      case 'drag-the-words':
        return `**Drag the Words Activity Schema:**
Return a JSON object with this structure:
{
  "passages": [
    {
      "id": "unique_id",
      "text": "Text with missing words that students drag from word bank",
      "missingWords": [
        {
          "id": "word_1",
          "position": 0,
          "correctWord": "correct word",
          "distractors": ["wrong1", "wrong2"]
        }
      ],
      "wordBank": ["correct word", "wrong1", "wrong2"],
      "explanation": "Explanation of the passage"
    }
  ]
}`;

      case 'reading':
        return `**Reading Activity Schema:**
Return a JSON object with this structure:
{
  "passages": [
    {
      "id": "unique_id",
      "title": "Reading title",
      "content": "Reading passage text",
      "comprehensionQuestions": [
        {
          "id": "q_1",
          "text": "Comprehension question",
          "type": "multiple-choice",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Why this is correct"
        }
      ],
      "vocabulary": [
        { "word": "difficult word", "definition": "definition" }
      ]
    }
  ]
}`;

      case 'video':
        return `**Video Activity Schema:**
Return a JSON object with this structure:
{
  "videoActivities": [
    {
      "id": "unique_id",
      "title": "Video activity title",
      "description": "Description of what students will learn",
      "discussionQuestions": [
        {
          "id": "dq_1",
          "text": "Discussion question about the video",
          "type": "open-ended"
        }
      ],
      "keyPoints": ["Key point 1", "Key point 2"],
      "followUpActivities": ["Activity suggestion 1"]
    }
  ]
}`;

      case 'quiz':
        return `**Quiz Activity Schema:**
Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "type": "multiple-choice",
      "text": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "explanation": "Explanation",
      "points": 1
    }
  ],
  "settings": {
    "timeLimit": 30,
    "allowRetakes": true,
    "showCorrectAnswers": true
  }
}`;

      case 'multiple-response':
        return `**Multiple Response Activity Schema:**
Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Question text",
      "options": [
        { "id": "opt_1", "text": "Option 1", "isCorrect": true },
        { "id": "opt_2", "text": "Option 2", "isCorrect": false },
        { "id": "opt_3", "text": "Option 3", "isCorrect": true },
        { "id": "opt_4", "text": "Option 4", "isCorrect": false }
      ],
      "explanation": "Explanation of correct answers",
      "points": 1
    }
  ]
}`;

      default:
        return `Generate ${itemCount} items appropriate for ${activityType} activity type.`;
    }
  }

  /**
   * Call Gemini API
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
   * Parse AI response based on activity type
   */
  private parseActivityResponse(response: string, request: ActivityGenerationRequest): any {
    try {
      const parsed = JSON.parse(response);
      
      // Validate the response has the expected structure
      this.validateActivityResponse(parsed, request.activityType);
      
      return parsed;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Validate activity response structure
   */
  private validateActivityResponse(content: any, activityType: string): void {
    const requiredFields: Record<string, string[]> = {
      'multiple-choice': ['questions'],
      'true-false': ['questions'],
      'multiple-response': ['questions'],
      'fill-in-the-blanks': ['passages'],
      'matching': ['matchingSets'],
      'sequence': ['sequences'],
      'drag-and-drop': ['dragDropSets'],
      'drag-the-words': ['passages'],
      'essay': ['prompts'],
      'numeric': ['problems'],
      'flash-cards': ['cards'],
      'reading': ['passages'],
      'video': ['videoActivities'],
      'quiz': ['questions']
    };

    const required = requiredFields[activityType];
    if (required) {
      for (const field of required) {
        if (!content[field] || !Array.isArray(content[field])) {
          throw new Error(`Invalid response structure: missing ${field} array`);
        }
      }
    }
  }

  /**
   * Get count of generated items
   */
  private getGeneratedItemCount(content: any, activityType: string): number {
    const countFields: Record<string, string> = {
      'multiple-choice': 'questions',
      'true-false': 'questions',
      'multiple-response': 'questions',
      'fill-in-the-blanks': 'passages',
      'matching': 'matchingSets',
      'sequence': 'sequences',
      'drag-and-drop': 'dragDropSets',
      'drag-the-words': 'passages',
      'essay': 'prompts',
      'numeric': 'problems',
      'flash-cards': 'cards',
      'reading': 'passages',
      'video': 'videoActivities',
      'quiz': 'questions'
    };

    const field = countFields[activityType];
    return field && content[field] ? content[field].length : 0;
  }

  /**
   * Validate generation request
   */
  validateRequest(request: ActivityGenerationRequest): string[] {
    const errors: string[] = [];

    if (!request.activityType) {
      errors.push('Activity type is required');
    }

    if (!request.topics || request.topics.length === 0) {
      errors.push('At least one topic is required');
    }

    if (!request.learningOutcomes || request.learningOutcomes.length === 0) {
      errors.push('At least one learning outcome is required');
    }

    if (!request.actionVerbs || request.actionVerbs.length === 0) {
      errors.push('At least one action verb is required');
    }

    if (!request.itemCount || request.itemCount < 1 || request.itemCount > 20) {
      errors.push('Item count must be between 1 and 20');
    }

    if (!request.bloomsLevel) {
      errors.push('Bloom\'s taxonomy level is required');
    }

    return errors;
  }
}

// Export singleton instance
export const activityAIGeneratorService = new ActivityAIGeneratorService();
