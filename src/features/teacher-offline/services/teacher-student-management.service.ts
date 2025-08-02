/**
 * Teacher Student Management Offline Service
 * 
 * Handles offline student management functionality including:
 * - Offline access to student lists
 * - Attendance tracking capabilities
 * - Performance data viewing
 * - Contact information access
 */

import { teacherOfflineDB, OfflineStudent, OfflineAttendance, OfflineClass } from './teacher-offline-db.service';
import { v4 as uuidv4 } from 'uuid';

export interface AttendanceEntry {
  studentId: string;
  classId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface BulkAttendanceEntry {
  classId: string;
  date: Date;
  attendance: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }[];
}

export interface StudentPerformanceData {
  student: OfflineStudent;
  currentGrade: number;
  attendanceRate: number;
  recentGrades: {
    assessmentName: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: Date;
  }[];
  attendanceHistory: {
    date: Date;
    status: string;
    notes?: string;
  }[];
  alerts: {
    type: 'grade' | 'attendance' | 'performance';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export interface ClassRoster {
  classInfo: OfflineClass;
  students: OfflineStudent[];
  attendanceStats: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    overallAttendanceRate: number;
  };
}

export class TeacherStudentManagementService {
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  /**
   * Get all students for a specific class
   */
  async getClassStudents(classId: string): Promise<OfflineStudent[]> {
    try {
      return await teacherOfflineDB.getStudentsByClass(classId);
    } catch (error) {
      console.error('Error getting class students:', error);
      throw new Error('Failed to get class students');
    }
  }

  /**
   * Get detailed student information
   */
  async getStudentDetails(studentId: string): Promise<OfflineStudent | null> {
    try {
      const student = await teacherOfflineDB.getStudent(studentId);
      return student || null;
    } catch (error) {
      console.error('Error getting student details:', error);
      return null;
    }
  }

  /**
   * Search students by name or enrollment number
   */
  async searchStudents(query: string, classId?: string): Promise<OfflineStudent[]> {
    try {
      let students: OfflineStudent[];
      
      if (classId) {
        students = await teacherOfflineDB.getStudentsByClass(classId);
      } else {
        students = await teacherOfflineDB.getAllStudents();
      }

      const searchTerm = query.toLowerCase();
      return students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.enrollmentNumber.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching students:', error);
      return [];
    }
  }

  /**
   * Record attendance for a single student
   */
  async recordAttendance(attendanceEntry: AttendanceEntry): Promise<string> {
    try {
      const attendanceId = uuidv4();
      
      const attendance: OfflineAttendance = {
        id: attendanceId,
        studentId: attendanceEntry.studentId,
        classId: attendanceEntry.classId,
        date: attendanceEntry.date,
        status: attendanceEntry.status,
        notes: attendanceEntry.notes,
        recordedBy: this.teacherId,
        syncStatus: 'pending',
        lastModified: new Date(),
      };

      await teacherOfflineDB.saveAttendance(attendance);
      
      // Update student attendance rate
      await this.updateStudentAttendanceRate(attendanceEntry.studentId);

      console.log(`Attendance recorded for student ${attendanceEntry.studentId}`);
      return attendanceId;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error('Failed to record attendance');
    }
  }

  /**
   * Record attendance for entire class
   */
  async recordBulkAttendance(bulkEntry: BulkAttendanceEntry): Promise<string[]> {
    try {
      const attendanceIds: string[] = [];

      for (const studentAttendance of bulkEntry.attendance) {
        const attendanceId = await this.recordAttendance({
          studentId: studentAttendance.studentId,
          classId: bulkEntry.classId,
          date: bulkEntry.date,
          status: studentAttendance.status,
          notes: studentAttendance.notes,
        });
        attendanceIds.push(attendanceId);
      }

      console.log(`Bulk attendance recorded for ${attendanceIds.length} students`);
      return attendanceIds;
    } catch (error) {
      console.error('Error recording bulk attendance:', error);
      throw new Error('Failed to record bulk attendance');
    }
  }

  /**
   * Get attendance for a class on a specific date
   */
  async getClassAttendance(classId: string, date: Date): Promise<OfflineAttendance[]> {
    try {
      return await teacherOfflineDB.getAttendanceByClass(classId, date);
    } catch (error) {
      console.error('Error getting class attendance:', error);
      return [];
    }
  }

  /**
   * Get attendance history for a student
   */
  async getStudentAttendanceHistory(studentId: string, days: number = 30): Promise<OfflineAttendance[]> {
    try {
      const allAttendance = await teacherOfflineDB.getAttendanceByStudent(studentId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return allAttendance
        .filter(att => att.date >= cutoffDate)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting student attendance history:', error);
      return [];
    }
  }

  /**
   * Get comprehensive student performance data
   */
  async getStudentPerformance(studentId: string): Promise<StudentPerformanceData | null> {
    try {
      const student = await teacherOfflineDB.getStudent(studentId);
      if (!student) return null;

      const [grades, attendanceHistory] = await Promise.all([
        teacherOfflineDB.getGradesByStudent(studentId),
        this.getStudentAttendanceHistory(studentId, 30),
      ]);

      // Get recent grades with assessment names
      const recentGrades = await Promise.all(
        grades
          .sort((a, b) => b.gradedAt.getTime() - a.gradedAt.getTime())
          .slice(0, 10)
          .map(async (grade) => {
            const assessment = await teacherOfflineDB.getAssessment(grade.assessmentId);
            return {
              assessmentName: assessment?.title || 'Unknown Assessment',
              score: grade.score,
              maxScore: grade.maxScore,
              percentage: grade.percentage,
              date: grade.gradedAt,
            };
          })
      );

      // Calculate current grade average
      const currentGrade = grades.length > 0 
        ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length 
        : 0;

      // Calculate attendance rate
      const attendanceRate = this.calculateAttendanceRate(attendanceHistory);

      // Generate alerts
      const alerts = this.generateStudentAlerts(student, currentGrade, attendanceRate);

      return {
        student,
        currentGrade: Math.round(currentGrade * 100) / 100,
        attendanceRate,
        recentGrades,
        attendanceHistory: attendanceHistory.map(att => ({
          date: att.date,
          status: att.status,
          notes: att.notes,
        })),
        alerts,
      };
    } catch (error) {
      console.error('Error getting student performance:', error);
      return null;
    }
  }

  /**
   * Get class roster with attendance statistics
   */
  async getClassRoster(classId: string): Promise<ClassRoster | null> {
    try {
      const [classInfo, students] = await Promise.all([
        teacherOfflineDB.getClass(classId),
        teacherOfflineDB.getStudentsByClass(classId),
      ]);

      if (!classInfo) return null;

      // Get today's attendance
      const today = new Date();
      const todayAttendance = await this.getClassAttendance(classId, today);

      const attendanceStats = {
        totalStudents: students.length,
        presentToday: todayAttendance.filter(att => att.status === 'present').length,
        absentToday: todayAttendance.filter(att => att.status === 'absent').length,
        lateToday: todayAttendance.filter(att => att.status === 'late').length,
        overallAttendanceRate: await this.calculateClassAttendanceRate(classId),
      };

      return {
        classInfo,
        students,
        attendanceStats,
      };
    } catch (error) {
      console.error('Error getting class roster:', error);
      return null;
    }
  }

  /**
   * Get students who need attention (low grades or poor attendance)
   */
  async getStudentsNeedingAttention(classId: string): Promise<{
    lowGrades: { student: OfflineStudent; average: number }[];
    poorAttendance: { student: OfflineStudent; attendanceRate: number }[];
    noRecentActivity: { student: OfflineStudent; lastActivity: Date }[];
  }> {
    try {
      const students = await teacherOfflineDB.getStudentsByClass(classId);
      const lowGrades: { student: OfflineStudent; average: number }[] = [];
      const poorAttendance: { student: OfflineStudent; attendanceRate: number }[] = [];
      const noRecentActivity: { student: OfflineStudent; lastActivity: Date }[] = [];

      for (const student of students) {
        // Check grades
        const grades = await teacherOfflineDB.getGradesByStudent(student.id);
        if (grades.length > 0) {
          const average = grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length;
          if (average < 70) {
            lowGrades.push({ student, average });
          }
        }

        // Check attendance
        const attendanceHistory = await this.getStudentAttendanceHistory(student.id, 30);
        const attendanceRate = this.calculateAttendanceRate(attendanceHistory);
        if (attendanceRate < 80) {
          poorAttendance.push({ student, attendanceRate });
        }

        // Check recent activity
        const lastActivity = student.performance.lastActivity;
        const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 7) {
          noRecentActivity.push({ student, lastActivity });
        }
      }

      return {
        lowGrades: lowGrades.sort((a, b) => a.average - b.average),
        poorAttendance: poorAttendance.sort((a, b) => a.attendanceRate - b.attendanceRate),
        noRecentActivity: noRecentActivity.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
      };
    } catch (error) {
      console.error('Error getting students needing attention:', error);
      return { lowGrades: [], poorAttendance: [], noRecentActivity: [] };
    }
  }

  /**
   * Update student contact information
   */
  async updateStudentContact(studentId: string, contactInfo: Partial<OfflineStudent['contactInfo']>): Promise<void> {
    try {
      const student = await teacherOfflineDB.getStudent(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent: OfflineStudent = {
        ...student,
        contactInfo: {
          ...student.contactInfo,
          ...contactInfo,
        },
      };

      await teacherOfflineDB.saveStudent(updatedStudent);
      console.log(`Updated contact info for student ${studentId}`);
    } catch (error) {
      console.error('Error updating student contact:', error);
      throw new Error('Failed to update student contact information');
    }
  }

  /**
   * Private helper methods
   */
  private async updateStudentAttendanceRate(studentId: string): Promise<void> {
    try {
      const student = await teacherOfflineDB.getStudent(studentId);
      if (!student) return;

      const attendanceHistory = await this.getStudentAttendanceHistory(studentId, 30);
      const attendanceRate = this.calculateAttendanceRate(attendanceHistory);

      const updatedStudent: OfflineStudent = {
        ...student,
        performance: {
          ...student.performance,
          attendanceRate,
          lastActivity: new Date(),
        },
      };

      await teacherOfflineDB.saveStudent(updatedStudent);
    } catch (error) {
      console.error('Error updating student attendance rate:', error);
    }
  }

  private calculateAttendanceRate(attendanceHistory: OfflineAttendance[]): number {
    if (attendanceHistory.length === 0) return 100;

    const presentCount = attendanceHistory.filter(att => 
      att.status === 'present' || att.status === 'late'
    ).length;

    return Math.round((presentCount / attendanceHistory.length) * 10000) / 100;
  }

  private async calculateClassAttendanceRate(classId: string): Promise<number> {
    try {
      const students = await teacherOfflineDB.getStudentsByClass(classId);
      if (students.length === 0) return 100;

      let totalRate = 0;
      for (const student of students) {
        const attendanceHistory = await this.getStudentAttendanceHistory(student.id, 30);
        totalRate += this.calculateAttendanceRate(attendanceHistory);
      }

      return Math.round((totalRate / students.length) * 100) / 100;
    } catch (error) {
      console.error('Error calculating class attendance rate:', error);
      return 0;
    }
  }

  private generateStudentAlerts(
    student: OfflineStudent, 
    currentGrade: number, 
    attendanceRate: number
  ): StudentPerformanceData['alerts'] {
    const alerts: StudentPerformanceData['alerts'] = [];

    // Grade alerts
    if (currentGrade < 60) {
      alerts.push({
        type: 'grade',
        message: 'Student is failing with current grade below 60%',
        severity: 'high',
      });
    } else if (currentGrade < 70) {
      alerts.push({
        type: 'grade',
        message: 'Student grade is below 70% - needs attention',
        severity: 'medium',
      });
    }

    // Attendance alerts
    if (attendanceRate < 70) {
      alerts.push({
        type: 'attendance',
        message: 'Poor attendance rate - below 70%',
        severity: 'high',
      });
    } else if (attendanceRate < 85) {
      alerts.push({
        type: 'attendance',
        message: 'Attendance rate below 85% - monitor closely',
        severity: 'medium',
      });
    }

    // Performance trend alerts
    const daysSinceActivity = (Date.now() - student.performance.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 7) {
      alerts.push({
        type: 'performance',
        message: `No recent activity for ${Math.floor(daysSinceActivity)} days`,
        severity: daysSinceActivity > 14 ? 'high' : 'medium',
      });
    }

    return alerts;
  }
}
