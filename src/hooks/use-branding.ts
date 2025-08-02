import { api } from '@/utils/api';

/**
 * Hook to get branding configuration
 * 
 * This hook provides access to system branding settings like
 * system name, logo, colors, etc.
 */
export function useBranding() {
  const { data: brandingData, isLoading, error } = api.systemConfig.getBranding.useQuery(
    undefined,
    {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Default branding values
  const defaultBranding = {
    systemName: 'FabriiQ LXP',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#64748B',
    footerText: '© 2024 FabriiQ. All rights reserved.',
  };

  // Parse branding data from the API response or use defaults if error
  const branding = {
    systemName: brandingData?.['branding.systemName'] || defaultBranding.systemName,
    logoUrl: brandingData?.['branding.logoUrl'] || defaultBranding.logoUrl,
    faviconUrl: brandingData?.['branding.faviconUrl'] || defaultBranding.faviconUrl,
    primaryColor: brandingData?.['branding.primaryColor'] || defaultBranding.primaryColor,
    secondaryColor: brandingData?.['branding.secondaryColor'] || defaultBranding.secondaryColor,
    footerText: brandingData?.['branding.footerText'] || defaultBranding.footerText,
  };

  return {
    branding,
    isLoading,
    error,
    // Helper functions
    getSystemName: () => branding.systemName,
    getLogoUrl: () => branding.logoUrl,
    getFaviconUrl: () => branding.faviconUrl,
    getPrimaryColor: () => branding.primaryColor,
    getSecondaryColor: () => branding.secondaryColor,
    getFooterText: () => branding.footerText,
  };
}
