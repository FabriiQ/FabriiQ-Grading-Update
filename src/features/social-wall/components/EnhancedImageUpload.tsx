/**
 * Enhanced Image Upload Component
 * Provides multiple upload options and better UX
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  Camera, 
  Link, 
  Image as ImageIcon,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

interface EnhancedImageUploadProps {
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

export function EnhancedImageUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className
}: EnhancedImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not supported`);
        return false;
      }
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name}: File size exceeds ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (uploadingFiles.length + validFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploadingFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Start uploads
    for (const file of validFiles) {
      try {
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
      }
    }
  }, [uploadingFiles.length, maxFiles, maxSize, allowedTypes, uploadMutation]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Handle URL input
  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    try {
      new URL(urlInput); // Validate URL
      const completedUrls = uploadingFiles
        .filter(f => f.status === 'completed')
        .map(f => f.url!)
        .filter(Boolean);
      
      onUploadComplete([...completedUrls, urlInput]);
      setUrlInput('');
      toast.success('Image URL added');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Update completed URLs
  React.useEffect(() => {
    const completedUrls = uploadingFiles
      .filter(f => f.status === 'completed')
      .map(f => f.url!)
      .filter(Boolean);
    
    if (completedUrls.length > 0) {
      onUploadComplete(completedUrls);
    }
  }, [uploadingFiles, onUploadComplete]);

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
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
              Images up to {maxSize}MB ({maxFiles} max)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </TabsContent>

        <TabsContent value="camera" className="space-y-4">
          <div className="text-center">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Use your device camera to capture images
            </p>
          </div>
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
              />
              <Button onClick={handleUrlAdd} disabled={!urlInput.trim()}>
                Add
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{file.file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1" />
                )}
                
                {file.status === 'completed' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    <span className="text-xs">Uploaded</span>
                  </div>
                )}
                
                {file.status === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">{file.error || 'Upload failed'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
