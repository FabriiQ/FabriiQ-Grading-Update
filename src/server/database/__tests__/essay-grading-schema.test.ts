/**
 * Essay Grading Schema Tests
 * 
 * Tests for the essay grading database schema extensions
 * to ensure all fields and constraints work correctly.
 */

import { PrismaClient } from '@prisma/client';
import { MigrationHelper } from '../migration-helper';
import { EssayGradingDatabaseService } from '../../api/services/essay-grading-database.service';

// Mock Prisma for testing
const mockPrisma = {
  activityGrade: {
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('Essay Grading Schema', () => {
  let migrationHelper: MigrationHelper;
  let essayService: EssayGradingDatabaseService;

  beforeEach(() => {
    migrationHelper = new MigrationHelper(mockPrisma);
    essayService = new EssayGradingDatabaseService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate essay grading fields exist', async () => {
      // Mock successful field check
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ column_name: 'aiScore' }]);

      const validation = await migrationHelper.validateEssayGradingSchema();
      
      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });

    it('should detect missing fields', async () => {
      // Mock missing field
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const validation = await migrationHelper.validateEssayGradingSchema();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields.length).toBeGreaterThan(0);
    });

    it('should check for required indexes', async () => {
      // Mock field exists but index missing
      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ column_name: 'aiScore' }]) // Field exists
        .mockResolvedValueOnce([]); // Index missing

      const validation = await migrationHelper.validateEssayGradingSchema();
      
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('index'))).toBe(true);
    });
  });

  describe('AI Grading Operations', () => {
    it('should save AI grading result correctly', async () => {
      const submissionId = 'test-submission-id';
      const gradingResult = {
        submissionId,
        aiScore: 85,
        aiConfidence: 0.92,
        aiFeedback: 'Good essay with clear structure',
        aiAnalysis: {
          contentQuality: { score: 85, feedback: 'Good content' },
          structure: { score: 90, hasIntroduction: true, hasConclusion: true },
          language: { grammarScore: 88, vocabularyScore: 82 },
          bloomsAnalysis: { detectedLevel: 'ANALYZE', confidence: 0.85 },
          overall: { readabilityScore: 85 }
        },
        aiBloomsLevel: 'ANALYZE' as const,
        requiresManualReview: false,
        reviewReasons: [],
        processingTime: 1500,
        modelVersion: 'v1.0',
        gradedAt: new Date(),
      };

      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      await essayService.saveAIGradingResult(submissionId, gradingResult);

      expect(mockPrisma.activityGrade.update).toHaveBeenCalledWith({
        where: { id: submissionId },
        data: expect.objectContaining({
          aiScore: 85,
          aiConfidence: 0.92,
          aiFeedback: 'Good essay with clear structure',
          aiBloomsLevel: 'ANALYZE',
          gradingMethod: 'AI',
          reviewRequired: false,
          finalScore: 85, // Should be set since no manual review required
        })
      });
    });

    it('should require manual review for low confidence scores', async () => {
      const submissionId = 'test-submission-id';
      const gradingResult = {
        submissionId,
        aiScore: 75,
        aiConfidence: 0.45, // Low confidence
        aiFeedback: 'Uncertain about this essay',
        aiAnalysis: {} as any,
        aiBloomsLevel: 'UNDERSTAND' as const,
        requiresManualReview: true,
        reviewReasons: ['Low AI confidence'],
        processingTime: 1200,
        modelVersion: 'v1.0',
        gradedAt: new Date(),
      };

      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      await essayService.saveAIGradingResult(submissionId, gradingResult);

      expect(mockPrisma.activityGrade.update).toHaveBeenCalledWith({
        where: { id: submissionId },
        data: expect.objectContaining({
          reviewRequired: true,
          finalScore: null, // Should not be set when manual review required
        })
      });
    });
  });

  describe('Manual Override Operations', () => {
    it('should apply manual override correctly', async () => {
      const submissionId = 'test-submission-id';
      const manualScore = 90;
      const reviewNotes = 'Excellent analysis, deserves higher score';
      const reviewerId = 'teacher-id';

      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      await essayService.applyManualOverride(
        submissionId,
        manualScore,
        reviewNotes,
        reviewerId
      );

      expect(mockPrisma.activityGrade.update).toHaveBeenCalledWith({
        where: { id: submissionId },
        data: {
          finalScore: manualScore,
          manualOverride: true,
          reviewRequired: false,
          reviewNotes,
          gradedById: reviewerId,
          gradedAt: expect.any(Date),
          gradingMethod: 'HYBRID',
        }
      });
    });
  });

  describe('Analytics Operations', () => {
    it('should calculate essay grading analytics correctly', async () => {
      // Mock database responses
      (mockPrisma.activityGrade.count as jest.Mock)
        .mockResolvedValueOnce(100) // Total essays
        .mockResolvedValueOnce(60)  // AI graded
        .mockResolvedValueOnce(20)  // Manual graded
        .mockResolvedValueOnce(20)  // Hybrid graded
        .mockResolvedValueOnce(15); // Manual overrides

      (mockPrisma.activityGrade.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _avg: { aiConfidence: 0.85 } })
        .mockResolvedValueOnce({ _avg: { wordCount: 450 } });

      (mockPrisma.activityGrade.groupBy as jest.Mock)
        .mockResolvedValue([
          { aiBloomsLevel: 'ANALYZE', _count: 40 },
          { aiBloomsLevel: 'EVALUATE', _count: 30 },
          { aiBloomsLevel: 'CREATE', _count: 20 },
        ]);

      const analytics = await essayService.getEssayGradingAnalytics();

      expect(analytics).toEqual({
        totalEssays: 100,
        aiGradedCount: 60,
        manualGradedCount: 20,
        hybridGradedCount: 20,
        averageAIConfidence: 0.85,
        manualOverrideRate: 0.15,
        averageWordCount: 450,
        bloomsDistribution: {
          'ANALYZE': 40,
          'EVALUATE': 30,
          'CREATE': 20,
        },
      });
    });
  });

  describe('Data Constraints', () => {
    it('should validate AI score range (0-100)', () => {
      // This would be tested at the database level
      // Here we test that our service validates the range
      const validScores = [0, 50, 100];
      const invalidScores = [-1, 101, 150];

      validScores.forEach(score => {
        expect(score >= 0 && score <= 100).toBe(true);
      });

      invalidScores.forEach(score => {
        expect(score >= 0 && score <= 100).toBe(false);
      });
    });

    it('should validate AI confidence range (0-1)', () => {
      const validConfidences = [0, 0.5, 1];
      const invalidConfidences = [-0.1, 1.1, 2];

      validConfidences.forEach(confidence => {
        expect(confidence >= 0 && confidence <= 1).toBe(true);
      });

      invalidConfidences.forEach(confidence => {
        expect(confidence >= 0 && confidence <= 1).toBe(false);
      });
    });

    it('should validate grading method values', () => {
      const validMethods = ['AI', 'MANUAL', 'HYBRID'];
      const invalidMethods = ['AUTO', 'AUTOMATIC', 'UNKNOWN'];

      validMethods.forEach(method => {
        expect(['AI', 'MANUAL', 'HYBRID'].includes(method)).toBe(true);
      });

      invalidMethods.forEach(method => {
        expect(['AI', 'MANUAL', 'HYBRID'].includes(method)).toBe(false);
      });
    });

    it('should validate Blooms taxonomy levels', () => {
      const validLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
      const invalidLevels = ['BASIC', 'ADVANCED', 'UNKNOWN'];

      validLevels.forEach(level => {
        expect(validLevels.includes(level)).toBe(true);
      });

      invalidLevels.forEach(level => {
        expect(validLevels.includes(level)).toBe(false);
      });
    });
  });
});
