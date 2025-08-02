'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/use-branding';

/**
 * Dynamic Head Component
 * 
 * This component dynamically updates the document title and favicon
 * based on the branding settings configured in the system.
 */
export function DynamicHead() {
  const { branding, isLoading } = useBranding();

  useEffect(() => {
    if (isLoading) return;

    // Update document title
    document.title = branding.systemName;

    // Update favicon if provided
    if (branding.faviconUrl) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Add new favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = branding.faviconUrl;
      document.head.appendChild(favicon);

      // Add apple touch icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = branding.faviconUrl;
      document.head.appendChild(appleTouchIcon);
    }

    // Update theme colors if provided
    if (branding.primaryColor) {
      // Update or create theme-color meta tag
      let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.content = branding.primaryColor;

      // Update CSS custom properties for dynamic theming
      document.documentElement.style.setProperty('--brand-primary', branding.primaryColor);
    }

    if (branding.secondaryColor) {
      document.documentElement.style.setProperty('--brand-secondary', branding.secondaryColor);
    }

  }, [branding, isLoading]);

  // This component doesn't render anything visible
  return null;
}
