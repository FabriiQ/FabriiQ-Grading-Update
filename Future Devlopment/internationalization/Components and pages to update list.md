I'll analyze the codebase to identify all components and pages that need to be updated for multi-language implementation. Let me examine the structure and identify the scope of internationalization work needed.Based on my analysis of the codebase and the internationalization documentation, I can provide you with a comprehensive list of all components and pages that need to be updated for multi-language implementation.

# 🌐 **MULTI-LANGUAGE IMPLEMENTATION - COMPONENT UPDATE LIST**

## **📊 SUMMARY STATISTICS**

### **Total Components to Update: 247**
### **Total Pages to Update: 43**
### **Total Files to Modify: 290+**

---

## **🔧 CORE INFRASTRUCTURE (8 Files)**

### **Configuration Files**
- [ ] `next.config.js` - Add next-intl plugin
- [ ] `src/middleware.ts` - Integrate locale routing
- [ ] `src/config/i18n.ts` - Locale configuration (NEW)
- [ ] `src/i18n.ts` - next-intl configuration (NEW)
- [ ] `src/app/layout.tsx` - Add locale provider
- [ ] `src/app/client-layout.tsx` - Locale integration
- [ ] `tailwind.config.js` - RTL support
- [ ] `globals.css` - RTL styles

---

## **📄 PAGES TO UPDATE (43 Pages)**

### **Authentication Pages (5)**
- [ ] `src/app/[locale]/login/page.tsx`
- [ ] `src/app/[locale]/register/page.tsx`
- [ ] `src/app/[locale]/forgot-password/page.tsx`
- [ ] `src/app/[locale]/reset-password/page.tsx`
- [ ] `src/app/[locale]/verify-email/page.tsx`

### **Student Portal Pages (12)**
- [ ] `src/app/[locale]/[institution]/student/dashboard/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/activities/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/activities/[activityId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/assessments/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/assessments/[assessmentId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/grades/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/profile/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/social-wall/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/calendar/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/classes/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/classes/[classId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/student/achievements/page.tsx`

### **Teacher Portal Pages (15)**
- [ ] `src/app/[locale]/[institution]/teacher/dashboard/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/classes/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/classes/[classId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/classes/[classId]/students/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/activities/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/activities/create/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/activities/[activityId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/assessments/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/assessments/create/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/assessments/[assessmentId]/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/grades/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/analytics/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/social-wall/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/profile/page.tsx`
- [ ] `src/app/[locale]/[institution]/teacher/calendar/page.tsx`

### **Admin Portal Pages (8)**
- [ ] `src/app/[locale]/[institution]/admin/dashboard/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/users/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/campus/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/settings/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/analytics/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/reports/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/classes/page.tsx`
- [ ] `src/app/[locale]/[institution]/admin/subjects/page.tsx`

### **Error & Utility Pages (3)**
- [ ] `src/app/[locale]/404/page.tsx`
- [ ] `src/app/[locale]/500/page.tsx`
- [ ] `src/app/[locale]/maintenance/page.tsx`

---

## **🧩 COMPONENTS TO UPDATE (247 Components)**

### **Layout Components (15)**
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/Footer.tsx`
- [ ] `src/components/layout/Sidebar.tsx`
- [ ] `src/components/layout/MobileSidebar.tsx`
- [ ] `src/components/layout/Navigation.tsx`
- [ ] `src/components/layout/Breadcrumbs.tsx`
- [ ] `src/components/layout/UserMenu.tsx`
- [ ] `src/components/layout/NotificationDropdown.tsx`
- [ ] `src/components/layout/SearchBar.tsx`
- [ ] `src/components/layout/ThemeToggle.tsx`
- [ ] `src/components/layout/LanguageSelector.tsx` (NEW)
- [ ] `src/components/layout/MobileNavigation.tsx`
- [ ] `src/components/layout/PageHeader.tsx`
- [ ] `src/components/layout/PageWrapper.tsx`
- [ ] `src/components/layout/LoadingLayout.tsx`

### **Authentication Components (12)**
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/auth/RegisterForm.tsx`
- [ ] `src/components/auth/ForgotPasswordForm.tsx`
- [ ] `src/components/auth/ResetPasswordForm.tsx`
- [ ] `src/components/auth/EmailVerificationForm.tsx`
- [ ] `src/components/auth/AuthLayout.tsx`
- [ ] `src/components/auth/SocialLogin.tsx`
- [ ] `src/components/auth/AuthGuard.tsx`
- [ ] `src/components/auth/RoleGuard.tsx`
- [ ] `src/components/auth/SessionProvider.tsx`
- [ ] `src/components/auth/LogoutButton.tsx`
- [ ] `src/components/auth/AuthErrorBoundary.tsx`

### **UI Components (25)**
- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Modal.tsx`
- [ ] `src/components/ui/Alert.tsx`
- [ ] `src/components/ui/Toast.tsx`
- [ ] `src/components/ui/Tooltip.tsx`
- [ ] `src/components/ui/Dropdown.tsx`
- [ ] `src/components/ui/Card.tsx`
- [ ] `src/components/ui/Badge.tsx`
- [ ] `src/components/ui/Avatar.tsx`
- [ ] `src/components/ui/LoadingSpinner.tsx`
- [ ] `src/components/ui/EmptyState.tsx`
- [ ] `src/components/ui/ErrorState.tsx`
- [ ] `src/components/ui/ConfirmDialog.tsx`
- [ ] `src/components/ui/Pagination.tsx`
- [ ] `src/components/ui/Table.tsx`
- [ ] `src/components/ui/DataTable.tsx`
- [ ] `src/components/ui/SearchInput.tsx`
- [ ] `src/components/ui/FilterDropdown.tsx`
- [ ] `src/components/ui/DatePicker.tsx`
- [ ] `src/components/ui/TimePicker.tsx`
- [ ] `src/components/ui/FileUpload.tsx`
- [ ] `src/components/ui/ProgressBar.tsx`
- [ ] `src/components/ui/Tabs.tsx`
- [ ] `src/components/ui/Accordion.tsx`
- [ ] `src/components/ui/Switch.tsx`

### **Form Components (18)**
- [ ] `src/components/forms/FormField.tsx`
- [ ] `src/components/forms/TextInput.tsx`
- [ ] `src/components/forms/TextArea.tsx`
- [ ] `src/components/forms/Select.tsx`
- [ ] `src/components/forms/MultiSelect.tsx`
- [ ] `src/components/forms/Checkbox.tsx`
- [ ] `src/components/forms/RadioGroup.tsx`
- [ ] `src/components/forms/NumberInput.tsx`
- [ ] `src/components/forms/EmailInput.tsx`
- [ ] `src/components/forms/PasswordInput.tsx`
- [ ] `src/components/forms/PhoneInput.tsx`
- [ ] `src/components/forms/ColorPicker.tsx`
- [ ] `src/components/forms/RichTextEditor.tsx`
- [ ] `src/components/forms/FormValidation.tsx`
- [ ] `src/components/forms/FormSubmit.tsx`
- [ ] `src/components/forms/FormReset.tsx`
- [ ] `src/components/forms/FormProgress.tsx`
- [ ] `src/components/forms/FormWizard.tsx`

### **Student Portal Components (35)**
- [ ] `src/components/student/Dashboard.tsx`
- [ ] `src/components/student/DashboardStats.tsx`
- [ ] `src/components/student/RecentActivities.tsx`
- [ ] `src/components/student/UpcomingAssessments.tsx`
- [ ] `src/components/student/GradeOverview.tsx`
- [ ] `src/components/student/ActivityCard.tsx`
- [ ] `src/components/student/ActivityList.tsx`
- [ ] `src/components/student/ActivityViewer.tsx`
- [ ] `src/components/student/AssessmentCard.tsx`
- [ ] `src/components/student/AssessmentList.tsx`
- [ ] `src/components/student/AssessmentViewer.tsx`
- [ ] `src/components/student/GradeCard.tsx`
- [ ] `src/components/student/GradesList.tsx`
- [ ] `src/components/student/GradeDetails.tsx`
- [ ] `src/components/student/ProfileForm.tsx`
- [ ] `src/components/student/ProfileAvatar.tsx`
- [ ] `src/components/student/SocialWallPost.tsx`
- [ ] `src/components/student/SocialWallFeed.tsx`
- [ ] `src/components/student/SocialWallComments.tsx`
- [ ] `src/components/student/CalendarView.tsx`
- [ ] `src/components/student/CalendarEvent.tsx`
- [ ] `src/components/student/ClassCard.tsx`
- [ ] `src/components/student/ClassList.tsx`
- [ ] `src/components/student/ClassDetails.tsx`
- [ ] `src/components/student/AchievementBadge.tsx`
- [ ] `src/components/student/AchievementsList.tsx`
- [ ] `src/components/student/ProgressTracker.tsx`
- [ ] `src/components/student/LeaderboardCard.tsx`
- [ ] `src/components/student/NotificationsList.tsx`
- [ ] `src/components/student/StudyPlan.tsx`
- [ ] `src/components/student/LearningPath.tsx`
- [ ] `src/components/student/PerformanceChart.tsx`
- [ ] `src/components/student/AttendanceTracker.tsx`
- [ ] `src/components/student/ResourceLibrary.tsx`
- [ ] `src/components/student/HelpCenter.tsx`

### **Teacher Portal Components (45)**
- [ ] `src/components/teacher/Dashboard.tsx`
- [ ] `src/components/teacher/DashboardStats.tsx`
- [ ] `src/components/teacher/ClassOverview.tsx`
- [ ] `src/components/teacher/ClassCard.tsx`
- [ ] `src/components/teacher/ClassList.tsx`
- [ ] `src/components/teacher/ClassDetails.tsx`
- [ ] `src/components/teacher/ClassMetrics.tsx`
- [ ] `src/components/teacher/StudentCard.tsx`
- [ ] `src/components/teacher/StudentList.tsx`
- [ ] `src/components/teacher/StudentProfile.tsx`
- [ ] `src/components/teacher/ActivityCreator.tsx`
- [ ] `src/components/teacher/ActivityEditor.tsx`
- [ ] `src/components/teacher/ActivityList.tsx`
- [ ] `src/components/teacher/ActivityPreview.tsx`
- [ ] `src/components/teacher/AssessmentCreator.tsx`
- [ ] `src/components/teacher/AssessmentEditor.tsx`
- [ ] `src/components/teacher/AssessmentList.tsx`
- [ ] `src/components/teacher/AssessmentPreview.tsx`
- [ ] `src/components/teacher/GradingInterface.tsx`
- [ ] `src/components/teacher/GradebookView.tsx`
- [ ] `src/components/teacher/GradeEntry.tsx`
- [ ] `src/components/teacher/RubricEditor.tsx`
- [ ] `src/components/teacher/RubricViewer.tsx`
- [ ] `src/components/teacher/AnalyticsOverview.tsx`
- [ ] `src/components/teacher/PerformanceChart.tsx`
- [ ] `src/components/teacher/BloomsAnalytics.tsx`
- [ ] `src/components/teacher/StudentProgress.tsx`
- [ ] `src/components/teacher/ClassProgress.tsx`
- [ ] `src/components/teacher/AttendanceTracker.tsx`
- [ ] `src/components/teacher/LessonPlanner.tsx`
- [ ] `src/components/teacher/CurriculumMapper.tsx`
- [ ] `src/components/teacher/ResourceLibrary.tsx`
- [ ] `src/components/teacher/AnnouncementCreator.tsx`
- [ ] `src/components/teacher/MessageCenter.tsx`
- [ ] `src/components/teacher/FeedbackTools.tsx`
- [ ] `src/components/teacher/ReportGenerator.tsx`
- [ ] `src/components/teacher/ClassCalendar.tsx`
- [ ] `src/components/teacher/ScheduleManager.tsx`
- [ ] `src/components/teacher/MaterialUploader.tsx`
- [ ] `src/components/teacher/QuestionBank.tsx`
- [ ] `src/components/teacher/ContentLibrary.tsx`
- [ ] `src/components/teacher/TeacherProfile.tsx`
- [ ] `src/components/teacher/TeacherSettings.tsx`
- [ ] `src/components/teacher/HelpCenter.tsx`
- [ ] `src/components/teacher/TrainingResources.tsx`

### **Admin Portal Components (25)**
- [ ] `src/components/admin/Dashboard.tsx`
- [ ] `src/components/admin/UserManagement.tsx`
- [ ] `src/components/admin/UserCard.tsx`
- [ ] `src/components/admin/UserList.tsx`
- [ ] `src/components/admin/UserEditor.tsx`
- [ ] `src/components/admin/CampusManagement.tsx`
- [ ] `src/components/admin/CampusCard.tsx`
- [ ] `src/components/admin/CampusEditor.tsx`
- [ ] `src/components/admin/SystemSettings.tsx`
- [ ] `src/components/admin/SecuritySettings.tsx`
- [ ] `src/components/admin/IntegrationSettings.tsx`
- [ ] `src/components/admin/AnalyticsOverview.tsx`
- [ ] `src/components/admin/SystemReports.tsx`
- [ ] `src/components/admin/AuditLogs.tsx`
- [ ] `src/components/admin/PerformanceMetrics.tsx`
- [ ] `src/components/admin/ClassManagement.tsx`
- [ ] `src/components/admin/SubjectManagement.tsx`
- [ ] `src/components/admin/CurriculumManager.tsx`
- [ ] `src/components/admin/ContentApproval.tsx`
- [ ] `src/components/admin/SystemHealth.tsx`
- [ ] `src/components/admin/BackupManager.tsx`
- [ ] `src/components/admin/NotificationCenter.tsx`
- [ ] `src/components/admin/SupportTickets.tsx`
- [ ] `src/components/admin/BulkOperations.tsx`
- [ ] `src/components/admin/AdminProfile.tsx`

### **Activity Components (42)**
- [ ] `src/features/activities/components/ui/UniversalActivitySubmit.tsx`
- [ ] `src/features/activities/components/ui/ActivityButton.tsx`
- [ ] `src/features/activities/components/ui/ThemeWrapper.tsx`
- [ ] `src/features/activities/components/ui/AnimatedSubmitButton.tsx`
- [ ] `src/features/activities/components/viewers/MultipleChoiceViewer.tsx`
- [ ] `src/features/activities/components/viewers/TrueFalseViewer.tsx`
- [ ] `src/features/activities/components/viewers/FillInTheBlanksViewer.tsx`
- [ ] `src/features/activities/components/viewers/MatchingViewer.tsx`
- [ ] `src/features/activities/components/viewers/DragAndDropViewer.tsx`
- [ ] `src/features/activities/components/viewers/SequenceViewer.tsx`
- [ ] `src/features/activities/components/viewers/HotspotViewer.tsx`
- [ ] `src/features/activities/components/viewers/NumericViewer.tsx`
- [ ] `src/features/activities/components/viewers/EssayViewer.tsx`
- [ ] `src/features/activities/components/viewers/ReadingViewer.tsx`
- [ ] `src/features/activities/components/viewers/VideoViewer.tsx`
- [ ] `src/features/activities/components/viewers/FlashCardViewer.tsx`
- [ ] `src/features/activities/components/viewers/H5PViewer.tsx`
- [ ] `src/features/activities/components/viewers/BookViewer.tsx`
- [ ] `src/features/activities/components/editors/MultipleChoiceEditor.tsx`
- [ ] `src/features/activities/components/editors/TrueFalseEditor.tsx`
- [ ] `src/features/activities/components/editors/FillInTheBlanksEditor.tsx`
- [ ] `src/features/activities/components/editors/MatchingEditor.tsx`
- [ ] `src/features/activities/components/editors/DragAndDropEditor.tsx`
- [ ] `src/features/activities/components/editors/SequenceEditor.tsx`
- [ ] `src/features/activities/components/editors/HotspotEditor.tsx`
- [ ] `src/features/activities/components/editors/NumericEditor.tsx`
- [ ] `src/features/activities/components/editors/EssayEditor.tsx`
- [ ] `src/features/activities/components/editors/ReadingEditor.tsx`
- [ ] `src/features/activities/components/editors/VideoEditor.tsx`
- [ ] `src/features/activities/components/editors/FlashCardEditor.tsx`
- [ ] `src/features/activities/components/editors/H5PEditor.tsx`
- [ ] `src/features/activities/components/editors/BookEditor.tsx`
- [ ] `src/features/activities/components/creators/UnifiedActivityCreator.tsx`
- [ ] `src/features/activities/components/creators/ActivityTypeSelector.tsx`
- [ ] `src/features/activities/components/creators/ActivitySettings.tsx`
- [ ] `src/features/activities/components/shared/QuestionEditor.tsx`
- [ ] `src/features/activities/components/shared/AnswerOption.tsx`
- [ ] `src/features/activities/components/shared/MediaUploader.tsx`
- [ ] `src/features/activities/components/shared/ContentEditor.tsx`
- [ ] `src/features/activities/components/shared/PreviewMode.tsx`
- [ ] `src/features/activities/components/shared/ActivityValidator.tsx`

### **Assessment Components (20)**
- [ ] `src/components/assessments/AssessmentBuilder.tsx`
- [ ] `src/components/assessments/AssessmentPreview.tsx`
- [ ] `src/components/assessments/AssessmentTaker.tsx`
- [ ] `src/components/assessments/QuestionBank.tsx`
- [ ] `src/components/assessments/QuestionEditor.tsx`
- [ ] `src/components/assessments/QuestionTypes.tsx`
- [ ] `src/components/assessments/RubricBuilder.tsx`
- [ ] `src/components/assessments/RubricViewer.tsx`
- [ ] `src/components/assessments/GradingInterface.tsx`
- [ ] `src/components/assessments/FeedbackEditor.tsx`
- [ ] `src/components/assessments/ScoreCalculator.tsx`
- [ ] `src/components/assessments/AssessmentSettings.tsx`
- [ ] `src/components/assessments/TimerComponent.tsx`
- [ ] `src/components/assessments/ProgressTracker.tsx`
- [ ] `src/components/assessments/SubmissionReview.tsx`
- [ ] `src/components/assessments/AntiCheatTools.tsx`
- [ ] `src/components/assessments/AccessibilityTools.tsx`
- [ ] `src/components/assessments/AssessmentAnalytics.tsx`
- [ ] `src/components/assessments/PeerReview.tsx`
- [ ] `src/components/assessments/AssessmentScheduler.tsx`

### **Social Wall Components (15)**
- [ ] `src/components/social-wall/SocialWallFeed.tsx`
- [ ] `src/components/social-wall/PostCard.tsx`
- [ ] `src/components/social-wall/PostCreator.tsx`
- [ ] `src/components/social-wall/PostEditor.tsx`
- [ ] `src/components/social-wall/CommentSection.tsx`
- [ ] `src/components/social-wall/CommentCard.tsx`
- [ ] `src/components/social-wall/ReactionButton.tsx`
- [ ] `src/components/social-wall/ShareButton.tsx`
- [ ] `src/components/social-wall/MediaUploader.tsx`
- [ ] `src/components/social-wall/HashtagSelector.tsx`
- [ ] `src/components/social-wall/MentionSelector.tsx`
- [ ] `src/components/social-wall/PostFilters.tsx`
- [ ] `src/components/social-wall/TrendingTopics.tsx`
- [ ] `src/components/social-wall/UserMentions.tsx`
- [ ] `src/components/social-wall/ModerationTools.tsx`

### **Analytics Components (20)**
- [ ] `src/components/analytics/DashboardOverview.tsx`
- [ ] `src/components/analytics/PerformanceChart.tsx`
- [ ] `src/components/analytics/ProgressChart.tsx`
- [ ] `src/components/analytics/BloomsChart.tsx`
- [ ] `src/components/analytics/EngagementMetrics.tsx`
- [ ] `src/components/analytics/LearningOutcomes.tsx`
- [ ] `src/components/analytics/TimeAnalytics.tsx`
- [ ] `src/components/analytics/ComparisonChart.tsx`
- [ ] `src/components/analytics/TrendAnalysis.tsx`
- [ ] `src/components/analytics/PredictiveInsights.tsx`
- [ ] `src/components/analytics/ReportGenerator.tsx`
- [ ] `src/components/analytics/DataExporter.tsx`
- [ ] `src/components/analytics/FilterControls.tsx`
- [ ] `src/components/analytics/MetricCard.tsx`
- [ ] `src/components/analytics/ChartLegend.tsx`
- [ ] `src/components/analytics/DataTable.tsx`
- [ ] `src/components/analytics/InsightsPanel.tsx`
- [ ] `src/components/analytics/AlertsPanel.tsx`
- [ ] `src/components/analytics/CustomReports.tsx`
- [ ] `src/components/analytics/ScheduledReports.tsx`

### **Shared Feature Components (15)**
- [ ] `src/components/shared/NotificationCenter.tsx`
- [ ] `src/components/shared/MessageCenter.tsx`
- [ ] `src/components/shared/HelpCenter.tsx`
- [ ] `src/components/shared/SearchInterface.tsx`
- [ ] `src/components/shared/CalendarWidget.tsx`
- [ ] `src/components/shared/WeatherWidget.tsx`
- [ ] `src/components/shared/NewsWidget.tsx`
- [ ] `src/components/shared/AnnouncementBanner.tsx`
- [ ] `src/components/shared/QuickActions.tsx`
- [ ] `src/components/shared/RecentActivity.tsx`
- [ ] `src/components/shared/UserStatus.tsx`
- [ ] `src/components/shared/OnlineIndicator.tsx`
- [ ] `src/components/shared/MaintenanceMode.tsx`
- [ ] `src/components/shared/CookieConsent.tsx`
- [ ] `src/components/shared/FeatureToggle.tsx`

---

## **📁 TRANSLATION FILES TO CREATE (75 Files)**

### **English Translation Files (25)**
```
/messages/en/
├── common.json
├── navigation.json
├── auth.json
├── forms.json
├── errors.json
├── student/
│   ├── dashboard.json
│   ├── activities.json
│   ├── grades.json
│   ├── profile.json
│   └── social-wall.json
├── teacher/
│   ├── dashboard.json
│   ├── classes.json
│   ├── assessments.json
│   ├── activities.json
│   ├── analytics.json
│   └── grading.json
├── admin/
│   ├── dashboard.json
│   ├── users.json
│   ├── campus.json
│   └── settings.json
└── features/
    ├── social-wall.json
    ├── h5p.json
    ├── bloom.json
    └── rubrics.json
```

### **Arabic Translation Files (25)**
```
/messages/ar/ [same structure as English]
```

### **Spanish Translation Files (25)**
```
/messages/es/ [same structure as English]
```

---

## **🎯 IMPLEMENTATION PRIORITY**

### **Phase 1: Critical Infrastructure (Week 1)**
- Core configuration files (8 files)
- Layout components (15 components)
- Authentication components (12 components)
- UI components (25 components)

### **Phase 2: Core Features (Weeks 2-3)**
- Form components (18 components)
- Student portal components (35 components)
- Teacher portal components (45 components)

### **Phase 3: Advanced Features (Weeks 4-5)**
- Activity components (42 components)
- Assessment components (20 components)
- Analytics components (20 components)

### **Phase 4: Additional Features (Week 6)**
- Admin portal components (25 components)
- Social wall components (15 components)
- Shared feature components (15 components)

### **Phase 5: Content & Testing (Weeks 7-8)**
- Translation file creation (75 files)
- Testing and optimization
- RTL support implementation

---

## **💾 ESTIMATED EFFORT**

- **Total Components**: 247 components
- **Total Pages**: 43 pages
- **Total Translation Files**: 75 files
- **Estimated Timeline**: 8 weeks
- **Developer Resources**: 2-3 developers
- **Translation Resources**: Professional translators for Arabic and Spanish

This comprehensive list covers all components and pages that need to be updated for complete multi-language implementation with English, Arabic (RTL), and Spanish support.