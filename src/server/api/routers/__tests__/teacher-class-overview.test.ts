import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { teacherRouter } from '../teacher';
import { Session } from 'next-auth';

// Mock Prisma Client
const mockPrisma = {
  class: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
  },
  assessment: {
    findMany: jest.fn(),
  },
  studentEnrollment: {
    findMany: jest.fn(),
  },
  attendance: {
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
    username: 'test-teacher',
  },
  expires: '2024-12-31',
};

// Mock academic cycle service
const mockAcademicCycleService = {
  getCurrentAcademicCycle: jest.fn(),
  getAcademicCycleById: jest.fn(),
} as any;

// Mock context
const mockContext = {
  session: mockSession,
  prisma: mockPrisma,
  academicCycleService: mockAcademicCycleService,
  res: undefined,
};

describe('Teacher Class Overview API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClassMetrics', () => {
    it('should return real-time class metrics', async () => {
      const classId = 'test-class-id';
      
      // Mock teacher profile
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      // Mock class data with comprehensive includes
      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        name: 'Test Class',
        students: [
          { id: 'student-1', status: 'ACTIVE', student: { user: { name: 'Student 1' } } },
          { id: 'student-2', status: 'ACTIVE', student: { user: { name: 'Student 2' } } },
        ],
        activities: [
          {
            id: 'activity-1',
            status: 'ACTIVE',
            activityGrades: [
              { studentId: 'student-1', status: 'GRADED', score: 85 },
              { studentId: 'student-2', status: 'SUBMITTED', score: null },
            ],
          },
          {
            id: 'activity-2',
            status: 'ACTIVE',
            activityGrades: [
              { studentId: 'student-1', status: 'GRADED', score: 90 },
            ],
          },
        ],
        assessments: [
          {
            id: 'assessment-1',
            status: 'ACTIVE',
            submissions: [
              { studentId: 'student-1', status: 'GRADED', score: 88 },
              { studentId: 'student-2', status: 'SUBMITTED', score: null },
            ],
          },
        ],
        attendanceRecords: [
          { status: 'PRESENT', createdAt: new Date() },
          { status: 'PRESENT', createdAt: new Date() },
          { status: 'ABSENT', createdAt: new Date() },
        ],
      });

      const caller = teacherRouter.createCaller(mockContext);
      const result = await caller.getClassMetrics({ classId });

      expect(result).toMatchObject({
        classId,
        activeStudents: expect.any(Number),
        totalActivities: 2,
        totalAssessments: 1,
        completionRate: expect.any(Number),
        assessmentCompletionRate: expect.any(Number),
        averageGrade: expect.any(Number),
        participationRate: expect.any(Number),
      });

      expect(result.activeStudents).toBeGreaterThan(0);
      expect(result.completionRate).toBeGreaterThanOrEqual(0);
      expect(result.completionRate).toBeLessThanOrEqual(100);
    });

    it('should handle class not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue(null);

      const caller = teacherRouter.createCaller(mockContext);

      await expect(
        caller.getClassMetrics({ classId: 'non-existent' })
      ).rejects.toThrow('Class not found');
    });

    it('should handle unauthorized access', async () => {
      const unauthorizedContext = {
        ...mockContext,
        session: null,
      };

      const caller = teacherRouter.createCaller(unauthorizedContext);

      await expect(
        caller.getClassMetrics({ classId: 'test-class-id' })
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('getRecentClassActivities', () => {
    it('should return activities with statistics', async () => {
      const classId = 'test-class-id';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        _count: { students: 25 },
      });

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          title: 'Test Activity',
          status: 'ACTIVE',
          createdAt: new Date(),
          subject: { id: 'subject-1', name: 'Mathematics' },
          topic: { id: 'topic-1', title: 'Algebra' },
          activityGrades: [
            { status: 'GRADED', score: 85, student: { id: 'student-1', user: { name: 'Student 1' } } },
            { status: 'SUBMITTED', score: null, student: { id: 'student-2', user: { name: 'Student 2' } } },
            { status: 'GRADED', score: 90, student: { id: 'student-3', user: { name: 'Student 3' } } },
          ],
          _count: { activityGrades: 3 },
        },
      ]);

      const caller = teacherRouter.createCaller(mockContext);
      const result = await caller.getRecentClassActivities({ classId, limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'activity-1',
        title: 'Test Activity',
        statistics: {
          totalSubmissions: 3,
          gradedSubmissions: 2,
          pendingSubmissions: 1,
          averageScore: expect.any(Number),
          completionRate: expect.any(Number),
          needsGrading: true,
          activityStatus: 'needs_grading',
          totalStudents: 25,
        },
      });

      expect(result[0].statistics.averageScore).toBe(88); // (85 + 90) / 2
      expect(result[0].statistics.completionRate).toBe(12); // (3 / 25) * 100
    });

    it('should handle empty activities', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        _count: { students: 25 },
      });

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);

      const caller = teacherRouter.createCaller(mockContext);
      const result = await caller.getRecentClassActivities({ classId: 'test-class-id' });

      expect(result).toHaveLength(0);
    });
  });

  describe('getUpcomingClassAssessments', () => {
    it('should return assessments with statistics and urgency', async () => {
      const classId = 'test-class-id';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days from now

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        _count: { students: 20 },
      });

      (mockPrisma.assessment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'assessment-1',
          title: 'Midterm Exam',
          status: 'ACTIVE',
          dueDate: futureDate,
          subject: { id: 'subject-1', name: 'Mathematics' },
          submissions: [
            { studentId: 'student-1', status: 'GRADED', score: 85, student: { id: 'student-1', user: { name: 'Student 1' } } },
            { studentId: 'student-2', status: 'SUBMITTED', score: null, student: { id: 'student-2', user: { name: 'Student 2' } } },
          ],
          _count: { submissions: 2 },
        },
      ]);

      const caller = teacherRouter.createCaller(mockContext);
      const result = await caller.getUpcomingClassAssessments({ classId, limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'assessment-1',
        title: 'Midterm Exam',
        statistics: {
          totalSubmissions: 2,
          gradedSubmissions: 1,
          pendingSubmissions: 1,
          averageScore: 85,
          submissionRate: 10, // (2 / 20) * 100
          daysUntilDue: 2,
          urgency: 'medium',
          assessmentStatus: 'needs_grading',
          totalStudents: 20,
        },
      });
    });

    it('should calculate high urgency for assessments due soon', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: { id: 'teacher-profile-1' },
      });

      (mockPrisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-class-id',
        _count: { students: 20 },
      });

      (mockPrisma.assessment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'assessment-1',
          title: 'Quiz',
          status: 'ACTIVE',
          dueDate: tomorrow,
          subject: { id: 'subject-1', name: 'Mathematics' },
          submissions: [],
          _count: { submissions: 0 },
        },
      ]);

      const caller = teacherRouter.createCaller(mockContext);
      const result = await caller.getUpcomingClassAssessments({ classId: 'test-class-id' });

      expect(result[0].statistics.urgency).toBe('high');
      expect(result[0].statistics.daysUntilDue).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const caller = teacherRouter.createCaller(mockContext);

      await expect(
        caller.getClassMetrics({ classId: 'test-class-id' })
      ).rejects.toThrow('Failed to get class metrics');
    });

    it('should handle missing teacher profile', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        teacherProfile: null,
      });

      const caller = teacherRouter.createCaller(mockContext);

      await expect(
        caller.getClassMetrics({ classId: 'test-class-id' })
      ).rejects.toThrow('Teacher profile not found');
    });
  });
});
