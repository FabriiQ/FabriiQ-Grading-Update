'use client';

import React, { useEffect, forwardRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

/**
 * ThemeWrapper component
 *
 * This component ensures that all activity components respect the current theme.
 * It adds a data-theme attribute to the wrapped component and forces a re-render
 * when the theme changes.
 */
// Extend from React.HTMLAttributes<HTMLDivElement> to include all standard HTML div props
interface ThemeWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper = forwardRef<HTMLDivElement, ThemeWrapperProps>(
  ({ children, className, ...props }, ref) => {
    const { theme } = useTheme();

    // Force re-render when theme changes - FIXED: Only use user theme, not resolvedTheme
    useEffect(() => {
      // FIXED: Only apply user-selected theme, not system theme
      const userTheme = theme || 'light';

      document.body.setAttribute('data-theme', userTheme);

      // This is needed to force Tailwind's dark mode to update properly
      if (userTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [theme]); // FIXED: Remove resolvedTheme dependency

    return (
      <div
        ref={ref}
        data-theme={theme}
        className={cn(
          className,
          // Force theme class inheritance - FIXED: Use theme instead of resolvedTheme
          theme === 'dark' ? 'dark' : '',
          // Ensure proper background and text colors
          'bg-transparent text-inherit'
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default ThemeWrapper;
