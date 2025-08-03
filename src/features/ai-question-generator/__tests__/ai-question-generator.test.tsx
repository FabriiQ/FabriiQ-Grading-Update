/**
 * AI Question Generator Tests
 * 
 * Comprehensive tests for the AI question generation functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIQuestionGeneratorButton } from '../components/AIQuestionGeneratorButton';
import { GeneratedQuestionsManager } from '../components/GeneratedQuestionsManager';
import { aiQuestionGeneratorService } from '../services/ai-question-generator.service';

// Mock the service
jest.mock('../services/ai-question-generator.service');
const mockService = aiQuestionGeneratorService as jest.Mocked<typeof aiQuestionGeneratorService>;

// Mock tRPC
jest.mock('@/trpc/react', () => ({
  api: {
    aiQuestionGenerator: {
      generateQuestions: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        }),
      },
      getAvailableQuestionBanks: {
        useQuery: () => ({
          data: [
            { id: 'bank1', name: 'Math Question Bank', _count: { questions: 50 } },
            { id: 'bank2', name: 'Science Question Bank', _count: { questions: 75 } },
          ],
        }),
      },
      addToQuestionBank: {
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

describe('AIQuestionGeneratorButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the AI question generator button', () => {
    render(
      <AIQuestionGeneratorButton
        selectedTopics={['Mathematics']}
        selectedLearningOutcomes={['Solve linear equations']}
        selectedBloomsLevel="Apply"
        selectedActionVerbs={['solve', 'calculate']}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Generate Questions with AI')).toBeInTheDocument();
  });

  it('opens the accordion when clicked', async () => {
    render(
      <AIQuestionGeneratorButton
        selectedTopics={['Mathematics']}
        selectedLearningOutcomes={['Solve linear equations']}
        selectedBloomsLevel="Apply"
        selectedActionVerbs={['solve', 'calculate']}
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByText('Generate Questions with AI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('AI Question Generator')).toBeInTheDocument();
    });
  });

  it('pre-fills form with provided context data', async () => {
    render(
      <AIQuestionGeneratorButton
        selectedTopics={['Mathematics', 'Algebra']}
        selectedLearningOutcomes={['Solve linear equations', 'Graph functions']}
        selectedBloomsLevel="Apply"
        selectedActionVerbs={['solve', 'calculate', 'graph']}
        subject="Mathematics"
        gradeLevel="Grade 9"
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByText('Generate Questions with AI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Algebra')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Solve linear equations')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Graph functions')).toBeInTheDocument();
    });
  });

  it('validates required fields before generation', async () => {
    const mockToast = jest.fn();
    jest.mocked(require('@/components/ui/feedback/toast').useToast).mockReturnValue({
      toast: mockToast,
    });

    render(
      <AIQuestionGeneratorButton
        selectedTopics={[]}
        selectedLearningOutcomes={[]}
        selectedBloomsLevel="Apply"
        selectedActionVerbs={[]}
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByText('Generate Questions with AI');
    fireEvent.click(button);

    await waitFor(() => {
      const generateButton = screen.getByText(/Generate \d+ Questions/);
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'At least one topic is required',
        variant: 'error',
      });
    });
  });

  it('calls onQuestionsGenerated when questions are successfully generated', async () => {
    const mockOnQuestionsGenerated = jest.fn();
    const mockMutateAsync = jest.fn().mockResolvedValue({
      questions: [
        {
          id: 'q1',
          question: 'What is 2 + 2?',
          type: 'multiple-choice',
          bloomsLevel: 'Remember',
          topic: 'Mathematics',
          learningOutcome: 'Basic arithmetic',
          actionVerb: 'calculate',
          difficulty: 'easy',
          options: ['2', '3', '4', '5'],
          correctAnswer: '4',
          explanation: '2 + 2 equals 4',
          points: 1,
        },
      ],
      metadata: {
        totalGenerated: 1,
        requestedCount: 1,
        generationTime: 1500,
        model: 'gemini-2.0-flash',
      },
    });

    jest.mocked(require('@/trpc/react').api.aiQuestionGenerator.generateQuestions.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
    });

    render(
      <AIQuestionGeneratorButton
        selectedTopics={['Mathematics']}
        selectedLearningOutcomes={['Basic arithmetic']}
        selectedBloomsLevel="Remember"
        selectedActionVerbs={['calculate']}
        onQuestionsGenerated={mockOnQuestionsGenerated}
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByText('Generate Questions with AI');
    fireEvent.click(button);

    await waitFor(() => {
      const generateButton = screen.getByText(/Generate \d+ Questions/);
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockOnQuestionsGenerated).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'q1',
          question: 'What is 2 + 2?',
          type: 'multiple-choice',
        }),
      ]);
    });
  });
});

describe('GeneratedQuestionsManager', () => {
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is the capital of France?',
      type: 'multiple-choice',
      bloomsLevel: 'Remember',
      topic: 'Geography',
      learningOutcome: 'Identify world capitals',
      actionVerb: 'identify',
      difficulty: 'easy',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      points: 1,
    },
    {
      id: 'q2',
      question: 'Explain the water cycle.',
      type: 'essay',
      bloomsLevel: 'Understand',
      topic: 'Science',
      learningOutcome: 'Understand natural processes',
      actionVerb: 'explain',
      difficulty: 'medium',
      correctAnswer: 'The water cycle involves evaporation, condensation, and precipitation.',
      explanation: 'This tests understanding of the water cycle process.',
      points: 5,
    },
  ];

  it('renders the questions manager with questions', () => {
    render(
      <GeneratedQuestionsManager
        questions={mockQuestions}
        showQuestionBankOption={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Generated Questions (2)')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Explain the water cycle.')).toBeInTheDocument();
  });

  it('allows selecting and deselecting questions', () => {
    render(
      <GeneratedQuestionsManager
        questions={mockQuestions}
        showQuestionBankOption={true}
      />,
      { wrapper: createWrapper() }
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstQuestionCheckbox = checkboxes[1]; // Skip "Select All" checkbox

    fireEvent.click(firstQuestionCheckbox);
    expect(firstQuestionCheckbox).toBeChecked();

    fireEvent.click(firstQuestionCheckbox);
    expect(firstQuestionCheckbox).not.toBeChecked();
  });

  it('shows question bank selector when questions are selected', async () => {
    render(
      <GeneratedQuestionsManager
        questions={mockQuestions}
        showQuestionBankOption={true}
      />,
      { wrapper: createWrapper() }
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstQuestionCheckbox = checkboxes[1];

    fireEvent.click(firstQuestionCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Select Question Bank')).toBeInTheDocument();
      expect(screen.getByText('Add to Bank')).toBeInTheDocument();
      expect(screen.getByText('Create Questions')).toBeInTheDocument();
    });
  });

  it('calls onCreateNewQuestions when create button is clicked', () => {
    const mockOnCreateNewQuestions = jest.fn();

    render(
      <GeneratedQuestionsManager
        questions={mockQuestions}
        onCreateNewQuestions={mockOnCreateNewQuestions}
        showQuestionBankOption={true}
      />,
      { wrapper: createWrapper() }
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstQuestionCheckbox = checkboxes[1];

    fireEvent.click(firstQuestionCheckbox);

    const createButton = screen.getByText('Create Questions');
    fireEvent.click(createButton);

    expect(mockOnCreateNewQuestions).toHaveBeenCalledWith([mockQuestions[0]]);
  });

  it('shows empty state when no questions are provided', () => {
    render(
      <GeneratedQuestionsManager
        questions={[]}
        showQuestionBankOption={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No questions generated yet. Use the AI Question Generator to create questions.')).toBeInTheDocument();
  });
});

describe('AI Question Generator Integration', () => {
  it('integrates properly with assessment creators', () => {
    // This would test the integration with ProductionAssessmentCreator
    // For now, we'll just verify the components can be imported and used together
    expect(AIQuestionGeneratorButton).toBeDefined();
    expect(GeneratedQuestionsManager).toBeDefined();
  });

  it('integrates properly with activity creators', () => {
    // This would test the integration with MultipleChoiceEditor
    // For now, we'll just verify the components can be imported and used together
    expect(AIQuestionGeneratorButton).toBeDefined();
    expect(GeneratedQuestionsManager).toBeDefined();
  });
});
