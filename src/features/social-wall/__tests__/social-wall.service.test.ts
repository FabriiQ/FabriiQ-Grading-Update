/**
 * Social Wall Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { SocialWallService } from '../services/social-wall.service';
import type { CreatePostInput, CreateCommentInput } from '../types/social-wall.types';

// Mock Prisma Client
const mockPrisma = {
  socialPost: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  socialComment: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  socialReaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  socialUserTag: {
    createMany: jest.fn(),
  },
  studentEnrollment: {
    findMany: jest.fn(),
  },
  teacherAssignment: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('SocialWallService', () => {
  let service: SocialWallService;
  const mockUserId = 'user_123';
  const mockClassId = 'class_123';

  beforeEach(() => {
    service = new SocialWallService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const mockPostInput: CreatePostInput = {
      content: 'Test post content',
      classId: mockClassId,
      postType: 'REGULAR',
    };

    it('should create a post successfully for authorized teacher', async () => {
      // Mock user permissions check
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([{ id: 'assignment_1' }]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([]);

      // Mock post creation
      const mockPost = {
        id: 'post_123',
        content: 'Test post content',
        classId: mockClassId,
        authorId: mockUserId,
        postType: 'REGULAR',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: mockUserId, name: 'Test Teacher', userType: 'TEACHER' },
        reactions: [],
        userTags: [],
        commentCount: 0,
      };

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.createPost(mockUserId, mockPostInput);

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(result.post.content).toBe('Test post content');
    });

    it('should throw error for unauthorized student', async () => {
      // Mock student permissions (no teacher assignment)
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      await expect(service.createPost(mockUserId, mockPostInput))
        .rejects
        .toThrow(TRPCError);
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(5001);
      const invalidInput = { ...mockPostInput, content: longContent };

      // Mock teacher permissions
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([{ id: 'assignment_1' }]);

      await expect(service.createPost(mockUserId, invalidInput))
        .rejects
        .toThrow('Content validation failed');
    });

    it('should handle empty content', async () => {
      const emptyInput = { ...mockPostInput, content: '' };

      // Mock teacher permissions
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([{ id: 'assignment_1' }]);

      await expect(service.createPost(mockUserId, emptyInput))
        .rejects
        .toThrow('Content validation failed');
    });
  });

  describe('createComment', () => {
    const mockCommentInput: CreateCommentInput = {
      postId: 'post_123',
      content: 'Test comment content',
    };

    it('should create a comment successfully', async () => {
      // Mock post exists
      (mockPrisma.socialPost.findUnique as jest.Mock).mockResolvedValue({
        id: 'post_123',
        classId: mockClassId,
      });

      // Mock user has access to class
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      // Mock comment creation
      const mockComment = {
        id: 'comment_123',
        content: 'Test comment content',
        postId: 'post_123',
        authorId: mockUserId,
        createdAt: new Date(),
        author: { id: mockUserId, name: 'Test Student', userType: 'STUDENT' },
        reactions: [],
        userTags: [],
      };

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(mockComment);

      const result = await service.createComment(mockUserId, mockCommentInput);

      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
      expect(result.comment.content).toBe('Test comment content');
    });

    it('should throw error for non-existent post', async () => {
      (mockPrisma.socialPost.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createComment(mockUserId, mockCommentInput))
        .rejects
        .toThrow('Post not found');
    });

    it('should validate comment content length', async () => {
      const longContent = 'a'.repeat(1001);
      const invalidInput = { ...mockCommentInput, content: longContent };

      // Mock post exists
      (mockPrisma.socialPost.findUnique as jest.Mock).mockResolvedValue({
        id: 'post_123',
        classId: mockClassId,
      });

      // Mock user has access
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      await expect(service.createComment(mockUserId, invalidInput))
        .rejects
        .toThrow('Content validation failed');
    });
  });

  describe('getUserPermissions', () => {
    it('should return teacher permissions for teacher', async () => {
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([{ id: 'assignment_1' }]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([]);

      const permissions = await service.getUserPermissions(mockUserId, mockClassId);

      expect(permissions.canCreatePost).toBe(true);
      expect(permissions.canCreateAchievementPost).toBe(true);
      expect(permissions.canComment).toBe(true);
      expect(permissions.canReact).toBe(true);
      expect(permissions.canModerate).toBe(true);
    });

    it('should return student permissions for student', async () => {
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      const permissions = await service.getUserPermissions(mockUserId, mockClassId);

      expect(permissions.canCreatePost).toBe(false);
      expect(permissions.canCreateAchievementPost).toBe(false);
      expect(permissions.canComment).toBe(true);
      expect(permissions.canReact).toBe(true);
      expect(permissions.canModerate).toBe(false);
    });

    it('should return no permissions for unauthorized user', async () => {
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([]);

      const permissions = await service.getUserPermissions(mockUserId, mockClassId);

      expect(permissions.canCreatePost).toBe(false);
      expect(permissions.canCreateAchievementPost).toBe(false);
      expect(permissions.canComment).toBe(false);
      expect(permissions.canReact).toBe(false);
      expect(permissions.canModerate).toBe(false);
    });
  });

  describe('getClassPosts', () => {
    it('should return paginated posts for authorized user', async () => {
      // Mock user has access
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      const mockPosts = [
        {
          id: 'post_1',
          content: 'Post 1',
          author: { id: 'user_1', name: 'User 1', userType: 'TEACHER' },
          reactions: [],
          userTags: [],
          commentCount: 0,
        },
        {
          id: 'post_2',
          content: 'Post 2',
          author: { id: 'user_2', name: 'User 2', userType: 'TEACHER' },
          reactions: [],
          userTags: [],
          commentCount: 1,
        },
      ];

      (mockPrisma.socialPost.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await service.getClassPosts(mockUserId, {
        classId: mockClassId,
        limit: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('post_1');
      expect(result.items[1].id).toBe('post_2');
    });

    it('should throw error for unauthorized user', async () => {
      (mockPrisma.teacherAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.getClassPosts(mockUserId, { classId: mockClassId }))
        .rejects
        .toThrow('You do not have access to this class');
    });
  });

  describe('addReaction', () => {
    it('should add reaction to post', async () => {
      // Mock post exists and user has access
      (mockPrisma.socialPost.findUnique as jest.Mock).mockResolvedValue({
        id: 'post_123',
        classId: mockClassId,
      });
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      // Mock no existing reaction
      (mockPrisma.socialReaction.findUnique as jest.Mock).mockResolvedValue(null);

      const mockReaction = {
        id: 'reaction_123',
        postId: 'post_123',
        userId: mockUserId,
        reactionType: 'LIKE',
      };

      (mockPrisma.socialReaction.create as jest.Mock).mockResolvedValue(mockReaction);

      const result = await service.addReaction(mockUserId, {
        postId: 'post_123',
        reactionType: 'LIKE',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.socialReaction.create).toHaveBeenCalled();
    });

    it('should update existing reaction', async () => {
      // Mock post exists and user has access
      (mockPrisma.socialPost.findUnique as jest.Mock).mockResolvedValue({
        id: 'post_123',
        classId: mockClassId,
      });
      (mockPrisma.studentEnrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'enrollment_1' }]);

      // Mock existing reaction
      (mockPrisma.socialReaction.findUnique as jest.Mock).mockResolvedValue({
        id: 'reaction_123',
        reactionType: 'LIKE',
      });

      const result = await service.addReaction(mockUserId, {
        postId: 'post_123',
        reactionType: 'LOVE',
      });

      expect(result.success).toBe(true);
    });
  });
});
