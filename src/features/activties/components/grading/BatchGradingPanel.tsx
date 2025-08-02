/**
 * Batch Grading Panel Component
 * 
 * Provides interface for batch grading multiple submissions with advanced options
 * including AI grading, rubric-based assessment, and bulk feedback generation.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  FileText,
  Users,
  Download,

  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// Mock toast hook for development
const useToast = () => ({
  toast: (options: any) => {
    console.log('Toast:', options);
    alert(options.title + (options.description ? '\n' + options.description : ''));
  }
});

interface Submission {
  id: string;
  studentName: string;
  submittedAt: Date;
  status: 'pending' | 'grading' | 'completed' | 'error';
  score?: number;
  feedback?: string;
  activityTitle: string;
}

interface BatchGradingPanelProps {
  submissions: Submission[];
  onGradingComplete: (results: any) => void;
  availableRubrics: Array<{
    id: string;
    name: string;
    description: string;
    totalPoints: number;
  }>;
  className?: string;
}

export const BatchGradingPanel: React.FC<BatchGradingPanelProps> = ({
  submissions,
  onGradingComplete,
  availableRubrics,
  className = ''
}) => {
  const { toast } = useToast();
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [gradingMethod, setGradingMethod] = useState<'ai_only' | 'rubric_only' | 'hybrid'>('ai_only');
  const [selectedRubric, setSelectedRubric] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState(0);
  const [gradingResults, setGradingResults] = useState<any>(null);
  
  // AI Settings
  const [aiModel, setAiModel] = useState<'gpt-4' | 'gpt-3.5-turbo' | 'claude-3'>('gpt-4');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [generateFeedback, setGenerateFeedback] = useState(true);
  const [bloomsAnalysis, setBloomsAnalysis] = useState(true);
  
  // Grading Options
  const [allowPartialCredit, setAllowPartialCredit] = useState(true);
  const [roundToNearest, setRoundToNearest] = useState(0.5);
  const [applyLatePenalty, setApplyLatePenalty] = useState(false);
  const [latePenaltyPercent, setLatePenaltyPercent] = useState(10);

  const handleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s.id));
    }
  };

  const handleSubmissionToggle = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleStartGrading = async () => {
    if (selectedSubmissions.length === 0) {
      toast({
        title: "No submissions selected",
        description: "Please select at least one submission to grade.",
        variant: "destructive"
      });
      return;
    }

    if (gradingMethod !== 'ai_only' && !selectedRubric) {
      toast({
        title: "Rubric required",
        description: "Please select a rubric for rubric-based or hybrid grading.",
        variant: "destructive"
      });
      return;
    }

    setIsGrading(true);
    setGradingProgress(0);

    try {
      const batchRequest = {
        submissionIds: selectedSubmissions,
        gradingMethod,
        rubricId: selectedRubric || undefined,
        aiSettings: {
          model: aiModel,
          confidenceThreshold,
          generateFeedback,
          bloomsAnalysis
        },
        gradingOptions: {
          allowPartialCredit,
          roundToNearest,
          applyLatePenalty,
          latePenaltyPercent
        }
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGradingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch('/api/grading/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(batchRequest)
      });

      const result = await response.json();

      clearInterval(progressInterval);
      setGradingProgress(100);

      if (result.success) {
        setGradingResults(result.data);
        onGradingComplete(result.data);
        
        toast({
          title: "Batch grading completed",
          description: `Successfully graded ${result.data.successfulGradings} out of ${result.data.totalSubmissions} submissions.`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Batch grading error:', error);
      toast({
        title: "Grading failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleExportResults = () => {
    if (!gradingResults) return;

    const csvContent = [
      ['Student', 'Score', 'Percentage', 'Passed', 'Bloom\'s Level', 'Feedback'],
      ...gradingResults.results.map((result: any) => [
        `Student ${result.submissionId.slice(-4)}`,
        result.score.toFixed(1),
        result.percentage.toFixed(1) + '%',
        result.passed ? 'Yes' : 'No',
        result.aiAnalysis?.bloomsLevel || 'N/A',
        result.overallFeedback.replace(/\n/g, ' ').substring(0, 100) + '...'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-grading-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Grading</h2>
          <p className="text-muted-foreground">
            Grade multiple submissions efficiently with AI assistance and rubrics
          </p>
        </div>
        {gradingResults && (
          <Button onClick={handleExportResults} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isGrading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Grading Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(gradingProgress)}%
                </span>
              </div>
              <Progress value={gradingProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processing {selectedSubmissions.length} submissions...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {gradingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Grading Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {gradingResults.successfulGradings}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {gradingResults.failedGradings}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {gradingResults.summary.averageScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {gradingResults.summary.passRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Submissions ({submissions.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedSubmissions.length === submissions.length ? 'Deselect All' : 'Select All'}
              </Button>
            </CardTitle>
            <CardDescription>
              Select submissions to include in batch grading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedSubmissions.includes(submission.id)}
                    onCheckedChange={() => handleSubmissionToggle(submission.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {submission.studentName}
                      </p>
                      <Badge variant={
                        submission.status === 'completed' ? 'default' :
                        submission.status === 'pending' ? 'secondary' :
                        submission.status === 'grading' ? 'outline' : 'destructive'
                      }>
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {submission.activityTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {submission.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                  {submission.score !== undefined && (
                    <div className="text-right">
                      <div className="text-sm font-medium">{submission.score}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grading Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Grading Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={gradingMethod} onValueChange={(value: any) => setGradingMethod(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai_only">AI Only</TabsTrigger>
                <TabsTrigger value="rubric_only">Rubric</TabsTrigger>
                <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
              </TabsList>

              <TabsContent value="ai_only" className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={aiModel} onValueChange={(value: any) => setAiModel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={generateFeedback}
                      onCheckedChange={(checked) => setGenerateFeedback(checked as boolean)}
                    />
                    <Label>Generate detailed feedback</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={bloomsAnalysis}
                      onCheckedChange={(checked) => setBloomsAnalysis(checked as boolean)}
                    />
                    <Label>Perform Bloom's analysis</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rubric_only" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Rubric</Label>
                  <Select value={selectedRubric} onValueChange={setSelectedRubric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a rubric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRubrics.map((rubric) => (
                        <SelectItem key={rubric.id} value={rubric.id}>
                          {rubric.name} ({rubric.totalPoints} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="hybrid" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Rubric</Label>
                  <Select value={selectedRubric} onValueChange={setSelectedRubric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a rubric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRubrics.map((rubric) => (
                        <SelectItem key={rubric.id} value={rubric.id}>
                          {rubric.name} ({rubric.totalPoints} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={aiModel} onValueChange={(value: any) => setAiModel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Grading Options */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Grading Options</h4>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={allowPartialCredit}
                    onCheckedChange={(checked) => setAllowPartialCredit(checked as boolean)}
                  />
                  <Label>Allow partial credit</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={applyLatePenalty}
                    onCheckedChange={(checked) => setApplyLatePenalty(checked as boolean)}
                  />
                  <Label>Apply late penalty</Label>
                </div>
              </div>

              {applyLatePenalty && (
                <div className="space-y-2">
                  <Label>Late Penalty (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={latePenaltyPercent}
                    onChange={(e) => setLatePenaltyPercent(parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Round to nearest</Label>
                <Select value={roundToNearest.toString()} onValueChange={(value) => setRoundToNearest(parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1">0.1</SelectItem>
                    <SelectItem value="0.5">0.5</SelectItem>
                    <SelectItem value="1">1.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <Button
                onClick={handleStartGrading}
                disabled={isGrading || selectedSubmissions.length === 0}
                className="w-full"
              >
                {isGrading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Start Batch Grading
                  </>
                )}
              </Button>
              
              {selectedSubmissions.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  {selectedSubmissions.length} submission{selectedSubmissions.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
