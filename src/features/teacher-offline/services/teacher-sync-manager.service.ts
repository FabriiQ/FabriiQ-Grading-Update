/**
 * Teacher Sync Manager Service
 * 
 * Handles synchronization between offline teacher data and server including:
 * - Offline/online detection
 * - Sync queue processing
 * - Conflict resolution for grading data
 * - Background synchronization
 */

import { teacherOfflineDB, SyncQueueItem, OfflineGrade, OfflineAttendance } from './teacher-offline-db.service';
import { api } from '@/trpc/react';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingItems: number;
  failedItems: number;
  syncProgress: {
    total: number;
    completed: number;
    failed: number;
  };
}

export interface SyncConflict {
  id: string;
  type: 'grade' | 'attendance';
  localData: any;
  serverData: any;
  conflictReason: string;
  resolution?: 'use_local' | 'use_server' | 'merge';
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  conflicts: SyncConflict[];
  errors: string[];
}

export class TeacherSyncManagerService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
    this.setupOnlineDetection();
    this.startAutoSync();
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  /**
   * Start automatic sync every 5 minutes when online
   */
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingItems = await teacherOfflineDB.getPendingSyncItems();
    const failedItems = pendingItems.filter(item => item.status === 'failed');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.getLastSyncTime(),
      pendingItems: pendingItems.length,
      failedItems: failedItems.length,
      syncProgress: {
        total: 0,
        completed: 0,
        failed: failedItems.length,
      },
    };
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    return await this.syncPendingData();
  }

  /**
   * Sync pending data to server
   */
  private async syncPendingData(): Promise<SyncResult> {
    this.isSyncing = true;
    this.notifyStatusChange();

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      conflicts: [],
      errors: [],
    };

    try {
      const pendingItems = await teacherOfflineDB.getPendingSyncItems();
      
      for (const item of pendingItems) {
        try {
          await this.syncItem(item, result);
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Failed to sync ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Update item status to failed
          await teacherOfflineDB.updateSyncItem(item.id, {
            status: 'failed',
            retryCount: item.retryCount + 1,
            lastAttempt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Clean up completed items
      await teacherOfflineDB.clearSyncedItems();

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }

    return result;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem, result: SyncResult): Promise<void> {
    // Mark as processing
    await teacherOfflineDB.updateSyncItem(item.id, {
      status: 'processing',
      lastAttempt: new Date(),
    });

    switch (item.type) {
      case 'grade':
        await this.syncGrade(item, result);
        break;
      case 'attendance':
        await this.syncAttendance(item, result);
        break;
      case 'assessment':
        await this.syncAssessment(item, result);
        break;
      case 'student_update':
        await this.syncStudentUpdate(item, result);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }

    // Mark as completed
    await teacherOfflineDB.updateSyncItem(item.id, {
      status: 'completed',
    });
  }

  /**
   * Sync grade data
   */
  private async syncGrade(item: SyncQueueItem, result: SyncResult): Promise<void> {
    const gradeData = item.data as OfflineGrade;

    try {
      // Check if grade already exists on server
      const existingGrade = await this.checkServerGrade(gradeData.id);

      if (existingGrade && this.hasConflict(gradeData, existingGrade)) {
        // Handle conflict
        const conflict: SyncConflict = {
          id: gradeData.id,
          type: 'grade',
          localData: gradeData,
          serverData: existingGrade,
          conflictReason: 'Grade modified on both client and server',
        };
        result.conflicts.push(conflict);
        return;
      }

      // Sync to server
      if (item.action === 'create') {
        await this.createGradeOnServer(gradeData);
      } else if (item.action === 'update') {
        await this.updateGradeOnServer(gradeData);
      }

      // Update local sync status
      await teacherOfflineDB.saveGrade({
        ...gradeData,
        syncStatus: 'synced',
      });

    } catch (error) {
      console.error('Error syncing grade:', error);
      throw error;
    }
  }

  /**
   * Sync attendance data
   */
  private async syncAttendance(item: SyncQueueItem, result: SyncResult): Promise<void> {
    const attendanceData = item.data as OfflineAttendance;

    try {
      // Check for conflicts
      const existingAttendance = await this.checkServerAttendance(attendanceData.id);

      if (existingAttendance && this.hasConflict(attendanceData, existingAttendance)) {
        const conflict: SyncConflict = {
          id: attendanceData.id,
          type: 'attendance',
          localData: attendanceData,
          serverData: existingAttendance,
          conflictReason: 'Attendance modified on both client and server',
        };
        result.conflicts.push(conflict);
        return;
      }

      // Sync to server
      if (item.action === 'create') {
        await this.createAttendanceOnServer(attendanceData);
      } else if (item.action === 'update') {
        await this.updateAttendanceOnServer(attendanceData);
      }

      // Update local sync status
      await teacherOfflineDB.saveAttendance({
        ...attendanceData,
        syncStatus: 'synced',
      });

    } catch (error) {
      console.error('Error syncing attendance:', error);
      throw error;
    }
  }

  /**
   * Sync assessment data
   */
  private async syncAssessment(item: SyncQueueItem, result: SyncResult): Promise<void> {
    // Implementation for assessment sync
    console.log('Syncing assessment:', item.data);
    // TODO: Implement assessment sync logic
  }

  /**
   * Sync student update data
   */
  private async syncStudentUpdate(item: SyncQueueItem, result: SyncResult): Promise<void> {
    // Implementation for student update sync
    console.log('Syncing student update:', item.data);
    // TODO: Implement student update sync logic
  }

  /**
   * Server API calls (these would use your actual API)
   */
  private async checkServerGrade(gradeId: string): Promise<any> {
    // TODO: Implement actual API call to check server grade
    return null;
  }

  private async createGradeOnServer(gradeData: OfflineGrade): Promise<void> {
    // TODO: Implement actual API call to create grade
    console.log('Creating grade on server:', gradeData);
  }

  private async updateGradeOnServer(gradeData: OfflineGrade): Promise<void> {
    // TODO: Implement actual API call to update grade
    console.log('Updating grade on server:', gradeData);
  }

  private async checkServerAttendance(attendanceId: string): Promise<any> {
    // TODO: Implement actual API call to check server attendance
    return null;
  }

  private async createAttendanceOnServer(attendanceData: OfflineAttendance): Promise<void> {
    // TODO: Implement actual API call to create attendance
    console.log('Creating attendance on server:', attendanceData);
  }

  private async updateAttendanceOnServer(attendanceData: OfflineAttendance): Promise<void> {
    // TODO: Implement actual API call to update attendance
    console.log('Updating attendance on server:', attendanceData);
  }

  /**
   * Conflict detection
   */
  private hasConflict(localData: any, serverData: any): boolean {
    // Simple conflict detection based on lastModified timestamp
    if (!localData.lastModified || !serverData.lastModified) {
      return false;
    }

    const localTime = new Date(localData.lastModified).getTime();
    const serverTime = new Date(serverData.lastModified).getTime();

    // Consider it a conflict if both were modified within 1 minute of each other
    return Math.abs(localTime - serverTime) < 60000;
  }

  /**
   * Resolve sync conflicts
   */
  async resolveConflict(conflictId: string, resolution: 'use_local' | 'use_server' | 'merge'): Promise<void> {
    // TODO: Implement conflict resolution logic
    console.log(`Resolving conflict ${conflictId} with resolution: ${resolution}`);
  }

  /**
   * Download fresh data from server
   */
  async downloadServerData(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot download data while offline');
    }

    try {
      // TODO: Implement server data download
      // This would fetch fresh data for:
      // - Classes assigned to teacher
      // - Students in those classes
      // - Recent grades and assessments
      // - Attendance records

      console.log('Downloading fresh data from server...');
      
    } catch (error) {
      console.error('Error downloading server data:', error);
      throw error;
    }
  }

  /**
   * Force sync retry for failed items
   */
  async retryFailedSync(): Promise<SyncResult> {
    const failedItems = await teacherOfflineDB.getPendingSyncItems();
    const retryItems = failedItems.filter(item => 
      item.status === 'failed' && item.retryCount < item.maxRetries
    );

    // Reset failed items to pending
    for (const item of retryItems) {
      await teacherOfflineDB.updateSyncItem(item.id, {
        status: 'pending',
        error: undefined,
      });
    }

    return await this.triggerSync();
  }

  /**
   * Private helper methods
   */
  private notifyStatusChange(): void {
    this.getSyncStatus().then(status => {
      this.statusCallbacks.forEach(callback => callback(status));
    });
  }

  private getLastSyncTime(): Date | null {
    // TODO: Store and retrieve last sync time from localStorage
    const lastSync = localStorage.getItem('teacher_last_sync');
    return lastSync ? new Date(lastSync) : null;
  }

  private setLastSyncTime(): void {
    localStorage.setItem('teacher_last_sync', new Date().toISOString());
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.stopAutoSync();
    this.statusCallbacks = [];
  }
}
