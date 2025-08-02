/**
 * Social Wall Integration Tests
 * Tests the complete flow from API to database
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { PrismaClient } from '@prisma/client';
import { socialWallRouter } from '../../../server/api/routers/social-wall';
import { createTRPCContext } from '../../../server/api/trpc';

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db',
    },
  },
});

// Mock session for testing
const mockSession = {
  user: {
    id: 'test_user_123',
    name: 'Test User',
    email: 'test@example.com',
    userType: 'TEACHER',
    username: 'testuser',
    primaryCampusId: 'campus_123',
  },
  expires: '2024-12-31',
};

// MSW server setup
const trpcMsw = createTRPCMsw<typeof socialWallRouter>();
const server = setupServer();

describe('Social Wall Integration Tests', () => {
  let testClassId: string;
  let testUserId: string;
  let testStudentId: string;

  beforeEach(async () => {
    // Clean up database
    await prisma.socialReaction.deleteMany();
    await prisma.socialComment.deleteMany();
    await prisma.socialPost.deleteMany();
    await prisma.socialUserTag.deleteMany();
    await prisma.studentEnrollment.deleteMany();
    await prisma.teacherAssignment.deleteMany();

    // Create test data
    testUserId = 'test_teacher_123';
    testStudentId = 'test_student_123';
    testClassId = 'test_class_123';

    // Create test class
    await prisma.class.upsert({
      where: { id: testClassId },
      update: {},
      create: {
        id: testClassId,
        name: 'Test Class',
        courseCampusId: 'course_campus_123',
        academicCycleId: 'cycle_123',
        status: 'ACTIVE',
      },
    });

    // Create test teacher
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        name: 'Test Teacher',
        email: 'teacher@test.com',
        username: 'testteacher',
        userType: 'TEACHER',
        primaryCampusId: 'campus_123',
      },
    });

    await prisma.teacherProfile.upsert({
      where: { userId: testUserId },
      update: {},
      create: {
        userId: testUserId,
        employeeId: 'EMP123',
        campusId: 'campus_123',
      },
    });

    // Create test student
    await prisma.user.upsert({
      where: { id: testStudentId },
      update: {},
      create: {
        id: testStudentId,
        name: 'Test Student',
        email: 'student@test.com',
        username: 'teststudent',
        userType: 'STUDENT',
        primaryCampusId: 'campus_123',
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: testStudentId },
      update: {},
      create: {
        userId: testStudentId,
        enrollmentNumber: 'STU123',
        campusId: 'campus_123',
      },
    });

    // Create teacher assignment
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: testUserId },
    });

    await prisma.teacherAssignment.create({
      data: {
        teacherId: teacherProfile!.id,
        classId: testClassId,
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
    });

    // Create student enrollment
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: testStudentId },
    });

    await prisma.studentEnrollment.create({
      data: {
        studentId: studentProfile!.id,
        classId: testClassId,
        status: 'ACTIVE',
        enrolledAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.socialReaction.deleteMany();
    await prisma.socialComment.deleteMany();
    await prisma.socialPost.deleteMany();
    await prisma.socialUserTag.deleteMany();
    await prisma.studentEnrollment.deleteMany();
    await prisma.teacherAssignment.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
  });

  describe('Post Creation Flow', () => {
    it('should create a post as teacher and retrieve it', async () => {
      const ctx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testUserId } },
      });

      const caller = socialWallRouter.createCaller(ctx);

      // Create a post
      const createResult = await caller.createPost({
        content: 'This is a test post for integration testing',
        classId: testClassId,
        postType: 'REGULAR',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.post).toBeDefined();
      expect(createResult.post.content).toBe('This is a test post for integration testing');
      expect(createResult.post.authorId).toBe(testUserId);

      // Retrieve posts
      const postsResult = await caller.getClassPosts({
        classId: testClassId,
        limit: 10,
      });

      expect(postsResult.items).toHaveLength(1);
      expect(postsResult.items[0].id).toBe(createResult.post.id);
      expect(postsResult.items[0].content).toBe('This is a test post for integration testing');
    });

    it('should prevent students from creating posts', async () => {
      const ctx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testStudentId, userType: 'STUDENT' } },
      });

      const caller = socialWallRouter.createCaller(ctx);

      // Attempt to create a post as student
      await expect(caller.createPost({
        content: 'Student trying to post',
        classId: testClassId,
        postType: 'REGULAR',
      })).rejects.toThrow('Only teachers can create posts');
    });
  });

  describe('Comment Creation Flow', () => {
    it('should create a comment on a post', async () => {
      // Create context for teacher
      const teacherCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testUserId } },
      });

      const teacherCaller = socialWallRouter.createCaller(teacherCtx);

      // Create a post first
      const postResult = await teacherCaller.createPost({
        content: 'Post for comment testing',
        classId: testClassId,
        postType: 'REGULAR',
      });

      // Create context for student
      const studentCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testStudentId, userType: 'STUDENT' } },
      });

      const studentCaller = socialWallRouter.createCaller(studentCtx);

      // Create a comment as student
      const commentResult = await studentCaller.createComment({
        postId: postResult.post.id,
        content: 'This is a test comment',
      });

      expect(commentResult.success).toBe(true);
      expect(commentResult.comment).toBeDefined();
      expect(commentResult.comment.content).toBe('This is a test comment');
      expect(commentResult.comment.authorId).toBe(testStudentId);

      // Verify comment appears in post comments
      const commentsResult = await studentCaller.getPostComments({
        postId: postResult.post.id,
        limit: 10,
      });

      expect(commentsResult.items).toHaveLength(1);
      expect(commentsResult.items[0].id).toBe(commentResult.comment.id);
    });
  });

  describe('Reaction Flow', () => {
    it('should add and remove reactions', async () => {
      // Create context for teacher
      const teacherCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testUserId } },
      });

      const teacherCaller = socialWallRouter.createCaller(teacherCtx);

      // Create a post
      const postResult = await teacherCaller.createPost({
        content: 'Post for reaction testing',
        classId: testClassId,
        postType: 'REGULAR',
      });

      // Create context for student
      const studentCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testStudentId, userType: 'STUDENT' } },
      });

      const studentCaller = socialWallRouter.createCaller(studentCtx);

      // Add a reaction
      const reactionResult = await studentCaller.addReaction({
        postId: postResult.post.id,
        reactionType: 'LIKE',
      });

      expect(reactionResult.success).toBe(true);

      // Verify reaction is saved
      const postsAfterReaction = await studentCaller.getClassPosts({
        classId: testClassId,
        limit: 10,
      });

      const postWithReaction = postsAfterReaction.items[0];
      expect(postWithReaction.reactions).toHaveLength(1);
      expect(postWithReaction.reactions[0].type).toBe('LIKE');
      expect(postWithReaction.reactions[0].count).toBe(1);
      expect(postWithReaction.userReaction).toBe('LIKE');

      // Remove the reaction
      const removeResult = await studentCaller.removeReaction({
        postId: postResult.post.id,
      });

      expect(removeResult.success).toBe(true);

      // Verify reaction is removed
      const postsAfterRemoval = await studentCaller.getClassPosts({
        classId: testClassId,
        limit: 10,
      });

      const postAfterRemoval = postsAfterRemoval.items[0];
      expect(postAfterRemoval.reactions).toHaveLength(0);
      expect(postAfterRemoval.userReaction).toBeUndefined();
    });
  });

  describe('Permissions and Access Control', () => {
    it('should enforce class access permissions', async () => {
      // Create a user not enrolled in the class
      const unauthorizedUserId = 'unauthorized_user';
      await prisma.user.create({
        data: {
          id: unauthorizedUserId,
          name: 'Unauthorized User',
          email: 'unauthorized@test.com',
          username: 'unauthorized',
          userType: 'STUDENT',
          primaryCampusId: 'campus_123',
        },
      });

      const unauthorizedCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { 
          ...mockSession, 
          user: { 
            ...mockSession.user, 
            id: unauthorizedUserId, 
            userType: 'STUDENT' 
          } 
        },
      });

      const unauthorizedCaller = socialWallRouter.createCaller(unauthorizedCtx);

      // Attempt to access class posts
      await expect(unauthorizedCaller.getClassPosts({
        classId: testClassId,
        limit: 10,
      })).rejects.toThrow('You do not have access to this class');
    });

    it('should allow teachers to moderate content', async () => {
      const teacherCtx = await createTRPCContext({
        req: {} as any,
        res: {} as any,
        session: { ...mockSession, user: { ...mockSession.user, id: testUserId } },
      });

      const teacherCaller = socialWallRouter.createCaller(teacherCtx);

      // Create a post
      const postResult = await teacherCaller.createPost({
        content: 'Post to be moderated',
        classId: testClassId,
        postType: 'REGULAR',
      });

      // Delete the post (moderation action)
      const deleteResult = await teacherCaller.deletePost({
        postId: postResult.post.id,
        reason: 'Test moderation',
      });

      expect(deleteResult.success).toBe(true);

      // Verify post is no longer accessible
      const postsAfterDeletion = await teacherCaller.getClassPosts({
        classId: testClassId,
        limit: 10,
      });

      expect(postsAfterDeletion.items).toHaveLength(0);
    });
  });
});
