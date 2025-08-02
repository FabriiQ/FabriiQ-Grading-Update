import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { PrismaClient } from '@prisma/client';
import { teacherRouter } from '../../server/api/routers/teacher';
import { Session } from 'next-auth';

// Mock large dataset
const generateLargeDataset = (size: number) => {
  const students = Array.from({ length: size }, (_, i) => ({
    id: `student-${i}`,
    status: 'ACTIVE' as const,
    student: {
      user: { name: `Student ${i}` },
    },
  }));

  const activities = Array.from({ length: Math.min(size, 100) }, (_, i) => ({
    id: `activity-${i}`,
    title: `Activity ${i}`,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    subject: { id: `subject-${i % 5}`, name: `Subject ${i % 5}` },
    topic: { id: `topic-${i}`, title: `Topic ${i}` },
    activityGrades: students.slice(0, Math.floor(size * 0.8)).map((student, j) => ({
      studentId: student.id,
      status: j % 3 === 0 ? 'GRADED' as const : 'SUBMITTED' as const,
      score: j % 3 === 0 ? 70 + Math.floor(Math.random() * 30) : null,
      student: {
        id: student.id,
        user: { name: student.student.user.name },
      },
    })),
    _count: { activityGrades: Math.floor(size * 0.8) },
  }));

  const assessments = Array.from({ length: Math.min(size / 10, 20) }, (_, i) => ({
    id: `assessment-${i}`,
    title: `Assessment ${i}`,
    status: 'ACTIVE' as const,
    dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    subject: { id: `subject-${i % 5}`, name: `Subject ${i % 5}` },
    submissions: students.slice(0, Math.floor(size * 0.6)).map((student, j) => ({
      studentId: student.id,
      status: j % 4 === 0 ? 'GRADED' as const : 'SUBMITTED' as const,
      score: j % 4 === 0 ? 60 + Math.floor(Math.random() * 40) : null,
      student: {
        id: student.id,
        user: { name: student.student.user.name },
      },
    })),
    _count: { submissions: Math.floor(size * 0.6) },
  }));

  const attendanceRecords = Array.from({ length: size * 30 }, (_, i) => ({
    id: `attendance-${i}`,
    status: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'][Math.floor(Math.random() * 4)] as any,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
  }));

  return {
    students,
    activities,
    assessments,
    attendanceRecords,
  };
};

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  class: {
    findUnique: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
  },
  assessment: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock session
const mockSession: Session = {
  user: {
    id: 'teacher-1',
    userType: 'CAMPUS_TEACHER',
    email: 'teacher@test.com',
    name: 'Test Teacher',
  },
  expires: '2024-12-31',
};

const mockContext = {
  session: mockSession,
  prisma: mockPrisma,
};

describe('Class Overview Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock teacher profile
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'teacher-1',
      teacherProfile: { id: 'teacher-profile-1' },
    });
  });

  const measurePerformance = async (fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  };

  describe('getClassMetrics Performance', () => {
    it('should handle small class (25 students) efficiently', async () => {
      const dataset = generateLargeDataset(25);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        students: dataset.students,
        activities: dataset.activities,
        assessments: dataset.assessments,
        attendanceRecords: dataset.attendanceRecords,
      });

      const caller = teacherRouter.createCaller(mockContext);
      
      const { result, duration } = await measurePerformance(() =>
        caller.getClassMetrics({ classId: 'test-class-id' })
      );

      expect(result).toBeDefined();
      expect(result.activeStudents).toBe(25);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle medium class (100 students) efficiently', async () => {
      const dataset = generateLargeDataset(100);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        students: dataset.students,
        activities: dataset.activities,
        assessments: dataset.assessments,
        attendanceRecords: dataset.attendanceRecords,
      });

      const caller = teacherRouter.createCaller(mockContext);
      
      const { result, duration } = await measurePerformance(() =>
        caller.getClassMetrics({ classId: 'test-class-id' })
      );

      expect(result).toBeDefined();
      expect(result.activeStudents).toBe(100);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should handle large class (500 students) within acceptable time', async () => {
      const dataset = generateLargeDataset(500);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        students: dataset.students,
        activities: dataset.activities,
        assessments: dataset.assessments,
        attendanceRecords: dataset.attendanceRecords,
      });

      const caller = teacherRouter.createCaller(mockContext);
      
      const { result, duration } = await measurePerformance(() =>
        caller.getClassMetrics({ classId: 'test-class-id' })
      );

      expect(result).toBeDefined();
      expect(result.activeStudents).toBe(500);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('getRecentClassActivities Performance', () => {
    it('should handle activities with many submissions efficiently', async () => {
      const dataset = generateLargeDataset(200);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        _count: { students: 200 },
      });

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue(dataset.activities);

      const caller = teacherRouter.createCaller(mockContext);
      
      const { result, duration } = await measurePerformance(() =>
        caller.getRecentClassActivities({ classId: 'test-class-id', limit: 10 })
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(300); // Should complete in under 300ms
      
      // Verify statistics are calculated correctly
      result.forEach((activity: any) => {
        expect(activity.statistics).toBeDefined();
        expect(activity.statistics.totalSubmissions).toBeGreaterThanOrEqual(0);
        expect(activity.statistics.completionRate).toBeGreaterThanOrEqual(0);
        expect(activity.statistics.completionRate).toBeLessThanOrEqual(100);
      });
    });

    it('should limit results correctly for performance', async () => {
      const dataset = generateLargeDataset(100);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        _count: { students: 100 },
      });

      // Create many activities
      const manyActivities = Array.from({ length: 50 }, (_, i) => ({
        ...dataset.activities[0],
        id: `activity-${i}`,
        title: `Activity ${i}`,
      }));

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue(manyActivities);

      const caller = teacherRouter.createCaller(mockContext);
      
      const { result, duration } = await measurePerformance(() =>
        caller.getRecentClassActivities({ classId: 'test-class-id', limit: 5 })
      );

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(5); // Should respect limit
      expect(duration).toBeLessThan(200); // Should be fast due to limit
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple large datasets
      for (let i = 0; i < 10; i++) {
        const dataset = generateLargeDataset(100);
        
        (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
          id: `test-class-${i}`,
          students: dataset.students,
          activities: dataset.activities,
          assessments: dataset.assessments,
          attendanceRecords: dataset.attendanceRecords,
        });

        const caller = teacherRouter.createCaller(mockContext);
        await caller.getClassMetrics({ classId: `test-class-${i}` });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const dataset = generateLargeDataset(100);
      
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        students: dataset.students,
        activities: dataset.activities,
        assessments: dataset.assessments,
        attendanceRecords: dataset.attendanceRecords,
      });

      const caller = teacherRouter.createCaller(mockContext);
      
      // Create 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        measurePerformance(() => caller.getClassMetrics({ classId: 'test-class-id' }))
      );

      const results = await Promise.all(promises);
      
      // All requests should complete
      expect(results).toHaveLength(10);
      
      // Average response time should be reasonable
      const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(averageDuration).toBeLessThan(1000); // Average under 1 second
      
      // All results should be consistent
      results.forEach(({ result }) => {
        expect(result.activeStudents).toBe(100);
        expect(result.totalActivities).toBeDefined();
        expect(result.totalAssessments).toBeDefined();
      });
    });
  });

  describe('Database Query Optimization', () => {
    it('should minimize database queries', async () => {
      const dataset = generateLargeDataset(50);
      let queryCount = 0;

      // Mock and count database calls
      const originalFindUnique = (mockPrisma.class.findUnique as jest.Mock);
      (mockPrisma.class.findUnique as jest.Mock).mockImplementation((...args) => {
        queryCount++;
        return Promise.resolve({
          id: 'test-class-id',
          students: dataset.students,
          activities: dataset.activities,
          assessments: dataset.assessments,
          attendanceRecords: dataset.attendanceRecords,
        });
      });

      const caller = teacherRouter.createCaller(mockContext);
      await caller.getClassMetrics({ classId: 'test-class-id' });

      // Should make minimal database queries (ideally just 2: user + class with includes)
      expect(queryCount).toBeLessThanOrEqual(2);
    });
  });
});
