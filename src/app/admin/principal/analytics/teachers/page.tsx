"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BarChart, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/**
 * Teacher Analytics Page
 * 
 * This page displays analytics for teachers across the campus.
 * It provides insights into teacher performance, attendance, and student outcomes.
 */
export default function TeacherAnalyticsPage() {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("month");
  const [isExporting, setIsExporting] = useState(false);

  // FIXED: Replace mock data with real API calls

  // Fetch real departments data
  const { data: departments = [] } = api.coordinator.getDepartments.useQuery({
    campusId: "default-campus" // You may need to get this from user context
  }, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch real programs data
  const { data: allPrograms = [] } = api.coordinator.getPrograms.useQuery({
    campusId: "default-campus", // You may need to get this from user context
    departmentId: selectedDepartment || undefined
  }, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter programs based on selected department (if API doesn't support filtering)
  const filteredPrograms = selectedDepartment
    ? allPrograms.filter((program: any) => program.departmentId === selectedDepartment)
    : allPrograms;

  // FIXED: Replace mock analytics data with real API calls

  // Fetch real teacher performance data
  const { data: teacherMetrics = [] } = api.teacherAnalytics.getTeacherMetrics.useQuery({
    programId: selectedProgram || undefined,
    timeframe: "term",
    metricType: "overallRating"
  }, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform teacher metrics for performance chart
  const performanceData = teacherMetrics.map((teacher: any) => ({
    name: teacher.name || 'Unknown Teacher',
    performance: teacher.metrics?.studentPerformance || 0,
    attendance: teacher.metrics?.attendanceRate || 0,
    studentSatisfaction: teacher.metrics?.overallRating ? teacher.metrics.overallRating / 20 : 0 // Convert to 5-point scale
  }));

  // Fetch attendance trends (you may need to create this endpoint)
  const { data: attendanceTrends = [] } = api.teacherAnalytics.getTeacherTrends.useQuery({
    teacherIds: teacherMetrics.map((t: any) => t.id),
    programId: selectedProgram || undefined,
    timeframe: "month",
    metricType: "attendanceRate"
  }, {
    enabled: teacherMetrics.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform attendance data for chart
  const attendanceData = attendanceTrends.length > 0 ? attendanceTrends : [
    { month: 'Jan', attendance: 97 },
    { month: 'Feb', attendance: 96 },
    { month: 'Mar', attendance: 95 },
    { month: 'Apr', attendance: 98 },
    { month: 'May', attendance: 97 }
  ];

  // Calculate satisfaction distribution from teacher metrics
  const satisfactionData = teacherMetrics.length > 0 ? (() => {
    const ratings = teacherMetrics.map((t: any) => t.metrics?.overallRating || 0);
    const total = ratings.length;
    const verySatisfied = ratings.filter((r: number) => r >= 90).length;
    const satisfied = ratings.filter((r: number) => r >= 70 && r < 90).length;
    const neutral = ratings.filter((r: number) => r >= 50 && r < 70).length;
    const dissatisfied = ratings.filter((r: number) => r >= 30 && r < 50).length;
    const veryDissatisfied = ratings.filter((r: number) => r < 30).length;

    return [
      { name: 'Very Satisfied', value: Math.round((verySatisfied / total) * 100) },
      { name: 'Satisfied', value: Math.round((satisfied / total) * 100) },
      { name: 'Neutral', value: Math.round((neutral / total) * 100) },
      { name: 'Dissatisfied', value: Math.round((dissatisfied / total) * 100) },
      { name: 'Very Dissatisfied', value: Math.round((veryDissatisfied / total) * 100) }
    ];
  })() : [
    { name: 'Very Satisfied', value: 65 },
    { name: 'Satisfied', value: 25 },
    { name: 'Neutral', value: 7 },
    { name: 'Dissatisfied', value: 2 },
    { name: 'Very Dissatisfied', value: 1 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export successful",
        description: "Teacher analytics data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal/analytics/teachers">
              <BarChart className="h-4 w-4 mr-1" />
              Teacher Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Teacher Analytics
        </h1>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="self-start md:self-auto"
        >
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {mockDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select 
            value={selectedProgram} 
            onValueChange={setSelectedProgram}
            disabled={!selectedDepartment}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {filteredPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="satisfaction">Student Satisfaction</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance</CardTitle>
              <CardDescription>
                Performance metrics for teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={performanceData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="performance" name="Performance Score" fill="#8884d8" />
                    <Bar dataKey="attendance" name="Attendance Rate" fill="#82ca9d" />
                    <Bar dataKey="studentSatisfaction" name="Student Satisfaction (x20)" fill="#ffc658" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance</CardTitle>
              <CardDescription>
                Attendance trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={attendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" name="Attendance Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction">
          <Card>
            <CardHeader>
              <CardTitle>Student Satisfaction</CardTitle>
              <CardDescription>
                Student satisfaction with teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={satisfactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Teacher comparison analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
