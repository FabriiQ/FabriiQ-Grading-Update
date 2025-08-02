'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, MoreVertical, Edit, Eye, Copy, Trash2,
  Calendar, Clock, Users, Target, TrendingUp, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemoryLeakPrevention } from '../services/memory-leak-prevention.service';

/**
 * Activity data interface
 */
export interface ActivityData {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  stats: {
    totalSubmissions: number;
    averageScore: number;
    completionRate: number;
    timeSpent: number; // in minutes
  };
  settings: {
    maxScore: number;
    timeLimit?: number;
    attempts: number;
    gradingMethod: 'auto' | 'manual' | 'hybrid';
  };
  tags: string[];
  subject?: string;
  gradeLevel?: string;
}

/**
 * Props for ActivityList component
 */
export interface ActivityListProps {
  activities: ActivityData[];
  onEdit?: (activity: ActivityData) => void;
  onView?: (activity: ActivityData) => void;
  onDuplicate?: (activity: ActivityData) => void;
  onDelete?: (activity: ActivityData) => void;
  onStatusChange?: (activityId: string, status: ActivityData['status']) => void;
  className?: string;
  showFilters?: boolean;
  showStats?: boolean;
}

/**
 * Activity List Component
 */
export function ActivityList({
  activities,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onStatusChange,
  className = '',
  showFilters = true,
  showStats = true
}: ActivityListProps) {
  const { isMounted } = useMemoryLeakPrevention('activity-list');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort activities
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'submissions':
          aValue = a.stats.totalSubmissions;
          bValue = b.stats.totalSubmissions;
          break;
        case 'averageScore':
          aValue = a.stats.averageScore;
          bValue = b.stats.averageScore;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [activities, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Get unique activity types for filter
  const activityTypes = useMemo(() => {
    const types = [...new Set(activities.map(a => a.type))];
    return types.sort();
  }, [activities]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format activity type name
  const formatActivityType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters and Search */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {activityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatActivityType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <Badge className={cn('text-xs', getStatusColor(activity.status))}>
                          {activity.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatActivityType(activity.type)}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {activity.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(activity)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(activity)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDuplicate && (
                        <Button variant="ghost" size="sm" onClick={() => onDuplicate(activity)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(activity)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Activity Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(activity.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{activity.settings.maxScore} points</span>
                    </div>
                    {activity.settings.timeLimit && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{activity.settings.timeLimit} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{activity.settings.gradingMethod} grading</span>
                    </div>
                  </div>

                  {/* Stats */}
                  {showStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{activity.stats.totalSubmissions}</div>
                        <div className="text-xs text-muted-foreground">Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{activity.stats.averageScore.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{activity.stats.completionRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{activity.stats.timeSpent}m</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {activity.tags.slice(0, 5).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {activity.tags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{activity.tags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No results */}
      {filteredAndSortedActivities.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No activities found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
