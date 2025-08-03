'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileText,
  Mail,
  Calendar,
  Settings,
  CheckCircle
} from 'lucide-react';
import { FileSpreadsheet, Image } from '@/components/ui/icons-fix';

interface ReportExportOptionsProps {
  classId: string;
  className: string;
  period: 'daily' | 'weekly' | 'monthly';
  onExport: () => void;
  isExporting: boolean;
}

export function ReportExportOptions({ 
  classId, 
  className, 
  period, 
  onExport, 
  isExporting 
}: ReportExportOptionsProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'performance',
    'engagement',
    'analytics'
  ]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeStudentDetails, setIncludeStudentDetails] = useState(true);
  const [emailReport, setEmailReport] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(false);

  const reportSections = [
    {
      id: 'performance',
      name: 'Performance Analysis',
      description: 'Student scores, trends, and grade distribution',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'engagement',
      name: 'Engagement Metrics',
      description: 'Activity participation and time spent',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'analytics',
      name: 'Learning Analytics',
      description: 'Bloom\'s taxonomy, learning patterns, and insights',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'attendance',
      name: 'Attendance Records',
      description: 'Class attendance patterns and statistics',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'assignments',
      name: 'Assignment Summary',
      description: 'Submission rates and performance by assignment',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'recommendations',
      name: 'AI Recommendations',
      description: 'Personalized insights and suggested interventions',
      icon: <FileText className="h-4 w-4" />
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </CardTitle>
          <CardDescription>
            Generate a comprehensive report for {className} ({period} period)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Ready to Export</p>
              <p className="text-sm text-blue-700">
                {selectedSections.length} sections selected • {exportFormat.toUpperCase()} format
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Report Sections</CardTitle>
          <CardDescription>Choose which sections to include in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportSections.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={() => handleSectionToggle(section.id)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <label
                      htmlFor={section.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.name}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Format and Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Format</CardTitle>
            <CardDescription>Choose your preferred file format</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Spreadsheet
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV File
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>Customize your report content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                />
                <label htmlFor="charts" className="text-sm font-medium">
                  Include charts and visualizations
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="student-details"
                  checked={includeStudentDetails}
                  onCheckedChange={(checked) => setIncludeStudentDetails(checked as boolean)}
                />
                <label htmlFor="student-details" className="text-sm font-medium">
                  Include individual student details
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Options</CardTitle>
          <CardDescription>How would you like to receive your report?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={emailReport}
                onCheckedChange={(checked) => setEmailReport(checked as boolean)}
              />
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email report to me
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={scheduleReport}
                onCheckedChange={(checked) => setScheduleReport(checked as boolean)}
              />
              <label htmlFor="schedule" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule recurring reports
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to generate your report?</p>
              <p className="text-sm text-muted-foreground">
                This will create a {exportFormat.toUpperCase()} file with {selectedSections.length} sections
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" disabled={isExporting}>
                <Settings className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button onClick={onExport} disabled={isExporting || selectedSections.length === 0}>
                {isExporting ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {getFormatIcon(exportFormat)}
                    <span className="ml-2">Export {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Your previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{className} - Weekly Report</p>
                  <p className="text-xs text-muted-foreground">Generated 2 days ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{className} - Monthly Analytics</p>
                  <p className="text-xs text-muted-foreground">Generated 1 week ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
