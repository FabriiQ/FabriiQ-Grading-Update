/**
 * Teacher Assistant Router
 * Handles API routes for the Teacher Assistant feature
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import { TeacherAssistantService } from "@/features/teacher-assistant/services/teacher-assistant.service";

// Define input schemas
const assistantMessageSchema = z.object({
  message: z.string(),
  classId: z.string().optional(),
  courseId: z.string().optional(),
  context: z.string().optional(),
});

const teacherPreferenceSchema = z.object({
  category: z.string(),
  key: z.string(),
  value: z.any(),
  metadata: z.record(z.any()).optional(),
});

const searchQuerySchema = z.object({
  query: z.string(),
  filters: z.object({
    contentType: z.string().optional(),
    subject: z.string().optional(),
    gradeLevel: z.string().optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    limit: z.number().optional(),
  }).optional(),
});

// Initialize the Teacher Assistant Service
const teacherAssistantService = new TeacherAssistantService();

export const teacherAssistantRouter = createTRPCRouter({
  /**
   * Get a response from the teacher assistant
   */
  getAssistantResponse: protectedProcedure
    .input(assistantMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can use the Teacher Assistant",
          });
        }

        // Get teacher information for context
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            user: true,
            subjectQualifications: {
              include: { subject: true }
            }
          }
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get class information if classId is provided
        let classInfo: any = null;
        if (input.classId) {
          classInfo = await ctx.prisma.class.findUnique({
            where: { id: input.classId },
            include: {
              courseCampus: {
                include: {
                  course: {
                    include: {
                      subjects: true
                    }
                  }
                }
              }
            }
          });
        }

        // Parse context if provided
        let contextData = {};
        if (input.context) {
          try {
            contextData = JSON.parse(input.context);
          } catch (e) {
            console.error('Error parsing context:', e);
          }
        }

        // Build teacher context
        const teacherContext = {
          teacher: {
            id: teacher.id,
            name: teacher.user?.name || 'Teacher',
            subjects: teacher.subjectQualifications?.map(sq => ({
              id: sq.subject.id,
              name: sq.subject.name
            })) || []
          },
          currentClass: classInfo ? {
            id: classInfo.id,
            name: classInfo.name,
            subject: classInfo.courseCampus?.course?.subjects[0] ? {
              id: classInfo.courseCampus.course.subjects[0].id,
              name: classInfo.courseCampus.course.subjects[0].name
            } : undefined
          } : undefined,
          ...contextData
        };

        // Use the Teacher Assistant Service
        const response = await teacherAssistantService.generateResponse({
          message: input.message,
          context: teacherContext,
          classId: input.classId,
          courseId: input.courseId
        });

        // Log the interaction for analytics
        await ctx.prisma.teacherAssistantInteraction.create({
          data: {
            teacherId: teacher.id,
            message: input.message,
            response: response,
            classId: input.classId,
            courseId: input.courseId,
            metadata: {
              contextProvided: !!input.context,
              responseLength: response.length
            }
          }
        });

        return { response };
      } catch (error) {
        console.error('Error in getAssistantResponse:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get assistant response: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Save teacher preference
   */
  saveTeacherPreference: protectedProcedure
    .input(teacherPreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can save preferences",
          });
        }

        // Get teacher profile
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { userId: ctx.session.user.id }
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Upsert the preference
        const preference = await ctx.prisma.teacherPreference.upsert({
          where: {
            userId_category_key: {
              userId: ctx.session.user.id,
              category: input.category,
              key: input.key
            }
          },
          update: {
            value: input.value,
            metadata: input.metadata || {},
            updatedAt: new Date()
          },
          create: {
            userId: ctx.session.user.id,
            category: input.category,
            key: input.key,
            value: input.value,
            metadata: input.metadata || {}
          }
        });

        return preference;
      } catch (error) {
        console.error('Error in saveTeacherPreference:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save teacher preference: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Get teacher preferences
   */
  getTeacherPreferences: protectedProcedure
    .input(z.object({
      category: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can access preferences",
          });
        }

        // Build query
        const query: any = {
          where: {
            userId: ctx.session.user.id,
            status: SystemStatus.ACTIVE
          }
        };

        // Add category filter if provided
        if (input.category) {
          query.where.category = input.category;
        }

        // Get preferences
        const preferences = await ctx.prisma.teacherPreference.findMany(query);

        return preferences;
      } catch (error) {
        console.error('Error in getTeacherPreferences:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher preferences: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Search for educational resources
   */
  search: protectedProcedure
    .input(searchQuerySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || 
            (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && 
             ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only teachers can use the search feature",
          });
        }



        // For now, return simulated search results
        // In a real implementation, this would integrate with a search service
        const results: any[] = [
          {
            id: crypto.randomUUID(),
            title: `Teaching Resources for "${input.query}"`,
            snippet: 'Comprehensive educational resources and strategies...',
            url: 'https://example.com/resources',
            source: 'Educational Database',
            relevanceScore: 0.95
          },
          {
            id: crypto.randomUUID(),
            title: `Best Practices: ${input.query}`,
            snippet: 'Research-based teaching methodologies and approaches...',
            url: 'https://example.com/best-practices',
            source: 'Teaching Excellence',
            relevanceScore: 0.87
          }
        ];

        // Log the search for analytics
        await ctx.prisma.teacherAssistantSearch.create({
          data: {
            teacherId: ctx.session.user.id,
            query: input.query,
            filters: input.filters || {},
            resultsCount: results.length
          }
        });

        return results;
      } catch (error) {
        console.error('Error in search:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search for resources: ${(error as Error).message}`,
        });
      }
    }),
});
