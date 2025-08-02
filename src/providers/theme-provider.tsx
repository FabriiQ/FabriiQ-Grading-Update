'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { usePreferences } from '@/contexts/preferences-context';

export { useTheme };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={preferences.theme || 'light'}
      enableSystem={false}  // FIXED: Respect user choice only, no system override
      forcedTheme={preferences.theme}  // FIXED: Force user selection
      storageKey="fabriiq-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
