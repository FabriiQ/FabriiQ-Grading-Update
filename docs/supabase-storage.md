# Supabase Storage Implementation

This document describes the comprehensive Supabase storage implementation for FabriiQ, including configuration, security, and usage guidelines.

## Overview

Our Supabase storage implementation provides:
- **Secure file uploads** with comprehensive validation
- **Multiple storage buckets** for different content types
- **Row Level Security (RLS)** policies for access control
- **Automatic file validation** including malware scanning capabilities
- **Migration tools** for moving existing files to Supabase
- **Retry logic** and error handling for reliability

## Architecture

### Storage Buckets

| Bucket | Purpose | Public | Max Size | Allowed Types |
|--------|---------|--------|----------|---------------|
| `social-wall` | Social media posts | Yes | 10MB | Images, Videos |
| `avatars` | User profile pictures | Yes | 5MB | Images only |
| `documents` | Course materials, assignments | No | 50MB | Documents, PDFs |
| `assessments` | Assessment files | No | 25MB | Documents, Images |

### File Structure

```
src/
├── lib/supabase/
│   ├── config.ts              # Central configuration
│   ├── storage.service.ts     # Main storage service
│   └── file-validator.ts      # File validation service
├── scripts/
│   ├── setup-supabase-storage.ts     # Bucket setup
│   ├── setup-storage-policies.sql    # RLS policies
│   ├── deploy-storage-setup.ts       # Complete deployment
│   └── migrate-to-supabase.ts        # Migration script
└── features/social-wall/services/
    └── supabase-storage.service.ts   # Legacy service (deprecated)
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Storage Configuration
SUPABASE_STORAGE_BUCKET_SOCIAL_WALL="social-wall"
SUPABASE_STORAGE_BUCKET_AVATARS="avatars"
SUPABASE_STORAGE_BUCKET_DOCUMENTS="documents"
SUPABASE_STORAGE_BUCKET_ASSESSMENTS="assessments"
SUPABASE_STORAGE_MAX_FILE_SIZE="10485760"  # 10MB in bytes
SUPABASE_STORAGE_CDN_URL="https://your-project.supabase.co/storage/v1/object/public"
```

### Bucket Configuration

Each bucket has specific configuration in `src/lib/supabase/config.ts`:

```typescript
bucketConfigs: {
  socialWall: {
    public: true,
    allowedMimeTypes: ['image/*', 'video/*'],
    fileSizeLimit: '10MB',
  },
  // ... other buckets
}
```

## Usage

### Basic File Upload

```typescript
import { supabaseStorageService } from '@/lib/supabase/storage.service';

// Upload a file
const result = await supabaseStorageService.uploadFile(
  file, // File, Buffer, or Uint8Array
  'my-image.jpg',
  {
    bucket: 'social-wall',
    folder: 'posts',
    validation: {
      scanForMalware: true,
      checkImageDimensions: true,
      maxImageWidth: 2048,
      maxImageHeight: 2048,
    }
  }
);

console.log('Uploaded:', result.url);
```

### File Validation

The system automatically validates:
- **File size** against bucket limits
- **MIME types** against allowed types
- **File extensions** for security
- **Malicious content** patterns
- **Image dimensions** (optional)
- **Malware scanning** (optional, placeholder)

### Advanced Usage

```typescript
// Create signed URL for private files
const signedUrl = await supabaseStorageService.createSignedUrl(
  'documents/private-file.pdf',
  3600, // 1 hour expiry
  'documents'
);

// Delete a file
await supabaseStorageService.deleteFile('path/to/file.jpg', 'social-wall');

// List files in a bucket
const files = await supabaseStorageService.listFiles('posts/', 'social-wall', {
  limit: 50,
  search: 'image'
});
```

## Security

### Row Level Security (RLS)

RLS policies are defined in `src/scripts/setup-storage-policies.sql`:

#### Social Wall Bucket
- **Upload**: Authenticated users can upload
- **View**: Public access (bucket is public)
- **Delete**: Users can delete their own files, admins can delete any

#### Avatars Bucket
- **Upload**: Authenticated users can upload
- **View**: Public access (bucket is public)
- **Update**: Users can update their own avatars
- **Delete**: Users can delete their own avatars, admins can delete any

#### Documents Bucket (Private)
- **Upload**: Authenticated users can upload
- **View**: Users can view files they own or have access to
- **Delete**: Users can delete their own files, admins can delete any

#### Assessments Bucket (Private)
- **Upload**: Teachers and admins only
- **View**: Teachers, admins, and students
- **Delete**: Teachers and admins only

### File Validation Security

- **Dangerous extensions** blocked (exe, bat, script files, etc.)
- **Suspicious patterns** detected in file content
- **MIME type validation** against file headers
- **File name sanitization** to prevent path traversal
- **Size limits** enforced per bucket

## Deployment

### 1. Setup Buckets

```bash
npm run tsx src/scripts/setup-supabase-storage.ts
```

### 2. Apply RLS Policies

Execute the SQL in `src/scripts/setup-storage-policies.sql` in your Supabase dashboard.

### 3. Complete Deployment

```bash
npm run tsx src/scripts/deploy-storage-setup.ts
```

### 4. Migrate Existing Files

```bash
npm run tsx src/scripts/migrate-to-supabase.ts
```

## Migration

The migration script supports:
- **Batch processing** to avoid overwhelming the system
- **Retry logic** for failed uploads
- **Progress tracking** with detailed reporting
- **Dry run mode** for testing
- **Error handling** with detailed logs

### Migration Options

```typescript
// Run migration with custom options
await migratePostMedia({
  batchSize: 5,        // Process 5 files at a time
  maxRetries: 3,       // Retry failed uploads 3 times
  retryDelay: 2000,    // Wait 2 seconds between retries
  dryRun: true,        // Test mode - don't actually migrate
  skipExisting: true   // Skip files already migrated
});
```

## Monitoring

### Logging

All storage operations are logged with structured data:

```typescript
logger.info('File uploaded successfully', {
  url: result.url,
  path: result.path,
  size: result.size,
  mimeType: result.mimeType,
  bucket: result.bucket,
  validationWarnings: warnings
});
```

### Error Handling

Errors are categorized and handled appropriately:
- **BAD_REQUEST**: Invalid file or parameters
- **UNAUTHORIZED**: Authentication issues
- **FORBIDDEN**: Permission denied
- **NOT_FOUND**: File or bucket not found
- **INTERNAL_SERVER_ERROR**: System errors

## Best Practices

### File Naming
- Use descriptive, safe file names
- Avoid special characters and spaces
- Include timestamps for uniqueness

### Performance
- Use appropriate image sizes and formats
- Compress files before upload when possible
- Use batch operations for multiple files

### Security
- Always validate files on upload
- Use signed URLs for private content
- Regularly review and update RLS policies
- Monitor for suspicious upload patterns

## Troubleshooting

### Common Issues

1. **Upload fails with "File too large"**
   - Check bucket file size limits
   - Verify file size against configuration

2. **Permission denied errors**
   - Verify RLS policies are applied
   - Check user authentication status
   - Ensure user has required permissions

3. **MIME type validation fails**
   - Check file extension matches content
   - Verify allowed MIME types for bucket
   - Use proper file headers

### Debug Mode

Enable debug logging:

```typescript
// Set LOG_LEVEL=debug in environment
process.env.LOG_LEVEL = 'debug';
```

## Future Enhancements

- **Image processing** with automatic resizing and optimization
- **Video transcoding** for consistent formats
- **Real malware scanning** integration
- **CDN optimization** for global delivery
- **Backup and archival** policies
- **Analytics and usage tracking**
