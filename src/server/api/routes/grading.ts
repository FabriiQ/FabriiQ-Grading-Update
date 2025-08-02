/**
 * Advanced Grading API Routes
 * 
 * Provides API endpoints for advanced grading features including batch grading,
 * rubric management, and AI-powered feedback generation.
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdvancedGradingService } from '@/features/activties/services/advanced-grading.service';
// Mock middleware functions for development
const authenticateToken = (req: any, res: any, next: any) => {
  req.user = { id: 'user123', role: 'teacher' };
  next();
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (roles.includes(req.user?.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
};

const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Validation failed' });
  }
};
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const gradingService = new AdvancedGradingService(prisma);

// Validation schemas
const batchGradingSchema = z.object({
  submissionIds: z.array(z.string()).min(1).max(100),
  gradingMethod: z.enum(['ai_only', 'rubric_only', 'hybrid']),
  rubricId: z.string().optional(),
  aiSettings: z.object({
    model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3']).default('gpt-4'),
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    generateFeedback: z.boolean().default(true),
    bloomsAnalysis: z.boolean().default(true)
  }).optional(),
  gradingOptions: z.object({
    allowPartialCredit: z.boolean().default(true),
    roundToNearest: z.number().default(0.5),
    applyLatePenalty: z.boolean().default(false),
    latePenaltyPercent: z.number().min(0).max(50).default(10)
  }).optional()
});

const rubricSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  criteria: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    weight: z.number().min(0).max(100),
    levels: z.array(z.object({
      level: z.number().min(1).max(4),
      name: z.string().min(1).max(50),
      description: z.string().max(200),
      points: z.number().min(0)
    })).min(2).max(4)
  })).min(1).max(10),
  bloomsAlignment: z.record(z.number().min(0).max(100)).optional()
});

const feedbackTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  bloomsLevel: z.string().optional(),
  scoreRange: z.object({
    min: z.number().min(0),
    max: z.number().max(100)
  }),
  templates: z.object({
    strengths: z.array(z.string()).min(1),
    improvements: z.array(z.string()).min(1),
    suggestions: z.array(z.string()).min(1),
    encouragement: z.array(z.string()).min(1)
  }),
  variables: z.array(z.string())
});

/**
 * POST /api/grading/batch
 * Perform batch grading on multiple submissions
 */
router.post('/batch', 
  authenticateToken,
  requireRole(['teacher', 'admin']),
  validateRequest(batchGradingSchema),
  async (req, res) => {
    try {
      const gradedBy = req.user?.id || 'unknown';
      const result = await gradingService.performBatchGrading(req.body, gradedBy);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Batch grading error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform batch grading'
      });
    }
  }
);

/**
 * POST /api/grading/rubrics
 * Create a new grading rubric
 */
router.post('/rubrics',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  validateRequest(rubricSchema),
  async (req, res) => {
    try {
      const createdBy = req.user?.id || 'unknown';
      const rubric = await gradingService.createRubric({
        ...req.body,
        createdBy
      });
      
      res.status(201).json({
        success: true,
        data: rubric
      });
    } catch (error) {
      console.error('Rubric creation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create rubric'
      });
    }
  }
);

/**
 * GET /api/grading/rubrics
 * Get all rubrics for the authenticated user
 */
router.get('/rubrics',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const rubrics = await prisma.rubric.findMany({
        where: {
          createdById: userId
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedRubrics = rubrics.map(rubric => {
        const content = rubric.bloomsDistribution as any;
        return {
          id: rubric.id,
          name: rubric.title,
          description: rubric.description || '',
          criteria: content.criteria || [],
          totalPoints: rubric.maxScore,
          bloomsAlignment: content.bloomsAlignment,
          createdBy: rubric.createdById,
          createdAt: rubric.createdAt,
          updatedAt: rubric.updatedAt
        };
      });

      res.json({
        success: true,
        data: formattedRubrics
      });
    } catch (error) {
      console.error('Error fetching rubrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rubrics'
      });
    }
  }
);

/**
 * POST /api/grading/feedback/generate
 * Generate AI-powered feedback for a submission
 */
router.post('/feedback/generate',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { submissionContent, activityType, score, bloomsLevel, rubricResults } = req.body;
      
      const feedback = await gradingService.generateAIFeedback(
        submissionContent,
        activityType,
        score,
        bloomsLevel,
        rubricResults
      );
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('AI feedback generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate AI feedback'
      });
    }
  }
);

/**
 * POST /api/grading/templates
 * Create a new feedback template
 */
router.post('/templates',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  validateRequest(feedbackTemplateSchema),
  async (req, res) => {
    try {
      const template = await gradingService.createFeedbackTemplate(req.body);
      
      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create feedback template'
      });
    }
  }
);

/**
 * POST /api/grading/templates/:id/apply
 * Apply a feedback template with variables
 */
router.post('/templates/:id/apply',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { variables, score } = req.body;
      
      const feedback = await gradingService.applyFeedbackTemplate(id, variables, score);
      
      res.json({
        success: true,
        data: { feedback }
      });
    } catch (error) {
      console.error('Template application error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply feedback template'
      });
    }
  }
);

/**
 * GET /api/grading/analytics
 * Get grading analytics for a class or teacher
 */
router.get('/analytics',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { classId, timeframe } = req.query;
      const teacherId = req.user?.role === 'teacher' ? req.user.id : undefined;
      
      let timeframeObj;
      if (timeframe) {
        const [start, end] = (timeframe as string).split(',');
        timeframeObj = {
          start: new Date(start),
          end: new Date(end)
        };
      }
      
      const analytics = await gradingService.getGradingAnalytics(
        classId as string,
        teacherId,
        timeframeObj
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get grading analytics'
      });
    }
  }
);

/**
 * GET /api/grading/submissions/:id/suggestions
 * Get grading suggestions for a specific submission
 */
router.get('/submissions/:id/suggestions',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get submission details
      const submission = await prisma.activityGrade.findUnique({
        where: { id },
        include: {
          activity: {
            select: {
              title: true,
              content: true
            }
          }
        }
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }

      // Generate grading suggestions
      const content = submission.content as any;
      const submissionText = content?.text || content?.answer || '';
      
      const feedback = await gradingService.generateAIFeedback(
        submissionText,
        'essay', // Default activity type
        submission.score || 0
      );
      
      res.json({
        success: true,
        data: {
          submissionId: id,
          suggestions: feedback,
          recommendedScore: Math.round((feedback.strengths.length * 20) + 40), // Simple scoring
          confidence: 0.8
        }
      });
    } catch (error) {
      console.error('Grading suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get grading suggestions'
      });
    }
  }
);

/**
 * POST /api/grading/bulk-feedback
 * Generate bulk feedback for multiple submissions
 */
router.post('/bulk-feedback',
  authenticateToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { submissionIds, templateId, commonVariables } = req.body;
      
      if (!submissionIds || !Array.isArray(submissionIds)) {
        return res.status(400).json({
          success: false,
          error: 'submissionIds array is required'
        });
      }

      const results: Array<{
        submissionId: string;
        success: boolean;
        feedback?: string;
        error?: string;
      }> = [];
      
      for (const submissionId of submissionIds) {
        try {
          const submission = await prisma.activityGrade.findUnique({
            where: { id: submissionId }
          });

          if (!submission) {
            results.push({
              submissionId,
              success: false,
              error: 'Submission not found'
            });
            continue;
          }

          let feedback = '';
          
          if (templateId) {
            // Use template
            const variables = {
              ...commonVariables,
              studentName: `Student ${submission.studentId.slice(-4)}`,
              score: submission.score?.toString() || '0'
            };
            
            feedback = await gradingService.applyFeedbackTemplate(
              templateId,
              variables,
              submission.score || 0
            );
          } else {
            // Generate AI feedback
            const content = submission.content as any;
            const submissionText = content?.text || content?.answer || '';
            
            const aiFeedback = await gradingService.generateAIFeedback(
              submissionText,
              'essay',
              submission.score || 0
            );
            
            feedback = aiFeedback.detailedFeedback;
          }

          // Update submission with feedback
          await prisma.activityGrade.update({
            where: { id: submissionId },
            data: { feedback }
          });

          results.push({
            submissionId,
            success: true,
            feedback
          });
        } catch (error) {
          results.push({
            submissionId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalProcessed: submissionIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      console.error('Bulk feedback error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate bulk feedback'
      });
    }
  }
);

export default router;
