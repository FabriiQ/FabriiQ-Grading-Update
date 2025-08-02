/**
 * Image Upload Component
 * Handles image uploads for social wall posts
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  X,
  Image as ImageIcon,
  File,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export function ImageUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className
}: ImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload mutation
  const uploadMutation = api.socialWall.uploadFile.useMutation({
    onSuccess: (data, variables) => {
      const fileIndex = uploadingFiles.findIndex(f => f.file.name === variables.fileName);
      if (fileIndex !== -1) {
        setUploadingFiles(prev => prev.map((f, i) => 
          i === fileIndex 
            ? { ...f, status: 'completed', url: data.url, progress: 100 }
            : f
        ));
      }
    },
    onError: (error, variables) => {
      const fileIndex = uploadingFiles.findIndex(f => f.file.name === variables.fileName);
      if (fileIndex !== -1) {
        setUploadingFiles(prev => prev.map((f, i) => 
          i === fileIndex 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
      }
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length + uploadingFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);
    setShowPreview(true);

    // Start uploads
    for (const file of validFiles) {
      try {
        // Convert file to base64 for upload
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        uploadMutation.mutate({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          folder: 'social-wall'
        });
      } catch (error) {
        console.error('Upload error:', error);
        const fileIndex = uploadingFiles.findIndex(f => f.file.name === file.name);
        if (fileIndex !== -1) {
          setUploadingFiles(prev => prev.map((f, i) => 
            i === fileIndex 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ));
        }
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    const completedUrls = uploadingFiles
      .filter(f => f.status === 'completed' && f.url)
      .map(f => f.url!);
    
    onUploadComplete(completedUrls);
    setUploadingFiles([]);
    setShowPreview(false);
  };

  const allCompleted = uploadingFiles.length > 0 && uploadingFiles.every(f => f.status === 'completed');
  const hasErrors = uploadingFiles.some(f => f.status === 'error');

  return (
    <>
      <div className={cn("relative", className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            "hover:bg-muted/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {allowedTypes.includes('image/jpeg') ? 'Images' : 'Files'} up to {maxSize}MB ({maxFiles} max)
          </p>
        </div>
      </div>

      {/* Upload Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Progress</DialogTitle>
            <DialogDescription>
              {uploadingFiles.length} file(s) being processed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {uploadingFiles.map((uploadFile, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {uploadFile.file.type.startsWith('image/') ? (
                    <ImageIcon className="w-8 h-8 text-blue-500" />
                  ) : (
                    <File className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mt-2" />
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {uploadFile.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {uploadFile.status === 'completed' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="ml-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadingFiles([]);
                setShowPreview(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!allCompleted || hasErrors}
            >
              {allCompleted ? 'Add to Post' : 'Uploading...'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
