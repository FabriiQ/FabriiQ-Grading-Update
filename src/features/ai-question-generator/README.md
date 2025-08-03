# AI Question Generator

A comprehensive AI-powered question generation system that integrates with assessment and activity creators to automatically generate high-quality questions based on topics, learning outcomes, Bloom's taxonomy levels, and action verbs.

## Features

### 🤖 AI-Powered Generation
- Uses Google Gemini 2.0 Flash for intelligent question generation
- Supports multiple question types: multiple-choice, true/false, short-answer, essay, fill-in-the-blank, matching
- Context-aware generation based on educational parameters
- Real-time generation with progress feedback

### 📚 Educational Alignment
- **Bloom's Taxonomy Integration**: Generate questions aligned with specific cognitive levels
- **Learning Outcomes Mapping**: Questions directly assess specified learning outcomes
- **Action Verb Integration**: Uses pedagogically appropriate action verbs
- **Topic-Based Generation**: Focused questions on specific subject topics

### 🎯 Question Bank Integration
- Add generated questions directly to institutional question banks
- Browse and select from existing question banks
- Automatic categorization and tagging
- Bulk operations for efficient management

### 🔧 Creator Integration
- **Assessment Creator**: Seamlessly integrated into ProductionAssessmentCreator
- **Activity Creator**: Built into MultipleChoiceEditor and other activity editors
- **Context-Aware**: Pre-fills generation parameters from creator context
- **Real-Time Updates**: Generated questions immediately populate creators

## Architecture

### Components

#### AIQuestionGeneratorButton
The main interface component that provides:
- Collapsible accordion interface
- Form for generation parameters
- Real-time validation
- Progress indicators
- Error handling

```tsx
<AIQuestionGeneratorButton
  selectedTopics={['Mathematics', 'Algebra']}
  selectedLearningOutcomes={['Solve linear equations']}
  selectedBloomsLevel="Apply"
  selectedActionVerbs={['solve', 'calculate']}
  subject="Mathematics"
  gradeLevel="Grade 9"
  onQuestionsGenerated={handleQuestionsGenerated}
  onError={handleError}
/>
```

#### GeneratedQuestionsManager
Manages and displays generated questions:
- Question preview and editing
- Bulk selection and operations
- Question bank integration
- Answer visibility toggle
- Quality review interface

```tsx
<GeneratedQuestionsManager
  questions={generatedQuestions}
  onQuestionsUpdated={setGeneratedQuestions}
  onCreateNewQuestions={handleAddToCreator}
  onAddToQuestionBank={handleAddToBank}
  showQuestionBankOption={true}
/>
```

### Services

#### AIQuestionGeneratorService
Core service handling AI interactions:
- Google Gemini API integration
- Prompt engineering and optimization
- Response parsing and validation
- Error handling and retry logic

#### tRPC Router
Server-side API endpoints:
- `generateQuestions`: AI question generation
- `addToQuestionBank`: Question bank integration
- `getAvailableQuestionBanks`: Bank listing
- `getQuestionsFromBank`: Question retrieval

## Usage

### In Assessment Creators

```tsx
import { AIQuestionGeneratorButton, GeneratedQuestionsManager } from '@/features/ai-question-generator/components';

function AssessmentCreator() {
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showGenerated, setShowGenerated] = useState(false);

  const handleQuestionsGenerated = (questions) => {
    setGeneratedQuestions(questions);
    setShowGenerated(true);
  };

  const handleAddToAssessment = (selectedQuestions) => {
    // Convert and add to assessment
    const assessmentQuestions = selectedQuestions.map(convertToAssessmentFormat);
    addQuestionsToAssessment(assessmentQuestions);
    setShowGenerated(false);
  };

  return (
    <div>
      <AIQuestionGeneratorButton
        selectedTopics={getTopicsFromContext()}
        selectedLearningOutcomes={getLearningOutcomes()}
        selectedBloomsLevel={getBloomsLevel()}
        onQuestionsGenerated={handleQuestionsGenerated}
      />
      
      {showGenerated && (
        <GeneratedQuestionsManager
          questions={generatedQuestions}
          onCreateNewQuestions={handleAddToAssessment}
        />
      )}
    </div>
  );
}
```

### In Activity Creators

```tsx
import { AIQuestionGeneratorButton, GeneratedQuestionsManager } from '@/features/ai-question-generator/components';

function MultipleChoiceEditor({ activity, onChange }) {
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showGenerated, setShowGenerated] = useState(false);

  const handleAddToActivity = (selectedQuestions) => {
    const newQuestions = selectedQuestions.map(convertToActivityFormat);
    onChange({
      ...activity,
      questions: [...activity.questions, ...newQuestions]
    });
    setShowGenerated(false);
  };

  return (
    <div>
      <AIQuestionGeneratorButton
        selectedTopics={[activity.title]}
        selectedLearningOutcomes={[activity.description]}
        onQuestionsGenerated={setGeneratedQuestions}
      />
      
      {generatedQuestions.length > 0 && (
        <GeneratedQuestionsManager
          questions={generatedQuestions}
          onCreateNewQuestions={handleAddToActivity}
        />
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: AI Service Configuration
AI_GENERATION_TIMEOUT=30000
AI_MAX_RETRIES=3
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
```

### Database Schema

The system uses the following database models:

```sql
-- AI Usage Logging
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "model" TEXT,
    "generationTime" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);
```

## API Reference

### Generation Request

```typescript
interface QuestionGenerationRequest {
  topics: string[];
  learningOutcomes: string[];
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  questionCount: number;
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-blank' | 'matching';
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  subject?: string;
  gradeLevel?: string;
  customPrompt?: string;
}
```

### Generated Question Format

```typescript
interface GeneratedQuestion {
  id: string;
  question: string;
  type: string;
  bloomsLevel: BloomsTaxonomyLevel;
  topic: string;
  learningOutcome: string;
  actionVerb: string;
  difficulty: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
}
```

## Best Practices

### Question Quality
- Always review generated questions before use
- Verify alignment with learning outcomes
- Check for appropriate difficulty level
- Ensure cultural sensitivity and inclusivity

### Performance
- Use appropriate question counts (1-50)
- Implement proper loading states
- Handle errors gracefully
- Cache frequently used parameters

### Integration
- Pre-fill context from creators
- Provide clear feedback to users
- Maintain consistent UI patterns
- Support bulk operations

## Testing

Run the test suite:

```bash
npm test src/features/ai-question-generator
```

The tests cover:
- Component rendering and interaction
- Form validation and submission
- API integration and error handling
- Question management operations
- Integration with creators

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify GEMINI_API_KEY is set correctly
   - Check API key permissions and quotas
   - Ensure environment variables are loaded

2. **Generation Failures**
   - Check network connectivity
   - Verify input parameters are valid
   - Review error logs for specific issues

3. **Integration Problems**
   - Ensure proper component imports
   - Check tRPC router registration
   - Verify database schema is up to date

### Debug Mode

Enable debug logging:

```typescript
// In development
process.env.NODE_ENV === 'development' && console.log('AI Generation Debug:', data);
```

## Contributing

When contributing to the AI Question Generator:

1. Follow existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Ensure accessibility compliance

## License

This feature is part of the FabriiQ Social Wall project and follows the same licensing terms.
