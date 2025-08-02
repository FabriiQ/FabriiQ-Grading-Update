/**
 * Essay Activity Integration Tests
 * 
 * Comprehensive tests for the complete essay activity system including
 * AI grading, manual review, offline activities, and analytics integration.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { gradeEssayActivityWithAI } from '../grading/essay';
import { HybridGradingWorkflowService } from '../services/hybrid-grading-workflow.service';
import { EssayAnalyticsService } from '../analytics/essay-analytics.service';
import { EssayActivity, EssaySubmissionData, createDefaultEssayActivity } from '../models/essay';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Mock Prisma
const mockPrisma = {
  activityGrade: {
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock AI services
jest.mock('@/server/api/services/ai-essay-grading.service');
jest.mock('@/server/api/services/essay-grading-database.service');

describe('Essay Activity Integration', () => {
  let workflowService: HybridGradingWorkflowService;
  let analyticsService: EssayAnalyticsService;
  let sampleActivity: EssayActivity;
  let sampleSubmission: EssaySubmissionData;

  beforeEach(() => {
    workflowService = new HybridGradingWorkflowService(mockPrisma);
    analyticsService = new EssayAnalyticsService(mockPrisma);
    
    // Create sample activity
    sampleActivity = {
      ...createDefaultEssayActivity(),
      id: 'test-activity-id',
      title: 'Test Essay Activity',
      prompt: 'Analyze the impact of technology on modern education.',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      settings: {
        minWords: 200,
        maxWords: 1000,
        aiGrading: {
          enabled: true,
          confidenceThreshold: 0.7,
          gradingCriteria: [],
          feedbackLevel: 'detailed',
          enableBloomsDetection: true,
        },
        manualGrading: {
          requiresManualReview: false,
          gradingWorkflow: 'ai_first',
          allowTeacherOverride: true,
        },
        showWordCount: true,
        allowSaveProgress: true,
      }
    };

    // Create sample submission
    sampleSubmission = {
      essayText: 'Technology has revolutionized modern education in numerous ways. From online learning platforms to interactive digital tools, the educational landscape has been transformed. Students now have access to vast resources and can learn at their own pace. However, this digital transformation also presents challenges such as the digital divide and the need for digital literacy skills.',
      wordCount: 52,
      timeSpent: 1800, // 30 minutes
      revisionCount: 3,
      submittedAt: new Date(),
      startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Grading Integration', () => {
    it('should successfully grade essay with AI', async () => {
      // Mock successful AI grading
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await gradeEssayActivityWithAI(
        sampleActivity,
        sampleSubmission,
        'test-submission-id',
        mockPrisma
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.percentage).toBeGreaterThanOrEqual(0);
      expect(result.percentage).toBeLessThanOrEqual(100);
      expect(mockPrisma.activityGrade.update).toHaveBeenCalled();
    });

    it('should handle AI grading errors gracefully', async () => {
      // Mock AI grading failure
      (mockPrisma.activityGrade.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        gradeEssayActivityWithAI(
          sampleActivity,
          sampleSubmission,
          'test-submission-id',
          mockPrisma
        )
      ).rejects.toThrow();
    });

    it('should validate essay content before grading', async () => {
      const emptySubmission = {
        ...sampleSubmission,
        essayText: '',
        wordCount: 0,
      };

      await expect(
        gradeEssayActivityWithAI(
          sampleActivity,
          emptySubmission,
          'test-submission-id',
          mockPrisma
        )
      ).rejects.toThrow('Essay content cannot be empty');
    });
  });

  describe('Hybrid Grading Workflow', () => {
    it('should process essay through hybrid workflow', async () => {
      const config = {
        enableAIGrading: true,
        aiConfidenceThreshold: 0.7,
        requireManualReview: false,
        allowTeacherOverride: true,
        autoPublishHighConfidence: true,
        notifyTeacherOnLowConfidence: true,
        enableSecondReview: false,
        maxScoreDifference: 10,
      };

      // Mock successful workflow processing
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await workflowService.processEssaySubmission(
        'test-submission-id',
        sampleActivity,
        sampleSubmission,
        config
      );

      expect(result.success).toBe(true);
      expect(result.gradingMethod).toBeDefined();
      expect(result.requiresManualReview).toBeDefined();
    });

    it('should handle offline class activities', async () => {
      const offlineActivity = {
        id: 'offline-activity-id',
        title: 'Classroom Discussion',
        activityType: 'manual-grading' as const,
        isOfflineClassActivity: true,
        bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
        maxScore: 100,
        settings: {
          offlineClassSettings: {
            conductedInClass: true,
            requiresDigitalFeedback: true,
            allowGrading: true,
          }
        }
      };

      const offlineSubmission = {
        id: 'offline-submission-id',
        studentId: 'student-id',
        activityId: 'offline-activity-id',
        attachments: [],
        submittedAt: new Date(),
        status: 'conducted_in_class' as const,
        offlineClassData: {
          conductedAt: new Date(),
          attendanceConfirmed: true,
          participationLevel: 'high' as const,
          observationNotes: 'Student showed excellent critical thinking',
          digitalFeedbackAdded: false,
          gradingCompleted: false,
        }
      };

      const teacherFeedback = {
        score: 85,
        feedback: 'Excellent participation and critical analysis during the discussion.',
        bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
        observationNotes: 'Student demonstrated strong evaluation skills',
      };

      // Mock successful offline activity processing
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await workflowService.processOfflineClassActivity(
        'offline-submission-id',
        offlineActivity as any,
        offlineSubmission as any,
        teacherFeedback
      );

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(85);
      expect(result.isPublished).toBe(true);
      expect(mockPrisma.activityGrade.update).toHaveBeenCalledWith({
        where: { id: 'offline-submission-id' },
        data: expect.objectContaining({
          feedback: teacherFeedback.feedback,
          score: teacherFeedback.score,
          bloomsLevel: teacherFeedback.bloomsLevel,
        })
      });
    });

    it('should apply teacher overrides correctly', async () => {
      const teacherGrade = {
        score: 90,
        feedback: 'Excellent analysis with strong supporting evidence.',
        bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
        overrideReason: 'AI underestimated the depth of critical thinking demonstrated',
      };

      // Mock database operations
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await workflowService.applyTeacherOverride(
        'test-submission-id',
        teacherGrade,
        'teacher-id'
      );

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(90);
      expect(result.gradingMethod).toBe('HYBRID');
    });
  });

  describe('Analytics Integration', () => {
    it('should generate comprehensive essay analytics', async () => {
      // Mock analytics data
      (mockPrisma.activityGrade.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.activityGrade.aggregate as jest.Mock).mockResolvedValue({
        _avg: { score: 78.5, wordCount: 450, timeSpentMinutes: 45 }
      });
      (mockPrisma.activityGrade.groupBy as jest.Mock).mockResolvedValue([
        { bloomsLevel: 'ANALYZE', _count: 40, _avg: { score: 80 } },
        { bloomsLevel: 'EVALUATE', _count: 35, _avg: { score: 85 } },
        { bloomsLevel: 'CREATE', _count: 25, _avg: { score: 75 } },
      ]);

      const analytics = await analyticsService.getEssayAnalytics('test-class-id');

      expect(analytics.totalEssays).toBe(100);
      expect(analytics.averageScore).toBe(78.5);
      expect(analytics.averageWordCount).toBe(450);
      expect(analytics.bloomsDistribution).toBeDefined();
      expect(analytics.aiGradingStats).toBeDefined();
      expect(analytics.qualityMetrics).toBeDefined();
    });

    it('should track student progress over time', async () => {
      // Mock student essay data
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          id: '1',
          score: 70,
          bloomsLevel: 'UNDERSTAND',
          submittedAt: new Date('2024-01-01'),
          student: { user: { name: 'John Doe' } }
        },
        {
          id: '2',
          score: 80,
          bloomsLevel: 'ANALYZE',
          submittedAt: new Date('2024-01-15'),
          student: { user: { name: 'John Doe' } }
        },
        {
          id: '3',
          score: 85,
          bloomsLevel: 'EVALUATE',
          submittedAt: new Date('2024-02-01'),
          student: { user: { name: 'John Doe' } }
        },
      ]);

      const progress = await analyticsService.getStudentEssayProgress('student-id');

      expect(progress.studentName).toBe('John Doe');
      expect(progress.essayCount).toBe(3);
      expect(progress.averageScore).toBeCloseTo(78.33, 1);
      expect(progress.bloomsProgression).toEqual(['UNDERSTAND', 'ANALYZE', 'EVALUATE']);
      expect(progress.strengths).toContain('Showing improvement over time');
    });

    it('should provide dashboard analytics', async () => {
      // Mock dashboard data
      (mockPrisma.activityGrade.count as jest.Mock)
        .mockResolvedValueOnce(150) // total essays
        .mockResolvedValueOnce(12); // pending reviews

      (mockPrisma.activityGrade.aggregate as jest.Mock).mockResolvedValue({
        _avg: { score: 82.3 }
      });

      (mockPrisma.activityGrade.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { studentId: 'student1', _avg: { score: 95 }, _count: 5 },
          { studentId: 'student2', _avg: { score: 92 }, _count: 4 },
        ])
        .mockResolvedValueOnce([
          { bloomsLevel: 'ANALYZE', _count: 60 },
          { bloomsLevel: 'EVALUATE', _count: 50 },
          { bloomsLevel: 'CREATE', _count: 40 },
        ]);

      (mockPrisma.student.findUnique as jest.Mock)
        .mockResolvedValueOnce({ user: { name: 'Alice Smith' } })
        .mockResolvedValueOnce({ user: { name: 'Bob Johnson' } });

      const dashboard = await analyticsService.getDashboardAnalytics('test-class-id');

      expect(dashboard.totalEssays).toBe(150);
      expect(dashboard.averageScore).toBe(82.3);
      expect(dashboard.pendingReviews).toBe(12);
      expect(dashboard.topPerformers).toHaveLength(2);
      expect(dashboard.bloomsDistribution).toBeDefined();
    });
  });

  describe('Points and Scoring Integration', () => {
    it('should update points when essay is graded', async () => {
      // Mock successful grading with points update
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await gradeEssayActivityWithAI(
        sampleActivity,
        sampleSubmission,
        'test-submission-id',
        mockPrisma
      );

      // Verify points were updated
      expect(mockPrisma.activityGrade.update).toHaveBeenCalledWith({
        where: { id: 'test-submission-id' },
        data: expect.objectContaining({
          pointsEarned: expect.any(Number),
          bloomsLevel: expect.any(String),
          gradedAt: expect.any(Date),
        })
      });
    });

    it('should handle offline activity points correctly', async () => {
      const teacherFeedback = {
        score: 88,
        feedback: 'Great participation in class discussion',
        bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      };

      // Mock successful points update
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await workflowService.processOfflineClassActivity(
        'offline-submission-id',
        {} as any,
        {} as any,
        teacherFeedback
      );

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(88);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      (mockPrisma.activityGrade.update as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        gradeEssayActivityWithAI(
          sampleActivity,
          sampleSubmission,
          'test-submission-id',
          mockPrisma
        )
      ).rejects.toThrow('AI essay grading failed');
    });

    it('should validate word count limits', async () => {
      const longSubmission = {
        ...sampleSubmission,
        essayText: 'word '.repeat(1500), // Exceeds max words
        wordCount: 1500,
      };

      // Should still process but flag for review
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await gradeEssayActivityWithAI(
        sampleActivity,
        longSubmission,
        'test-submission-id',
        mockPrisma
      );

      expect(result).toBeDefined();
      // The grading should complete but may flag for manual review
    });

    it('should handle missing Bloom\'s level gracefully', async () => {
      const activityWithoutBlooms = {
        ...sampleActivity,
        bloomsLevel: undefined as any,
      };

      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const result = await gradeEssayActivityWithAI(
        activityWithoutBlooms,
        sampleSubmission,
        'test-submission-id',
        mockPrisma
      );

      expect(result).toBeDefined();
      // Should use a default Bloom's level
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large essay submissions efficiently', async () => {
      const largeSubmission = {
        ...sampleSubmission,
        essayText: 'This is a very long essay. '.repeat(200), // ~1400 words
        wordCount: 1400,
      };

      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const startTime = Date.now();
      const result = await gradeEssayActivityWithAI(
        sampleActivity,
        largeSubmission,
        'test-submission-id',
        mockPrisma
      );
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent grading requests', async () => {
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const promises = Array.from({ length: 5 }, (_, i) =>
        gradeEssayActivityWithAI(
          sampleActivity,
          { ...sampleSubmission, essayText: `Essay ${i + 1} content` },
          `test-submission-id-${i + 1}`,
          mockPrisma
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
