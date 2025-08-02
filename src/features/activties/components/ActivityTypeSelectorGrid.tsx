'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, FileText, List, ArrowDown,
  Edit, Plus, BookOpen, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Activity type definition
 */
export interface ActivityType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'assessment' | 'interactive' | 'content' | 'creative';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  features: string[];
  gradingMethod: 'auto' | 'manual' | 'hybrid';
  isNew?: boolean;
  isPopular?: boolean;
}

/**
 * Available activity types
 */
const ACTIVITY_TYPES: ActivityType[] = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Students select one or more correct answers from given options',
    icon: CheckCircle,
    category: 'assessment',
    difficulty: 'beginner',
    estimatedTime: '5-10 min',
    features: ['Auto-grading', 'Instant feedback', 'Analytics'],
    gradingMethod: 'auto',
    isPopular: true
  },
  {
    id: 'essay',
    name: 'Essay',
    description: 'Students write detailed responses with AI and manual grading support',
    icon: FileText,
    category: 'creative',
    difficulty: 'intermediate',
    estimatedTime: '20-60 min',
    features: ['AI grading', 'Rubrics', 'Word count', 'Plagiarism check'],
    gradingMethod: 'hybrid',
    isNew: true
  },
  {
    id: 'true-false',
    name: 'True/False',
    description: 'Simple binary choice questions for quick assessments',
    icon: XCircle,
    category: 'assessment',
    difficulty: 'beginner',
    estimatedTime: '2-5 min',
    features: ['Quick setup', 'Auto-grading', 'Bulk import'],
    gradingMethod: 'auto'
  },
  {
    id: 'multiple-response',
    name: 'Multiple Response',
    description: 'Students can select multiple correct answers from options',
    icon: List,
    category: 'assessment',
    difficulty: 'beginner',
    estimatedTime: '5-10 min',
    features: ['Partial scoring', 'Auto-grading', 'Flexible options'],
    gradingMethod: 'auto'
  },
  {
    id: 'matching',
    name: 'Matching',
    description: 'Students match items from two columns or groups',
    icon: ArrowDown,
    category: 'interactive',
    difficulty: 'intermediate',
    estimatedTime: '5-15 min',
    features: ['Drag & drop', 'Visual feedback', 'Randomization'],
    gradingMethod: 'auto'
  },
  {
    id: 'drag-and-drop',
    name: 'Drag & Drop',
    description: 'Interactive activities where students drag items to correct positions',
    icon: Edit,
    category: 'interactive',
    difficulty: 'intermediate',
    estimatedTime: '10-20 min',
    features: ['Visual learning', 'Interactive', 'Engaging'],
    gradingMethod: 'auto'
  },
  {
    id: 'fill-in-the-blanks',
    name: 'Fill in the Blanks',
    description: 'Students complete sentences or paragraphs by filling missing words',
    icon: Edit,
    category: 'assessment',
    difficulty: 'beginner',
    estimatedTime: '5-15 min',
    features: ['Text processing', 'Multiple answers', 'Auto-grading'],
    gradingMethod: 'auto'
  },
  {
    id: 'sequence',
    name: 'Sequence/Ordering',
    description: 'Students arrange items in the correct order or sequence',
    icon: List,
    category: 'interactive',
    difficulty: 'intermediate',
    estimatedTime: '5-15 min',
    features: ['Logical thinking', 'Step-by-step', 'Visual ordering'],
    gradingMethod: 'auto'
  },
  {
    id: 'numeric',
    name: 'Numeric',
    description: 'Mathematical problems requiring numerical answers',
    icon: Plus,
    category: 'assessment',
    difficulty: 'intermediate',
    estimatedTime: '5-20 min',
    features: ['Math support', 'Precision grading', 'Formula input'],
    gradingMethod: 'auto'
  },
  {
    id: 'reading',
    name: 'Reading Comprehension',
    description: 'Text-based activities with comprehension questions',
    icon: BookOpen,
    category: 'content',
    difficulty: 'intermediate',
    estimatedTime: '15-30 min',
    features: ['Text analysis', 'Comprehension', 'Critical thinking'],
    gradingMethod: 'hybrid'
  },
  {
    id: 'video',
    name: 'Video Activity',
    description: 'Video-based learning with interactive elements',
    icon: FileText,
    category: 'content',
    difficulty: 'beginner',
    estimatedTime: '10-30 min',
    features: ['Multimedia', 'Engagement', 'Visual learning'],
    gradingMethod: 'manual'
  }
];

/**
 * Props for ActivityTypeSelectorGrid
 */
export interface ActivityTypeSelectorGridProps {
  onSelect: (activityType: ActivityType) => void;
  selectedType?: string;
  className?: string;
  showFilters?: boolean;
}

/**
 * Activity Type Selector Grid Component
 */
export function ActivityTypeSelectorGrid({
  onSelect,
  selectedType,
  className = '',
  showFilters = true
}: ActivityTypeSelectorGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Filter activity types
  const filteredTypes = ACTIVITY_TYPES.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || type.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assessment': return 'bg-blue-100 text-blue-800';
      case 'interactive': return 'bg-green-100 text-green-800';
      case 'content': return 'bg-purple-100 text-purple-800';
      case 'creative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {['assessment', 'interactive', 'content', 'creative'].map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('all')}
              >
                All Levels
              </Button>
              {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className="capitalize"
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md',
                  isSelected && 'ring-2 ring-primary border-primary',
                  'relative overflow-hidden'
                )}
                onClick={() => onSelect(type)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                )}

                {/* New/Popular badges */}
                {(type.isNew || type.isPopular) && (
                  <div className="absolute top-2 left-2 flex gap-1">
                    {type.isNew && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        New
                      </Badge>
                    )}
                    {type.isPopular && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        Popular
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge className={cn('text-xs', getCategoryColor(type.category))}>
                          {type.category}
                        </Badge>
                        <Badge className={cn('text-xs', getDifficultyColor(type.difficulty))}>
                          {type.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">
                    {type.description}
                  </CardDescription>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>⏱️ {type.estimatedTime}</span>
                    <span className="capitalize">📊 {type.gradingMethod} grading</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {type.features.slice(0, 3).map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {type.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{type.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* No results */}
      {filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No activity types found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
