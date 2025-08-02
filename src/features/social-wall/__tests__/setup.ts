/**
 * Test Setup for Social Wall
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { server } from './mocks/server';

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.TEST_DATABASE_URL = 'file:./test.db';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Global test utilities
export const createMockPost = (overrides = {}) => ({
  id: 'post_123',
  content: 'Test post content',
  contentType: 'TEXT',
  mediaUrls: [],
  metadata: {},
  postType: 'REGULAR',
  status: 'ACTIVE',
  classId: 'class_123',
  authorId: 'author_123',
  commentCount: 0,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    id: 'author_123',
    name: 'Test Author',
    userType: 'TEACHER',
    avatar: null,
  },
  reactions: [],
  userReaction: undefined,
  userTagged: false,
  taggedUsers: [],
  ...overrides,
});

export const createMockComment = (overrides = {}) => ({
  id: 'comment_123',
  content: 'Test comment content',
  postId: 'post_123',
  authorId: 'author_123',
  parentId: null,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    id: 'author_123',
    name: 'Test Author',
    userType: 'STUDENT',
    avatar: null,
  },
  reactions: [],
  userReaction: undefined,
  replies: [],
  taggedUsers: [],
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
    userType: 'STUDENT',
    username: 'testuser',
    primaryCampusId: 'campus_123',
    ...overrides.user,
  },
  expires: '2024-12-31',
  ...overrides,
});

export const createMockReaction = (type = 'LIKE', count = 1) => ({
  type,
  count,
  users: Array.from({ length: count }, (_, i) => ({
    id: `user_${i}`,
    name: `User ${i}`,
    userType: 'STUDENT',
    avatar: null,
  })),
});

// Test data factories
export const TestDataFactory = {
  post: createMockPost,
  comment: createMockComment,
  session: createMockSession,
  reaction: createMockReaction,
  
  // Create a complete post with engagement
  postWithEngagement: (overrides = {}) => createMockPost({
    reactions: [
      createMockReaction('LIKE', 3),
      createMockReaction('LOVE', 1),
    ],
    commentCount: 5,
    userReaction: 'LIKE',
    taggedUsers: [
      {
        id: 'tagged_user_1',
        name: 'Tagged User',
        userType: 'STUDENT',
        avatar: null,
      },
    ],
    ...overrides,
  }),
  
  // Create a teacher session
  teacherSession: (overrides = {}) => createMockSession({
    user: {
      userType: 'TEACHER',
      ...overrides.user,
    },
    ...overrides,
  }),
  
  // Create a student session
  studentSession: (overrides = {}) => createMockSession({
    user: {
      userType: 'STUDENT',
      ...overrides.user,
    },
    ...overrides,
  }),
};
