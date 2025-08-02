# Teacher Offline Portal

A comprehensive offline-first solution for teachers that enables full functionality without internet connectivity, addressing the gap between student and teacher portal capabilities.

## 🎯 Overview

The Teacher Offline Portal provides teachers with the same level of offline functionality that students enjoy, ensuring uninterrupted educational delivery regardless of connectivity status.

### Key Features

- **Complete Offline Functionality**: All core teaching functions work without internet
- **Automatic Synchronization**: Seamless data sync when connectivity is restored
- **Conflict Resolution**: Smart handling of data conflicts between offline and online changes
- **Real-time Status**: Clear indicators of offline/online status and sync progress
- **Data Persistence**: Robust local storage with IndexedDB for reliability

## 🏗️ Architecture

### Core Services

1. **TeacherOfflineDBService**: IndexedDB-based local database
2. **TeacherSyncManagerService**: Handles online/offline sync operations
3. **TeacherOfflineGradingService**: Complete offline grading system
4. **TeacherStudentManagementService**: Student data and attendance management
5. **TeacherAssessmentToolsService**: Assessment creation and analytics
6. **TeacherClassManagementService**: Class schedules and lesson plans

### Data Storage

```
IndexedDB Stores:
├── students (student records, performance data)
├── classes (class information, schedules)
├── grades (grading data with sync status)
├── assessments (quizzes, assignments, exams)
├── attendance (attendance records)
└── sync_queue (pending sync operations)
```

## 🚀 Quick Start

### 1. Installation

```bash
npm install idb uuid
```

### 2. Basic Setup

```tsx
import { TeacherOfflineManager, TeacherOfflineStatusIndicator } from '@/features/teacher-offline';

function TeacherDashboard({ teacherId }: { teacherId: string }) {
  return (
    <TeacherOfflineManager teacherId={teacherId}>
      <div className="dashboard">
        <TeacherOfflineStatusIndicator teacherId={teacherId} />
        {/* Your teacher dashboard content */}
      </div>
    </TeacherOfflineManager>
  );
}
```

### 3. Using Services

```tsx
import { useTeacherOffline } from '@/features/teacher-offline';

function GradingComponent() {
  const { gradingService, isOnline } = useTeacherOffline();

  const handleGradeSubmission = async (gradeData) => {
    if (gradingService) {
      await gradingService.enterGrade(gradeData);
      // Grade is saved offline and will sync when online
    }
  };

  return (
    <div>
      {!isOnline && (
        <div className="offline-notice">
          Working offline - grades will sync when connection is restored
        </div>
      )}
      {/* Grading interface */}
    </div>
  );
}
```

## 📊 Offline Capabilities

### Grading System
- ✅ Enter individual grades
- ✅ Bulk grade entry
- ✅ Grade calculations
- ✅ Gradebook management
- ✅ Performance analytics
- ✅ Rubric application

### Student Management
- ✅ View student lists
- ✅ Track attendance
- ✅ Performance monitoring
- ✅ Contact information access
- ✅ Student search functionality

### Assessment Tools
- ✅ Create quizzes and assignments
- ✅ Design rubrics
- ✅ Assessment analytics
- ✅ Performance reports
- ✅ Question analysis

### Class Management
- ✅ View class schedules
- ✅ Create lesson plans
- ✅ Manage resources
- ✅ Class announcements
- ✅ Schedule management

## 🔄 Synchronization

### Automatic Sync
- Runs every 5 minutes when online
- Triggered on connectivity restoration
- Background processing with retry logic

### Manual Sync
```tsx
const { syncManager } = useTeacherOffline();

const handleManualSync = async () => {
  try {
    const result = await syncManager.triggerSync();
    console.log(`Synced ${result.syncedItems} items`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

### Conflict Resolution
```tsx
const conflicts = await syncManager.getConflicts();
for (const conflict of conflicts) {
  await syncManager.resolveConflict(conflict.id, 'use_local');
}
```

## 📱 UI Components

### Status Indicator
```tsx
<TeacherOfflineStatusIndicator 
  teacherId={teacherId}
  showDetails={true}
  className="fixed top-4 right-4"
/>
```

### Offline Manager
```tsx
<TeacherOfflineManager 
  teacherId={teacherId}
  onInitialized={() => console.log('Offline services ready')}
  onError={(error) => console.error('Offline error:', error)}
>
  {children}
</TeacherOfflineManager>
```

## 🛠️ API Reference

### Grading Service

```tsx
const gradingService = new TeacherOfflineGradingService(teacherId);

// Enter a grade
await gradingService.enterGrade({
  studentId: 'student-123',
  assessmentId: 'assessment-456',
  score: 85,
  maxScore: 100,
  feedback: 'Great work!'
});

// Get gradebook
const gradebook = await gradingService.getGradebook('class-123');

// Generate report
const report = await gradingService.generateClassReport('class-123');
```

### Student Management Service

```tsx
const studentService = new TeacherStudentManagementService(teacherId);

// Record attendance
await studentService.recordAttendance({
  studentId: 'student-123',
  classId: 'class-456',
  date: new Date(),
  status: 'present'
});

// Get student performance
const performance = await studentService.getStudentPerformance('student-123');
```

### Assessment Tools Service

```tsx
const assessmentService = new TeacherAssessmentToolsService(teacherId);

// Create assessment
const assessmentId = await assessmentService.createAssessment({
  title: 'Math Quiz 1',
  description: 'Basic algebra concepts',
  type: 'quiz',
  maxScore: 100
});

// Generate analytics
const analytics = await assessmentService.generateAssessmentAnalytics(assessmentId);
```

## 🔧 Configuration

### Database Settings
```tsx
// Custom database configuration
const dbService = new TeacherOfflineDBService();
await dbService.initialize();

// Get database statistics
const stats = await dbService.getStats();
console.log(`Offline data: ${stats.students} students, ${stats.grades} grades`);
```

### Sync Settings
```tsx
const syncManager = new TeacherSyncManagerService(teacherId);

// Configure sync intervals
syncManager.setSyncInterval(10 * 60 * 1000); // 10 minutes

// Set retry limits
syncManager.setMaxRetries(5);
```

## 🚨 Error Handling

### Service Errors
```tsx
try {
  await gradingService.enterGrade(gradeData);
} catch (error) {
  if (error.message.includes('offline')) {
    // Handle offline-specific errors
  }
}
```

### Sync Errors
```tsx
syncManager.onStatusChange((status) => {
  if (status.failedItems > 0) {
    // Handle sync failures
    console.log(`${status.failedItems} items failed to sync`);
  }
});
```

## 📈 Performance

### Optimization Tips
- Use batch operations for multiple grades
- Implement pagination for large datasets
- Cache frequently accessed data
- Clean up old sync queue items

### Memory Management
```tsx
// Clear old data periodically
await dbService.clearSyncedItems();

// Monitor database size
const stats = await dbService.getStats();
if (stats.pendingSync > 1000) {
  // Consider cleanup or user notification
}
```

## 🔒 Security

- All data is stored locally in IndexedDB
- No sensitive data is cached unnecessarily
- Sync operations use secure API endpoints
- User authentication is maintained offline

## 🧪 Testing

### Unit Tests
```bash
npm test teacher-offline
```

### Integration Tests
```bash
npm test teacher-offline:integration
```

### Offline Testing
1. Disable network in browser dev tools
2. Perform teacher operations
3. Re-enable network
4. Verify sync functionality

## 📚 Migration Guide

### From Online-Only to Offline-First

1. Wrap your teacher components with `TeacherOfflineManager`
2. Replace direct API calls with offline service calls
3. Add offline status indicators
4. Implement sync progress feedback
5. Handle offline-specific UI states

## 🤝 Contributing

1. Follow the established service patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure offline-first design principles

## 📄 License

This teacher offline functionality is part of the FabriiQ Social Wall project.
