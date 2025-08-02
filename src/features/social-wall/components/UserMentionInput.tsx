/**
 * User Mention Input Component
 * Provides @ mention functionality for tagging users
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Users, GraduationCap, User } from 'lucide-react';
import { AtSign } from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

interface UserMentionInputProps {
  classId: string;
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

interface ClassUser {
  id: string;
  name: string;
  userType: string;
}

export function UserMentionInput({
  classId,
  selectedUsers,
  onUsersChange,
  placeholder = "Type @ to mention users...",
  className
}: UserMentionInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teachers' | 'students'>('all');

  // Fetch class users (students and teachers)
  const { data: classUsers, isLoading } = api.socialWall.getClassUsers.useQuery(
    { classId },
    { 
      enabled: !!classId,
      refetchOnWindowFocus: false,
    }
  );

  const users = classUsers || [];
  const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));

  // Filter users by type and search query
  const getFilteredUsers = () => {
    let filteredByType = users;

    if (activeTab === 'teachers') {
      filteredByType = users.filter(user => user.userType === 'TEACHER' || user.userType === 'COORDINATOR');
    } else if (activeTab === 'students') {
      filteredByType = users.filter(user => user.userType === 'STUDENT');
    }

    if (searchQuery.trim()) {
      return filteredByType.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredByType;
  };

  const filteredUsers = getFilteredUsers();

  const handleUserSelect = (userId: string) => {
    console.log('Selecting user:', userId); // Debug log
    if (!selectedUsers.includes(userId)) {
      onUsersChange([...selectedUsers, userId]);
    }
    setSearchQuery('');
    setOpen(false);
  };

  const handleUserRemove = (userId: string) => {
    onUsersChange(selectedUsers.filter(id => id !== userId));
  };

  const handleTagEveryone = () => {
    // Get filtered users based on current tab
    const filteredUserIds = getFilteredUsers().map(user => user.id);
    // Add to existing selections instead of replacing
    const newSelections = [...new Set([...selectedUsers, ...filteredUserIds])];
    onUsersChange(newSelections);
    setOpen(false);
  };

  // This is now handled by the getFilteredUsers function above

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Users */}
      {selectedUserObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUserObjects.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                <AvatarFallback className="text-xs">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-3 h-3 hover:bg-transparent"
                onClick={() => handleUserRemove(user.id)}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Mention Input */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            <AtSign className="w-4 h-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  All
                </TabsTrigger>
                <TabsTrigger value="teachers" className="text-xs">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  Teachers
                </TabsTrigger>
                <TabsTrigger value="students" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Students
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3">
                <div className="space-y-2">
                  {/* Search Input */}
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />

                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {isLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading users...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No users found.
                      </div>
                    ) : (
                      <>
                        {/* Tag Everyone Option */}
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                            Quick Actions
                          </div>
                          <div
                            className="flex items-center p-2 rounded-md cursor-pointer hover:bg-accent transition-colors"
                            onClick={handleTagEveryone}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-sm">Tag All {activeTab === 'all' ? 'Users' : activeTab} ({filteredUsers.length})</span>
                          </div>
                        </div>

                        {/* Individual Users */}
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                            {activeTab === 'all' ? 'Users' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                          </div>
                          {filteredUsers
                            .filter(user => !selectedUsers.includes(user.id)) // Filter out selected users
                            .map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center p-2 rounded-md cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => {
                                  console.log('User clicked:', user.id, user.name);
                                  handleUserSelect(user.id);
                                }}
                              >
                                <Avatar className="w-6 h-6 mr-2">
                                  <AvatarFallback className="text-xs">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm">{user.name || 'Unknown User'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {user.userType.toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
