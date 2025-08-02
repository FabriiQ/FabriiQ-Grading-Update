'use client';

/**
 * Question Bank Models
 *
 * This file contains the data models for the question bank feature.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns
 * 4. Extensible - Easy to add new question types
 */

import { QuestionType, DifficultyLevel, QuestionSourceType, SystemStatus, BloomsTaxonomyLevel } from '@prisma/client';

// Re-export Prisma enums for convenience
export { QuestionType, DifficultyLevel, QuestionSourceType, SystemStatus };

// Base interfaces
export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string;
}

export interface Question {
  id: string;
  questionBankId: string;
  title: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  content: QuestionContent;
  metadata?: Record<string, any>;
  status: SystemStatus;

  // Academic context
  courseId?: string;
  subjectId: string;
  topicId?: string;
  gradeLevel?: number;

  // Source tracking
  sourceId?: string;
  sourceReference?: string;
  year?: number;           // Year of the question (especially for past papers)

  // ✅ NEW: Bloom's Taxonomy Integration
  bloomsLevel?: BloomsTaxonomyLevel;
  learningOutcomeIds?: string[];

  // Audit fields
  createdById: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  partitionKey: string;

  // Versioning
  versions?: QuestionVersion[];
}

// Question version for tracking changes
export interface QuestionVersion {
  id: string;
  questionId: string;
  versionNumber: number;
  content: QuestionContent;
  createdById: string;
  createdAt: Date;
  reason?: string;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  questionBankId: string;
  parentId?: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionUsageStats {
  id: string;
  questionId: string;
  usageCount: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  averageTime?: number;
  difficultyRating?: number;
  lastUsedAt?: Date;
  updatedAt: Date;
}

export interface QuestionSource {
  id: string;
  name: string;
  description?: string;
  type: QuestionSourceType;
  metadata?: Record<string, any>;
  institutionId: string;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Media types
export interface QuestionMedia {
  type: 'image' | 'video' | 'audio' | 'text';
  url?: string;
  content?: string;
  alt?: string;
  caption?: string;
}

// Question content types
export type QuestionContent =
  | MultipleChoiceContent
  | TrueFalseContent
  | MultipleResponseContent
  | FillInTheBlanksContent
  | MatchingContent
  | DragAndDropContent
  | DragTheWordsContent
  | NumericContent
  | SequenceContent
  | FlashCardsContent
  | ReadingContent
  | VideoContent
  | ShortAnswerContent
  | EssayContent
  | HotspotContent
  | LikertScaleContent;

// Multiple Choice
export interface MultipleChoiceContent {
  text: string;
  options: MultipleChoiceOption[];
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

// True/False
export interface TrueFalseContent {
  text: string;
  isTrue: boolean;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

// Multiple Response
export interface MultipleResponseContent {
  text: string;
  options: MultipleResponseOption[];
  minCorrectOptions?: number;
  maxCorrectOptions?: number;
  partialCredit?: boolean;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface MultipleResponseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

// Fill in the Blanks
export interface FillInTheBlanksContent {
  text: string;
  blanks: FillInTheBlankBlank[];
  caseSensitive?: boolean;
  partialCredit?: boolean;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface FillInTheBlankBlank {
  id: string;
  correctAnswers: string[];
  feedback?: string;
}

// Matching
export interface MatchingContent {
  text: string;
  pairs: MatchingPair[];
  partialCredit?: boolean;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  feedback?: string;
}

// Drag and Drop
export interface DragAndDropContent {
  text: string;
  items: DragAndDropItem[];
  zones: DropZone[];
  backgroundImage?: string;
  explanation?: string;
  hint?: string;
}

export interface DragAndDropItem {
  id: string;
  text: string;
  correctZoneId: string;
  feedback?: string;
}

export interface DropZone {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
}

// Drag the Words
export interface DragTheWordsContent {
  text: string;
  words: DraggableWord[];
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface DraggableWord {
  id: string;
  text: string;
  correctIndex: number;
  feedback?: string;
}

// Numeric
export interface NumericContent {
  text: string;
  correctAnswer: number;
  acceptableRange?: {
    min: number;
    max: number;
  };
  unit?: string;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

// Sequence
export interface SequenceContent {
  text: string;
  items: SequenceItem[];
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface SequenceItem {
  id: string;
  text: string;
  correctPosition: number;
  feedback?: string;
}

// Flash Cards
export interface FlashCardsContent {
  cards: FlashCard[];
  explanation?: string;
  hint?: string;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  media?: QuestionMedia;
}

// Reading
export interface ReadingContent {
  passage: string;
  questions: ReadingQuestion[];
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface ReadingQuestion {
  id: string;
  text: string;
  type: QuestionType;
  content: QuestionContent;
}

// Video
export interface VideoContent {
  videoUrl: string;
  questions: VideoQuestion[];
  explanation?: string;
  hint?: string;
}

export interface VideoQuestion {
  id: string;
  text: string;
  type: QuestionType;
  content: QuestionContent;
  timestamp: number; // In seconds
}

// Short Answer
export interface ShortAnswerContent {
  text: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

// Essay
export interface EssayContent {
  text: string;
  wordCountMin?: number;
  wordCountMax?: number;
  rubric?: EssayRubric;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface EssayRubric {
  criteria: EssayRubricCriterion[];
  totalPoints: number;
}

export interface EssayRubricCriterion {
  id: string;
  name: string;
  description: string;
  points: number;
  levels: EssayRubricLevel[];
}

export interface EssayRubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

// Hotspot
export interface HotspotContent {
  text: string;
  image: string;
  hotspots: Hotspot[];
  explanation?: string;
  hint?: string;
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCorrect: boolean;
  feedback?: string;
}

// Likert Scale
export interface LikertScaleContent {
  text: string;
  statements: LikertStatement[];
  scale: LikertScale;
  explanation?: string;
  hint?: string;
  media?: QuestionMedia;
}

export interface LikertStatement {
  id: string;
  text: string;
}

export interface LikertScale {
  min: number;
  max: number;
  labels: LikertScaleLabel[];
}

export interface LikertScaleLabel {
  value: number;
  label: string;
}

// Input types for API
export interface CreateQuestionBankInput {
  name: string;
  description?: string;
  institutionId: string;
}

export interface CreateQuestionInput {
  questionBankId: string;
  title: string;
  questionType: QuestionType;
  difficulty?: DifficultyLevel;
  content: QuestionContent;
  subjectId: string;
  courseId?: string;
  topicId?: string;
  gradeLevel?: number;
  sourceId?: string;
  sourceReference?: string;
  year?: number;           // Year of the question (especially for past papers)
  categoryIds?: string[];
  metadata?: Record<string, any>;

  // ✅ NEW: Bloom's Taxonomy Integration (Optional for backward compatibility)
  bloomsLevel?: BloomsTaxonomyLevel;
  learningOutcomeIds?: string[];
  actionVerbs?: string[];
}

export interface BulkUploadInput {
  questionBankId: string;
  questions: CreateQuestionInput[];
  validateOnly?: boolean;
}

export interface GetQuestionsInput {
  questionBankId: string;
  filters?: {
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    subjectId?: string;
    courseId?: string;
    topicId?: string;
    gradeLevel?: number;
    year?: number;
    categoryId?: string;
    search?: string;
    status?: SystemStatus | string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    field: 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'year';
    direction: 'asc' | 'desc';
  };
}

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createDefaultMultipleChoiceQuestion(): MultipleChoiceContent {
  return {
    text: 'New question',
    options: [
      { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
      { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
      { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
      { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
    ],
    explanation: 'Explanation for the correct answer.',
    hint: 'Think about the question carefully.'
  };
}

export function createDefaultTrueFalseQuestion(): TrueFalseContent {
  return {
    text: 'New true/false question',
    isTrue: true,
    explanation: 'Explanation for the correct answer.',
    hint: 'Think about whether the statement is factually correct.'
  };
}

// Add more default creators for other question types as needed
