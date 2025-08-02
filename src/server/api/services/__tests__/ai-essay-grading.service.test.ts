/**
 * AI Essay Grading Service Tests
 * 
 * Comprehensive tests for the AI essay grading service including
 * OpenAI integration, analysis parsing, and error handling.
 */

import { AIEssayGradingService } from '../ai-essay-grading.service';
import { EssayGradingRequest } from '@/types/essay-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('AIEssayGradingService', () => {
  let service: AIEssayGradingService;
  let mockOpenAI: any;

  beforeEach(() => {
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    service = new AIEssayGradingService();
    
    // Get the mocked OpenAI instance
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Essay Grading', () => {
    const sampleRequest: EssayGradingRequest = {
      submissionId: 'test-submission-id',
      essayContent: 'This is a sample essay about artificial intelligence. It discusses the impact of AI on society and explores various applications. The essay demonstrates analytical thinking and provides examples to support the arguments.',
      maxScore: 100,
      gradingCriteria: [
        {
          id: 'content',
          name: 'Content Quality',
          description: 'Quality and depth of content',
          weight: 0.4,
          maxPoints: 40,
          rubricLevels: []
        }
      ],
      requireManualReview: false
    };

    const mockAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            contentQuality: {
              score: 85,
              feedback: 'Good content with clear arguments',
              strengths: ['Clear thesis', 'Good examples'],
              improvements: ['More depth needed', 'Better transitions']
            },
            structure: {
              score: 80,
              hasIntroduction: true,
              hasConclusion: true,
              paragraphCount: 4,
              coherence: 85,
              feedback: 'Well-structured essay'
            },
            language: {
              grammarScore: 90,
              vocabularyScore: 85,
              clarityScore: 88,
              grammarErrors: [
                {
                  type: 'comma splice',
                  position: 45,
                  suggestion: 'Use a semicolon instead'
                }
              ],
              feedback: 'Good language use overall'
            },
            bloomsAnalysis: {
              detectedLevel: 'ANALYZE',
              confidence: 0.85,
              evidence: ['Compares different viewpoints', 'Breaks down complex concepts'],
              reasoning: 'Essay demonstrates analytical thinking'
            },
            overall: {
              readabilityScore: 85,
              originalityScore: 80,
              relevanceScore: 90
            }
          })
        }
      }]
    };

    it('should successfully grade an essay', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.gradeEssay(sampleRequest);

      expect(result).toMatchObject({
        submissionId: 'test-submission-id',
        aiScore: expect.any(Number),
        aiConfidence: expect.any(Number),
        aiFeedback: expect.any(String),
        aiAnalysis: expect.any(Object),
        aiBloomsLevel: BloomsTaxonomyLevel.ANALYZE,
        requiresManualReview: expect.any(Boolean),
        reviewReasons: expect.any(Array),
        processingTime: expect.any(Number),
        modelVersion: expect.any(String),
        gradedAt: expect.any(Date),
      });

      expect(result.aiScore).toBeGreaterThan(0);
      expect(result.aiScore).toBeLessThanOrEqual(100);
      expect(result.aiConfidence).toBeGreaterThan(0);
      expect(result.aiConfidence).toBeLessThanOrEqual(1);
    });

    it('should require manual review for low confidence scores', async () => {
      // Mock response with inconsistent scores (low confidence)
      const lowConfidenceResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ...JSON.parse(mockAIResponse.choices[0].message.content),
              contentQuality: { ...JSON.parse(mockAIResponse.choices[0].message.content).contentQuality, score: 30 },
              structure: { ...JSON.parse(mockAIResponse.choices[0].message.content).structure, score: 85 },
              language: { ...JSON.parse(mockAIResponse.choices[0].message.content).language, grammarScore: 95 }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(lowConfidenceResponse);

      const result = await service.gradeEssay(sampleRequest);

      expect(result.requiresManualReview).toBe(true);
      expect(result.reviewReasons).toContain(expect.stringMatching(/confidence/i));
    });

    it('should require manual review for high-level Bloom\'s taxonomy', async () => {
      const createLevelResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ...JSON.parse(mockAIResponse.choices[0].message.content),
              bloomsAnalysis: {
                detectedLevel: 'CREATE',
                confidence: 0.9,
                evidence: ['Original ideas', 'Innovative solutions'],
                reasoning: 'Essay demonstrates creative thinking'
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(createLevelResponse);

      const result = await service.gradeEssay(sampleRequest);

      expect(result.aiBloomsLevel).toBe(BloomsTaxonomyLevel.CREATE);
      expect(result.requiresManualReview).toBe(true);
      expect(result.reviewReasons).toContain('High-level critical thinking detected');
    });

    it('should require manual review for many grammar errors', async () => {
      const manyErrorsResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ...JSON.parse(mockAIResponse.choices[0].message.content),
              language: {
                ...JSON.parse(mockAIResponse.choices[0].message.content).language,
                grammarErrors: Array(10).fill({
                  type: 'grammar error',
                  position: 10,
                  suggestion: 'Fix this'
                })
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(manyErrorsResponse);

      const result = await service.gradeEssay(sampleRequest);

      expect(result.requiresManualReview).toBe(true);
      expect(result.reviewReasons).toContain('Multiple grammar issues require human review');
    });

    it('should generate comprehensive feedback', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.gradeEssay(sampleRequest);

      expect(result.aiFeedback).toContain('Score:');
      expect(result.aiFeedback).toContain('Content Quality');
      expect(result.aiFeedback).toContain('Structure & Organization');
      expect(result.aiFeedback).toContain('Language & Mechanics');
      expect(result.aiFeedback).toContain('Critical Thinking Level');
    });
  });

  describe('Input Validation', () => {
    it('should throw error for empty essay content', async () => {
      const invalidRequest = {
        ...{
          submissionId: 'test',
          essayContent: '',
          maxScore: 100
        }
      };

      await expect(service.gradeEssay(invalidRequest as any)).rejects.toThrow('Essay content is required');
    });

    it('should throw error for negative max score', async () => {
      const invalidRequest = {
        submissionId: 'test',
        essayContent: 'Sample essay content',
        maxScore: -10
      };

      await expect(service.gradeEssay(invalidRequest as any)).rejects.toThrow('Max score must be positive');
    });

    it('should throw error for very short essays', async () => {
      const invalidRequest = {
        submissionId: 'test',
        essayContent: 'Too short',
        maxScore: 100
      };

      await expect(service.gradeEssay(invalidRequest as any)).rejects.toThrow('Essay is too short for meaningful analysis');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const request: EssayGradingRequest = {
        submissionId: 'test',
        essayContent: 'Sample essay content for testing error handling',
        maxScore: 100
      };

      await expect(service.gradeEssay(request)).rejects.toThrow('AI grading failed');
    });

    it('should handle invalid JSON response from AI', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(invalidResponse);

      const request: EssayGradingRequest = {
        submissionId: 'test',
        essayContent: 'Sample essay content',
        maxScore: 100
      };

      await expect(service.gradeEssay(request)).rejects.toThrow('AI grading failed');
    });

    it('should handle missing required fields in AI response', async () => {
      const incompleteResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              contentQuality: { score: 85 }
              // Missing other required fields
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(incompleteResponse);

      const request: EssayGradingRequest = {
        submissionId: 'test',
        essayContent: 'Sample essay content',
        maxScore: 100
      };

      await expect(service.gradeEssay(request)).rejects.toThrow('AI grading failed');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate weighted scores correctly', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const request: EssayGradingRequest = {
        submissionId: 'test',
        essayContent: 'Sample essay content for score calculation testing',
        maxScore: 80 // Non-standard max score
      };

      const result = await service.gradeEssay(request);

      expect(result.aiScore).toBeLessThanOrEqual(80);
      expect(result.aiScore).toBeGreaterThan(0);
    });

    it('should calculate confidence based on score consistency', async () => {
      // Mock response with very consistent scores (high confidence)
      const consistentResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ...JSON.parse(mockAIResponse.choices[0].message.content),
              contentQuality: { ...JSON.parse(mockAIResponse.choices[0].message.content).contentQuality, score: 85 },
              structure: { ...JSON.parse(mockAIResponse.choices[0].message.content).structure, score: 85 },
              language: { 
                ...JSON.parse(mockAIResponse.choices[0].message.content).language, 
                grammarScore: 85, 
                vocabularyScore: 85, 
                clarityScore: 85 
              },
              overall: {
                readabilityScore: 85,
                originalityScore: 85,
                relevanceScore: 85
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(consistentResponse);

      const result = await service.gradeEssay({
        submissionId: 'test',
        essayContent: 'Sample essay content',
        maxScore: 100
      });

      expect(result.aiConfidence).toBeGreaterThan(0.8); // High confidence for consistent scores
    });
  });
});
