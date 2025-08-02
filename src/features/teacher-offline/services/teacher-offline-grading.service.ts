/**
 * Teacher Offline Grading Service
 * 
 * Handles offline grading functionality including:
 * - Local grade entry and storage
 * - Offline gradebook functionality
 * - Grade calculations without connectivity
 * - Sync queue for grade submissions
 */

import { teacherOfflineDB, OfflineGrade, OfflineStudent, OfflineAssessment } from './teacher-offline-db.service';
import { v4 as uuidv4 } from 'uuid';

export interface GradeEntry {
  studentId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface GradebookData {
  classId: string;
  students: OfflineStudent[];
  assessments: OfflineAssessment[];
  grades: OfflineGrade[];
  statistics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  };
}

export interface BulkGradeEntry {
  assessmentId: string;
  grades: {
    studentId: string;
    score: number;
    feedback?: string;
  }[];
}

export class TeacherOfflineGradingService {
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  /**
   * Enter a single grade offline
   */
  async enterGrade(gradeEntry: GradeEntry): Promise<string> {
    try {
      const gradeId = uuidv4();
      const percentage = (gradeEntry.score / gradeEntry.maxScore) * 100;

      const grade: OfflineGrade = {
        id: gradeId,
        studentId: gradeEntry.studentId,
        classId: await this.getClassIdFromAssessment(gradeEntry.assessmentId),
        assessmentId: gradeEntry.assessmentId,
        score: gradeEntry.score,
        maxScore: gradeEntry.maxScore,
        percentage: Math.round(percentage * 100) / 100,
        feedback: gradeEntry.feedback,
        gradedAt: new Date(),
        gradedBy: this.teacherId,
        syncStatus: 'pending',
        lastModified: new Date(),
      };

      await teacherOfflineDB.saveGrade(grade);
      
      // Update student performance cache
      await this.updateStudentPerformance(gradeEntry.studentId);

      console.log(`Grade entered offline for student ${gradeEntry.studentId}`);
      return gradeId;
    } catch (error) {
      console.error('Error entering grade offline:', error);
      throw new Error('Failed to enter grade offline');
    }
  }

  /**
   * Enter multiple grades for an assessment
   */
  async enterBulkGrades(bulkEntry: BulkGradeEntry): Promise<string[]> {
    try {
      const gradeIds: string[] = [];
      const assessment = await teacherOfflineDB.getAssessment(bulkEntry.assessmentId);
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      for (const gradeData of bulkEntry.grades) {
        const gradeId = await this.enterGrade({
          studentId: gradeData.studentId,
          assessmentId: bulkEntry.assessmentId,
          score: gradeData.score,
          maxScore: assessment.maxScore,
          feedback: gradeData.feedback,
        });
        gradeIds.push(gradeId);
      }

      console.log(`Bulk grades entered for ${gradeIds.length} students`);
      return gradeIds;
    } catch (error) {
      console.error('Error entering bulk grades:', error);
      throw new Error('Failed to enter bulk grades');
    }
  }

  /**
   * Update an existing grade
   */
  async updateGrade(gradeId: string, updates: Partial<GradeEntry>): Promise<void> {
    try {
      const existingGrade = await teacherOfflineDB.getGrade(gradeId);
      if (!existingGrade) {
        throw new Error('Grade not found');
      }

      const updatedGrade: OfflineGrade = {
        ...existingGrade,
        ...(updates.score !== undefined && { score: updates.score }),
        ...(updates.feedback !== undefined && { feedback: updates.feedback }),
        ...(updates.score !== undefined && updates.maxScore !== undefined && {
          percentage: Math.round((updates.score / updates.maxScore) * 10000) / 100
        }),
        syncStatus: 'pending',
        lastModified: new Date(),
      };

      await teacherOfflineDB.saveGrade(updatedGrade);
      
      // Update student performance cache
      await this.updateStudentPerformance(updatedGrade.studentId);

      console.log(`Grade ${gradeId} updated offline`);
    } catch (error) {
      console.error('Error updating grade:', error);
      throw new Error('Failed to update grade');
    }
  }

  /**
   * Get gradebook data for a class
   */
  async getGradebook(classId: string): Promise<GradebookData> {
    try {
      const [students, assessments, grades] = await Promise.all([
        teacherOfflineDB.getStudentsByClass(classId),
        teacherOfflineDB.getAssessmentsByClass(classId),
        teacherOfflineDB.getGradesByClass(classId),
      ]);

      const statistics = this.calculateClassStatistics(grades);

      return {
        classId,
        students,
        assessments,
        grades,
        statistics,
      };
    } catch (error) {
      console.error('Error getting gradebook:', error);
      throw new Error('Failed to get gradebook data');
    }
  }

  /**
   * Get grades for a specific student
   */
  async getStudentGrades(studentId: string): Promise<OfflineGrade[]> {
    try {
      return await teacherOfflineDB.getGradesByStudent(studentId);
    } catch (error) {
      console.error('Error getting student grades:', error);
      throw new Error('Failed to get student grades');
    }
  }

  /**
   * Calculate student's average grade
   */
  async calculateStudentAverage(studentId: string, classId?: string): Promise<number> {
    try {
      let grades = await teacherOfflineDB.getGradesByStudent(studentId);
      
      if (classId) {
        grades = grades.filter(grade => grade.classId === classId);
      }

      if (grades.length === 0) return 0;

      const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
      return Math.round((totalPercentage / grades.length) * 100) / 100;
    } catch (error) {
      console.error('Error calculating student average:', error);
      return 0;
    }
  }

  /**
   * Get pending grades that need to be synced
   */
  async getPendingGrades(): Promise<OfflineGrade[]> {
    try {
      return await teacherOfflineDB.getPendingGrades();
    } catch (error) {
      console.error('Error getting pending grades:', error);
      return [];
    }
  }

  /**
   * Mark grades as synced
   */
  async markGradesSynced(gradeIds: string[]): Promise<void> {
    try {
      for (const gradeId of gradeIds) {
        const grade = await teacherOfflineDB.getGrade(gradeId);
        if (grade) {
          await teacherOfflineDB.saveGrade({
            ...grade,
            syncStatus: 'synced',
            lastModified: new Date(),
          });
        }
      }
      console.log(`Marked ${gradeIds.length} grades as synced`);
    } catch (error) {
      console.error('Error marking grades as synced:', error);
      throw new Error('Failed to mark grades as synced');
    }
  }

  /**
   * Generate grade report for a class
   */
  async generateClassReport(classId: string): Promise<{
    classId: string;
    totalStudents: number;
    totalAssessments: number;
    averageClassGrade: number;
    gradeDistribution: { [key: string]: number };
    topPerformers: { studentId: string; average: number }[];
    needsAttention: { studentId: string; average: number }[];
  }> {
    try {
      const gradebook = await this.getGradebook(classId);
      const studentAverages = await Promise.all(
        gradebook.students.map(async (student) => ({
          studentId: student.id,
          average: await this.calculateStudentAverage(student.id, classId),
        }))
      );

      const classAverage = studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length;

      // Grade distribution (A, B, C, D, F)
      const gradeDistribution = {
        A: studentAverages.filter(s => s.average >= 90).length,
        B: studentAverages.filter(s => s.average >= 80 && s.average < 90).length,
        C: studentAverages.filter(s => s.average >= 70 && s.average < 80).length,
        D: studentAverages.filter(s => s.average >= 60 && s.average < 70).length,
        F: studentAverages.filter(s => s.average < 60).length,
      };

      // Top performers (top 3)
      const topPerformers = studentAverages
        .sort((a, b) => b.average - a.average)
        .slice(0, 3);

      // Students needing attention (below 70%)
      const needsAttention = studentAverages
        .filter(s => s.average < 70)
        .sort((a, b) => a.average - b.average);

      return {
        classId,
        totalStudents: gradebook.students.length,
        totalAssessments: gradebook.assessments.length,
        averageClassGrade: Math.round(classAverage * 100) / 100,
        gradeDistribution,
        topPerformers,
        needsAttention,
      };
    } catch (error) {
      console.error('Error generating class report:', error);
      throw new Error('Failed to generate class report');
    }
  }

  /**
   * Private helper methods
   */
  private async getClassIdFromAssessment(assessmentId: string): Promise<string> {
    const assessment = await teacherOfflineDB.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    return assessment.classId;
  }

  private async updateStudentPerformance(studentId: string): Promise<void> {
    try {
      const student = await teacherOfflineDB.getStudent(studentId);
      if (!student) return;

      const average = await this.calculateStudentAverage(studentId);
      const updatedStudent = {
        ...student,
        performance: {
          ...student.performance,
          averageGrade: average,
          lastActivity: new Date(),
        },
      };

      await teacherOfflineDB.saveStudent(updatedStudent);
    } catch (error) {
      console.error('Error updating student performance:', error);
    }
  }

  private calculateClassStatistics(grades: OfflineGrade[]): {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  } {
    if (grades.length === 0) {
      return { averageScore: 0, highestScore: 0, lowestScore: 0, passRate: 0 };
    }

    const percentages = grades.map(g => g.percentage);
    const averageScore = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);
    const passRate = (percentages.filter(p => p >= 60).length / percentages.length) * 100;

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.round(highestScore * 100) / 100,
      lowestScore: Math.round(lowestScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    };
  }
}
