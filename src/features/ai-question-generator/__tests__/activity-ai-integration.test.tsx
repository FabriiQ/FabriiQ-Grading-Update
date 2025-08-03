/**
 * Activity AI Integration Tests
 * 
 * Comprehensive tests for AI generation integration across all activity types
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIActivityGeneratorButton } from '../components/AIActivityGeneratorButton';
import { activityAIGeneratorService } from '../services/activity-ai-generator.service';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Mock the service
jest.mock('../services/activity-ai-generator.service');
const mockService = activityAIGeneratorService as jest.Mocked<typeof activityAIGeneratorService>;

// Mock tRPC
jest.mock('@/trpc/react', () => ({
  api: {
    aiQuestionGenerator: {
      generateActivityContent: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isLoading: false,
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Activity AI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multiple Choice Activity', () => {
    it('generates multiple choice questions with correct schema', async () => {
      const mockResponse = {
        content: {
          questions: [
            {
              id: 'q1',
              text: 'What is the capital of France?',
              options: [
                { id: 'opt1', text: 'London', isCorrect: false, feedback: 'Incorrect' },
                { id: 'opt2', text: 'Paris', isCorrect: true, feedback: 'Correct!' },
                { id: 'opt3', text: 'Berlin', isCorrect: false, feedback: 'Incorrect' },
                { id: 'opt4', text: 'Madrid', isCorrect: false, feedback: 'Incorrect' }
              ],
              explanation: 'Paris is the capital of France',
              hint: 'Think about French culture',
              points: 1
            }
          ]
        },
        metadata: {
          totalGenerated: 1,
          requestedCount: 1,
          generationTime: 1500,
          model: 'gemini-2.0-flash',
          bloomsLevel: BloomsTaxonomyLevel.REMEMBER
        }
      };

      const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse);
      jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateActivityContent.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const mockOnContentGenerated = jest.fn();

      render(
        <AIActivityGeneratorButton
          activityType="multiple-choice"
          selectedTopics={['Geography']}
          selectedLearningOutcomes={['Identify world capitals']}
          selectedBloomsLevel={BloomsTaxonomyLevel.REMEMBER}
          selectedActionVerbs={['identify', 'recall']}
          onContentGenerated={mockOnContentGenerated}
        />,
        { wrapper: createWrapper() }
      );

      // Open the generator
      const button = screen.getByText('Generate Multiple Choice Questions with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ Multiple Choice Questions/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          activityType: 'multiple-choice',
          topics: ['Geography'],
          learningOutcomes: ['Identify world capitals'],
          bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
          actionVerbs: ['identify', 'recall'],
          itemCount: 5,
          difficultyLevel: 'medium',
          subject: undefined,
          gradeLevel: undefined,
          customPrompt: undefined
        });

        expect(mockOnContentGenerated).toHaveBeenCalledWith(mockResponse.content);
      });
    });
  });

  describe('True/False Activity', () => {
    it('generates true/false statements with correct schema', async () => {
      const mockResponse = {
        content: {
          questions: [
            {
              id: 'tf1',
              text: 'The Earth is flat',
              isTrue: false,
              explanation: 'The Earth is actually spherical',
              hint: 'Think about satellite images',
              points: 1
            }
          ]
        },
        metadata: {
          totalGenerated: 1,
          requestedCount: 1,
          generationTime: 1200,
          model: 'gemini-2.0-flash',
          bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND
        }
      };

      const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse);
      jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateActivityContent.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const mockOnContentGenerated = jest.fn();

      render(
        <AIActivityGeneratorButton
          activityType="true-false"
          selectedTopics={['Science']}
          selectedLearningOutcomes={['Evaluate scientific statements']}
          selectedBloomsLevel={BloomsTaxonomyLevel.UNDERSTAND}
          selectedActionVerbs={['evaluate', 'assess']}
          onContentGenerated={mockOnContentGenerated}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByText('Generate True/False Statements with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ True\/False Statements/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnContentGenerated).toHaveBeenCalledWith(mockResponse.content);
      });
    });
  });

  describe('Fill in the Blanks Activity', () => {
    it('generates passages with blanks and correct answers', async () => {
      const mockResponse = {
        content: {
          passages: [
            {
              id: 'passage1',
              text: 'The _____ is the largest planet in our solar system.',
              blanks: [
                {
                  id: 'blank1',
                  position: 0,
                  correctAnswers: ['Jupiter'],
                  caseSensitive: false,
                  hint: 'It\'s a gas giant'
                }
              ],
              explanation: 'Jupiter is indeed the largest planet'
            }
          ]
        },
        metadata: {
          totalGenerated: 1,
          requestedCount: 1,
          generationTime: 1800,
          model: 'gemini-2.0-flash',
          bloomsLevel: BloomsTaxonomyLevel.REMEMBER
        }
      };

      const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse);
      jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateActivityContent.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const mockOnContentGenerated = jest.fn();

      render(
        <AIActivityGeneratorButton
          activityType="fill-in-the-blanks"
          selectedTopics={['Astronomy']}
          selectedLearningOutcomes={['Recall planetary facts']}
          selectedBloomsLevel={BloomsTaxonomyLevel.REMEMBER}
          selectedActionVerbs={['recall', 'identify']}
          onContentGenerated={mockOnContentGenerated}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByText('Generate Fill in the Blanks Passages with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ Fill in the Blanks Passages/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnContentGenerated).toHaveBeenCalledWith(mockResponse.content);
      });
    });
  });

  describe('Essay Activity', () => {
    it('generates essay prompts with rubrics', async () => {
      const mockResponse = {
        content: {
          prompts: [
            {
              id: 'essay1',
              title: 'Climate Change Analysis',
              prompt: 'Analyze the impact of climate change on global ecosystems',
              instructions: 'Write a comprehensive essay analyzing...',
              wordLimit: { min: 500, max: 1000 },
              timeLimit: 60,
              rubric: [
                {
                  criterion: 'Content Knowledge',
                  description: 'Demonstrates understanding of climate science',
                  points: 25,
                  levels: [
                    { name: 'Excellent', description: 'Comprehensive understanding', score: 25 },
                    { name: 'Good', description: 'Good understanding', score: 20 }
                  ]
                }
              ],
              sampleAnswer: 'Climate change affects ecosystems through...',
              keywordsConcepts: ['greenhouse gases', 'biodiversity', 'adaptation']
            }
          ]
        },
        metadata: {
          totalGenerated: 1,
          requestedCount: 1,
          generationTime: 2500,
          model: 'gemini-2.0-flash',
          bloomsLevel: BloomsTaxonomyLevel.ANALYZE
        }
      };

      const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse);
      jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateActivityContent.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const mockOnContentGenerated = jest.fn();

      render(
        <AIActivityGeneratorButton
          activityType="essay"
          selectedTopics={['Environmental Science']}
          selectedLearningOutcomes={['Analyze environmental issues']}
          selectedBloomsLevel={BloomsTaxonomyLevel.ANALYZE}
          selectedActionVerbs={['analyze', 'evaluate']}
          onContentGenerated={mockOnContentGenerated}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByText('Generate Essay Prompts with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ Essay Prompts/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnContentGenerated).toHaveBeenCalledWith(mockResponse.content);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('API Error'));
      jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateActivityContent.useMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      const mockOnError = jest.fn();
      const mockToast = jest.fn();
      jest.mocked(require('@/components/ui/feedback/toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      render(
        <AIActivityGeneratorButton
          activityType="multiple-choice"
          selectedTopics={['Test']}
          selectedLearningOutcomes={['Test']}
          selectedBloomsLevel={BloomsTaxonomyLevel.REMEMBER}
          selectedActionVerbs={['test']}
          onError={mockOnError}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByText('Generate Multiple Choice Questions with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ Multiple Choice Questions/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Generation Failed',
          description: 'API Error',
          variant: 'error'
        });
        expect(mockOnError).toHaveBeenCalledWith('API Error');
      });
    });
  });

  describe('Validation', () => {
    it('validates required fields before generation', async () => {
      const mockToast = jest.fn();
      jest.mocked(require('@/components/ui/feedback/toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      render(
        <AIActivityGeneratorButton
          activityType="multiple-choice"
          selectedTopics={[]}
          selectedLearningOutcomes={[]}
          selectedBloomsLevel={BloomsTaxonomyLevel.REMEMBER}
          selectedActionVerbs={[]}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByText('Generate Multiple Choice Questions with AI');
      fireEvent.click(button);

      await waitFor(() => {
        const generateButton = screen.getByText(/Generate \d+ Multiple Choice Questions/);
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Validation Error',
          description: 'At least one topic is required',
          variant: 'error'
        });
      });
    });
  });
});
