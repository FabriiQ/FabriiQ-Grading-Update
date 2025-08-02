import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { ClassOverview } from '../ClassOverview';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock tRPC API
jest.mock('~/utils/api', () => ({
  api: {
    teacher: {
      getClassById: {
        useQuery: jest.fn(),
      },
      getClassMetrics: {
        useQuery: jest.fn(),
      },
      getRecentClassActivities: {
        useQuery: jest.fn(),
      },
      getUpcomingClassAssessments: {
        useQuery: jest.fn(),
      },
    },
    attendance: {
      getClassStats: {
        useQuery: jest.fn(),
      },
      getRecords: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock @/trpc/react
jest.mock('@/trpc/react', () => ({
  api: {
    teacher: {
      getClassById: {
        useQuery: jest.fn(),
      },
      getClassMetrics: {
        useQuery: jest.fn(),
      },
      getRecentClassActivities: {
        useQuery: jest.fn(),
      },
      getUpcomingClassAssessments: {
        useQuery: jest.fn(),
      },
    },
    attendance: {
      getClassStats: {
        useQuery: jest.fn(),
      },
      getRecords: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock ClassMetricsGrid component
jest.mock('../ClassMetricsGrid', () => ({
  ClassMetricsGrid: ({ metrics, isLoading }: any) => (
    <div data-testid="metrics-grid">
      {isLoading ? 'Loading metrics...' : `Metrics: ${metrics.length} items`}
    </div>
  ),
}));

// Mock useResponsive hook
jest.mock('@/lib/hooks/use-responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div data-testid="card-footer" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsContent: ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
}));

const mockRouter = {
  push: jest.fn(),
  query: { id: 'test-class-id' },
};

const mockClassData = {
  id: 'test-class-id',
  name: 'Test Class',
  courseCampus: {
    course: {
      name: 'Test Course',
    },
  },
  term: {
    name: 'Fall 2024',
  },
  _count: {
    students: 25,
  },
};

const mockMetrics = {
  activeStudents: 20,
  attendanceRate: 85,
  totalActivities: 10,
  completionRate: 75,
  totalAssessments: 5,
  assessmentCompletionRate: 80,
  averageGrade: 78,
  passingRate: 85,
  participationRate: 90,
  presentCount: 150,
  absentCount: 20,
  lateCount: 10,
  excusedCount: 5,
};

const mockActivities = [
  {
    id: 'activity-1',
    title: 'Test Activity 1',
    subject: { name: 'Mathematics' },
    createdAt: new Date('2024-01-15'),
    statistics: {
      totalSubmissions: 18,
      completionRate: 72,
      gradedSubmissions: 15,
      averageScore: 82,
      activityStatus: 'active',
      needsGrading: false,
      pendingSubmissions: 3,
    },
  },
  {
    id: 'activity-2',
    title: 'Test Activity 2',
    subject: { name: 'Science' },
    createdAt: new Date('2024-01-10'),
    statistics: {
      totalSubmissions: 20,
      completionRate: 80,
      gradedSubmissions: 12,
      averageScore: 75,
      activityStatus: 'needs_grading',
      needsGrading: true,
      pendingSubmissions: 8,
    },
  },
];

const mockAssessments = [
  {
    id: 'assessment-1',
    title: 'Midterm Exam',
    subject: { name: 'Mathematics' },
    dueDate: new Date('2024-02-15'),
    statistics: {
      totalSubmissions: 15,
      submissionRate: 60,
      gradedSubmissions: 10,
      averageScore: 78,
      daysUntilDue: 5,
      urgency: 'medium',
      assessmentStatus: 'active',
      pendingSubmissions: 5,
    },
  },
];

const mockAttendanceStats = {
  success: true,
  stats: {
    overallAttendanceRate: 85,
    statusCounts: {
      PRESENT: 150,
      ABSENT: 20,
      LATE: 10,
      EXCUSED: 5,
    },
  },
};

const mockAttendanceRecords = [
  {
    id: 'record-1',
    date: new Date('2024-01-15'),
    status: 'PRESENT',
    student: {
      user: { name: 'John Doe' },
    },
  },
  {
    id: 'record-2',
    date: new Date('2024-01-15'),
    status: 'ABSENT',
    student: {
      user: { name: 'Jane Smith' },
    },
  },
];

describe('ClassOverview Component', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const setupMocks = (overrides = {}) => {
    const defaultMocks = {
      classData: { data: mockClassData, isLoading: false, error: null },
      metrics: { data: mockMetrics, isLoading: false, error: null },
      activities: { data: mockActivities, isLoading: false, error: null },
      assessments: { data: mockAssessments, isLoading: false, error: null },
      attendanceStats: { data: mockAttendanceStats, isLoading: false, error: null },
      attendanceRecords: { data: mockAttendanceRecords, isLoading: false, error: null },
      ...overrides,
    };

    // Mock @/trpc/react API
    const { api } = require('@/trpc/react');
    (api.teacher.getClassById.useQuery as jest.Mock).mockReturnValue(defaultMocks.classData);
    (api.teacher.getClassMetrics.useQuery as jest.Mock).mockReturnValue(defaultMocks.metrics);
    (api.teacher.getRecentClassActivities.useQuery as jest.Mock).mockReturnValue(defaultMocks.activities);
    (api.teacher.getUpcomingClassAssessments.useQuery as jest.Mock).mockReturnValue(defaultMocks.assessments);
    (api.attendance.getClassStats.useQuery as jest.Mock).mockReturnValue(defaultMocks.attendanceStats);
    (api.attendance.getRecords.useQuery as jest.Mock).mockReturnValue(defaultMocks.attendanceRecords);
  };

  test('renders class overview with all sections', async () => {
    setupMocks();

    render(<ClassOverview classId="test-class-id" />);

    // Check class title and info
    expect(screen.getByText('Test Class')).toBeInTheDocument();
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();

    // Check metrics grid
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Assessments')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();

    // Check performance summary
    expect(screen.getByText('Class Performance')).toBeInTheDocument();
  });

  test('displays loading states correctly', () => {
    setupMocks({
      classData: { data: null, isLoading: true, error: null },
      metrics: { data: null, isLoading: true, error: null },
      activities: { data: null, isLoading: true, error: null },
    });

    render(<ClassOverview classId="test-class-id" />);

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  test('displays activities with real-time statistics', async () => {
    setupMocks();

    render(<ClassOverview classId="test-class-id" />);

    // Check activities are displayed
    expect(screen.getByText('Test Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Test Activity 2')).toBeInTheDocument();

    // Check statistics are displayed
    expect(screen.getByText('18')).toBeInTheDocument(); // submissions
    expect(screen.getByText('72%')).toBeInTheDocument(); // completion rate
    expect(screen.getByText('82%')).toBeInTheDocument(); // average score

    // Check status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Needs Grading')).toBeInTheDocument();
  });

  test('displays assessments with urgency indicators', async () => {
    setupMocks();

    render(<ClassOverview classId="test-class-id" />);

    // Switch to assessments tab
    fireEvent.click(screen.getByText('Upcoming Assessments'));

    await waitFor(() => {
      expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      expect(screen.getByText('5 days left')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument(); // submission rate
    });
  });

  test('displays attendance statistics', async () => {
    setupMocks();

    render(<ClassOverview classId="test-class-id" />);

    // Switch to attendance tab
    fireEvent.click(screen.getByText('Attendance'));

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // attendance rate
      expect(screen.getByText('150')).toBeInTheDocument(); // present count
      expect(screen.getByText('20')).toBeInTheDocument(); // absent count
    });
  });

  test('handles empty states correctly', () => {
    setupMocks({
      activities: { data: [], isLoading: false, error: null },
      assessments: { data: [], isLoading: false, error: null },
      attendanceRecords: { data: [], isLoading: false, error: null },
    });

    render(<ClassOverview classId="test-class-id" />);

    expect(screen.getByText('No Activities Yet')).toBeInTheDocument();
    expect(screen.getByText('Create Activity')).toBeInTheDocument();
  });

  test('navigates correctly when clicking on activities', async () => {
    setupMocks();

    render(<ClassOverview classId="test-class-id" />);

    const activityElement = screen.getByText('Test Activity 1').closest('div');
    fireEvent.click(activityElement!);

    expect(mockRouter.push).toHaveBeenCalledWith('/teacher/classes/test-class-id/activities/activity-1');
  });

  test('shows performance insights when metrics are low', () => {
    setupMocks({
      metrics: {
        data: {
          ...mockMetrics,
          completionRate: 50, // Below 60%
          averageGrade: 65, // Below 70%
        },
        isLoading: false,
        error: null,
      },
      attendanceStats: {
        data: {
          success: true,
          stats: {
            overallAttendanceRate: 70, // Below 75%
            statusCounts: mockAttendanceStats.stats.statusCounts,
          },
        },
        isLoading: false,
        error: null,
      },
    });

    render(<ClassOverview classId="test-class-id" />);

    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    expect(screen.getByText(/Activity completion rate is below 60%/)).toBeInTheDocument();
    expect(screen.getByText(/Average grade is below 70%/)).toBeInTheDocument();
    expect(screen.getByText(/Attendance rate is below 75%/)).toBeInTheDocument();
  });
});
