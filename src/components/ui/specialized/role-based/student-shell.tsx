'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/core/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import {
  BookOpen,
  Settings,
  Bell,
  LogOut,
  ClipboardList,
  Award,
  BarChart,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface StudentShellProps {
  children: React.ReactNode;
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  title?: string;
  logo?: React.ReactNode;
  onNavigate?: (path: string) => void;
  currentPath?: string;
  notifications?: number;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * StudentShell component for student portal
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Collapsible sidebar navigation
 * - Mobile sidebar overlay
 * - Role-specific styling
 * - Context-aware navigation
 *
 * @example
 * ```tsx
 * <StudentShell
 *   user={{ name: 'Student Name', email: 'student@example.com' }}
 *   title="Student Portal"
 *   onNavigate={(path) => router.push(path)}
 *   currentPath={router.pathname}
 * >
 *   <div>Content goes here</div>
 * </StudentShell>
 * ```
 */
export function StudentShell({
  children,
  className,
  user,
  title = 'Student Portal',
  logo,
  onNavigate,
  currentPath = '/',
  notifications = 0,
  headerContent,
  footerContent,
}: StudentShellProps) {
  const { isMobile } = useResponsive();
  const pathname = usePathname() || currentPath;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation items for sidebar
  const navItems = [
    {
      id: '/student/classes',
      label: 'Classes',
      path: '/student/classes',
      icon: <BookOpen size={20} />,
    },
    {
      id: '/student/activities',
      label: 'Activities',
      path: '/student/activities',
      icon: <ClipboardList size={20} />,
    },
    {
      id: '/student/achievements',
      label: 'Achievements',
      path: '/student/achievements',
      icon: <Award size={20} />,
    },
    {
      id: '/student/leaderboard',
      label: 'Leaderboard',
      path: '/student/leaderboard',
      icon: <BarChart size={20} />,
    },
    {
      id: '/student/profile',
      label: 'Profile',
      path: '/student/profile',
      icon: <User size={20} />,
    },
  ];

  // Handle navigation
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle sign out
  const signOut = () => {
    if (onNavigate) {
      onNavigate('/logout');
    }
  };

  // Get the primary color for student
  const primaryColor = 'hsl(var(--primary))';



  // Mobile layout
  if (isMobile) {
    return (
      <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
        {/* Mobile header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
            <span className="sr-only">Open menu</span>
          </Button>

          <div className="flex items-center flex-1">
            {logo}
            <h1 className="ml-2 text-lg font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {notifications > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate('/notifications')}
                className="relative"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {notifications}
                </span>
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('/student/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/student/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-background border-r shadow-lg">
              <div className="flex h-16 items-center px-4 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={24} />
                  <span className="sr-only">Close menu</span>
                </Button>

                <div className="flex items-center flex-1">
                  {logo}
                  <h1 className="ml-2 text-lg font-semibold">{title}</h1>
                </div>
              </div>

              <div className="py-4">
                <nav className="space-y-1 px-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-sm rounded-md",
                        pathname === item.path
                          ? `bg-[${primaryColor}] text-white`
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <span className="mr-3">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto pt-16 p-4">
          {children}
        </main>

        {/* Footer content if any */}
        {footerContent && (
          <footer className="border-t py-4 px-4">
            {footerContent}
          </footer>
        )}
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
        style={{ borderColor: primaryColor }}
      >
        <div className="flex h-16 items-center px-4 border-b">
          {!sidebarCollapsed && (
            <>
              {logo}
              <h1 className="ml-2 text-lg font-semibold truncate">{title}</h1>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto", sidebarCollapsed && "mx-auto")}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        <div className="py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md",
                  pathname === item.path
                    ? `bg-[${primaryColor}] text-white`
                    : "text-muted-foreground hover:bg-muted",
                  sidebarCollapsed && "justify-center px-0"
                )}
                onClick={() => handleNavigate(item.path)}
              >
                <span className={cn(sidebarCollapsed ? "mr-0" : "mr-3")}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="ml-2 text-left">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('/student/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('/student/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header content if any */}
        {headerContent && (
          <header className="border-b py-4 px-6">
            {headerContent}
          </header>
        )}

        <div className="p-6">
          {children}
        </div>

        {/* Footer content if any */}
        {footerContent && (
          <footer className="border-t py-4 px-6">
            {footerContent}
          </footer>
        )}
      </main>
    </div>
  );
}
