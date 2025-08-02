/**
 * Comprehensive Integration Tests for Activities System
 * 
 * Tests all major components and workflows to ensure system reliability
 * and performance under various conditions.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AdvancedGradingService } from '../services/advanced-grading.service';
import { AdvancedReportingService } from '../services/advanced-reporting.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';
import { SecurityService } from '../services/security.service';
import { MonitoringService } from '../services/monitoring.service';
import { AdvancedAIService } from '../services/advanced-ai.service';
import { IntegrationService } from '../services/integration.service';

// Mock Prisma Client
const mockPrisma = {
  rubric: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  activityGrade: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn()
  },
  activity: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  userSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  errorLog: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  systemAlert: {
    create: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn()
  },
  $queryRaw: jest.fn(),
  $disconnect: jest.fn()
} as unknown as PrismaClient;

describe('Activities System Integration Tests', () => {
  let gradingService: AdvancedGradingService;
  let reportingService: AdvancedReportingService;
  let performanceService: PerformanceOptimizationService;
  let securityService: SecurityService;
  let monitoringService: MonitoringService;
  let aiService: AdvancedAIService;
  let integrationService: IntegrationService;

  beforeEach(() => {
    // Initialize services
    gradingService = new AdvancedGradingService(mockPrisma);
    reportingService = new AdvancedReportingService(mockPrisma);
    performanceService = new PerformanceOptimizationService(mockPrisma);
    securityService = new SecurityService(mockPrisma);
    monitoringService = new MonitoringService(mockPrisma);
    aiService = new AdvancedAIService(mockPrisma);
    integrationService = new IntegrationService(mockPrisma);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await mockPrisma.$disconnect();
  });

  describe('Advanced Grading Service', () => {
    it('should create rubric successfully', async () => {
      const mockRubric = {
        id: 'rubric-1',
        title: 'Test Rubric',
        description: 'Test Description',
        maxScore: 100,
        bloomsDistribution: {},
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'HOLISTIC' as const,
        subjectId: null
      };

      (mockPrisma.rubric.create as jest.Mock).mockResolvedValue(mockRubric);

      const rubricData = {
        name: 'Test Rubric',
        description: 'Test Description',
        criteria: [],
        createdBy: 'user-1'
      };

      const result = await gradingService.createRubric(rubricData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Rubric');
      expect(mockPrisma.rubric.create).toHaveBeenCalled();
    });

    it('should perform batch grading', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          activityId: 'activity-1',
          score: null,
          content: { text: 'Test submission' },
          activity: { title: 'Test Activity', content: {} }
        }
      ];

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      const batchRequest = {
        submissionIds: ['sub-1'],
        gradingMethod: 'ai_only' as const,
        aiSettings: {
          model: 'gpt-4' as const,
          confidenceThreshold: 0.7,
          generateFeedback: true,
          bloomsAnalysis: true
        }
      };

      const result = await gradingService.performBatchGrading(batchRequest, 'teacher-1');

      expect(result).toBeDefined();
      expect(result.totalSubmissions).toBe(1);
      expect(result.successfulGradings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Advanced Reporting Service', () => {
    it('should generate student report', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          score: 85,
          timeSpentMinutes: 30,
          submittedAt: new Date(),
          content: { bloomsLevel: 'UNDERSTAND' },
          activity: { title: 'Test Activity', content: {} }
        }
      ];

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(10);

      const report = await reportingService.generateStudentReport('student-1');

      expect(report).toBeDefined();
      expect(report.studentId).toBe('student-1');
      expect(report.averageScore).toBe(85);
      expect(report.completedActivities).toBe(1);
    });

    it('should generate class report', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          score: 85,
          activityId: 'activity-1',
          activity: { title: 'Test Activity', content: {} }
        },
        {
          id: 'sub-2',
          studentId: 'student-2',
          score: 75,
          activityId: 'activity-1',
          activity: { title: 'Test Activity', content: {} }
        }
      ];

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const report = await reportingService.generateClassReport('class-1');

      expect(report).toBeDefined();
      expect(report.classId).toBe('class-1');
      expect(report.totalStudents).toBe(2);
      expect(report.metrics.averageScore).toBe(80);
    });
  });

  describe('Performance Optimization Service', () => {
    it('should cache and retrieve data', async () => {
      const testData = { id: 'test', value: 'cached data' };
      const fetchFunction = jest.fn().mockResolvedValue(testData);

      // First call should fetch from function
      const result1 = await performanceService.getCached('test-key', 'activities', fetchFunction);
      expect(result1).toEqual(testData);
      expect(fetchFunction).toHaveBeenCalledTimes(1);

      // Second call should return from cache
      const result2 = await performanceService.getCached('test-key', 'activities', fetchFunction);
      expect(result2).toEqual(testData);
      expect(fetchFunction).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should collect performance metrics', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: '5' }]);

      const metrics = await performanceService.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.queryTime).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Service', () => {
    it('should encrypt and decrypt data', () => {
      const originalData = 'sensitive information';
      
      const encrypted = securityService.encryptData(originalData);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = securityService.decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should validate file uploads', () => {
      const validFile = securityService.validateFileUpload('document.pdf', 1024 * 1024, 'application/pdf');
      expect(validFile.valid).toBe(true);
      expect(validFile.errors).toHaveLength(0);

      const invalidFile = securityService.validateFileUpload('script.exe', 1024 * 1024, 'application/exe');
      expect(invalidFile.valid).toBe(false);
      expect(invalidFile.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });
  });

  describe('Monitoring Service', () => {
    it('should perform health checks', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const healthCheck = await monitoringService.performHealthCheck('database');

      expect(healthCheck).toBeDefined();
      expect(healthCheck.service).toBe('database');
      expect(healthCheck.status).toMatch(/healthy|degraded|unhealthy/);
      expect(healthCheck.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track errors', async () => {
      (mockPrisma.errorLog.create as jest.Mock).mockResolvedValue({});

      const error = new Error('Test error');
      await monitoringService.trackError(error, { context: 'test' });

      expect(mockPrisma.errorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          error: 'Test error',
          context: expect.any(String)
        })
      });
    });
  });

  describe('Advanced AI Service', () => {
    it('should generate learning profile', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          score: 85,
          timeSpentMinutes: 30,
          content: { bloomsLevel: 'UNDERSTAND' },
          activity: { title: 'Test Activity', content: { activityType: 'quiz' } }
        }
      ];

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const profile = await aiService.generateLearningProfile('student-1');

      expect(profile).toBeDefined();
      expect(profile.studentId).toBe('student-1');
      expect(profile.learningStyle).toMatch(/visual|auditory|kinesthetic|reading_writing/);
      expect(profile.optimalDifficulty).toBeGreaterThanOrEqual(0);
      expect(profile.optimalDifficulty).toBeLessThanOrEqual(100);
    });

    it('should generate personalized recommendations', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          studentId: 'student-1',
          score: 65,
          timeSpentMinutes: 30,
          content: { bloomsLevel: 'REMEMBER' },
          activity: { title: 'Test Activity', content: { activityType: 'quiz' } }
        }
      ];

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const recommendations = await aiService.generatePersonalizedRecommendations('student-1');

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      const firstRec = recommendations[0];
      expect(firstRec.type).toMatch(/activity|content|strategy|intervention/);
      expect(firstRec.confidence).toBeGreaterThanOrEqual(0);
      expect(firstRec.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration Service', () => {
    it('should register webhook', async () => {
      (mockPrisma.rubric.create as jest.Mock).mockResolvedValue({
        id: 'webhook-1',
        title: 'Webhook: https://example.com/webhook',
        createdById: 'user-1'
      });

      const webhook = await integrationService.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['grade_updated', 'activity_completed'],
        secret: 'webhook-secret',
        active: true,
        createdBy: 'user-1'
      });

      expect(webhook).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain('grade_updated');
    });

    it('should install plugin', async () => {
      const plugin = await integrationService.installPlugin({
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        config: {},
        hooks: ['before_grade', 'after_grade'],
        active: true
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('Test Plugin');
      expect(plugin.hooks).toContain('before_grade');
    });
  });

  describe('End-to-End Workflows', () => {
    it('should complete full grading workflow', async () => {
      // Mock data setup
      const mockSubmission = {
        id: 'sub-1',
        studentId: 'student-1',
        activityId: 'activity-1',
        score: null,
        content: { text: 'Student response' },
        activity: { title: 'Essay Activity', content: {} }
      };

      const mockRubric = {
        id: 'rubric-1',
        title: 'Essay Rubric',
        description: 'Rubric for essays',
        maxScore: 100,
        bloomsDistribution: { criteria: [] },
        createdById: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'HOLISTIC' as const,
        subjectId: null
      };

      (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue([mockSubmission]);
      (mockPrisma.rubric.findUnique as jest.Mock).mockResolvedValue(mockRubric);
      (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

      // Execute workflow
      const batchRequest = {
        submissionIds: ['sub-1'],
        gradingMethod: 'hybrid' as const,
        rubricId: 'rubric-1',
        aiSettings: {
          model: 'gpt-4' as const,
          confidenceThreshold: 0.8,
          generateFeedback: true,
          bloomsAnalysis: true
        }
      };

      const result = await gradingService.performBatchGrading(batchRequest, 'teacher-1');

      expect(result.totalSubmissions).toBe(1);
      expect(result.successfulGradings).toBeGreaterThanOrEqual(0);
    });

    it('should handle performance monitoring during load', async () => {
      // Simulate multiple concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => 
        performanceService.getCached(`key-${i}`, 'activities', async () => ({ data: i }))
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);

      // Check performance metrics
      const metrics = await performanceService.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database connection errors gracefully', async () => {
      (mockPrisma.activityGrade.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(reportingService.generateStudentReport('student-1')).rejects.toThrow('Failed to generate student report');
    });

    it('should handle invalid input gracefully', async () => {
      const invalidRubric = {
        name: '', // Invalid: empty name
        description: 'Test',
        criteria: [],
        createdBy: 'user-1'
      };

      await expect(gradingService.createRubric(invalidRubric)).rejects.toThrow();
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  it('should handle large batch grading efficiently', async () => {
    const startTime = Date.now();
    
    // Simulate large batch
    const submissionIds = Array.from({ length: 100 }, (_, i) => `sub-${i}`);
    
    const mockSubmissions = submissionIds.map(id => ({
      id,
      studentId: `student-${id}`,
      activityId: 'activity-1',
      score: null,
      content: { text: 'Test submission' },
      activity: { title: 'Test Activity', content: {} }
    }));

    (mockPrisma.activityGrade.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
    (mockPrisma.activityGrade.update as jest.Mock).mockResolvedValue({});

    const gradingService = new AdvancedGradingService(mockPrisma);
    
    const batchRequest = {
      submissionIds,
      gradingMethod: 'ai_only' as const,
      aiSettings: {
        model: 'gpt-4' as const,
        confidenceThreshold: 0.7,
        generateFeedback: true,
        bloomsAnalysis: true
      }
    };

    await gradingService.performBatchGrading(batchRequest, 'teacher-1');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
