'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { InstitutionNavigationLink } from '@/components/ui/navigation/institution-navigation-link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  BookOpen,
  User,
  Award,
  CheckCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  MessageSquare
} from 'lucide-react';
import { StudentThemeSelector } from './StudentThemeSelector';
import { StudentHeader } from './StudentHeader';
import { useSession, signOut } from 'next-auth/react';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface StudentSidebarProps {
  classId: string;
}

/**
 * StudentSidebar component for class-specific navigation in the student portal
 *
 * Features:
 * - Responsive sidebar navigation (desktop) and mobile overlay
 * - Collapsible sidebar on desktop
 * - Same navigation items as the old bottom nav
 * - Theme selector integration
 * - User profile dropdown
 * - Consistent with teacher portal design patterns
 */
export function StudentSidebar({ classId }: StudentSidebarProps) {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation items (same as the old bottom nav)
  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: `/student/class/${classId}/dashboard`,
      ariaLabel: 'Go to class dashboard'
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Subjects',
      href: `/student/class/${classId}/subjects`,
      ariaLabel: 'View class subjects'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Social Wall',
      href: `/student/class/${classId}/social-wall`,
      ariaLabel: 'Connect with your classmates'
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'Leaderboard',
      href: `/student/class/${classId}/leaderboard`,
      ariaLabel: 'Check class leaderboard'
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      label: 'Commitments',
      href: `/student/class/${classId}/commitments`,
      ariaLabel: 'Manage your learning commitments'
    },
    {
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      href: `/student/class/${classId}/profile`,
      ariaLabel: 'Go to your class profile'
    }
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSignOut = () => {
    signOut();
  };

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {/* Mobile header */}
        <StudentHeader
          title="Student Portal"
          showMenuButton={true}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Mobile sidebar overlay */}
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
                  <h1 className="text-lg font-semibold">Navigation</h1>
                </div>
              </div>

              <div className="py-4">
                <nav className="space-y-1 px-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    
                    return (
                      <InstitutionNavigationLink
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center w-full px-3 py-2 text-sm rounded-md",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => setSidebarOpen(false)}
                        ariaLabel={item.ariaLabel}
                      >
                        <span className="mr-3">
                          {item.icon}
                        </span>
                        {item.label}
                      </InstitutionNavigationLink>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "border-r transition-all duration-300 bg-background",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center px-4 border-b">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-semibold truncate">Student Portal</h1>
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <InstitutionNavigationLink
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                  sidebarCollapsed && "justify-center px-0"
                )}
                ariaLabel={item.ariaLabel}
              >
                <span className={cn(sidebarCollapsed ? "mr-0" : "mr-3")}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && item.label}
              </InstitutionNavigationLink>
            );
          })}
        </nav>
      </div>

      {/* User section at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        {session?.user && (
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
                  <AvatarImage src="" alt={session.user.name || ""} />
                  <AvatarFallback>{session.user.name?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="ml-2 text-left">
                    <div className="text-sm font-medium">{session.user.name}</div>
                    <div className="text-xs text-muted-foreground">{session.user.email}</div>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = `/student/class/${classId}/profile`}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/student/settings'}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
