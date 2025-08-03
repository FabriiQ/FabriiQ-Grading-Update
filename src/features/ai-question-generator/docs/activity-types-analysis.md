# Activity Types Analysis

## Complete List of Activity Types

Based on the codebase analysis, here are all the activity types available in the system:

### 1. Assessment Activities (Question-Based)

#### Multiple Choice
- **Model**: `src/features/activties/models/multiple-choice.ts`
- **Editor**: `src/features/activties/components/multiple-choice/MultipleChoiceEditor.tsx`
- **Schema**: MultipleChoiceActivity with questions array
- **AI Generation Needs**: Questions with options, correct answers, explanations

#### True/False
- **Model**: `src/features/activties/models/true-false.ts`
- **Editor**: `src/features/activties/components/true-false/TrueFalseEditor.tsx`
- **Schema**: TrueFalseActivity with boolean questions
- **AI Generation Needs**: True/false statements with explanations

#### Multiple Response
- **Model**: `src/features/activties/models/multiple-response.ts`
- **Editor**: `src/features/activties/components/multiple-response/MultipleResponseEditor.tsx`
- **Schema**: MultipleResponseActivity with multiple correct answers
- **AI Generation Needs**: Questions with multiple correct options

#### Fill in the Blanks
- **Model**: `src/features/activties/models/fill-in-the-blanks.ts`
- **Editor**: `src/features/activties/components/fill-in-the-blanks/FillInTheBlanksEditor.tsx`
- **Schema**: FillInTheBlanksActivity with text and blanks
- **AI Generation Needs**: Text passages with strategic blanks and answers

#### Matching
- **Model**: `src/features/activties/models/matching.ts`
- **Editor**: `src/features/activties/components/matching/MatchingEditor.tsx`
- **Schema**: MatchingActivity with pairs to match
- **AI Generation Needs**: Related pairs of items to match

#### Sequence/Ordering
- **Model**: `src/features/activties/models/sequence.ts`
- **Editor**: `src/features/activties/components/sequence/SequenceEditor.tsx`
- **Schema**: SequenceActivity with items to order
- **AI Generation Needs**: Items that need to be arranged in correct order

#### Numeric
- **Model**: `src/features/activties/models/numeric.ts`
- **Editor**: `src/features/activties/components/numeric/NumericEditor.tsx`
- **Schema**: NumericActivity with numerical answers
- **AI Generation Needs**: Math problems with numerical solutions

#### Essay
- **Model**: `src/features/activties/models/essay.ts`
- **Editor**: `src/features/activties/components/essay/EssayEditor.tsx`
- **Schema**: EssayActivity with prompts and rubrics
- **AI Generation Needs**: Essay prompts, rubrics, sample answers

### 2. Interactive Activities

#### Drag and Drop
- **Model**: `src/features/activties/models/drag-and-drop.ts`
- **Editor**: `src/features/activties/components/drag-and-drop/DragAndDropEditor.tsx`
- **Schema**: DragAndDropActivity with draggable items and drop zones
- **AI Generation Needs**: Items to drag and appropriate drop zones

#### Drag the Words
- **Model**: `src/features/activties/models/drag-the-words.ts`
- **Editor**: `src/features/activties/components/drag-the-words/DragTheWordsEditor.tsx`
- **Schema**: DragTheWordsActivity with text and draggable words
- **AI Generation Needs**: Text with missing words and word bank

#### Flash Cards
- **Model**: `src/features/activties/models/flash-cards.ts`
- **Editor**: `src/features/activties/components/flash-cards/FlashCardsEditor.tsx`
- **Schema**: FlashCardsActivity with front/back card pairs
- **AI Generation Needs**: Question/answer or term/definition pairs

### 3. Content Activities

#### Reading
- **Model**: `src/features/activties/models/reading.ts`
- **Editor**: `src/features/activties/components/reading/ReadingEditor.tsx`
- **Schema**: ReadingActivity with text content and comprehension questions
- **AI Generation Needs**: Reading passages and comprehension questions

#### Video
- **Model**: `src/features/activties/models/video.ts`
- **Editor**: `src/features/activties/components/video/VideoEditor.tsx`
- **Schema**: VideoActivity with video content and questions
- **AI Generation Needs**: Video-related questions and discussion prompts

#### Book
- **Model**: `src/features/activties/models/book.ts`
- **Editor**: `src/features/activties/components/book/BookEditor.tsx`
- **Schema**: BookActivity with book content
- **AI Generation Needs**: Book-related questions and activities

### 4. Composite Activities

#### Quiz
- **Model**: `src/features/activties/models/quiz.ts`
- **Editor**: `src/features/activties/components/quiz/QuizEditor.tsx`
- **Schema**: QuizActivity with mixed question types
- **AI Generation Needs**: Mixed question types in a single quiz

#### Manual Grading
- **Model**: `src/features/activties/models/manual-grading.ts`
- **Editor**: `src/features/activties/components/activity-creators/ManualGradingCreator.tsx`
- **Schema**: ManualGradingActivity with open-ended tasks
- **AI Generation Needs**: Open-ended tasks and grading rubrics

## Activity Schema Patterns

### Common Base Schema
All activities extend from a base schema with:
- `id`: string
- `title`: string
- `description`: string
- `instructions`: string
- `settings`: object with configuration
- `metadata`: object with additional info

### Activity-Specific Content
Each activity type has specific content structure:
- **Questions-based**: Array of questions with type-specific properties
- **Content-based**: Content object with media and text
- **Interactive**: Items and interaction rules

### AI Generation Requirements by Type

#### Question-Based Activities
- Need question text generation
- Need options/answers generation
- Need explanations and feedback
- Need difficulty and Bloom's level alignment

#### Interactive Activities
- Need item generation (drag items, drop zones)
- Need interaction rules
- Need feedback for correct/incorrect interactions

#### Content Activities
- Need content generation (text, prompts)
- Need related questions
- Need discussion points

## Implementation Strategy

### 1. Activity-Specific AI Generators
Create specialized AI generators for each activity type that understand:
- The specific schema requirements
- The educational purpose of each type
- The content structure needed

### 2. Schema-Aware Generation
Each generator should:
- Validate against the activity's schema
- Generate content in the exact format expected
- Include all required fields and properties

### 3. Integration Points
- Each activity editor needs AI button integration
- Each generator needs to populate the editor with generated content
- Content should be immediately usable without manual formatting

## Next Steps

1. Create activity-specific AI generators for each type
2. Integrate AI buttons into all activity editors
3. Implement schema-compliant content generation
4. Test with real activity schemas to ensure compatibility
