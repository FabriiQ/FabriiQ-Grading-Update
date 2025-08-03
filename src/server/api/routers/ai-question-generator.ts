/**
 * AI Question Generator tRPC Router
 * 
 * Provides server-side endpoints for AI question generation and question bank integration
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { aiQuestionGeneratorService } from '@/features/ai-question-generator/services/ai-question-generator.service';
import { activityAIGeneratorService } from '@/features/ai-question-generator/services/activity-ai-generator.service';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Input validation schemas
const questionGenerationSchema = z.object({
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  learningOutcomes: z.array(z.string()).min(1, 'At least one learning outcome is required'),
  bloomsLevel: z.enum([BloomsTaxonomyLevel.REMEMBER, BloomsTaxonomyLevel.UNDERSTAND, BloomsTaxonomyLevel.APPLY, BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE, BloomsTaxonomyLevel.CREATE]),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
  questionCount: z.number().min(1).max(50),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank', 'matching']).optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  customPrompt: z.string().optional(),
});

const activityContentGenerationSchema = z.object({
  activityType: z.string(),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  learningOutcomes: z.array(z.string()).min(1, 'At least one learning outcome is required'),
  bloomsLevel: z.enum([BloomsTaxonomyLevel.REMEMBER, BloomsTaxonomyLevel.UNDERSTAND, BloomsTaxonomyLevel.APPLY, BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE, BloomsTaxonomyLevel.CREATE]),
  actionVerbs: z.array(z.string()).min(1, 'At least one action verb is required'),
  itemCount: z.number().min(1).max(20),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  customPrompt: z.string().optional(),
});

const addToQuestionBankSchema = z.object({
  questionBankId: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.string(),
    bloomsLevel: z.string(),
    topic: z.string(),
    learningOutcome: z.string(),
    actionVerb: z.string(),
    difficulty: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
    points: z.number().optional(),
  })),
});

export const aiQuestionGeneratorRouter = createTRPCRouter({
  /**
   * Generate activity content using AI
   */
  generateActivityContent: protectedProcedure
    .input(activityContentGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to generate activity content',
          });
        }

        // Call the activity AI service
        const response = await activityAIGeneratorService.generateActivityContent({
          activityType: input.activityType,
          topics: input.topics,
          learningOutcomes: input.learningOutcomes,
          bloomsLevel: input.bloomsLevel as BloomsTaxonomyLevel,
          actionVerbs: input.actionVerbs,
          itemCount: input.itemCount,
          difficultyLevel: input.difficultyLevel,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          customPrompt: input.customPrompt,
        });

        return response;
      } catch (error) {
        console.error('Error generating activity content:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate activity content',
        });
      }
    }),

  /**
   * Generate questions using AI
   */
  generateQuestions: protectedProcedure
    .input(questionGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to generate questions',
          });
        }

        // Call the AI service
        const response = await aiQuestionGeneratorService.generateQuestions({
          topics: input.topics,
          learningOutcomes: input.learningOutcomes,
          bloomsLevel: input.bloomsLevel as BloomsTaxonomyLevel,
          actionVerbs: input.actionVerbs,
          questionCount: input.questionCount,
          questionType: input.questionType,
          difficultyLevel: input.difficultyLevel,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          customPrompt: input.customPrompt,
        });

        // Log the generation for analytics (commented out until schema is updated)
        // await ctx.prisma.aiUsageLog.create({
        //   data: {
        //     userId: ctx.session.user.id,
        //     feature: 'question-generation',
        //     inputTokens: JSON.stringify(input).length, // Approximate
        //     outputTokens: JSON.stringify(response.questions).length, // Approximate
        //     model: response.metadata.model,
        //     generationTime: response.metadata.generationTime,
        //     metadata: {
        //       questionCount: response.questions.length,
        //       bloomsLevel: input.bloomsLevel,
        //       questionType: input.questionType || 'multiple-choice',
        //     },
        //   },
        // }).catch((error) => {
        //   // Log error but don't fail the request
        //   console.error('Failed to log AI usage:', error);
        // });

        return response;
      } catch (error) {
        console.error('Error generating questions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate questions',
        });
      }
    }),

  /**
   * Add generated questions to question bank
   */
  addToQuestionBank: protectedProcedure
    .input(addToQuestionBankSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to add questions to question bank',
          });
        }

        // Verify the question bank exists and user has access
        const questionBank = await ctx.prisma.questionBank.findUnique({
          where: { id: input.questionBankId },
        });

        if (!questionBank) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Question bank not found',
          });
        }

        // TODO: Add proper access control check based on institution membership

        // Convert and add questions to the question bank
        const createdQuestions = await Promise.all(
          input.questions.map(async (q) => {
            // Create question content based on type
            const content = {
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            };

            return await ctx.prisma.question.create({
              data: {
                questionBankId: input.questionBankId,
                title: q.question.substring(0, 100), // Use first 100 chars as title
                questionType: q.type.toUpperCase().replace('-', '_') as any,
                difficulty: q.difficulty.toUpperCase() as any,
                content: content,
                bloomsLevel: q.bloomsLevel as any,
                subjectId: 'default-subject', // TODO: Get from context
                metadata: {
                  topic: q.topic,
                  learningOutcome: q.learningOutcome,
                  actionVerb: q.actionVerb,
                  aiGenerated: true,
                  generatedAt: new Date().toISOString(),
                  points: q.points || 1,
                },
                createdById: ctx.session.user.id,
                partitionKey: `qb_${input.questionBankId}`,
              },
            });
          })
        );

        return {
          success: true,
          questionsAdded: createdQuestions.length,
          questions: createdQuestions,
        };
      } catch (error) {
        console.error('Error adding questions to question bank:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add questions to question bank',
        });
      }
    }),

  /**
   * Get available question banks for the current user
   */
  getAvailableQuestionBanks: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view question banks',
          });
        }

        // Get question banks the user has access to
        const questionBanks = await ctx.prisma.questionBank.findMany({
          where: {
            status: 'ACTIVE',
            // TODO: Add proper institution-based filtering
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return questionBanks;
      } catch (error) {
        console.error('Error fetching question banks:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch question banks',
        });
      }
    }),

  /**
   * Get questions from question bank with filters
   */
  getQuestionsFromBank: protectedProcedure
    .input(z.object({
      questionBankId: z.string(),
      filters: z.object({
        type: z.string().optional(),
        difficulty: z.string().optional(),
        bloomsLevel: z.string().optional(),
        topic: z.string().optional(),
      }).optional(),
      pagination: z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view questions',
          });
        }

        const { questionBankId, filters = {}, pagination = { page: 1, pageSize: 20 } } = input;

        // Build where clause
        const where: any = {
          questionBankId,
          status: 'ACTIVE',
          // TODO: Add proper access control
        };

        if (filters.type) {
          where.type = filters.type.toUpperCase();
        }
        if (filters.difficulty) {
          where.difficulty = filters.difficulty.toUpperCase();
        }
        if (filters.bloomsLevel) {
          where.bloomsLevel = filters.bloomsLevel.toUpperCase();
        }
        if (filters.topic) {
          where.metadata = {
            path: ['topic'],
            string_contains: filters.topic,
          };
        }

        // Get questions with pagination
        const [questions, totalCount] = await Promise.all([
          ctx.prisma.question.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            skip: (pagination.page - 1) * pagination.pageSize,
            take: pagination.pageSize,
          }),
          ctx.prisma.question.count({ where }),
        ]);

        return {
          questions,
          pagination: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pagination.pageSize),
          },
        };
      } catch (error) {
        console.error('Error fetching questions from bank:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch questions from question bank',
        });
      }
    }),
});
