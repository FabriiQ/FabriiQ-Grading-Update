/**
 * Enhanced Assessment Tests
 * 
 * Tests for the enhanced assessment functionality with backward compatibility.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { EnhancedAssessmentService } from '../services/enhanced-assessment.service';
import { 
  QuestionSelectionMode, 
  AssessmentContent,
  getQuestionsFromAssessment,
  getInstructionsFromAssessment,
  getDescriptionFromAssessment
} from '../types/enhanced-assessment';

// Mock Prisma for testing
const mockPrisma = {
  assessment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  class: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('EnhancedAssessmentService', () => {
  let service: EnhancedAssessmentService;

  beforeEach(() => {
    service = new EnhancedAssessmentService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createEnhancedAssessment', () => {
    it('should create assessment with enhanced content', async () => {
      // Mock class details
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        campus: { institutionId: 'inst-1' },
        term: { id: 'term-1' },
      });

      // Mock assessment creation
      const mockAssessment = {
        id: 'assessment-1',
        title: 'Test Quiz',
        content: {
          assessmentType: 'QUIZ',
          questions: [
            {
              id: 'q1',
              type: 'MULTIPLE_CHOICE',
              text: 'What is 2+2?',
              choices: [
                { id: 'c1', text: '3', isCorrect: false },
                { id: 'c2', text: '4', isCorrect: true },
              ],
              points: 1,
              isFromQuestionBank: false,
            },
          ],
        },
        questionSelectionMode: 'MANUAL',
      };

      (mockPrisma.assessment.create as jest.Mock).mockResolvedValue(mockAssessment);

      const input = {
        title: 'Test Quiz',
        classId: 'class-1',
        subjectId: 'subject-1',
        category: 'QUIZ',
        content: {
          assessmentType: 'QUIZ',
          questions: [
            {
              id: 'q1',
              type: 'MULTIPLE_CHOICE',
              text: 'What is 2+2?',
              choices: [
                { id: 'c1', text: '3', isCorrect: false },
                { id: 'c2', text: '4', isCorrect: true },
              ],
              points: 1,
              isFromQuestionBank: false,
            },
          ],
        } as AssessmentContent,
        questionSelectionMode: QuestionSelectionMode.MANUAL,
      };

      const result = await service.createEnhancedAssessment(input, 'user-1');

      expect(result).toEqual(mockAssessment);
      expect(mockPrisma.assessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Quiz',
          content: input.content,
          questionSelectionMode: 'MANUAL',
          questionBankRefs: [],
        }),
        include: expect.any(Object),
      });
    });

    it('should create legacy assessment for backward compatibility', async () => {
      // Mock class details
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'class-1',
        campus: { institutionId: 'inst-1' },
        term: { id: 'term-1' },
      });

      const mockAssessment = {
        id: 'assessment-1',
        title: 'Legacy Quiz',
        rubric: {
          questions: [
            {
              text: 'What is 2+2?',
              type: 'MULTIPLE_CHOICE',
              options: [
                { text: '3', isCorrect: false },
                { text: '4', isCorrect: true },
              ],
            },
          ],
        },
      };

      (mockPrisma.assessment.create as jest.Mock).mockResolvedValue(mockAssessment);

      const input = {
        title: 'Legacy Quiz',
        classId: 'class-1',
        subjectId: 'subject-1',
        category: 'QUIZ',
        questions: [
          {
            text: 'What is 2+2?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
            ],
          },
        ],
      };

      const result = await service.createEnhancedAssessment(input, 'user-1');

      expect(result).toEqual(mockAssessment);
      expect(mockPrisma.assessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Legacy Quiz',
          content: null,
          rubric: expect.objectContaining({
            questions: input.questions,
          }),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getAssessmentContent', () => {
    it('should return content from enhanced assessment', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        content: {
          assessmentType: 'QUIZ',
          questions: [
            {
              id: 'q1',
              type: 'MULTIPLE_CHOICE',
              text: 'What is 2+2?',
              points: 1,
            },
          ],
        },
      };

      (mockPrisma.assessment.findUnique as jest.Mock).mockResolvedValue(mockAssessment);

      const result = await service.getAssessmentContent('assessment-1');

      expect(result).toEqual(mockAssessment.content);
    });

    it('should extract content from legacy assessment rubric', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        content: null,
        rubric: {
          description: 'Test description',
          instructions: 'Test instructions',
          questions: [
            {
              text: 'What is 2+2?',
              type: 'MULTIPLE_CHOICE',
            },
          ],
        },
      };

      (mockPrisma.assessment.findUnique as jest.Mock).mockResolvedValue(mockAssessment);

      const result = await service.getAssessmentContent('assessment-1');

      expect(result).toEqual({
        assessmentType: 'QUIZ',
        description: 'Test description',
        instructions: 'Test instructions',
        questions: mockAssessment.rubric.questions,
        settings: {},
        metadata: expect.objectContaining({
          version: 'legacy',
        }),
      });
    });
  });
});

describe('Utility Functions', () => {
  describe('getQuestionsFromAssessment', () => {
    it('should get questions from enhanced assessment', () => {
      const assessment = {
        content: {
          questions: [
            { id: 'q1', text: 'Question 1' },
            { id: 'q2', text: 'Question 2' },
          ],
        },
      };

      const result = getQuestionsFromAssessment(assessment);

      expect(result).toEqual(assessment.content.questions);
    });

    it('should get questions from legacy assessment rubric', () => {
      const assessment = {
        rubric: {
          questions: [
            { text: 'Question 1' },
            { text: 'Question 2' },
          ],
        },
      };

      const result = getQuestionsFromAssessment(assessment);

      expect(result).toEqual(assessment.rubric.questions);
    });

    it('should return empty array if no questions found', () => {
      const assessment = {};

      const result = getQuestionsFromAssessment(assessment);

      expect(result).toEqual([]);
    });
  });

  describe('getInstructionsFromAssessment', () => {
    it('should get instructions from enhanced assessment', () => {
      const assessment = {
        content: {
          instructions: 'Enhanced instructions',
        },
      };

      const result = getInstructionsFromAssessment(assessment);

      expect(result).toBe('Enhanced instructions');
    });

    it('should get instructions from legacy assessment rubric', () => {
      const assessment = {
        rubric: {
          instructions: 'Legacy instructions',
        },
      };

      const result = getInstructionsFromAssessment(assessment);

      expect(result).toBe('Legacy instructions');
    });
  });

  describe('getDescriptionFromAssessment', () => {
    it('should get description from enhanced assessment', () => {
      const assessment = {
        content: {
          description: 'Enhanced description',
        },
      };

      const result = getDescriptionFromAssessment(assessment);

      expect(result).toBe('Enhanced description');
    });

    it('should get description from legacy assessment rubric', () => {
      const assessment = {
        rubric: {
          description: 'Legacy description',
        },
      };

      const result = getDescriptionFromAssessment(assessment);

      expect(result).toBe('Legacy description');
    });
  });
});
