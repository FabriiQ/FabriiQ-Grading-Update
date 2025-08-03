/**
 * Teacher Offline Status Indicator Component
 * 
 * Displays offline/online status, sync progress, and provides
 * offline workflow guidance for teachers
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Download,
  ArrowUp,
  X
} from 'lucide-react';
import { TeacherSyncManagerService, SyncStatus } from '../services/teacher-sync-manager.service';
import { teacherOfflineDB } from '../services/teacher-offline-db.service';

interface TeacherOfflineStatusIndicatorProps {
  teacherId: string;
  className?: string;
  showDetails?: boolean;
}

export const TeacherOfflineStatusIndicator: React.FC<TeacherOfflineStatusIndicatorProps> = ({
  teacherId,
  className = '',
  showDetails = false,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncManager, setSyncManager] = useState<TeacherSyncManagerService | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    const manager = new TeacherSyncManagerService(teacherId);
    setSyncManager(manager);

    // Subscribe to status changes
    const unsubscribe = manager.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // Initial status load
    manager.getSyncStatus().then(setSyncStatus);

    // Load database stats
    teacherOfflineDB.getStats().then(setDbStats);

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [teacherId]);

  const handleManualSync = async () => {
    if (!syncManager || !syncStatus?.isOnline) return;

    try {
      await syncManager.triggerSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleRetryFailedSync = async () => {
    if (!syncManager) return;

    try {
      await syncManager.retryFailedSync();
    } catch (error) {
      console.error('Retry failed sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="w-4 h-4 text-gray-400" />;

    if (!syncStatus.isOnline) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if ((syncStatus.failedItems || 0) > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }

    if ((syncStatus.pendingItems || 0) > 0) {
      return <ArrowUp className="w-4 h-4 text-orange-500" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Loading...';

    if (!syncStatus.isOnline) {
      return 'Offline Mode';
    }

    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }

    if ((syncStatus.failedItems || 0) > 0) {
      return `${syncStatus.failedItems || 0} sync errors`;
    }

    if ((syncStatus.pendingItems || 0) > 0) {
      return `${syncStatus.pendingItems || 0} pending`;
    }

    return 'All synced';
  };

  const getStatusColor = () => {
    if (!syncStatus) return 'text-gray-500';

    if (!syncStatus.isOnline) return 'text-red-600';
    if (syncStatus.isSyncing) return 'text-blue-600';
    if ((syncStatus.failedItems || 0) > 0) return 'text-yellow-600';
    if ((syncStatus.pendingItems || 0) > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  const formatLastSync = () => {
    if (!syncStatus?.lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - syncStatus.lastSyncTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
          syncStatus?.isOnline 
            ? 'bg-white border-gray-200 hover:bg-gray-50' 
            : 'bg-red-50 border-red-200 hover:bg-red-100'
        }`}
        onClick={() => setShowDetailPanel(!showDetailPanel)}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {syncStatus?.pendingItems && syncStatus.pendingItems > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            {syncStatus.pendingItems}
          </span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetailPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Offline Status
              </h3>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                {syncStatus?.isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {syncStatus?.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {syncStatus?.isOnline 
                  ? 'Connected to server. Data will sync automatically.'
                  : 'Working offline. Changes will sync when connection is restored.'
                }
              </p>
            </div>

            {/* Sync Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Sync Status</span>
                <span className="text-sm text-gray-500">
                  Last sync: {formatLastSync()}
                </span>
              </div>
              
              {syncStatus?.isSyncing && (
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Syncing data...</span>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Pending items:</span>
                  <span className={(syncStatus?.pendingItems || 0) > 0 ? 'text-orange-600' : 'text-gray-600'}>
                    {syncStatus?.pendingItems || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed items:</span>
                  <span className={(syncStatus?.failedItems || 0) > 0 ? 'text-red-600' : 'text-gray-600'}>
                    {syncStatus?.failedItems || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Stats */}
            {dbStats && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Offline Data</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Students:</span>
                    <span>{dbStats.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classes:</span>
                    <span>{dbStats.classes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grades:</span>
                    <span>{dbStats.grades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assessments:</span>
                    <span>{dbStats.assessments}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {syncStatus?.isOnline && (
                <button
                  onClick={handleManualSync}
                  disabled={syncStatus.isSyncing}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              )}

              {(syncStatus?.failedItems || 0) > 0 && (
                <button
                  onClick={handleRetryFailedSync}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Failed Items</span>
                </button>
              )}
            </div>

            {/* Offline Tips */}
            {!syncStatus?.isOnline && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Working Offline
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You can still grade assignments</li>
                  <li>• Take attendance for your classes</li>
                  <li>• Create lesson plans and assessments</li>
                  <li>• View student information</li>
                  <li>• All changes will sync when online</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherOfflineStatusIndicator;
