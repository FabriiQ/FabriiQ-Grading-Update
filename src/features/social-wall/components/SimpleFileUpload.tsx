'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  Upload,
  File,
  Image as ImageIcon,
  Video,
  Link as LinkIcon
} from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface SimpleFileUploadProps {
  onFilesChange: (files: Array<{ url: string; name: string; type: string }>) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export function SimpleFileUpload({
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', 'text/*'],
  className
}: SimpleFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update parent component when files change
  useEffect(() => {
    const completedFiles = uploadedFiles
      .filter(file => file.status === 'completed')
      .map(file => ({
        url: file.url,
        name: file.name,
        type: file.type
      }));
    onFilesChange(completedFiles);
  }, [uploadedFiles, onFilesChange]);

  // Upload mutation
  const uploadMutation = api.socialWall.uploadFile.useMutation({
    onSuccess: (data, variables) => {
      setUploadedFiles(prev => prev.map(file =>
        file.name === variables.fileName
          ? { ...file, status: 'completed' as const, url: data.url, progress: 100 }
          : file
      ));
    },
    onError: (error, variables) => {
      setUploadedFiles(prev => prev.map(file =>
        file.name === variables.fileName
          ? { ...file, status: 'error' as const, error: error.message }
          : file
      ));
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const updateParentFiles = useCallback(() => {
    const completedFiles = uploadedFiles
      .filter(file => file.status === 'completed')
      .map(file => ({
        url: file.url,
        name: file.name,
        type: file.type
      }));
    onFilesChange(completedFiles);
  }, [uploadedFiles, onFilesChange]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    files.forEach(file => {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        return;
      }

      // Validate file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`File type ${file.type} is not supported`);
        return;
      }

      // Add to upload queue
      const uploadFile: UploadedFile = {
        id: `${Date.now()}_${file.name}`,
        name: file.name,
        url: '',
        type: file.type,
        size: file.size,
        progress: 0,
        status: 'uploading' as const
      };

      setUploadedFiles(prev => [...prev, uploadFile]);

      // Convert file to base64 and upload
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

        uploadMutation.mutate({
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
          folder: 'social-wall'
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput); // Validate URL
      
      const urlFile: UploadedFile = {
        id: `url_${Date.now()}`,
        name: urlInput.split('/').pop() || 'External Link',
        url: urlInput,
        type: 'url',
        size: 0,
        progress: 100,
        status: 'completed'
      };

      setUploadedFiles(prev => [...prev, urlFile]);
      setUrlInput('');
      setShowUrlInput(false);
      updateParentFiles();
      
      toast.success('URL added successfully');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    updateParentFiles();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type === 'url') return <LinkIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Controls */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadedFiles.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={uploadedFiles.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          Add URL
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Input */}
      {showUrlInput && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Enter URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <Button onClick={handleUrlAdd} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map(file => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {file.size > 0 && <span>{formatFileSize(file.size)}</span>}
                      <Badge 
                        variant={
                          file.status === 'completed' ? 'default' :
                          file.status === 'error' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {file.status}
                      </Badge>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Info */}
      <p className="text-xs text-muted-foreground">
        Maximum {maxFiles} files, {maxFileSize}MB each. 
        Supported: {acceptedTypes.join(', ')}
      </p>
    </div>
  );
}
