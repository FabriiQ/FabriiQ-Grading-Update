/**
 * Supabase Storage Service
 * Handles file uploads and management using Supabase Storage
 */

import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import {
  createSupabaseServiceClient,
  storageConfig,
  generateFilePath,
  isValidMimeType,
  formatFileSize,
  getPublicUrl,
  getBucketConfig
} from '@/lib/supabase/config';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export class SupabaseStorageService {
  private readonly supabase = createSupabaseServiceClient();
  private readonly defaultBucket = storageConfig.buckets.socialWall;
  private readonly defaultMaxSize = storageConfig.maxFileSize;
  private readonly defaultAllowedTypes = [
    ...storageConfig.allowedMimeTypes.images,
    ...storageConfig.allowedMimeTypes.videos,
    ...storageConfig.allowedMimeTypes.documents,
  ];

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: Buffer | Uint8Array | File,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        bucket = this.defaultBucket,
        folder = 'uploads',
        maxSize = this.defaultMaxSize,
        allowedTypes = this.defaultAllowedTypes
      } = options;

      // Validate file size
      const fileSize = file instanceof File ? file.size : file.length;
      if (fileSize > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
        });
      }

      // Get file type
      let mimeType = '';
      if (file instanceof File) {
        mimeType = file.type;
      } else {
        // Try to determine mime type from file extension
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'mp4': 'video/mp4',
          'webm': 'video/webm',
          'pdf': 'application/pdf',
          'txt': 'text/plain',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        mimeType = mimeMap[ext || ''] || 'application/octet-stream';
      }

      // Validate file type using the improved validation
      if (!isValidMimeType(mimeType, allowedTypes)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Generate unique file path using the utility function
      const filePath = generateFilePath(folder, fileName);

      // Upload to Supabase Storage
      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        logger.error('Supabase upload error', { error, filePath });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Upload failed: ${error.message}`,
        });
      }

      // Get public URL using the utility function
      const publicUrl = getPublicUrl(bucket, filePath);

      if (!publicUrl) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get public URL for uploaded file',
        });
      }

      logger.info('File uploaded successfully', {
        path: filePath,
        size: fileSize,
        mimeType,
        url: publicUrl
      });

      return {
        url: publicUrl,
        path: filePath,
        size: fileSize,
        mimeType,
      };
    } catch (error) {
      logger.error('Upload service error', { error, fileName });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Upload failed',
      });
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string, bucket = this.defaultBucket): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        logger.error('Supabase delete error', { error, filePath });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Delete failed: ${error.message}`,
        });
      }

      logger.info('File deleted successfully', { path: filePath });
    } catch (error) {
      logger.error('Delete service error', { error, filePath });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Delete failed',
      });
    }
  }

  /**
   * Get file info from Supabase Storage
   */
  async getFileInfo(filePath: string, bucket = this.defaultBucket) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get file info: ${error.message}`,
        });
      }

      return data?.[0] || null;
    } catch (error) {
      logger.error('Get file info error', { error, filePath });
      throw error;
    }
  }

  /**
   * Move existing files from local storage to Supabase
   */
  async migrateFile(
    localUrl: string,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Fetch the file from the local URL
      const response = await fetch(localUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // Upload to Supabase
      return await this.uploadFile(uint8Array, fileName, {
        ...options,
        folder: options.folder || 'migrated'
      });
    } catch (error) {
      logger.error('File migration error', { error, localUrl, fileName });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'File migration failed',
      });
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  async ensureBucket(bucketName: string): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        // Get bucket configuration
        const bucketConfig = getBucketConfig(bucketName as keyof typeof storageConfig.buckets);

        const { error } = await this.supabase.storage.createBucket(bucketName, {
          public: bucketConfig?.public ?? true,
          allowedMimeTypes: bucketConfig?.allowedMimeTypes ? [...bucketConfig.allowedMimeTypes] : this.defaultAllowedTypes,
          fileSizeLimit: bucketConfig?.fileSizeLimit ?? '10MB',
        });

        if (error) {
          logger.error('Failed to create bucket', { error, bucketName });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create storage bucket: ${error.message}`,
          });
        }

        logger.info('Storage bucket created', { bucketName });
      }
    } catch (error) {
      logger.error('Ensure bucket error', { error, bucketName });
      throw error;
    }
  }
}
