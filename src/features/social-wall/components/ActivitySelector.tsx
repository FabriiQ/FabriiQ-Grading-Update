/**
 * Activity Selector Component
 * Allows teachers to tag activities and assessments in social wall posts
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  BookOpen,
  ClipboardList,
  Search,
  X,
  Calendar,
  Clock,
  Users,
  Target,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/trpc/react';
import { formatDistanceToNow } from 'date-fns';

interface ActivitySelectorProps {
  classId: string;
  selectedActivityIds: string[];
  onActivityChange: (activityIds: string[]) => void;
  className?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  type: 'ACTIVITY' | 'ASSESSMENT';
  description?: string;
  dueDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED' | 'ARCHIVED_CURRENT_YEAR' | 'ARCHIVED_PREVIOUS_YEAR' | 'ARCHIVED_HISTORICAL';
  subjectName?: string;
  topicName?: string;
  participantCount?: number;
  bloomsLevel?: string | null;
}

export function ActivitySelector({
  classId,
  selectedActivityIds,
  onActivityChange,
  className
}: ActivitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'activities' | 'assessments'>('activities');

  // Fetch class activities
  const { data: activities, isLoading: isLoadingActivities } = api.activity.getClassActivities.useQuery(
    { classId },
    {
      enabled: !!classId && isOpen,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch class assessments
  const { data: assessments, isLoading: isLoadingAssessments } = api.assessment.getClassAssessments.useQuery(
    { classId },
    {
      enabled: !!classId && isOpen,
      refetchOnWindowFocus: false,
    }
  );

  // Combine and format data
  const allItems: ActivityItem[] = [
    ...(activities?.map(activity => ({
      id: activity.id,
      title: activity.title,
      type: 'ACTIVITY' as const,
      description: typeof activity.content === 'string' ? activity.content : undefined,
      dueDate: activity.dueDate || undefined,
      status: activity.status,
      subjectName: activity.subjectName,
      topicName: activity.topicName,
      participantCount: activity.participantCount || 0,
      bloomsLevel: activity.bloomsLevel,
    })) || []),
    ...(assessments?.map(assessment => ({
      id: assessment.id,
      title: assessment.title,
      type: 'ASSESSMENT' as const,
      description: typeof assessment.content === 'string' ? assessment.content : undefined,
      dueDate: assessment.dueDate || undefined,
      status: assessment.status,
      subjectName: assessment.subjectName,
      topicName: undefined, // assessments don't have topicName in the API response
      participantCount: assessment.participantCount || 0,
      bloomsLevel: null, // assessments don't have bloomsLevel in this context
    })) || [])
  ];

  // Filter items based on search and tab
  const filteredItems = allItems.filter(item => {
    const matchesTab = activeTab === 'activities' ? item.type === 'ACTIVITY' : item.type === 'ASSESSMENT';
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topicName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const handleItemSelect = (itemId: string) => {
    const newSelection = selectedActivityIds.includes(itemId)
      ? selectedActivityIds.filter(id => id !== itemId)
      : [...selectedActivityIds, itemId];
    
    onActivityChange(newSelection);
  };

  const handleRemoveItem = (itemId: string) => {
    onActivityChange(selectedActivityIds.filter(id => id !== itemId));
  };

  const getSelectedItems = () => {
    return allItems.filter(item => selectedActivityIds.includes(item.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-yellow-500';
      case 'ARCHIVED': return 'bg-blue-500';
      case 'DELETED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'ACTIVITY' ? BookOpen : ClipboardList;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Items Display */}
      {selectedActivityIds.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tagged Activities & Assessments</Label>
          <div className="flex flex-wrap gap-2">
            {getSelectedItems().map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{item.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
          >
            <Plus className="w-4 h-4" />
            Tag Activity
            {selectedActivityIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedActivityIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-2">Select Activities & Assessments</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities and assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="assessments" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Assessments
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-80">
              <TabsContent value="activities" className="m-0">
                <div className="p-2 space-y-1">
                  {isLoadingActivities ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading activities...
                    </div>
                  ) : filteredItems.filter(item => item.type === 'ACTIVITY').length > 0 ? (
                    filteredItems
                      .filter(item => item.type === 'ACTIVITY')
                      .map((item) => (
                        <ActivityItem
                          key={item.id}
                          item={item}
                          isSelected={selectedActivityIds.includes(item.id)}
                          onSelect={() => handleItemSelect(item.id)}
                        />
                      ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No activities found
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="m-0">
                <div className="p-2 space-y-1">
                  {isLoadingAssessments ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading assessments...
                    </div>
                  ) : filteredItems.filter(item => item.type === 'ASSESSMENT').length > 0 ? (
                    filteredItems
                      .filter(item => item.type === 'ASSESSMENT')
                      .map((item) => (
                        <ActivityItem
                          key={item.id}
                          item={item}
                          isSelected={selectedActivityIds.includes(item.id)}
                          onSelect={() => handleItemSelect(item.id)}
                        />
                      ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No assessments found
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ 
  item, 
  isSelected, 
  onSelect 
}: { 
  item: ActivityItem; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const Icon = getTypeIcon(item.type);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-accent",
        isSelected && "bg-primary/10 border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={cn("w-4 h-4 mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-1">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(item.status))} />
              <span className="text-xs text-muted-foreground capitalize">
                {item.status.toLowerCase()}
              </span>
              {item.dueDate && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}
                    </span>
                  </div>
                </>
              )}
              {item.participantCount !== undefined && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {item.participantCount} participants
                    </span>
                  </div>
                </>
              )}
            </div>
            {(item.subjectName || item.topicName) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.subjectName && (
                  <Badge variant="outline" className="text-xs">
                    {item.subjectName}
                  </Badge>
                )}
                {item.topicName && (
                  <Badge variant="outline" className="text-xs">
                    {item.topicName}
                  </Badge>
                )}
                {item.bloomsLevel && (
                  <Badge variant="outline" className="text-xs">
                    {item.bloomsLevel}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-500';
    case 'INACTIVE': return 'bg-yellow-500';
    case 'ARCHIVED': return 'bg-blue-500';
    case 'DELETED': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getTypeIcon(type: string) {
  return type === 'ACTIVITY' ? BookOpen : ClipboardList;
}
