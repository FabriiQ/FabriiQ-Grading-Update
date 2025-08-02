/**
 * Rubric Builder Component
 * 
 * Provides interface for creating and editing grading rubrics with multiple criteria,
 * performance levels, and Bloom's taxonomy alignment.
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Edit, 
  Copy,
  AlertCircle,
  CheckCircle,
  Target,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Mock toast hook for development
const useToast = () => ({
  toast: (options: any) => {
    console.log('Toast:', options);
    alert(options.title + (options.description ? '\n' + options.description : ''));
  }
});
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

interface RubricLevel {
  level: number;
  name: string;
  description: string;
  points: number;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

interface Rubric {
  id?: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  bloomsAlignment?: Record<BloomsTaxonomyLevel, number>;
  totalPoints: number;
}

interface RubricBuilderProps {
  initialRubric?: Rubric;
  onSave: (rubric: Rubric) => void;
  onCancel: () => void;
  className?: string;
}

const defaultLevels: RubricLevel[] = [
  { level: 4, name: 'Excellent', description: 'Exceeds expectations', points: 4 },
  { level: 3, name: 'Good', description: 'Meets expectations', points: 3 },
  { level: 2, name: 'Satisfactory', description: 'Approaching expectations', points: 2 },
  { level: 1, name: 'Needs Improvement', description: 'Below expectations', points: 1 }
];

export const RubricBuilder: React.FC<RubricBuilderProps> = ({
  initialRubric,
  onSave,
  onCancel,
  className = ''
}) => {
  const { toast } = useToast();
  const [rubric, setRubric] = useState<Rubric>({
    name: '',
    description: '',
    criteria: [],
    bloomsAlignment: {
      [BloomsTaxonomyLevel.REMEMBER]: 0,
      [BloomsTaxonomyLevel.UNDERSTAND]: 0,
      [BloomsTaxonomyLevel.APPLY]: 0,
      [BloomsTaxonomyLevel.ANALYZE]: 0,
      [BloomsTaxonomyLevel.EVALUATE]: 0,
      [BloomsTaxonomyLevel.CREATE]: 0
    },
    totalPoints: 0,
    ...initialRubric
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    calculateTotalPoints();
  }, [rubric.criteria]);

  const calculateTotalPoints = () => {
    const total = rubric.criteria.reduce((sum, criterion) => {
      const maxPoints = Math.max(...criterion.levels.map(l => l.points));
      return sum + (maxPoints * criterion.weight / 100);
    }, 0);
    
    setRubric(prev => ({ ...prev, totalPoints: total }));
  };

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion_${Date.now()}`,
      name: '',
      description: '',
      weight: 25,
      levels: [...defaultLevels]
    };
    
    setRubric(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));
  };

  const updateCriterion = (criterionId: string, updates: Partial<RubricCriterion>) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(criterion =>
        criterion.id === criterionId ? { ...criterion, ...updates } : criterion
      )
    }));
  };

  const deleteCriterion = (criterionId: string) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.filter(criterion => criterion.id !== criterionId)
    }));
  };

  const updateLevel = (criterionId: string, levelIndex: number, updates: Partial<RubricLevel>) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(criterion =>
        criterion.id === criterionId
          ? {
              ...criterion,
              levels: criterion.levels.map((level, index) =>
                index === levelIndex ? { ...level, ...updates } : level
              )
            }
          : criterion
      )
    }));
  };

  const updateBloomsAlignment = (level: BloomsTaxonomyLevel, weight: number) => {
    setRubric(prev => ({
      ...prev,
      bloomsAlignment: {
        ...prev.bloomsAlignment,
        [level]: weight
      } as Record<BloomsTaxonomyLevel, number>
    }));
  };

  const validateRubric = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!rubric.name.trim()) {
      newErrors.name = 'Rubric name is required';
    }

    if (rubric.criteria.length === 0) {
      newErrors.criteria = 'At least one criterion is required';
    }

    rubric.criteria.forEach((criterion, index) => {
      if (!criterion.name.trim()) {
        newErrors[`criterion_${index}_name`] = 'Criterion name is required';
      }
      
      criterion.levels.forEach((level, levelIndex) => {
        if (!level.name.trim()) {
          newErrors[`criterion_${index}_level_${levelIndex}_name`] = 'Level name is required';
        }
        if (level.points < 0) {
          newErrors[`criterion_${index}_level_${levelIndex}_points`] = 'Points must be non-negative';
        }
      });
    });

    const totalWeight = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      newErrors.weights = 'Criterion weights must sum to 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateRubric()) {
      onSave(rubric);
      toast({
        title: "Rubric saved",
        description: "Your rubric has been saved successfully."
      });
    } else {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before saving.",
        variant: "destructive"
      });
    }
  };

  const duplicateCriterion = (criterionId: string) => {
    const criterion = rubric.criteria.find(c => c.id === criterionId);
    if (criterion) {
      const duplicated = {
        ...criterion,
        id: `criterion_${Date.now()}`,
        name: `${criterion.name} (Copy)`
      };
      setRubric(prev => ({
        ...prev,
        criteria: [...prev.criteria, duplicated]
      }));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {initialRubric ? 'Edit Rubric' : 'Create New Rubric'}
          </h2>
          <p className="text-muted-foreground">
            Design a comprehensive grading rubric with multiple criteria and performance levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Rubric
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="alignment">Bloom's Alignment</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set the name and description for your rubric
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rubric-name">Rubric Name *</Label>
                <Input
                  id="rubric-name"
                  value={rubric.name}
                  onChange={(e) => setRubric(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rubric name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rubric-description">Description</Label>
                <Textarea
                  id="rubric-description"
                  value={rubric.description}
                  onChange={(e) => setRubric(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rubric assesses"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Points</span>
                  <Badge variant="secondary" className="text-lg">
                    {rubric.totalPoints.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Calculated based on criteria weights and maximum points
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criteria */}
        <TabsContent value="criteria" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Grading Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Define the criteria and performance levels for assessment
              </p>
            </div>
            <Button onClick={addCriterion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Criterion
            </Button>
          </div>

          {errors.criteria && (
            <p className="text-sm text-red-500">{errors.criteria}</p>
          )}

          <div className="space-y-4">
            {rubric.criteria.map((criterion, criterionIndex) => (
              <Card key={criterion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Criterion {criterionIndex + 1}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateCriterion(criterion.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCriterion(criterion.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Criterion Name *</Label>
                      <Input
                        value={criterion.name}
                        onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                        placeholder="e.g., Content Quality"
                        className={errors[`criterion_${criterionIndex}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`criterion_${criterionIndex}_name`] && (
                        <p className="text-sm text-red-500">{errors[`criterion_${criterionIndex}_name`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Weight ({criterion.weight}%)</Label>
                      <Slider
                        value={[criterion.weight]}
                        onValueChange={([value]) => updateCriterion(criterion.id, { weight: value })}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                      placeholder="Describe what this criterion assesses"
                      rows={2}
                    />
                  </div>

                  {/* Performance Levels */}
                  <div className="space-y-3">
                    <Label>Performance Levels</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {criterion.levels.map((level, levelIndex) => (
                        <Card key={levelIndex} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={
                                level.level === 4 ? 'default' :
                                level.level === 3 ? 'secondary' :
                                level.level === 2 ? 'outline' : 'destructive'
                              }>
                                Level {level.level}
                              </Badge>
                              <Input
                                type="number"
                                value={level.points}
                                onChange={(e) => updateLevel(criterion.id, levelIndex, { points: parseFloat(e.target.value) || 0 })}
                                className="w-16 h-6 text-xs"
                                min="0"
                              />
                            </div>
                            
                            <Input
                              value={level.name}
                              onChange={(e) => updateLevel(criterion.id, levelIndex, { name: e.target.value })}
                              placeholder="Level name"
                              className="text-sm"
                            />
                            
                            <Textarea
                              value={level.description}
                              onChange={(e) => updateLevel(criterion.id, levelIndex, { description: e.target.value })}
                              placeholder="Level description"
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {errors.weights && (
            <p className="text-sm text-red-500">{errors.weights}</p>
          )}
        </TabsContent>

        {/* Bloom's Alignment */}
        <TabsContent value="alignment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Bloom's Taxonomy Alignment
              </CardTitle>
              <CardDescription>
                Align your rubric with Bloom's taxonomy levels to ensure cognitive depth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.values(BloomsTaxonomyLevel).map((level) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{level.toLowerCase()}</Label>
                    <span className="text-sm text-muted-foreground">
                      {rubric.bloomsAlignment?.[level] || 0}%
                    </span>
                  </div>
                  <Slider
                    value={[rubric.bloomsAlignment?.[level] || 0]}
                    onValueChange={([value]) => updateBloomsAlignment(level, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total alignment: {Object.values(rubric.bloomsAlignment || {}).reduce((sum, weight) => sum + weight, 0)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Rubric Preview
              </CardTitle>
              <CardDescription>
                Preview how your rubric will appear to students and during grading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">{rubric.name || 'Untitled Rubric'}</h3>
                  {rubric.description && (
                    <p className="text-muted-foreground mt-1">{rubric.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Points: {rubric.totalPoints.toFixed(1)}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-gray-300 p-2 text-left">Criteria</th>
                        <th className="border border-gray-300 p-2 text-center">Weight</th>
                        {defaultLevels.map((level) => (
                          <th key={level.level} className="border border-gray-300 p-2 text-center">
                            {level.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rubric.criteria.map((criterion) => (
                        <tr key={criterion.id}>
                          <td className="border border-gray-300 p-2">
                            <div>
                              <div className="font-medium">{criterion.name}</div>
                              {criterion.description && (
                                <div className="text-sm text-muted-foreground">
                                  {criterion.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {criterion.weight}%
                          </td>
                          {criterion.levels.map((level) => (
                            <td key={level.level} className="border border-gray-300 p-2">
                              <div className="text-center">
                                <div className="font-medium">{level.points} pts</div>
                                <div className="text-sm">{level.description}</div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
