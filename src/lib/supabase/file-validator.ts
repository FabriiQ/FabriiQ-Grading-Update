/**
 * File Validation Service
 * Comprehensive file validation for security and compliance
 */

import { logger } from '@/server/api/utils/logger';
import { storageConfig, formatFileSize } from './config';

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  scanForMalware?: boolean;
  checkImageDimensions?: boolean;
  maxImageWidth?: number;
  maxImageHeight?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedMimeType: string;
  fileSize: number;
  fileName: string;
  sanitizedFileName: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number; // for videos
    pages?: number; // for PDFs
  };
}

export class FileValidator {
  private readonly dangerousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'msi', 'dll', 'sys',
    'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'sh', 'ps1'
  ];

  private readonly suspiciousPatterns = [
    /\x00/g, // null bytes
    /<script/gi, // script tags
    /javascript:/gi, // javascript protocol
    /data:.*base64/gi, // base64 data URLs
    /vbscript:/gi, // vbscript protocol
  ];

  /**
   * Validate a file comprehensively
   */
  async validateFile(
    file: Buffer | Uint8Array | File,
    fileName: string,
    options: FileValidationOptions = {}
  ): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      detectedMimeType: '',
      fileSize: 0,
      fileName,
      sanitizedFileName: '',
    };

    try {
      // Basic validation
      result.fileSize = file instanceof File ? file.size : file.length;
      result.sanitizedFileName = this.sanitizeFileName(fileName);

      // Validate file name
      this.validateFileName(fileName, result);

      // Validate file size
      this.validateFileSize(result.fileSize, options.maxSize || storageConfig.maxFileSize, result);

      // Detect MIME type
      result.detectedMimeType = await this.detectMimeType(file, fileName);

      // Validate MIME type
      if (options.allowedMimeTypes) {
        this.validateMimeType(result.detectedMimeType, options.allowedMimeTypes, result);
      }

      // Validate file extension
      if (options.allowedExtensions) {
        this.validateExtension(fileName, options.allowedExtensions, result);
      }

      // Check for dangerous extensions
      this.checkDangerousExtensions(fileName, result);

      // Scan file content for suspicious patterns
      await this.scanFileContent(file, result);

      // Additional validations based on file type
      if (result.detectedMimeType.startsWith('image/') && options.checkImageDimensions) {
        await this.validateImageDimensions(file, options, result);
      }

      // Malware scanning (placeholder - would integrate with actual scanner)
      if (options.scanForMalware) {
        await this.scanForMalware(file, result);
      }

      // Set overall validity
      result.isValid = result.errors.length === 0;

      if (!result.isValid) {
        logger.warn('File validation failed', {
          fileName,
          errors: result.errors,
          warnings: result.warnings,
        });
      }

      return result;

    } catch (error) {
      logger.error('File validation error', { error, fileName });
      result.isValid = false;
      result.errors.push('File validation failed due to internal error');
      return result;
    }
  }

  /**
   * Sanitize file name to prevent path traversal and other attacks
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path separators and dangerous characters
    let sanitized = fileName
      .replace(/[\/\\:*?"<>|]/g, '_') // Replace dangerous characters
      .replace(/\.\./g, '_') // Remove path traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .trim();

    // Ensure filename is not empty
    if (!sanitized) {
      sanitized = `file_${Date.now()}`;
    }

    // Limit length
    if (sanitized.length > 255) {
      const extension = sanitized.split('.').pop();
      const baseName = sanitized.substring(0, 250 - (extension?.length || 0));
      sanitized = extension ? `${baseName}.${extension}` : baseName;
    }

    return sanitized;
  }

  /**
   * Validate file name
   */
  private validateFileName(fileName: string, result: FileValidationResult): void {
    if (!fileName || fileName.trim().length === 0) {
      result.errors.push('File name is required');
      return;
    }

    // Check for suspicious patterns in filename
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(fileName)) {
        result.warnings.push('File name contains suspicious patterns');
        break;
      }
    }

    // Check for very long filenames
    if (fileName.length > 255) {
      result.warnings.push('File name is very long and will be truncated');
    }

    // Check for hidden files (starting with dot)
    if (fileName.startsWith('.')) {
      result.warnings.push('Hidden file detected');
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(fileSize: number, maxSize: number, result: FileValidationResult): void {
    if (fileSize === 0) {
      result.errors.push('File is empty');
      return;
    }

    if (fileSize > maxSize) {
      result.errors.push(
        `File size ${formatFileSize(fileSize)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`
      );
    }

    // Warn about very large files
    if (fileSize > maxSize * 0.8) {
      result.warnings.push('File size is close to the maximum limit');
    }
  }

  /**
   * Detect MIME type from file content
   */
  private async detectMimeType(file: Buffer | Uint8Array | File, fileName: string): Promise<string> {
    // If it's a File object, use its type first
    if (file instanceof File && file.type) {
      return file.type;
    }

    // Get file buffer for analysis
    const buffer = file instanceof File ? 
      new Uint8Array(await file.arrayBuffer()) : 
      file instanceof Buffer ? file : file;

    // Check magic numbers for common file types
    const mimeType = this.detectMimeTypeFromMagicNumbers(buffer);
    if (mimeType) {
      return mimeType;
    }

    // Fallback to extension-based detection
    return this.detectMimeTypeFromExtension(fileName);
  }

  /**
   * Detect MIME type from magic numbers (file signatures)
   */
  private detectMimeTypeFromMagicNumbers(buffer: Uint8Array | Buffer): string | null {
    const bytes = buffer.slice(0, 16);

    // Image formats
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';

    // Video formats
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'video/mp4';

    // Document formats
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      // ZIP-based formats (Office documents)
      return 'application/zip'; // Will be refined by extension
    }

    return null;
  }

  /**
   * Detect MIME type from file extension
   */
  private detectMimeTypeFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypeMap: Record<string, string> = {
      // Images
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon',
      
      // Videos
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
      
      // Audio
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
      
      // Documents
      pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    return mimeTypeMap[extension || ''] || 'application/octet-stream';
  }

  /**
   * Validate MIME type against allowed types
   */
  private validateMimeType(mimeType: string, allowedTypes: string[], result: FileValidationResult): void {
    const isAllowed = allowedTypes.some(allowed => {
      if (allowed.endsWith('/*')) {
        const category = allowed.slice(0, -2);
        return mimeType.startsWith(category + '/');
      }
      return mimeType === allowed;
    });

    if (!isAllowed) {
      result.errors.push(
        `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Validate file extension
   */
  private validateExtension(fileName: string, allowedExtensions: string[], result: FileValidationResult): void {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      result.errors.push('File must have an extension');
      return;
    }

    if (!allowedExtensions.includes(extension)) {
      result.errors.push(
        `File extension .${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      );
    }
  }

  /**
   * Check for dangerous file extensions
   */
  private checkDangerousExtensions(fileName: string, result: FileValidationResult): void {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension && this.dangerousExtensions.includes(extension)) {
      result.errors.push(`Dangerous file extension .${extension} is not allowed`);
    }
  }

  /**
   * Scan file content for suspicious patterns
   */
  private async scanFileContent(file: Buffer | Uint8Array | File, result: FileValidationResult): Promise<void> {
    try {
      // Get file content as string for text-based scanning
      const buffer = file instanceof File ? 
        new Uint8Array(await file.arrayBuffer()) : 
        file instanceof Buffer ? file : file;

      // Convert to string for pattern matching (first 1KB only for performance)
      const textContent = new TextDecoder('utf-8', { fatal: false })
        .decode(buffer.slice(0, 1024));

      // Check for suspicious patterns
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(textContent)) {
          result.warnings.push('File contains suspicious content patterns');
          break;
        }
      }

    } catch (error) {
      // Ignore errors in content scanning (binary files may not decode properly)
      logger.debug('Content scanning failed (expected for binary files)', { error });
    }
  }



  /**
   * Validate image dimensions
   */
  private async validateImageDimensions(
    _file: Buffer | Uint8Array | File,
    _options: FileValidationOptions,
    result: FileValidationResult
  ): Promise<void> {
    try {
      // This is a placeholder - in a real implementation, you'd use an image processing library
      // like sharp or jimp to get actual image dimensions

      // TODO: Implement actual dimension checking
      // const maxWidth = options.maxImageWidth || 4096;
      // const maxHeight = options.maxImageHeight || 4096;

      // For now, we'll just add a warning about large files that might have large dimensions
      if (result.fileSize > 5 * 1024 * 1024) { // 5MB
        result.warnings.push('Large image file - please verify dimensions are appropriate');
      }

      // TODO: Implement actual dimension checking
      // const dimensions = await getImageDimensions(file);
      // if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
      //   result.errors.push(`Image dimensions ${dimensions.width}x${dimensions.height} exceed maximum ${maxWidth}x${maxHeight}`);
      // }

    } catch (error) {
      logger.warn('Image dimension validation failed', { error });
      result.warnings.push('Could not validate image dimensions');
    }
  }

  /**
   * Scan for malware (placeholder)
   */
  private async scanForMalware(_file: Buffer | Uint8Array | File, result: FileValidationResult): Promise<void> {
    try {
      // This is a placeholder for malware scanning
      // In a real implementation, you'd integrate with a service like:
      // - ClamAV
      // - VirusTotal API
      // - AWS GuardDuty
      // - Microsoft Defender API

      logger.info('Malware scanning requested (not implemented)');
      result.warnings.push('Malware scanning not implemented - manual review recommended for sensitive uploads');

    } catch (error) {
      logger.warn('Malware scanning failed', { error });
      result.warnings.push('Malware scanning failed');
    }
  }
}

// Export singleton instance
export const fileValidator = new FileValidator();
