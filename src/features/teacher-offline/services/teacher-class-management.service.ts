/**
 * Teacher Class Management Offline Service
 * 
 * Handles offline class management functionality including:
 * - Offline class schedule access
 * - Lesson plan viewing and editing
 * - Resource management capabilities
 * - Limited communication tools
 */

import { teacherOfflineDB, OfflineClass, OfflineStudent } from './teacher-offline-db.service';
import { v4 as uuidv4 } from 'uuid';

export interface LessonPlan {
  id: string;
  classId: string;
  title: string;
  date: Date;
  duration: number; // in minutes
  objectives: string[];
  materials: string[];
  activities: LessonActivity[];
  assessment: string;
  homework?: string;
  notes?: string;
  status: 'draft' | 'published' | 'completed';
  lastModified: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface LessonActivity {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'lecture' | 'discussion' | 'activity' | 'assessment' | 'break';
  resources: string[];
}

export interface ClassSchedule {
  classId: string;
  className: string;
  schedule: ScheduleEntry[];
  upcomingLessons: LessonPlan[];
  totalWeeklyHours: number;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  recurring: boolean;
}

export interface ClassResource {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'other';
  url?: string;
  fileData?: string; // base64 for offline storage
  size?: number;
  uploadedAt: Date;
  lastAccessed?: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface ClassAnnouncement {
  id: string;
  classId: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  publishedAt: Date;
  expiresAt?: Date;
  targetStudents?: string[]; // student IDs, empty means all students
  readBy: string[]; // student IDs who have read
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface ClassStatistics {
  classId: string;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  averageGrade: number;
  totalLessons: number;
  completedLessons: number;
  upcomingAssessments: number;
  recentActivity: {
    date: Date;
    type: 'lesson' | 'assessment' | 'announcement';
    description: string;
  }[];
}

export class TeacherClassManagementService {
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  /**
   * Get class schedule for teacher
   */
  async getClassSchedule(classId?: string): Promise<ClassSchedule[]> {
    try {
      let classes: OfflineClass[];
      
      if (classId) {
        const singleClass = await teacherOfflineDB.getClass(classId);
        classes = singleClass ? [singleClass] : [];
      } else {
        classes = await teacherOfflineDB.getClassesByTeacher(this.teacherId);
      }

      const schedules = await Promise.all(
        classes.map(async (classData) => {
          const lessonPlans = await this.getLessonPlans(classData.id);
          const upcomingLessons = lessonPlans
            .filter(plan => plan.date >= new Date() && plan.status !== 'completed')
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5);

          const totalWeeklyHours = classData.schedule.reduce((total, entry) => {
            const start = new Date(`2000-01-01 ${entry.startTime}`);
            const end = new Date(`2000-01-01 ${entry.endTime}`);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + duration;
          }, 0);

          return {
            classId: classData.id,
            className: classData.name,
            schedule: classData.schedule.map(s => ({
              id: uuidv4(),
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              recurring: true,
            })),
            upcomingLessons,
            totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
          };
        })
      );

      return schedules;
    } catch (error) {
      console.error('Error getting class schedule:', error);
      return [];
    }
  }

  /**
   * Create or update lesson plan
   */
  async saveLessonPlan(lessonPlan: Omit<LessonPlan, 'id' | 'lastModified' | 'syncStatus'>): Promise<string> {
    try {
      const planId = uuidv4();
      
      const plan: LessonPlan = {
        ...lessonPlan,
        id: planId,
        lastModified: new Date(),
        syncStatus: 'pending',
      };

      await this.storeLessonPlan(plan);
      
      // Add to sync queue
      await teacherOfflineDB.addToSyncQueue({
        id: `lesson-plan-${planId}-${Date.now()}`,
        type: 'lesson_plan' as any,
        action: 'create',
        data: plan,
        priority: 3,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });

      console.log(`Lesson plan saved offline: ${planId}`);
      return planId;
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      throw new Error('Failed to save lesson plan');
    }
  }

  /**
   * Get lesson plans for a class
   */
  async getLessonPlans(classId: string, dateRange?: { start: Date; end: Date }): Promise<LessonPlan[]> {
    try {
      const allPlans = await this.getAllLessonPlans();
      let classPlans = allPlans.filter(plan => plan.classId === classId);

      if (dateRange) {
        classPlans = classPlans.filter(plan => 
          plan.date >= dateRange.start && plan.date <= dateRange.end
        );
      }

      return classPlans.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting lesson plans:', error);
      return [];
    }
  }

  /**
   * Update lesson plan status
   */
  async updateLessonPlanStatus(planId: string, status: LessonPlan['status']): Promise<void> {
    try {
      const plans = await this.getAllLessonPlans();
      const planIndex = plans.findIndex(p => p.id === planId);
      
      if (planIndex === -1) {
        throw new Error('Lesson plan not found');
      }

      plans[planIndex] = {
        ...plans[planIndex],
        status,
        lastModified: new Date(),
        syncStatus: 'pending',
      };

      await this.storeLessonPlans(plans);
      console.log(`Lesson plan status updated: ${planId} -> ${status}`);
    } catch (error) {
      console.error('Error updating lesson plan status:', error);
      throw new Error('Failed to update lesson plan status');
    }
  }

  /**
   * Add class resource
   */
  async addClassResource(resource: Omit<ClassResource, 'id' | 'uploadedAt' | 'syncStatus'>): Promise<string> {
    try {
      const resourceId = uuidv4();
      
      const classResource: ClassResource = {
        ...resource,
        id: resourceId,
        uploadedAt: new Date(),
        syncStatus: 'pending',
      };

      const resources = await this.getClassResources(resource.classId);
      resources.push(classResource);
      await this.storeClassResources(resource.classId, resources);

      console.log(`Class resource added: ${resourceId}`);
      return resourceId;
    } catch (error) {
      console.error('Error adding class resource:', error);
      throw new Error('Failed to add class resource');
    }
  }

  /**
   * Get class resources
   */
  async getClassResources(classId: string): Promise<ClassResource[]> {
    try {
      const resourcesData = localStorage.getItem(`class_resources_${classId}`);
      return resourcesData ? JSON.parse(resourcesData) : [];
    } catch (error) {
      console.error('Error getting class resources:', error);
      return [];
    }
  }

  /**
   * Update resource access time
   */
  async updateResourceAccess(resourceId: string, classId: string): Promise<void> {
    try {
      const resources = await this.getClassResources(classId);
      const resourceIndex = resources.findIndex(r => r.id === resourceId);
      
      if (resourceIndex >= 0) {
        resources[resourceIndex].lastAccessed = new Date();
        await this.storeClassResources(classId, resources);
      }
    } catch (error) {
      console.error('Error updating resource access:', error);
    }
  }

  /**
   * Create class announcement
   */
  async createAnnouncement(announcement: Omit<ClassAnnouncement, 'id' | 'publishedAt' | 'readBy' | 'syncStatus'>): Promise<string> {
    try {
      const announcementId = uuidv4();
      
      const classAnnouncement: ClassAnnouncement = {
        ...announcement,
        id: announcementId,
        publishedAt: new Date(),
        readBy: [],
        syncStatus: 'pending',
      };

      const announcements = await this.getClassAnnouncements(announcement.classId);
      announcements.push(classAnnouncement);
      await this.storeClassAnnouncements(announcement.classId, announcements);

      console.log(`Class announcement created: ${announcementId}`);
      return announcementId;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  /**
   * Get class announcements
   */
  async getClassAnnouncements(classId: string, activeOnly: boolean = true): Promise<ClassAnnouncement[]> {
    try {
      const announcementsData = localStorage.getItem(`class_announcements_${classId}`);
      let announcements: ClassAnnouncement[] = announcementsData ? JSON.parse(announcementsData) : [];

      if (activeOnly) {
        const now = new Date();
        announcements = announcements.filter(a => !a.expiresAt || a.expiresAt > now);
      }

      return announcements.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    } catch (error) {
      console.error('Error getting class announcements:', error);
      return [];
    }
  }

  /**
   * Get class statistics
   */
  async getClassStatistics(classId: string): Promise<ClassStatistics> {
    try {
      const [classData, students, lessonPlans, grades, announcements] = await Promise.all([
        teacherOfflineDB.getClass(classId),
        teacherOfflineDB.getStudentsByClass(classId),
        this.getLessonPlans(classId),
        teacherOfflineDB.getGradesByClass(classId),
        this.getClassAnnouncements(classId, false),
      ]);

      if (!classData) {
        throw new Error('Class not found');
      }

      // Calculate statistics
      const totalStudents = students.length;
      const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
      
      const averageAttendance = students.length > 0
        ? students.reduce((sum, s) => sum + s.performance.attendanceRate, 0) / students.length
        : 0;

      const averageGrade = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
        : 0;

      const totalLessons = lessonPlans.length;
      const completedLessons = lessonPlans.filter(p => p.status === 'completed').length;

      // Get upcoming assessments
      const assessments = await teacherOfflineDB.getAssessmentsByClass(classId);
      const upcomingAssessments = assessments.filter(a => 
        a.dueDate > new Date() && a.status === 'published'
      ).length;

      // Recent activity
      const recentActivity = [
        ...lessonPlans.slice(-3).map(p => ({
          date: p.lastModified,
          type: 'lesson' as const,
          description: `Lesson: ${p.title}`,
        })),
        ...assessments.slice(-2).map(a => ({
          date: a.lastSynced,
          type: 'assessment' as const,
          description: `Assessment: ${a.title}`,
        })),
        ...announcements.slice(-2).map(a => ({
          date: a.publishedAt,
          type: 'announcement' as const,
          description: `Announcement: ${a.title}`,
        })),
      ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

      return {
        classId,
        totalStudents,
        activeStudents,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalLessons,
        completedLessons,
        upcomingAssessments,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting class statistics:', error);
      throw new Error('Failed to get class statistics');
    }
  }

  /**
   * Search across class content
   */
  async searchClassContent(classId: string, query: string): Promise<{
    lessonPlans: LessonPlan[];
    resources: ClassResource[];
    announcements: ClassAnnouncement[];
  }> {
    try {
      const [lessonPlans, resources, announcements] = await Promise.all([
        this.getLessonPlans(classId),
        this.getClassResources(classId),
        this.getClassAnnouncements(classId, false),
      ]);

      const searchTerm = query.toLowerCase();

      const filteredLessonPlans = lessonPlans.filter(plan =>
        plan.title.toLowerCase().includes(searchTerm) ||
        plan.objectives.some(obj => obj.toLowerCase().includes(searchTerm)) ||
        plan.notes?.toLowerCase().includes(searchTerm)
      );

      const filteredResources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm)
      );

      const filteredAnnouncements = announcements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm) ||
        announcement.content.toLowerCase().includes(searchTerm)
      );

      return {
        lessonPlans: filteredLessonPlans,
        resources: filteredResources,
        announcements: filteredAnnouncements,
      };
    } catch (error) {
      console.error('Error searching class content:', error);
      return { lessonPlans: [], resources: [], announcements: [] };
    }
  }

  /**
   * Export class data
   */
  async exportClassData(classId: string): Promise<{
    classInfo: OfflineClass | undefined;
    students: OfflineStudent[];
    lessonPlans: LessonPlan[];
    resources: ClassResource[];
    announcements: ClassAnnouncement[];
    statistics: ClassStatistics;
  }> {
    try {
      const [classInfo, students, lessonPlans, resources, announcements, statistics] = await Promise.all([
        teacherOfflineDB.getClass(classId),
        teacherOfflineDB.getStudentsByClass(classId),
        this.getLessonPlans(classId),
        this.getClassResources(classId),
        this.getClassAnnouncements(classId, false),
        this.getClassStatistics(classId),
      ]);

      return {
        classInfo,
        students,
        lessonPlans,
        resources,
        announcements,
        statistics,
      };
    } catch (error) {
      console.error('Error exporting class data:', error);
      throw new Error('Failed to export class data');
    }
  }

  /**
   * Private helper methods
   */
  private async getAllLessonPlans(): Promise<LessonPlan[]> {
    try {
      const plansData = localStorage.getItem(`lesson_plans_${this.teacherId}`);
      return plansData ? JSON.parse(plansData) : [];
    } catch (error) {
      console.error('Error getting all lesson plans:', error);
      return [];
    }
  }

  private async storeLessonPlan(plan: LessonPlan): Promise<void> {
    try {
      const plans = await this.getAllLessonPlans();
      const existingIndex = plans.findIndex(p => p.id === plan.id);
      
      if (existingIndex >= 0) {
        plans[existingIndex] = plan;
      } else {
        plans.push(plan);
      }

      await this.storeLessonPlans(plans);
    } catch (error) {
      console.error('Error storing lesson plan:', error);
      throw error;
    }
  }

  private async storeLessonPlans(plans: LessonPlan[]): Promise<void> {
    localStorage.setItem(`lesson_plans_${this.teacherId}`, JSON.stringify(plans));
  }

  private async storeClassResources(classId: string, resources: ClassResource[]): Promise<void> {
    localStorage.setItem(`class_resources_${classId}`, JSON.stringify(resources));
  }

  private async storeClassAnnouncements(classId: string, announcements: ClassAnnouncement[]): Promise<void> {
    localStorage.setItem(`class_announcements_${classId}`, JSON.stringify(announcements));
  }
}
