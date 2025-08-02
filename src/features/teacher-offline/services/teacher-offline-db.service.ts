/**
 * Teacher Offline Database Service
 * 
 * Manages IndexedDB stores for teacher offline functionality including:
 * - Student data and performance records
 * - Class rosters and enrollment information
 * - Grading data and assessment results
 * - Assignment and activity information
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema interfaces
export interface TeacherOfflineDBSchema extends DBSchema {
  students: {
    key: string;
    value: OfflineStudent;
    indexes: {
      'by-class': string;
      'by-status': string;
    };
  };
  classes: {
    key: string;
    value: OfflineClass;
    indexes: {
      'by-teacher': string;
      'by-status': string;
    };
  };
  grades: {
    key: string;
    value: OfflineGrade;
    indexes: {
      'by-student': string;
      'by-class': string;
      'by-assessment': string;
      'by-sync-status': string;
    };
  };
  assessments: {
    key: string;
    value: OfflineAssessment;
    indexes: {
      'by-class': string;
      'by-type': string;
      'by-status': string;
    };
  };
  attendance: {
    key: string;
    value: OfflineAttendance;
    indexes: {
      'by-student': string;
      'by-class': string;
      'by-date': string;
    };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-type': string;
      'by-status': string;
      'by-priority': number;
    };
  };
}

// Data interfaces
export interface OfflineStudent {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  classIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
  performance: {
    averageGrade: number;
    attendanceRate: number;
    lastActivity: Date;
  };
  contactInfo: {
    phone?: string;
    parentEmail?: string;
    address?: string;
  };
  lastSynced: Date;
}

export interface OfflineClass {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  courseName: string;
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  studentCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastSynced: Date;
}

export interface OfflineGrade {
  id: string;
  studentId: string;
  classId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  gradedAt: Date;
  gradedBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastModified: Date;
}

export interface OfflineAssessment {
  id: string;
  title: string;
  description: string;
  classId: string;
  type: 'quiz' | 'assignment' | 'exam' | 'project';
  maxScore: number;
  dueDate: Date;
  status: 'draft' | 'published' | 'closed';
  rubric?: {
    criteria: {
      id: string;
      name: string;
      description: string;
      maxPoints: number;
    }[];
  };
  lastSynced: Date;
}

export interface OfflineAttendance {
  id: string;
  studentId: string;
  classId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recordedBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastModified: Date;
}

export interface SyncQueueItem {
  id: string;
  type: 'grade' | 'attendance' | 'assessment' | 'student_update';
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: number; // 1 = highest, 5 = lowest
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
}

export class TeacherOfflineDBService {
  private db: IDBPDatabase<TeacherOfflineDBSchema> | null = null;
  private readonly DB_NAME = 'TeacherOfflineDB';
  private readonly DB_VERSION = 1;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<TeacherOfflineDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Students store
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
          studentsStore.createIndex('by-class', 'classIds', { multiEntry: true });
          studentsStore.createIndex('by-status', 'status');

          // Classes store
          const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
          classesStore.createIndex('by-teacher', 'teacherId');
          classesStore.createIndex('by-status', 'status');

          // Grades store
          const gradesStore = db.createObjectStore('grades', { keyPath: 'id' });
          gradesStore.createIndex('by-student', 'studentId');
          gradesStore.createIndex('by-class', 'classId');
          gradesStore.createIndex('by-assessment', 'assessmentId');
          gradesStore.createIndex('by-sync-status', 'syncStatus');

          // Assessments store
          const assessmentsStore = db.createObjectStore('assessments', { keyPath: 'id' });
          assessmentsStore.createIndex('by-class', 'classId');
          assessmentsStore.createIndex('by-type', 'type');
          assessmentsStore.createIndex('by-status', 'status');

          // Attendance store
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('by-student', 'studentId');
          attendanceStore.createIndex('by-class', 'classId');
          attendanceStore.createIndex('by-date', 'date');

          // Sync queue store
          const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-type', 'type');
          syncQueueStore.createIndex('by-status', 'status');
          syncQueueStore.createIndex('by-priority', 'priority');
        },
      });

      console.log('Teacher offline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize teacher offline database:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBPDatabase<TeacherOfflineDBSchema>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  // Student operations
  async saveStudent(student: OfflineStudent): Promise<void> {
    const db = await this.ensureDB();
    await db.put('students', { ...student, lastSynced: new Date() });
  }

  async getStudent(id: string): Promise<OfflineStudent | undefined> {
    const db = await this.ensureDB();
    return await db.get('students', id);
  }

  async getStudentsByClass(classId: string): Promise<OfflineStudent[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('students', 'by-class', classId);
  }

  async getAllStudents(): Promise<OfflineStudent[]> {
    const db = await this.ensureDB();
    return await db.getAll('students');
  }

  // Class operations
  async saveClass(classData: OfflineClass): Promise<void> {
    const db = await this.ensureDB();
    await db.put('classes', { ...classData, lastSynced: new Date() });
  }

  async getClass(id: string): Promise<OfflineClass | undefined> {
    const db = await this.ensureDB();
    return await db.get('classes', id);
  }

  async getClassesByTeacher(teacherId: string): Promise<OfflineClass[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('classes', 'by-teacher', teacherId);
  }

  // Grade operations
  async saveGrade(grade: OfflineGrade): Promise<void> {
    const db = await this.ensureDB();
    await db.put('grades', { ...grade, lastModified: new Date() });
    
    // Add to sync queue if not already synced
    if (grade.syncStatus === 'pending') {
      await this.addToSyncQueue({
        id: `grade-${grade.id}-${Date.now()}`,
        type: 'grade',
        action: 'create',
        data: grade,
        priority: 2,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });
    }
  }

  async getGradesByStudent(studentId: string): Promise<OfflineGrade[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('grades', 'by-student', studentId);
  }

  async getGradesByClass(classId: string): Promise<OfflineGrade[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('grades', 'by-class', classId);
  }

  async getGradesByAssessment(assessmentId: string): Promise<OfflineGrade[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('grades', 'by-assessment', assessmentId);
  }

  async getGrade(gradeId: string): Promise<OfflineGrade | undefined> {
    const db = await this.ensureDB();
    return await db.get('grades', gradeId);
  }

  async getPendingGrades(): Promise<OfflineGrade[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('grades', 'by-sync-status', 'pending');
  }

  // Assessment operations
  async saveAssessment(assessment: OfflineAssessment): Promise<void> {
    const db = await this.ensureDB();
    await db.put('assessments', { ...assessment, lastSynced: new Date() });
  }

  async getAssessmentsByClass(classId: string): Promise<OfflineAssessment[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('assessments', 'by-class', classId);
  }

  async getAssessment(assessmentId: string): Promise<OfflineAssessment | undefined> {
    const db = await this.ensureDB();
    return await db.get('assessments', assessmentId);
  }

  // Attendance operations
  async saveAttendance(attendance: OfflineAttendance): Promise<void> {
    const db = await this.ensureDB();
    await db.put('attendance', { ...attendance, lastModified: new Date() });
    
    // Add to sync queue if not already synced
    if (attendance.syncStatus === 'pending') {
      await this.addToSyncQueue({
        id: `attendance-${attendance.id}-${Date.now()}`,
        type: 'attendance',
        action: 'create',
        data: attendance,
        priority: 3,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });
    }
  }

  async getAttendanceByClass(classId: string, date?: Date): Promise<OfflineAttendance[]> {
    const db = await this.ensureDB();
    const allAttendance = await db.getAllFromIndex('attendance', 'by-class', classId);

    if (date) {
      const targetDate = date.toDateString();
      return allAttendance.filter(att => att.date.toDateString() === targetDate);
    }

    return allAttendance;
  }

  async getAttendanceByStudent(studentId: string): Promise<OfflineAttendance[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('attendance', 'by-student', studentId);
  }

  // Sync queue operations
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const db = await this.ensureDB();
    await db.put('sync_queue', item);
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('sync_queue', 'by-status', 'pending');
  }

  async updateSyncItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const db = await this.ensureDB();
    const item = await db.get('sync_queue', id);
    if (item) {
      await db.put('sync_queue', { ...item, ...updates });
    }
  }

  async clearSyncedItems(): Promise<void> {
    const db = await this.ensureDB();
    const completedItems = await db.getAllFromIndex('sync_queue', 'by-status', 'completed');
    const tx = db.transaction('sync_queue', 'readwrite');
    
    for (const item of completedItems) {
      await tx.store.delete(item.id);
    }
    
    await tx.done;
  }

  /**
   * Clear all data (for logout or reset)
   */
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(['students', 'classes', 'grades', 'assessments', 'attendance', 'sync_queue'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('students').clear(),
      tx.objectStore('classes').clear(),
      tx.objectStore('grades').clear(),
      tx.objectStore('assessments').clear(),
      tx.objectStore('attendance').clear(),
      tx.objectStore('sync_queue').clear(),
    ]);
    
    await tx.done;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    students: number;
    classes: number;
    grades: number;
    assessments: number;
    attendance: number;
    pendingSync: number;
  }> {
    const db = await this.ensureDB();
    
    const [students, classes, grades, assessments, attendance, pendingSync] = await Promise.all([
      db.count('students'),
      db.count('classes'),
      db.count('grades'),
      db.count('assessments'),
      db.count('attendance'),
      db.countFromIndex('sync_queue', 'by-status', 'pending'),
    ]);
    
    return { students, classes, grades, assessments, attendance, pendingSync };
  }
}

// Singleton instance
export const teacherOfflineDB = new TeacherOfflineDBService();
