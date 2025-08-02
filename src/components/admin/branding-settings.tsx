'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, Palette, Type, ImageIcon } from 'lucide-react';
import { api } from '@/utils/api';

const brandingSchema = z.object({
  systemName: z.string().min(1, 'System name is required').max(100, 'System name must be less than 100 characters'),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  faviconUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().or(z.literal('')),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().or(z.literal('')),
  footerText: z.string().max(500, 'Footer text must be less than 500 characters').optional().or(z.literal('')),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export function BrandingSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get current branding settings
  const { data: brandingData, isLoading: isLoadingData, error: loadingError, refetch } = api.systemConfig.getBranding.useQuery(
    undefined,
    {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update branding mutation
  const updateBrandingMutation = api.systemConfig.updateBranding.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Branding settings updated successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branding settings',
        variant: 'error',
      });
    },
  });

  // Default values for the form
  const getDefaultValues = () => ({
    systemName: brandingData?.['branding.systemName'] || 'FabriiQ LXP',
    logoUrl: brandingData?.['branding.logoUrl'] || '',
    faviconUrl: brandingData?.['branding.faviconUrl'] || '',
    primaryColor: brandingData?.['branding.primaryColor'] || '',
    secondaryColor: brandingData?.['branding.secondaryColor'] || '',
    footerText: brandingData?.['branding.footerText'] || '',
  });

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: getDefaultValues(),
  });

  // Update form when data loads
  React.useEffect(() => {
    // Always reset form with current data or defaults
    form.reset(getDefaultValues());
  }, [brandingData, form]);

  const onSubmit = async (data: BrandingFormData) => {
    setIsLoading(true);
    try {
      // Filter out empty strings but keep systemName as it's required
      const cleanData: Partial<BrandingFormData> & { systemName: string } = {
        systemName: data.systemName, // Always include systemName
        ...Object.fromEntries(
          Object.entries(data)
            .filter(([key, value]) => key !== 'systemName' && value !== '')
        )
      };

      await updateBrandingMutation.mutateAsync(cleanData);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading branding settings...</span>
        </CardContent>
      </Card>
    );
  }

  // Show error state but still allow form to work with defaults
  if (loadingError) {
    console.warn('Failed to load branding settings, using defaults:', loadingError);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding Settings
        </CardTitle>
        <CardDescription>
          Customize your system's branding including name, logo, colors, and footer text.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* System Name */}
          <div className="space-y-2">
            <Label htmlFor="systemName" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              System Name *
            </Label>
            <Input
              id="systemName"
              {...form.register('systemName')}
              placeholder="Enter system name"
              className="max-w-md"
            />
            {form.formState.errors.systemName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.systemName.message}
              </p>
            )}
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Logo URL
            </Label>
            <Input
              id="logoUrl"
              {...form.register('logoUrl')}
              placeholder="https://example.com/logo.png"
              className="max-w-md"
            />
            {form.formState.errors.logoUrl && (
              <p className="text-sm text-destructive">
                {form.formState.errors.logoUrl.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Recommended size: 200x50px or similar aspect ratio
            </p>
          </div>

          {/* Favicon URL */}
          <div className="space-y-2">
            <Label htmlFor="faviconUrl" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              Favicon URL
            </Label>
            <Input
              id="faviconUrl"
              {...form.register('faviconUrl')}
              placeholder="https://example.com/favicon.ico"
              className="max-w-md"
            />
            {form.formState.errors.faviconUrl && (
              <p className="text-sm text-destructive">
                {form.formState.errors.faviconUrl.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Recommended format: .ico, .png (16x16px or 32x32px)
            </p>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  {...form.register('primaryColor')}
                  placeholder="#3B82F6"
                  className="max-w-32"
                />
                <input
                  type="color"
                  value={form.watch('primaryColor') || '#3B82F6'}
                  onChange={(e) => form.setValue('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-input"
                />
              </div>
              {form.formState.errors.primaryColor && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.primaryColor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  {...form.register('secondaryColor')}
                  placeholder="#64748B"
                  className="max-w-32"
                />
                <input
                  type="color"
                  value={form.watch('secondaryColor') || '#64748B'}
                  onChange={(e) => form.setValue('secondaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-input"
                />
              </div>
              {form.formState.errors.secondaryColor && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.secondaryColor.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Text</Label>
            <Textarea
              id="footerText"
              {...form.register('footerText')}
              placeholder="© 2024 Your Organization. All rights reserved."
              rows={3}
              className="max-w-md"
            />
            {form.formState.errors.footerText && (
              <p className="text-sm text-destructive">
                {form.formState.errors.footerText.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || updateBrandingMutation.isLoading}
              className="min-w-32"
            >
              {(isLoading || updateBrandingMutation.isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
