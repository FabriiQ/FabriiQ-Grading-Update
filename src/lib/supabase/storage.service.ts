/**
 * Centralized Supabase Storage Service
 * Provides a comprehensive interface for all storage operations
 */

import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import {
  createSupabaseServiceClient,
  storageConfig,
  generateFilePath,
  getPublicUrl,
  getBucketConfig
} from './config';
import { fileValidator, FileValidationOptions } from './file-validator';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
  bucket: string;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  upsert?: boolean;
  metadata?: Record<string, any>;
  validation?: FileValidationOptions;
}

export interface StorageError {
  code: string;
  message: string;
  details?: any;
}

export class SupabaseStorageService {
  private readonly supabase = createSupabaseServiceClient();
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Upload a file with comprehensive validation and error handling
   */
  async uploadFile(
    file: Buffer | Uint8Array | File,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      bucket = storageConfig.buckets.socialWall,
      folder = 'uploads',
      maxSize = storageConfig.maxFileSize,
      allowedTypes = [...storageConfig.allowedMimeTypes.images, ...storageConfig.allowedMimeTypes.videos],
      upsert = false,
      metadata = {}
    } = options;

    try {
      // Comprehensive file validation
      const validationResult = await fileValidator.validateFile(file, fileName, {
        maxSize,
        allowedMimeTypes: allowedTypes,
        scanForMalware: options.validation?.scanForMalware ?? false,
        checkImageDimensions: options.validation?.checkImageDimensions ?? false,
        maxImageWidth: options.validation?.maxImageWidth,
        maxImageHeight: options.validation?.maxImageHeight,
      });

      if (!validationResult.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `File validation failed: ${validationResult.errors.join(', ')}`,
        });
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        logger.warn('File validation warnings', {
          fileName: validationResult.sanitizedFileName,
          warnings: validationResult.warnings,
        });
      }

      // Ensure bucket exists
      await this.ensureBucket(bucket);

      // Generate file path using sanitized filename
      const filePath = generateFilePath(folder, validationResult.sanitizedFileName);

      // Upload with retry logic
      await this.uploadWithRetry(
        bucket,
        filePath,
        file,
        {
          contentType: validationResult.detectedMimeType,
          upsert,
          metadata: {
            ...metadata,
            originalFileName: fileName,
            sanitizedFileName: validationResult.sanitizedFileName,
            validationWarnings: validationResult.warnings,
          },
        }
      );

      // Get public URL
      const publicUrl = getPublicUrl(bucket, filePath);

      const result: UploadResult = {
        url: publicUrl,
        path: filePath,
        size: validationResult.fileSize,
        mimeType: validationResult.detectedMimeType,
        bucket,
      };

      logger.info('File uploaded successfully', {
        ...result,
        metadata,
        validationWarnings: validationResult.warnings.length > 0 ? validationResult.warnings : undefined
      });

      return result;

    } catch (error) {
      logger.error('Upload failed', { error, fileName, bucket, folder });
      throw this.handleStorageError(error, 'Upload failed');
    }
  }

  /**
   * Delete a file with proper error handling
   */
  async deleteFile(filePath: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || storageConfig.buckets.socialWall;

    try {
      const { error } = await this.supabase.storage
        .from(targetBucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      logger.info('File deleted successfully', { path: filePath, bucket: targetBucket });

    } catch (error) {
      logger.error('Delete failed', { error, filePath, bucket: targetBucket });
      throw this.handleStorageError(error, 'Delete failed');
    }
  }

  /**
   * Move/copy files between buckets or paths
   */
  async moveFile(
    fromPath: string,
    toPath: string,
    fromBucket?: string,
    toBucket?: string
  ): Promise<void> {
    const sourceBucket = fromBucket || storageConfig.buckets.socialWall;
    const targetBucket = toBucket || sourceBucket;

    try {
      const { error } = await this.supabase.storage
        .from(sourceBucket)
        .move(fromPath, toPath);

      if (error) {
        throw error;
      }

      logger.info('File moved successfully', {
        from: `${sourceBucket}/${fromPath}`,
        to: `${targetBucket}/${toPath}`,
      });

    } catch (error) {
      logger.error('Move failed', { error, fromPath, toPath, sourceBucket, targetBucket });
      throw this.handleStorageError(error, 'Move failed');
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string, bucket?: string) {
    const targetBucket = bucket || storageConfig.buckets.socialWall;

    try {
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');

      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list(folderPath, {
          search: fileName,
        });

      if (error) {
        throw error;
      }

      return data?.[0] || null;

    } catch (error) {
      logger.error('Get file info failed', { error, filePath, bucket: targetBucket });
      throw this.handleStorageError(error, 'Failed to get file info');
    }
  }

  /**
   * List files in a bucket/folder
   */
  async listFiles(
    folder: string = '',
    bucket?: string,
    options: { limit?: number; offset?: number; search?: string } = {}
  ) {
    const targetBucket = bucket || storageConfig.buckets.socialWall;
    const { limit = 100, offset = 0, search } = options;

    try {
      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list(folder, {
          limit,
          offset,
          search,
        });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      logger.error('List files failed', { error, folder, bucket: targetBucket });
      throw this.handleStorageError(error, 'Failed to list files');
    }
  }

  /**
   * Create a signed URL for private files
   */
  async createSignedUrl(
    filePath: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<string> {
    const targetBucket = bucket || storageConfig.buckets.documents;

    try {
      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .createSignedUrl(filePath, expiresIn);

      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to create signed URL');
      }

      return data.signedUrl;

    } catch (error) {
      logger.error('Create signed URL failed', { error, filePath, bucket: targetBucket });
      throw this.handleStorageError(error, 'Failed to create signed URL');
    }
  }

  /**
   * Ensure bucket exists with proper configuration
   */
  async ensureBucket(bucketName: string): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        const config = getBucketConfig(bucketName as keyof typeof storageConfig.buckets);
        
        if (!config) {
          throw new Error(`No configuration found for bucket: ${bucketName}`);
        }

        const { error } = await this.supabase.storage.createBucket(bucketName, {
          public: config.public,
          allowedMimeTypes: [...config.allowedMimeTypes],
          fileSizeLimit: config.fileSizeLimit,
        });

        if (error) {
          throw error;
        }

        logger.info('Storage bucket created', { bucketName });
      }
    } catch (error) {
      logger.error('Ensure bucket failed', { error, bucketName });
      throw this.handleStorageError(error, 'Failed to ensure bucket exists');
    }
  }





  /**
   * Upload with retry logic
   */
  private async uploadWithRetry(
    bucket: string,
    filePath: string,
    file: Buffer | Uint8Array | File,
    options: any,
    attempt: number = 1
  ): Promise<any> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, options);

      if (error) {
        throw error;
      }

      return { success: true };

    } catch (error) {
      if (attempt < this.retryAttempts) {
        logger.warn(`Upload attempt ${attempt} failed, retrying...`, { error, filePath });
        await this.delay(this.retryDelay * attempt);
        return this.uploadWithRetry(bucket, filePath, file, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle storage errors consistently
   */
  private handleStorageError(error: any, defaultMessage: string): TRPCError {
    if (error instanceof TRPCError) {
      return error;
    }

    const message = error?.message || defaultMessage;
    const code = this.mapErrorCode(error);

    return new TRPCError({
      code,
      message,
      cause: error,
    });
  }

  /**
   * Map storage errors to appropriate TRPC error codes
   */
  private mapErrorCode(error: any): 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid token')) {
      return 'UNAUTHORIZED';
    }
    if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      return 'FORBIDDEN';
    }
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return 'NOT_FOUND';
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('bad request')) {
      return 'BAD_REQUEST';
    }

    return 'INTERNAL_SERVER_ERROR';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService();
