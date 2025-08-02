'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { usePreferences } from '@/contexts/preferences-context';

export { useTheme };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences();

  // FIXED: Convert 'system' theme to 'light' to prevent system override
  const userTheme = preferences.theme === 'system' ? 'light' : (preferences.theme || 'light');

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={userTheme}
      enableSystem={false}  // FIXED: Respect user choice only, no system override
      forcedTheme={userTheme}  // FIXED: Force user selection
      storageKey="fabriiq-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
