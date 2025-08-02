import { test, expect, Page } from '@playwright/test';

// Test data setup
const mockClassData = {
  id: 'test-class-id',
  name: 'Advanced Mathematics',
  courseCampus: {
    course: { name: 'Mathematics 101' },
  },
  term: { name: 'Fall 2024' },
};

const mockMetrics = {
  activeStudents: 25,
  attendanceRate: 87,
  totalActivities: 12,
  completionRate: 78,
  totalAssessments: 6,
  assessmentCompletionRate: 85,
  averageGrade: 82,
  passingRate: 88,
  participationRate: 92,
};

const mockActivities = [
  {
    id: 'activity-1',
    title: 'Quadratic Equations Practice',
    subject: { name: 'Mathematics' },
    createdAt: new Date('2024-01-15'),
    statistics: {
      totalSubmissions: 22,
      completionRate: 88,
      gradedSubmissions: 18,
      averageScore: 84,
      activityStatus: 'active',
      needsGrading: false,
      pendingSubmissions: 4,
    },
  },
  {
    id: 'activity-2',
    title: 'Algebra Word Problems',
    subject: { name: 'Mathematics' },
    createdAt: new Date('2024-01-12'),
    statistics: {
      totalSubmissions: 20,
      completionRate: 80,
      gradedSubmissions: 12,
      averageScore: 76,
      activityStatus: 'needs_grading',
      needsGrading: true,
      pendingSubmissions: 8,
    },
  },
];

const mockAssessments = [
  {
    id: 'assessment-1',
    title: 'Midterm Examination',
    subject: { name: 'Mathematics' },
    dueDate: new Date('2024-02-15'),
    statistics: {
      totalSubmissions: 18,
      submissionRate: 72,
      gradedSubmissions: 15,
      averageScore: 81,
      daysUntilDue: 3,
      urgency: 'medium',
      assessmentStatus: 'active',
      pendingSubmissions: 3,
    },
  },
];

// Helper function to setup API mocks
async function setupApiMocks(page: Page) {
  // Mock class data API
  await page.route('**/api/trpc/teacher.getClassById*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockClassData,
        },
      }),
    });
  });

  // Mock metrics API
  await page.route('**/api/trpc/teacher.getClassMetrics*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockMetrics,
        },
      }),
    });
  });

  // Mock activities API
  await page.route('**/api/trpc/teacher.getRecentClassActivities*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockActivities,
        },
      }),
    });
  });

  // Mock assessments API
  await page.route('**/api/trpc/teacher.getUpcomingClassAssessments*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockAssessments,
        },
      }),
    });
  });

  // Mock attendance APIs
  await page.route('**/api/trpc/attendance.getClassStats*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            success: true,
            stats: {
              overallAttendanceRate: 87,
              statusCounts: {
                PRESENT: 180,
                ABSENT: 25,
                LATE: 8,
                EXCUSED: 5,
              },
            },
          },
        },
      }),
    });
  });

  await page.route('**/api/trpc/attendance.getRecords*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: [
            {
              id: 'record-1',
              date: new Date('2024-01-15'),
              status: 'PRESENT',
              student: { user: { name: 'John Doe' } },
            },
          ],
        },
      }),
    });
  });
}

test.describe('Teacher Class Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication mock
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'teacher-1',
            userType: 'CAMPUS_TEACHER',
            email: 'teacher@test.com',
            name: 'Test Teacher',
          },
          expires: '2024-12-31',
        }),
      });
    });

    await setupApiMocks(page);
  });

  test('should display class overview with real-time data', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check class title and info
    await expect(page.getByText('Advanced Mathematics')).toBeVisible();
    await expect(page.getByText('Mathematics 101')).toBeVisible();
    await expect(page.getByText('Fall 2024')).toBeVisible();

    // Check metrics cards are displayed with correct values
    await expect(page.getByText('25')).toBeVisible(); // Active students
    await expect(page.getByText('87%')).toBeVisible(); // Attendance rate
    await expect(page.getByText('12')).toBeVisible(); // Total activities
    await expect(page.getByText('6')).toBeVisible(); // Total assessments

    // Check performance summary
    await expect(page.getByText('Class Performance')).toBeVisible();
    await expect(page.getByText('82%')).toBeVisible(); // Average grade
    await expect(page.getByText('88%')).toBeVisible(); // Passing rate
  });

  test('should navigate between tabs and display correct content', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Default tab should be activities
    await expect(page.getByText('Quadratic Equations Practice')).toBeVisible();
    await expect(page.getByText('Algebra Word Problems')).toBeVisible();

    // Check activity statistics
    await expect(page.getByText('22')).toBeVisible(); // Submissions
    await expect(page.getByText('88%')).toBeVisible(); // Completion rate
    await expect(page.getByText('84%')).toBeVisible(); // Average score

    // Switch to assessments tab
    await page.click('text=Upcoming Assessments');
    await expect(page.getByText('Midterm Examination')).toBeVisible();
    await expect(page.getByText('3 days left')).toBeVisible();
    await expect(page.getByText('72%')).toBeVisible(); // Submission rate

    // Switch to attendance tab
    await page.click('text=Attendance');
    await expect(page.getByText('Attendance Summary')).toBeVisible();
    await expect(page.getByText('180')).toBeVisible(); // Present count
    await expect(page.getByText('25')).toBeVisible(); // Absent count
  });

  test('should handle activity interactions', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Click on an activity
    const activityCard = page.locator('text=Quadratic Equations Practice').locator('..');
    await activityCard.click();

    // Should navigate to activity detail page
    await expect(page).toHaveURL(/\/teacher\/classes\/test-class-id\/activities\/activity-1/);
  });

  test('should display grading alerts for activities needing attention', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Check for grading alert
    await expect(page.getByText('Needs Grading')).toBeVisible();
    await expect(page.getByText('8 submissions need grading')).toBeVisible();
  });

  test('should show performance insights when metrics are low', async ({ page }) => {
    // Mock low performance metrics
    await page.route('**/api/trpc/teacher.getClassMetrics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              ...mockMetrics,
              completionRate: 55, // Below 60%
              averageGrade: 65, // Below 70%
            },
          },
        }),
      });
    });

    await page.route('**/api/trpc/attendance.getClassStats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              success: true,
              stats: {
                overallAttendanceRate: 70, // Below 75%
                statusCounts: mockMetrics,
              },
            },
          },
        }),
      });
    });

    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Check for performance insights
    await expect(page.getByText('Performance Insights')).toBeVisible();
    await expect(page.getByText(/Activity completion rate is below 60%/)).toBeVisible();
    await expect(page.getByText(/Average grade is below 70%/)).toBeVisible();
    await expect(page.getByText(/Attendance rate is below 75%/)).toBeVisible();
  });

  test('should handle empty states correctly', async ({ page }) => {
    // Mock empty data
    await page.route('**/api/trpc/teacher.getRecentClassActivities*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { data: [] },
        }),
      });
    });

    await page.route('**/api/trpc/teacher.getUpcomingClassAssessments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { data: [] },
        }),
      });
    });

    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Check empty state for activities
    await expect(page.getByText('No Activities Yet')).toBeVisible();
    await expect(page.getByText('Create Activity')).toBeVisible();

    // Check empty state for assessments
    await page.click('text=Upcoming Assessments');
    await expect(page.getByText('No Assessments Yet')).toBeVisible();
    await expect(page.getByText('Create Assessment')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/teacher/classes/test-class-id');
    await page.waitForLoadState('networkidle');

    // Check that content is still visible and properly arranged
    await expect(page.getByText('Advanced Mathematics')).toBeVisible();
    await expect(page.getByText('Class Performance')).toBeVisible();
    
    // Check that tabs are still functional
    await page.click('text=Upcoming Assessments');
    await expect(page.getByText('Midterm Examination')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Delay API responses to test loading states
    await page.route('**/api/trpc/teacher.getClassMetrics*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { data: mockMetrics },
        }),
      });
    });

    await page.goto('/teacher/classes/test-class-id');

    // Check for loading skeletons
    await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('82%')).toBeVisible();
  });
});
