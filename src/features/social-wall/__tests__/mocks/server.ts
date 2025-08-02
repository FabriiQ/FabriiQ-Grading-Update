/**
 * MSW Server for Social Wall Tests
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { TestDataFactory } from '../setup';

// Mock API responses
export const handlers = [
  // Mock tRPC endpoints
  rest.post('/api/trpc/socialWall.createPost', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
            post: TestDataFactory.post(),
            notifications: [],
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.getClassPosts', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            items: [
              TestDataFactory.postWithEngagement(),
              TestDataFactory.post({ id: 'post_456', content: 'Second post' }),
            ],
            nextCursor: null,
            hasMore: false,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.createComment', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
            comment: TestDataFactory.comment(),
            notifications: [],
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.getPostComments', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            items: [
              TestDataFactory.comment(),
              TestDataFactory.comment({ id: 'comment_456', content: 'Second comment' }),
            ],
            nextCursor: null,
            hasMore: false,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.addReaction', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
            reaction: {
              id: 'reaction_123',
              postId: 'post_123',
              userId: 'user_123',
              reactionType: 'LIKE',
            },
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.removeReaction', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.deletePost', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.updatePost', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
            post: TestDataFactory.post({ content: 'Updated content' }),
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.getUserPermissions', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            canCreatePost: true,
            canCreateAchievementPost: true,
            canComment: true,
            canReact: true,
            canModerate: true,
            canViewAnalytics: true,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.moderateContent', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            success: true,
          },
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.getModerationLogs', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            items: [
              {
                id: 'log_123',
                action: 'HIDE',
                contentType: 'POST',
                contentId: 'post_123',
                moderatorId: 'moderator_123',
                reason: 'Inappropriate content',
                createdAt: new Date().toISOString(),
                moderator: {
                  id: 'moderator_123',
                  name: 'Test Moderator',
                  userType: 'TEACHER',
                },
              },
            ],
            nextCursor: null,
            hasMore: false,
          },
        },
      })
    );
  }),

  // Mock Socket.IO endpoints
  rest.get('/api/socket/social-wall', (req, res, ctx) => {
    return res(ctx.text('Socket.IO endpoint'));
  }),

  // Mock NextAuth endpoints
  rest.get('/api/auth/session', (req, res, ctx) => {
    return res(
      ctx.json(TestDataFactory.teacherSession())
    );
  }),

  // Mock file upload endpoints
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        urls: ['https://example.com/uploaded-file.jpg'],
      })
    );
  }),

  // Error scenarios for testing
  rest.post('/api/trpc/socialWall.createPost.error', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        error: {
          message: 'Content validation failed',
          code: 'BAD_REQUEST',
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.unauthorized', (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.json({
        error: {
          message: 'You do not have access to this class',
          code: 'FORBIDDEN',
        },
      })
    );
  }),

  rest.post('/api/trpc/socialWall.rateLimit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        error: {
          message: 'Rate limit exceeded',
          code: 'TOO_MANY_REQUESTS',
        },
      })
    );
  }),
];

export const server = setupServer(...handlers);

// Helper functions for test scenarios
export const mockSuccessfulPostCreation = () => {
  server.use(
    rest.post('/api/trpc/socialWall.createPost', (req, res, ctx) => {
      return res(
        ctx.json({
          result: {
            data: {
              success: true,
              post: TestDataFactory.postWithEngagement(),
              notifications: ['notification_123'],
            },
          },
        })
      );
    })
  );
};

export const mockFailedPostCreation = (errorMessage = 'Content validation failed') => {
  server.use(
    rest.post('/api/trpc/socialWall.createPost', (req, res, ctx) => {
      return res(
        ctx.status(400),
        ctx.json({
          error: {
            message: errorMessage,
            code: 'BAD_REQUEST',
          },
        })
      );
    })
  );
};

export const mockUnauthorizedAccess = () => {
  server.use(
    rest.post('/api/trpc/socialWall.*', (req, res, ctx) => {
      return res(
        ctx.status(403),
        ctx.json({
          error: {
            message: 'You do not have access to this class',
            code: 'FORBIDDEN',
          },
        })
      );
    })
  );
};

export const mockRateLimitExceeded = () => {
  server.use(
    rest.post('/api/trpc/socialWall.createPost', (req, res, ctx) => {
      return res(
        ctx.status(429),
        ctx.json({
          error: {
            message: 'Rate limit exceeded. You can create 0 more posts this hour.',
            code: 'TOO_MANY_REQUESTS',
          },
        })
      );
    })
  );
};

export const mockEmptyFeed = () => {
  server.use(
    rest.post('/api/trpc/socialWall.getClassPosts', (req, res, ctx) => {
      return res(
        ctx.json({
          result: {
            data: {
              items: [],
              nextCursor: null,
              hasMore: false,
            },
          },
        })
      );
    })
  );
};

export const mockStudentPermissions = () => {
  server.use(
    rest.post('/api/trpc/socialWall.getUserPermissions', (req, res, ctx) => {
      return res(
        ctx.json({
          result: {
            data: {
              canCreatePost: false,
              canCreateAchievementPost: false,
              canComment: true,
              canReact: true,
              canModerate: false,
              canViewAnalytics: false,
            },
          },
        })
      );
    }),
    rest.get('/api/auth/session', (req, res, ctx) => {
      return res(
        ctx.json(TestDataFactory.studentSession())
      );
    })
  );
};
