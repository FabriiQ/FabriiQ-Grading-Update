/**
 * Teacher Assessment Tools Offline Service
 * 
 * Handles offline assessment functionality including:
 * - Offline quiz and assignment creation
 * - Local assessment data storage
 * - Offline rubric application
 * - Performance analytics generation
 */

import { teacherOfflineDB, OfflineAssessment, OfflineGrade, OfflineStudent } from './teacher-offline-db.service';
import { v4 as uuidv4 } from 'uuid';

export interface AssessmentTemplate {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'exam' | 'project';
  maxScore: number;
  timeLimit?: number; // in minutes
  instructions: string;
  questions?: QuestionTemplate[];
  rubric?: RubricTemplate;
}

export interface QuestionTemplate {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  points: number;
  options?: string[]; // for multiple choice
  correctAnswer?: string | number;
  explanation?: string;
}

export interface RubricTemplate {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface AssessmentAnalytics {
  assessmentId: string;
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  standardDeviation: number;
  gradeDistribution: { [grade: string]: number };
  questionAnalytics?: QuestionAnalytics[];
  completionRate: number;
  timeAnalytics?: {
    averageTime: number;
    fastestTime: number;
    slowestTime: number;
  };
}

export interface QuestionAnalytics {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyRate: number;
  commonWrongAnswers: { answer: string; count: number }[];
}

export class TeacherAssessmentToolsService {
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  /**
   * Create a new assessment offline
   */
  async createAssessment(template: Omit<AssessmentTemplate, 'id'>): Promise<string> {
    try {
      const assessmentId = uuidv4();
      
      const assessment: OfflineAssessment = {
        id: assessmentId,
        title: template.title,
        description: template.description,
        classId: '', // Will be set when assigning to class
        type: template.type,
        maxScore: template.maxScore,
        dueDate: new Date(), // Default to today, can be updated
        status: 'draft',
        rubric: template.rubric ? {
          criteria: template.rubric.criteria.map(criterion => ({
            id: criterion.id,
            name: criterion.name,
            description: criterion.description,
            maxPoints: criterion.maxPoints,
          }))
        } : undefined,
        lastSynced: new Date(),
      };

      await teacherOfflineDB.saveAssessment(assessment);
      
      // Store additional template data in separate storage if needed
      await this.saveAssessmentTemplate(assessmentId, { ...template, id: assessmentId });

      console.log(`Assessment created offline: ${assessmentId}`);
      return assessmentId;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment offline');
    }
  }

  /**
   * Update an existing assessment
   */
  async updateAssessment(assessmentId: string, updates: Partial<AssessmentTemplate>): Promise<void> {
    try {
      const existingAssessment = await teacherOfflineDB.getAssessment(assessmentId);
      if (!existingAssessment) {
        throw new Error('Assessment not found');
      }

      const updatedAssessment: OfflineAssessment = {
        ...existingAssessment,
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.type && { type: updates.type }),
        ...(updates.maxScore && { maxScore: updates.maxScore }),
        ...(updates.rubric && { 
          rubric: {
            criteria: updates.rubric.criteria.map(criterion => ({
              id: criterion.id,
              name: criterion.name,
              description: criterion.description,
              maxPoints: criterion.maxPoints,
            }))
          }
        }),
        lastSynced: new Date(),
      };

      await teacherOfflineDB.saveAssessment(updatedAssessment);
      
      // Update template data
      const existingTemplate = await this.getAssessmentTemplate(assessmentId);
      if (existingTemplate) {
        await this.saveAssessmentTemplate(assessmentId, { ...existingTemplate, ...updates });
      }

      console.log(`Assessment updated offline: ${assessmentId}`);
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw new Error('Failed to update assessment');
    }
  }

  /**
   * Assign assessment to a class
   */
  async assignToClass(assessmentId: string, classId: string, dueDate: Date): Promise<void> {
    try {
      const assessment = await teacherOfflineDB.getAssessment(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const updatedAssessment: OfflineAssessment = {
        ...assessment,
        classId,
        dueDate,
        status: 'published',
        lastSynced: new Date(),
      };

      await teacherOfflineDB.saveAssessment(updatedAssessment);
      console.log(`Assessment ${assessmentId} assigned to class ${classId}`);
    } catch (error) {
      console.error('Error assigning assessment to class:', error);
      throw new Error('Failed to assign assessment to class');
    }
  }

  /**
   * Apply rubric to grade a submission
   */
  async applyRubric(
    assessmentId: string, 
    studentId: string, 
    rubricScores: { criterionId: string; points: number; feedback?: string }[]
  ): Promise<string> {
    try {
      const assessment = await teacherOfflineDB.getAssessment(assessmentId);
      if (!assessment || !assessment.rubric) {
        throw new Error('Assessment or rubric not found');
      }

      // Calculate total score
      const totalScore = rubricScores.reduce((sum, score) => sum + score.points, 0);
      
      // Create detailed feedback
      const rubricFeedback = rubricScores.map(score => {
        const criterion = assessment.rubric!.criteria.find(c => c.id === score.criterionId);
        return {
          criterion: criterion?.name || 'Unknown',
          points: score.points,
          maxPoints: criterion?.maxPoints || 0,
          feedback: score.feedback || '',
        };
      });

      const gradeId = uuidv4();
      const grade: OfflineGrade = {
        id: gradeId,
        studentId,
        classId: assessment.classId,
        assessmentId,
        score: totalScore,
        maxScore: assessment.maxScore,
        percentage: Math.round((totalScore / assessment.maxScore) * 10000) / 100,
        feedback: JSON.stringify({ rubricFeedback }),
        gradedAt: new Date(),
        gradedBy: this.teacherId,
        syncStatus: 'pending',
        lastModified: new Date(),
      };

      await teacherOfflineDB.saveGrade(grade);
      console.log(`Rubric applied for student ${studentId} on assessment ${assessmentId}`);
      return gradeId;
    } catch (error) {
      console.error('Error applying rubric:', error);
      throw new Error('Failed to apply rubric');
    }
  }

  /**
   * Generate assessment analytics
   */
  async generateAssessmentAnalytics(assessmentId: string): Promise<AssessmentAnalytics> {
    try {
      const [assessment, grades] = await Promise.all([
        teacherOfflineDB.getAssessment(assessmentId),
        teacherOfflineDB.getGradesByAssessment(assessmentId),
      ]);

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      if (grades.length === 0) {
        return {
          assessmentId,
          totalSubmissions: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          medianScore: 0,
          standardDeviation: 0,
          gradeDistribution: {},
          completionRate: 0,
        };
      }

      const scores = grades.map(g => g.percentage);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      
      // Calculate median
      const sortedScores = [...scores].sort((a, b) => a - b);
      const medianScore = sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

      // Calculate standard deviation
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);

      // Grade distribution
      const gradeDistribution = {
        'A (90-100%)': scores.filter(s => s >= 90).length,
        'B (80-89%)': scores.filter(s => s >= 80 && s < 90).length,
        'C (70-79%)': scores.filter(s => s >= 70 && s < 80).length,
        'D (60-69%)': scores.filter(s => s >= 60 && s < 70).length,
        'F (0-59%)': scores.filter(s => s < 60).length,
      };

      // Get total students in class for completion rate
      const classStudents = await teacherOfflineDB.getStudentsByClass(assessment.classId);
      const completionRate = classStudents.length > 0 
        ? (grades.length / classStudents.length) * 100 
        : 0;

      return {
        assessmentId,
        totalSubmissions: grades.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        lowestScore: Math.round(lowestScore * 100) / 100,
        medianScore: Math.round(medianScore * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        gradeDistribution,
        completionRate: Math.round(completionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error generating assessment analytics:', error);
      throw new Error('Failed to generate assessment analytics');
    }
  }

  /**
   * Get assessments for a class
   */
  async getClassAssessments(classId: string): Promise<OfflineAssessment[]> {
    try {
      return await teacherOfflineDB.getAssessmentsByClass(classId);
    } catch (error) {
      console.error('Error getting class assessments:', error);
      return [];
    }
  }

  /**
   * Get assessment templates (saved drafts)
   */
  async getAssessmentTemplates(): Promise<AssessmentTemplate[]> {
    try {
      // Get from localStorage or IndexedDB
      const templates = localStorage.getItem(`assessment_templates_${this.teacherId}`);
      return templates ? JSON.parse(templates) : [];
    } catch (error) {
      console.error('Error getting assessment templates:', error);
      return [];
    }
  }

  /**
   * Save assessment template
   */
  private async saveAssessmentTemplate(assessmentId: string, template: AssessmentTemplate): Promise<void> {
    try {
      const templates = await this.getAssessmentTemplates();
      const existingIndex = templates.findIndex(t => t.id === assessmentId);
      
      const templateWithId = { ...template, id: assessmentId };
      
      if (existingIndex >= 0) {
        templates[existingIndex] = templateWithId;
      } else {
        templates.push(templateWithId);
      }

      localStorage.setItem(`assessment_templates_${this.teacherId}`, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving assessment template:', error);
    }
  }

  /**
   * Get assessment template
   */
  private async getAssessmentTemplate(assessmentId: string): Promise<AssessmentTemplate | null> {
    try {
      const templates = await this.getAssessmentTemplates();
      return templates.find(t => t.id === assessmentId) || null;
    } catch (error) {
      console.error('Error getting assessment template:', error);
      return null;
    }
  }

  /**
   * Create rubric template
   */
  async createRubricTemplate(rubric: Omit<RubricTemplate, 'id'>): Promise<string> {
    try {
      const rubricId = uuidv4();
      const rubricTemplate: RubricTemplate = {
        ...rubric,
        id: rubricId,
      };

      // Save to localStorage
      const rubrics = await this.getRubricTemplates();
      rubrics.push(rubricTemplate);
      localStorage.setItem(`rubric_templates_${this.teacherId}`, JSON.stringify(rubrics));

      console.log(`Rubric template created: ${rubricId}`);
      return rubricId;
    } catch (error) {
      console.error('Error creating rubric template:', error);
      throw new Error('Failed to create rubric template');
    }
  }

  /**
   * Get rubric templates
   */
  async getRubricTemplates(): Promise<RubricTemplate[]> {
    try {
      const rubrics = localStorage.getItem(`rubric_templates_${this.teacherId}`);
      return rubrics ? JSON.parse(rubrics) : [];
    } catch (error) {
      console.error('Error getting rubric templates:', error);
      return [];
    }
  }

  /**
   * Generate class performance report
   */
  async generateClassPerformanceReport(classId: string): Promise<{
    classId: string;
    totalAssessments: number;
    totalStudents: number;
    overallClassAverage: number;
    assessmentBreakdown: {
      assessmentId: string;
      title: string;
      average: number;
      submissions: number;
    }[];
    studentPerformance: {
      studentId: string;
      name: string;
      average: number;
      completedAssessments: number;
    }[];
    trends: {
      improvingStudents: string[];
      decliningStudents: string[];
      consistentPerformers: string[];
    };
  }> {
    try {
      const [assessments, students, allGrades] = await Promise.all([
        teacherOfflineDB.getAssessmentsByClass(classId),
        teacherOfflineDB.getStudentsByClass(classId),
        teacherOfflineDB.getGradesByClass(classId),
      ]);

      // Assessment breakdown
      const assessmentBreakdown = assessments.map(assessment => {
        const assessmentGrades = allGrades.filter(g => g.assessmentId === assessment.id);
        const average = assessmentGrades.length > 0
          ? assessmentGrades.reduce((sum, g) => sum + g.percentage, 0) / assessmentGrades.length
          : 0;

        return {
          assessmentId: assessment.id,
          title: assessment.title,
          average: Math.round(average * 100) / 100,
          submissions: assessmentGrades.length,
        };
      });

      // Student performance
      const studentPerformance = await Promise.all(
        students.map(async (student) => {
          const studentGrades = allGrades.filter(g => g.studentId === student.id);
          const average = studentGrades.length > 0
            ? studentGrades.reduce((sum, g) => sum + g.percentage, 0) / studentGrades.length
            : 0;

          return {
            studentId: student.id,
            name: student.name,
            average: Math.round(average * 100) / 100,
            completedAssessments: studentGrades.length,
          };
        })
      );

      // Overall class average
      const overallClassAverage = studentPerformance.length > 0
        ? studentPerformance.reduce((sum, s) => sum + s.average, 0) / studentPerformance.length
        : 0;

      // Simple trend analysis (would be more sophisticated with more data)
      const trends = {
        improvingStudents: studentPerformance.filter(s => s.average > overallClassAverage + 10).map(s => s.studentId),
        decliningStudents: studentPerformance.filter(s => s.average < overallClassAverage - 10).map(s => s.studentId),
        consistentPerformers: studentPerformance.filter(s => 
          Math.abs(s.average - overallClassAverage) <= 10
        ).map(s => s.studentId),
      };

      return {
        classId,
        totalAssessments: assessments.length,
        totalStudents: students.length,
        overallClassAverage: Math.round(overallClassAverage * 100) / 100,
        assessmentBreakdown,
        studentPerformance,
        trends,
      };
    } catch (error) {
      console.error('Error generating class performance report:', error);
      throw new Error('Failed to generate class performance report');
    }
  }

  /**
   * Export assessment data for backup
   */
  async exportAssessmentData(assessmentId: string): Promise<{
    assessment: OfflineAssessment;
    template: AssessmentTemplate | null;
    grades: OfflineGrade[];
    analytics: AssessmentAnalytics;
  }> {
    try {
      const [assessment, template, grades, analytics] = await Promise.all([
        teacherOfflineDB.getAssessment(assessmentId),
        this.getAssessmentTemplate(assessmentId),
        teacherOfflineDB.getGradesByAssessment(assessmentId),
        this.generateAssessmentAnalytics(assessmentId),
      ]);

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      return {
        assessment,
        template,
        grades,
        analytics,
      };
    } catch (error) {
      console.error('Error exporting assessment data:', error);
      throw new Error('Failed to export assessment data');
    }
  }
}
