/**
 * Teacher Offline Manager Component
 * 
 * Main component that initializes and manages all teacher offline functionality
 */

'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { TeacherOfflineDBService, teacherOfflineDB } from '../services/teacher-offline-db.service';
import { TeacherSyncManagerService } from '../services/teacher-sync-manager.service';
import { TeacherOfflineGradingService } from '../services/teacher-offline-grading.service';
import { TeacherStudentManagementService } from '../services/teacher-student-management.service';
import { TeacherAssessmentToolsService } from '../services/teacher-assessment-tools.service';
import { TeacherClassManagementService } from '../services/teacher-class-management.service';

interface TeacherOfflineContextType {
  isInitialized: boolean;
  isOnline: boolean;
  dbService: TeacherOfflineDBService;
  syncManager: TeacherSyncManagerService | null;
  gradingService: TeacherOfflineGradingService | null;
  studentManagementService: TeacherStudentManagementService | null;
  assessmentToolsService: TeacherAssessmentToolsService | null;
  classManagementService: TeacherClassManagementService | null;
  error: string | null;
}

const TeacherOfflineContext = createContext<TeacherOfflineContextType | null>(null);

export const useTeacherOffline = () => {
  const context = useContext(TeacherOfflineContext);
  if (!context) {
    throw new Error('useTeacherOffline must be used within TeacherOfflineManager');
  }
  return context;
};

interface TeacherOfflineManagerProps {
  teacherId: string;
  children: React.ReactNode;
  onInitialized?: () => void;
  onError?: (error: string) => void;
}

export const TeacherOfflineManager: React.FC<TeacherOfflineManagerProps> = ({
  teacherId,
  children,
  onInitialized,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [services, setServices] = useState<{
    syncManager: TeacherSyncManagerService | null;
    gradingService: TeacherOfflineGradingService | null;
    studentManagementService: TeacherStudentManagementService | null;
    assessmentToolsService: TeacherAssessmentToolsService | null;
    classManagementService: TeacherClassManagementService | null;
  }>({
    syncManager: null,
    gradingService: null,
    studentManagementService: null,
    assessmentToolsService: null,
    classManagementService: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeOfflineServices();
    setupOnlineDetection();

    return () => {
      cleanup();
    };
  }, [teacherId]);

  const initializeOfflineServices = async () => {
    try {
      setError(null);
      
      // Initialize database
      await teacherOfflineDB.initialize();
      
      // Initialize all services
      const syncManager = new TeacherSyncManagerService(teacherId);
      const gradingService = new TeacherOfflineGradingService(teacherId);
      const studentManagementService = new TeacherStudentManagementService(teacherId);
      const assessmentToolsService = new TeacherAssessmentToolsService(teacherId);
      const classManagementService = new TeacherClassManagementService(teacherId);

      setServices({
        syncManager,
        gradingService,
        studentManagementService,
        assessmentToolsService,
        classManagementService,
      });

      setIsInitialized(true);
      onInitialized?.();

      console.log('Teacher offline services initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize offline services';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Failed to initialize teacher offline services:', err);
    }
  };

  const setupOnlineDetection = () => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Teacher portal back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Teacher portal offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const cleanup = () => {
    if (services.syncManager) {
      services.syncManager.destroy();
    }
  };

  const contextValue: TeacherOfflineContextType = {
    isInitialized,
    isOnline,
    dbService: teacherOfflineDB,
    syncManager: services.syncManager,
    gradingService: services.gradingService,
    studentManagementService: services.studentManagementService,
    assessmentToolsService: services.assessmentToolsService,
    classManagementService: services.classManagementService,
    error,
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Offline Services Error
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            {error}
          </p>
          <button
            onClick={initializeOfflineServices}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Initializing Teacher Portal
          </h3>
          <p className="text-sm text-gray-600">
            Setting up offline capabilities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TeacherOfflineContext.Provider value={contextValue}>
      {children}
    </TeacherOfflineContext.Provider>
  );
};

export default TeacherOfflineManager;
