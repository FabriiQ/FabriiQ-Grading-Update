import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

/**
 * System Configuration Router
 * 
 * Handles system-wide configuration settings including branding,
 * general settings, and other system preferences.
 */

const systemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any().optional(),
  description: z.string().optional(),
  category: z.string().default('general'),
  isPublic: z.boolean().default(false),
});

const brandingConfigSchema = z.object({
  systemName: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  footerText: z.string().max(500).optional(),
});

export const systemConfigRouter = createTRPCRouter({
  /**
   * Get all system configurations
   */
  getAll: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      includePrivate: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user has system admin permissions
      if (ctx.session.user.userType !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can access system configurations',
        });
      }

      const where: any = {};
      
      if (input.category) {
        where.category = input.category;
      }
      
      if (!input.includePrivate) {
        where.isPublic = true;
      }

      const configs = await ctx.prisma.systemConfig.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' },
        ],
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return configs;
    }),

  /**
   * Get a specific configuration by key
   */
  getByKey: protectedProcedure
    .input(z.object({
      key: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.prisma.systemConfig.findUnique({
        where: { key: input.key },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // If config is private, check permissions
      if (config && !config.isPublic && ctx.session.user.userType !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied to private configuration',
        });
      }

      return config;
    }),

  /**
   * Get branding configuration
   */
  getBranding: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Test database connection first
        await ctx.prisma.$queryRaw`SELECT 1`;

        const brandingConfigs = await ctx.prisma.systemConfig.findMany({
          where: {
            category: 'branding',
          },
        });

        // Convert array of configs to object
        const branding: any = {};
        brandingConfigs.forEach(config => {
          branding[config.key] = config.value;
        });

        // Return default values if no branding configs exist
        if (Object.keys(branding).length === 0) {
          return {
            'branding.systemName': 'FabriiQ LXP',
            'branding.logoUrl': '',
            'branding.faviconUrl': '',
            'branding.primaryColor': '#3B82F6',
            'branding.secondaryColor': '#64748B',
            'branding.footerText': '© 2024 FabriiQ. All rights reserved.',
          };
        }

        return branding;
      } catch (error) {
        console.error('Error fetching branding configuration:', error);

        // Return default branding configuration if database error occurs
        return {
          'branding.systemName': 'FabriiQ LXP',
          'branding.logoUrl': '',
          'branding.faviconUrl': '',
          'branding.primaryColor': '#3B82F6',
          'branding.secondaryColor': '#64748B',
          'branding.footerText': '© 2024 FabriiQ. All rights reserved.',
        };
      }
    }),

  /**
   * Update branding configuration
   */
  updateBranding: protectedProcedure
    .input(brandingConfigSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has system admin permissions
        if (ctx.session.user.userType !== 'SYSTEM_ADMIN') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only system administrators can update branding settings',
          });
        }

        const userId = ctx.session.user.id;

        // Update each branding field
        const updatePromises: Promise<any>[] = [];
        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            updatePromises.push(
              ctx.prisma.systemConfig.upsert({
                where: { key: `branding.${key}` },
                create: {
                  key: `branding.${key}`,
                  value,
                  description: `Branding setting: ${key}`,
                  category: 'branding',
                  isPublic: true,
                  createdById: userId,
                },
                update: {
                  value,
                  updatedById: userId,
                  updatedAt: new Date(),
                },
              })
            );
          }
        }

        await Promise.all(updatePromises);

        return { success: true };
      } catch (error) {
        console.error('Error updating branding configuration:', error);

        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update branding configuration',
        });
      }
    }),

  /**
   * Create or update a configuration
   */
  upsert: protectedProcedure
    .input(systemConfigSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has system admin permissions
      if (ctx.session.user.userType !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can modify system configurations',
        });
      }

      const userId = ctx.session.user.id;

      const config = await ctx.prisma.systemConfig.upsert({
        where: { key: input.key },
        create: {
          ...input,
          createdById: userId,
        },
        update: {
          value: input.value,
          description: input.description,
          category: input.category,
          isPublic: input.isPublic,
          updatedById: userId,
          updatedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return config;
    }),

  /**
   * Delete a configuration
   */
  delete: protectedProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has system admin permissions
      if (ctx.session.user.userType !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can delete system configurations',
        });
      }

      await ctx.prisma.systemConfig.delete({
        where: { key: input.key },
      });

      return { success: true };
    }),
});
