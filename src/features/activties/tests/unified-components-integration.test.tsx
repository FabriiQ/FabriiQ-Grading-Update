/**
 * Integration tests for unified activity and assessment components
 * Tests the complete workflow from creation to grading
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedActivityCreator } from '../components/UnifiedActivityCreator';
import { UnifiedAssessmentCreator } from '@/components/teacher/assessments/UnifiedAssessmentCreator';
import { StandardizedActivityConfig, ActivityConfigSummary } from '../components/ui/StandardizedActivityConfig';
import { ActivityConfiguration } from '../components/ui/StandardizedActivityConfig';

// Mock tRPC
jest.mock('@/trpc/react', () => ({
  api: {
    activity: {
      create: {
        useMutation: () => ({
          mutateAsync: jest.fn().mockResolvedValue({ id: 'test-activity' }),
          isLoading: false,
        }),
      },
    },
    assessment: {
      create: {
        useMutation: () => ({
          mutateAsync: jest.fn().mockResolvedValue({ id: 'test-assessment' }),
          isLoading: false,
        }),
      },
    },
    subject: {
      getByClass: {
        useQuery: () => ({
          data: [
            { id: 'subject-1', name: 'Mathematics' },
            { id: 'subject-2', name: 'Science' },
          ],
        }),
      },
    },
    topic: {
      getBySubject: {
        useQuery: () => ({
          data: [
            { id: 'topic-1', name: 'Algebra' },
            { id: 'topic-2', name: 'Geometry' },
          ],
        }),
      },
    },
  },
}));

// Mock toast
jest.mock('@/components/ui/feedback/toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Unified Components Integration Tests', () => {
  describe('UnifiedActivityCreator', () => {
    it('should render activity creator with all required fields', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <UnifiedActivityCreator
            activityTypeId="multiple-choice"
            classId="class-1"
            subjectId="subject-1"
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Check for basic form fields
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();

      // Check for action buttons
      expect(screen.getByRole('button', { name: /create activity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle form submission correctly', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <UnifiedActivityCreator
            activityTypeId="quiz"
            classId="class-1"
            subjectId="subject-1"
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Activity' },
      });

      fireEvent.change(screen.getByLabelText(/duration/i), {
        target: { value: '30' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create activity/i }));

      // Wait for success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle cancellation correctly', () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <UnifiedActivityCreator
            activityTypeId="essay"
            classId="class-1"
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('UnifiedAssessmentCreator', () => {
    it('should render assessment creator with required fields', () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <UnifiedAssessmentCreator
            classId="class-1"
            mode="create"
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Check for basic form elements
      expect(screen.getByText(/create assessment/i)).toBeInTheDocument();
    });

    it('should handle edit mode correctly', () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <UnifiedAssessmentCreator
            classId="class-1"
            mode="edit"
            assessmentId="assessment-1"
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Should show edit-specific UI
      expect(screen.getByText(/edit assessment/i)).toBeInTheDocument();
    });
  });

  describe('StandardizedActivityConfig', () => {
    const mockConfiguration: ActivityConfiguration = {
      title: 'Test Activity',
      description: 'Test Description',
      instructions: 'Test Instructions',
      subject: 'Mathematics',
      topic: 'Algebra',
      bloomsLevel: 'Apply',
      activityType: 'multiple-choice',
      gradingType: 'automatic',
      maxScore: 100,
      passingScore: 60,
      timeLimit: 30,
      maxAttempts: 3,
      dueDate: new Date('2024-12-31'),
      allowLateSubmissions: true,
      allowFileUpload: false,
      allowTextSubmission: true,
      showRubricToStudents: true,
      randomizeQuestions: false,
      isPublished: true,
    };

    it('should render activity configuration correctly', () => {
      render(
        <StandardizedActivityConfig
          configuration={mockConfiguration}
          mode="view"
        />
      );

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Algebra')).toBeInTheDocument();
    });

    it('should render in edit mode', () => {
      const mockOnChange = jest.fn();

      render(
        <StandardizedActivityConfig
          configuration={mockConfiguration}
          mode="edit"
          onChange={mockOnChange}
        />
      );

      // Should show editable fields
      expect(screen.getByDisplayValue('Test Activity')).toBeInTheDocument();
    });
  });

  describe('ActivityConfigSummary', () => {
    const mockConfiguration: ActivityConfiguration = {
      title: 'Summary Test Activity',
      description: 'Summary Description',
      instructions: 'Summary Instructions',
      subject: 'Science',
      bloomsLevel: 'Remember',
      activityType: 'quiz',
      gradingType: 'manual',
      maxScore: 50,
      passingScore: 30,
      isPublished: false,
    };

    it('should render activity summary correctly', () => {
      render(
        <ActivityConfigSummary configuration={mockConfiguration} />
      );

      expect(screen.getByText('Summary Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText(/50 points/i)).toBeInTheDocument();
    });

    it('should show published status correctly', () => {
      const publishedConfig = { ...mockConfiguration, isPublished: true };

      render(
        <ActivityConfigSummary configuration={publishedConfig} />
      );

      expect(screen.getByText(/published/i)).toBeInTheDocument();
    });
  });

  describe('Workflow Integration', () => {
    it('should complete activity creation workflow', async () => {
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <UnifiedActivityCreator
            activityTypeId="reading"
            classId="class-1"
            subjectId="subject-1"
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Reading Comprehension' },
      });

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Read the passage and answer questions' },
      });

      // Enable grading
      const gradingSwitch = screen.getByRole('switch');
      fireEvent.click(gradingSwitch);

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create activity/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle error states gracefully', () => {
      render(
        <TestWrapper>
          <UnifiedActivityCreator
            activityTypeId="invalid-type"
            classId="class-1"
          />
        </TestWrapper>
      );

      // Should show error message for invalid activity type
      expect(screen.getByText(/error loading activity type/i)).toBeInTheDocument();
    });
  });
});
