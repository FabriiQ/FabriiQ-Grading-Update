/**
 * Analytics Integration Tests
 * 
 * Comprehensive tests for the advanced analytics system including
 * cognitive analysis, real-time updates, pattern recognition, and dashboard integration.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { CognitiveAnalysisService } from '../cognitive-analysis.service';
import { RealTimeBloomsAnalyticsService } from '../realtime-blooms-analytics.service';
import { LearningPatternRecognitionService } from '../learning-pattern-recognition.service';
import { UnifiedAnalyticsDashboardService } from '../unified-analytics-dashboard.service';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Mock Prisma
const mockPrisma = {
  activityGrade: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    update: jest.fn(),
  },
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  class: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

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

describe('Analytics Integration Tests', () => {
  let cognitiveService: CognitiveAnalysisService;
  let realTimeService: RealTimeBloomsAnalyticsService;
  let patternService: LearningPatternRecognitionService;
  let dashboardService: UnifiedAnalyticsDashboardService;

  beforeEach(() => {
    // Set up environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    cognitiveService = new CognitiveAnalysisService(mockPrisma);
    realTimeService = new RealTimeBloomsAnalyticsService(mockPrisma);
    patternService = new LearningPatternRecognitionService(mockPrisma);
    dashboardService = new UnifiedAnalyticsDashboardService(mockPrisma);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cognitive Analysis Service', () => {
    it('should analyze cognitive level from student work', async () => {
      // Mock OpenAI response
      const mockOpenAI = require('openai').default;
      const openaiInstance = new mockOpenAI();
      
      openaiInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              detectedLevel: 'ANALYZE',
              confidence: 0.85,
              evidence: ['Compares different concepts', 'Breaks down complex ideas'],
              reasoning: 'Student demonstrates analytical thinking',
              skillsAssessment: {
                criticalThinking: 80,
                problemSolving: 75,
                creativity: 60,
                analysis: 85,
                synthesis: 70,
                evaluation: 65
              },
              cognitiveComplexity: 'high',
              recommendations: ['Continue with analysis-level activities', 'Introduce evaluation tasks']
            })
          }
        }]
      });

      const result = await cognitiveService.analyzeCognitiveLevel(
        'This essay compares different educational theories and analyzes their effectiveness in modern classrooms.',
        'essay'
      );

      expect(result.detectedLevel).toBe(BloomsTaxonomyLevel.ANALYZE);
      expect(result.confidence).toBe(0.85);
      expect(result.evidence).toContain('Compares different concepts');
      expect(result.skillsAssessment.analysis).toBe(85);
      expect(result.cognitiveComplexity).toBe('high');
    });

    it('should track cognitive progression over time', async () => {
      // Mock database responses
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: 'student1',
          bloomsLevel: 'UNDERSTAND',
          aiConfidence: 0.8,
          gradedAt: new Date('2024-01-01'),
          activity: { activityType: 'quiz' }
        },
        {
          studentId: 'student1',
          bloomsLevel: 'APPLY',
          aiConfidence: 0.85,
          gradedAt: new Date('2024-01-15'),
          activity: { activityType: 'problem-solving' }
        },
        {
          studentId: 'student1',
          bloomsLevel: 'ANALYZE',
          aiConfidence: 0.9,
          gradedAt: new Date('2024-02-01'),
          activity: { activityType: 'essay' }
        }
      ]);

      const progression = await cognitiveService.trackCognitiveProgression('student1');

      expect(progression.currentLevel).toBe(BloomsTaxonomyLevel.ANALYZE);
      expect(progression.progressionTrend).toBe('improving');
      expect(progression.levelHistory).toHaveLength(3);
      expect(progression.nextRecommendedLevel).toBe(BloomsTaxonomyLevel.EVALUATE);
      expect(progression.readinessScore).toBeGreaterThan(70);
    });

    it('should generate class cognitive insights', async () => {
      // Mock class submissions data
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: 'student1',
          bloomsLevel: 'ANALYZE',
          score: 85,
          student: { user: { name: 'John Doe' } },
          activity: { activityType: 'essay' }
        },
        {
          studentId: 'student2',
          bloomsLevel: 'UNDERSTAND',
          score: 70,
          student: { user: { name: 'Jane Smith' } },
          activity: { activityType: 'quiz' }
        },
        {
          studentId: 'student3',
          bloomsLevel: 'REMEMBER',
          score: 60,
          student: { user: { name: 'Bob Johnson' } },
          activity: { activityType: 'flashcards' }
        }
      ]);

      const insights = await cognitiveService.generateClassCognitiveInsights('class1');

      expect(insights.overallProgression).toBeDefined();
      expect(insights.bloomsDistribution).toBeDefined();
      expect(insights.cognitiveGaps).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.studentsNeedingSupport).toBeDefined();
    });
  });

  describe('Real-Time Bloom\'s Analytics Service', () => {
    it('should process activity submission and detect progression', async () => {
      // Mock cognitive analysis
      const mockAnalysis = {
        detectedLevel: BloomsTaxonomyLevel.EVALUATE,
        confidence: 0.9,
        evidence: ['Makes judgments', 'Critiques arguments'],
        reasoning: 'Student demonstrates evaluation skills'
      };

      // Mock previous submission
      (mockPrisma.activityGrade.findFirst as jest.Mock).mockResolvedValue({
        bloomsLevel: 'ANALYZE',
        gradedAt: new Date('2024-01-01')
      });

      // Mock update operation
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const event = await realTimeService.processActivitySubmission(
        'submission1',
        'student1',
        'class1',
        'activity1',
        'This essay evaluates different approaches and makes informed judgments.',
        'essay'
      );

      expect(event).toBeDefined();
      expect(event?.type).toBe('level_achieved');
      expect(event?.currentLevel).toBe(BloomsTaxonomyLevel.EVALUATE);
      expect(event?.previousLevel).toBe(BloomsTaxonomyLevel.ANALYZE);
    });

    it('should get real-time student metrics', async () => {
      // Mock student submissions
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sub1',
          bloomsLevel: 'EVALUATE',
          aiConfidence: 0.9,
          gradedAt: new Date(),
          activityId: 'act1'
        },
        {
          id: 'sub2',
          bloomsLevel: 'ANALYZE',
          aiConfidence: 0.85,
          gradedAt: new Date(Date.now() - 86400000),
          activityId: 'act2'
        }
      ]);

      const metrics = await realTimeService.getStudentRealTimeMetrics('student1');

      expect(metrics.studentId).toBe('student1');
      expect(metrics.currentLevel).toBe(BloomsTaxonomyLevel.EVALUATE);
      expect(metrics.levelConfidence).toBe(0.9);
      expect(metrics.progressionVelocity).toBeGreaterThanOrEqual(0);
      expect(metrics.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(metrics.nextLevelReadiness).toBeGreaterThanOrEqual(0);
      expect(metrics.recentActivities).toHaveLength(2);
    });

    it('should verify level achievement with consistency', async () => {
      // Mock consistent submissions at EVALUATE level
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: 'student1',
          bloomsLevel: 'EVALUATE',
          gradedAt: new Date(),
          activityId: 'act1',
          activity: { classId: 'class1' }
        },
        {
          studentId: 'student1',
          bloomsLevel: 'EVALUATE',
          gradedAt: new Date(Date.now() - 86400000),
          activityId: 'act2',
          activity: { classId: 'class1' }
        },
        {
          studentId: 'student1',
          bloomsLevel: 'EVALUATE',
          gradedAt: new Date(Date.now() - 172800000),
          activityId: 'act3',
          activity: { classId: 'class1' }
        }
      ]);

      const isVerified = await realTimeService.verifyLevelAchievement(
        'student1',
        BloomsTaxonomyLevel.EVALUATE,
        3
      );

      expect(isVerified).toBe(true);
    });
  });

  describe('Learning Pattern Recognition Service', () => {
    it('should analyze student learning patterns', async () => {
      // Mock student activity data
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: 'student1',
          score: 85,
          timeSpentMinutes: 30,
          gradedAt: new Date(),
          activity: { activityType: 'essay' }
        },
        {
          studentId: 'student1',
          score: 90,
          timeSpentMinutes: 25,
          gradedAt: new Date(Date.now() - 86400000),
          activity: { activityType: 'quiz' }
        },
        {
          studentId: 'student1',
          score: 80,
          timeSpentMinutes: 35,
          gradedAt: new Date(Date.now() - 172800000),
          activity: { activityType: 'interactive' }
        }
      ]);

      const profile = await patternService.analyzeStudentLearningPatterns('student1');

      expect(profile.studentId).toBe('student1');
      expect(profile.learningStyle).toBeDefined();
      expect(profile.cognitivePreferences).toBeDefined();
      expect(profile.performancePatterns).toBeDefined();
      expect(profile.engagementPatterns).toBeDefined();
      expect(profile.adaptiveRecommendations).toBeDefined();
    });

    it('should predict student performance', async () => {
      // Mock learning profile
      const mockProfile = {
        studentId: 'student1',
        learningStyle: { primary: 'visual', confidence: 0.8 },
        cognitivePreferences: {
          processingSpeed: 'moderate',
          complexityPreference: 'moderate'
        },
        performancePatterns: {
          consistencyScore: 85,
          improvementTrend: 'steady'
        }
      };

      // Mock historical data
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        { score: 85, activity: { activityType: 'essay' } },
        { score: 80, activity: { activityType: 'essay' } },
        { score: 88, activity: { activityType: 'essay' } }
      ]);

      const prediction = await patternService.predictPerformance(
        'student1',
        'essay',
        BloomsTaxonomyLevel.ANALYZE,
        7
      );

      expect(prediction.studentId).toBe('student1');
      expect(prediction.activityType).toBe('essay');
      expect(prediction.predictedScore).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedScore).toBeLessThanOrEqual(100);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.factors).toBeDefined();
      expect(prediction.recommendations).toBeDefined();
    });

    it('should detect early warning indicators', async () => {
      // Mock recent declining performance
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: 'student1',
          score: 45, // Low score
          timeSpentMinutes: 10, // Short time
          gradedAt: new Date(),
          activity: { activityType: 'quiz' }
        },
        {
          studentId: 'student1',
          score: 50,
          timeSpentMinutes: 12,
          gradedAt: new Date(Date.now() - 86400000),
          activity: { activityType: 'essay' }
        }
      ]);

      const warnings = await patternService.detectEarlyWarnings('student1');

      expect(warnings).toBeDefined();
      expect(Array.isArray(warnings)).toBe(true);
      // Should detect performance issues
      if (warnings.length > 0) {
        expect(warnings[0]).toHaveProperty('type');
        expect(warnings[0]).toHaveProperty('severity');
        expect(warnings[0]).toHaveProperty('indicators');
        expect(warnings[0]).toHaveProperty('interventions');
      }
    });
  });

  describe('Unified Analytics Dashboard Service', () => {
    it('should get comprehensive dashboard overview', async () => {
      // Mock summary metrics
      (mockPrisma.activityGrade.count as jest.Mock).mockResolvedValue(150);
      (mockPrisma.activityGrade.aggregate as jest.Mock).mockResolvedValue({
        _avg: { score: 78.5 }
      });
      (mockPrisma.activityGrade.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { studentId: 'student1' },
          { studentId: 'student2' },
          { studentId: 'student3' }
        ])
        .mockResolvedValueOnce([
          { activityId: 'activity1' },
          { activityId: 'activity2' }
        ])
        .mockResolvedValueOnce([
          {
            student: { user: { name: 'John Doe' } },
            activity: { title: 'Essay 1' },
            score: 85,
            gradedAt: new Date()
          }
        ]);

      const overview = await dashboardService.getDashboardOverview('teacher1', 'class1');

      expect(overview.summary).toBeDefined();
      expect(overview.summary.totalStudents).toBe(3);
      expect(overview.summary.totalActivities).toBe(2);
      expect(overview.summary.totalSubmissions).toBe(150);
      expect(overview.summary.averagePerformance).toBe(79);
      expect(overview.recentActivity).toBeDefined();
      expect(overview.performanceTrends).toBeDefined();
      expect(overview.alerts).toBeDefined();
    });

    it('should get detailed student analytics', async () => {
      // Mock student data
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue({
        id: 'student1',
        user: { name: 'John Doe' }
      });

      // Mock student submissions
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          score: 85,
          bloomsLevel: 'ANALYZE',
          timeSpentMinutes: 30,
          gradedAt: new Date(),
          activity: { activityType: 'essay' }
        },
        {
          score: 80,
          bloomsLevel: 'APPLY',
          timeSpentMinutes: 25,
          gradedAt: new Date(Date.now() - 86400000),
          activity: { activityType: 'quiz' }
        }
      ]);

      const analytics = await dashboardService.getStudentAnalytics('student1');

      expect(analytics.studentId).toBe('student1');
      expect(analytics.studentName).toBe('John Doe');
      expect(analytics.overview).toBeDefined();
      expect(analytics.performance).toBeDefined();
      expect(analytics.engagement).toBeDefined();
      expect(analytics.predictions).toBeDefined();
      expect(analytics.learningProfile).toBeDefined();
    });

    it('should get real-time updates', async () => {
      const lastUpdate = new Date(Date.now() - 3600000); // 1 hour ago
      
      // Mock recent submissions
      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([
        {
          student: { user: { name: 'John Doe' } },
          activity: { title: 'Essay 1', activityType: 'essay' },
          score: 85,
          bloomsLevel: 'ANALYZE',
          gradedAt: new Date()
        }
      ]);

      const updates = await dashboardService.getRealTimeUpdates('class1', lastUpdate);

      expect(updates.hasUpdates).toBe(true);
      expect(updates.updates).toHaveLength(1);
      expect(updates.updates[0].type).toBe('submission');
      expect(updates.updates[0].data.studentName).toBe('John Doe');
    });

    it('should export analytics data in different formats', async () => {
      // Mock class analytics
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Class'
      });

      const exportData = await dashboardService.exportAnalyticsData('class1', 'json');

      expect(exportData.data).toBeDefined();
      expect(exportData.filename).toContain('class-analytics-class1');
      expect(exportData.contentType).toBe('application/json');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow from submission to dashboard', async () => {
      // Simulate complete workflow
      const studentWork = 'This essay analyzes different educational theories and evaluates their effectiveness.';
      
      // 1. Process submission through real-time analytics
      const progressionEvent = await realTimeService.processActivitySubmission(
        'submission1',
        'student1',
        'class1',
        'activity1',
        studentWork,
        'essay'
      );

      // 2. Get updated student metrics
      const metrics = await realTimeService.getStudentRealTimeMetrics('student1');

      // 3. Check for pattern updates
      const profile = await patternService.analyzeStudentLearningPatterns('student1');

      // 4. Update dashboard
      const dashboard = await dashboardService.getDashboardOverview('teacher1', 'class1');

      // Verify integration
      expect(progressionEvent || metrics).toBeDefined();
      expect(profile).toBeDefined();
      expect(dashboard).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid data
      (mockPrisma.activityGrade.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        dashboardService.getDashboardOverview('invalid-teacher', 'invalid-class')
      ).rejects.toThrow('Failed to get dashboard overview');
    });

    it('should maintain performance with large datasets', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        studentId: `student${i}`,
        score: Math.floor(Math.random() * 100),
        bloomsLevel: 'ANALYZE',
        gradedAt: new Date(Date.now() - i * 86400000),
        activity: { activityType: 'essay' }
      }));

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const overview = await dashboardService.getDashboardOverview('teacher1', 'class1');
      const endTime = Date.now();

      expect(overview).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across services', async () => {
      const studentId = 'student1';
      
      // Get data from different services
      const [metrics, profile, analytics] = await Promise.all([
        realTimeService.getStudentRealTimeMetrics(studentId),
        patternService.analyzeStudentLearningPatterns(studentId),
        dashboardService.getStudentAnalytics(studentId)
      ]);

      // Verify consistency
      expect(metrics.studentId).toBe(studentId);
      expect(profile.studentId).toBe(studentId);
      expect(analytics.studentId).toBe(studentId);
    });

    it('should validate input parameters', async () => {
      // Test with invalid parameters
      await expect(
        cognitiveService.analyzeCognitiveLevel('', 'essay')
      ).rejects.toThrow();

      await expect(
        patternService.predictPerformance('', 'essay', BloomsTaxonomyLevel.ANALYZE, -1)
      ).rejects.toThrow();
    });

    it('should handle concurrent requests safely', async () => {
      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        dashboardService.getStudentAnalytics(`student${i}`)
      );

      const results = await Promise.allSettled(promises);
      
      // All requests should complete (either fulfilled or rejected, but not hanging)
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });
  });
});
