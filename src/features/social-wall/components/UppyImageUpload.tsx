/**
 * Uppy Image Upload Component
 * Professional file upload with multiple sources and advanced features
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Webcam from '@uppy/webcam';
import ImageEditor from '@uppy/image-editor';
import DropTarget from '@uppy/drop-target';
// import Url from '@uppy/url'; // Disabled until companion server is configured
import Audio from '@uppy/audio';
import ScreenCapture from '@uppy/screen-capture';
import { DashboardModal } from '@uppy/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UploadCloud,
  Video,
  LinkIcon,
  X,
  ImageIcon,
  Edit,
  Mic,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';

interface UppyImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function UppyImageUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className,
  isOpen = false,
  onClose
}: UppyImageUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [urlInput, setUrlInput] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const uppyRef = useRef<Uppy | null>(null);

  // Upload mutation for handling file uploads
  const uploadMutation = api.socialWall.uploadFile.useMutation({
    onSuccess: (data) => {
      console.log('Upload successful:', data);
      const newUrls = [...uploadedUrls, data.url];
      setUploadedUrls(newUrls);
      onUploadComplete(newUrls);
      toast.success('Image uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Initialize Uppy
  useEffect(() => {
    const uppy = new Uppy({
      id: 'social-wall-uppy',
      restrictions: {
        maxNumberOfFiles: maxFiles,
        maxFileSize: maxSize * 1024 * 1024,
        allowedFileTypes: allowedTypes,
      },
      autoProceed: false,
      allowMultipleUploadBatches: true,
      debug: process.env.NODE_ENV === 'development',
    });

    // Add plugins
    uppy.use(Dashboard, {
      inline: false,
      showProgressDetails: true,
      proudlyDisplayPoweredByUppy: false,
      theme: 'auto',
      note: `Images only, up to ${maxSize}MB each`,
      metaFields: [
        { id: 'name', name: 'Name', placeholder: 'File name' },
        { id: 'caption', name: 'Caption', placeholder: 'Describe the image' }
      ],
      browserBackButtonClose: true,
    });

    uppy.use(Webcam, {
      countdown: 3,
      modes: ['picture'],
      mirror: true,
      locale: {
        strings: {
          smile: 'Smile! 📸',
          takePicture: 'Take Picture',
          startRecording: 'Start Recording',
          stopRecording: 'Stop Recording',
          allowAccessTitle: 'Please allow camera access',
          allowAccessDescription: 'To take photos, please allow camera access for this site.',
        }
      }
    });

    uppy.use(ImageEditor, {
      quality: 0.8,
      cropperOptions: {
        viewMode: 1,
        background: false,
        autoCropArea: 1,
        responsive: true,
      },
      actions: {
        revert: true,
        rotate: true,
        granularRotate: true,
        flip: true,
        zoomIn: true,
        zoomOut: true,
        cropSquare: true,
        cropWidescreen: true,
        cropWidescreenVertical: true,
      }
    });

    // Note: URL import requires companion server setup
    // Temporarily disabled until companion is configured
    // uppy.use(Url, {
    //   companionUrl: process.env.NEXT_PUBLIC_UPPY_COMPANION_URL || '',
    //   locale: {
    //     strings: {
    //       import: 'Import from URL',
    //       enterUrlToImport: 'Enter URL to import file',
    //       failedToFetch: 'Failed to fetch file from URL',
    //       enterCorrectUrl: 'Please enter a correct URL',
    //     }
    //   }
    // });

    // Add audio recording capability
    uppy.use(Audio, {
      locale: {
        strings: {
          startAudioRecording: 'Start Recording',
          stopAudioRecording: 'Stop Recording',
          allowAudioAccessTitle: 'Please allow microphone access',
          allowAudioAccessDescription: 'To record audio, please allow microphone access for this site.',
        }
      }
    });

    // Add screen capture capability
    uppy.use(ScreenCapture, {
      locale: {
        strings: {
          startCapturing: 'Start Screen Capture',
          stopCapturing: 'Stop Capture',
        }
      }
    });

    uppy.use(DropTarget, {
      target: document.body,
      onDragOver: () => {
        // Optional: Add visual feedback when dragging over the page
      },
      onDrop: () => {
        setIsModalOpen(true);
      }
    });

    // Handle successful uploads
    uppy.on('upload-success', async (file, response) => {
      try {
        if (!file || !file.data || !file.name || !file.type) {
          console.error('Invalid file data');
          toast.error('Invalid file data');
          return;
        }

        // Convert file to base64 for our API
        const arrayBuffer = await file.data.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        uploadMutation.mutate({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          folder: 'social-wall'
        });
      } catch (error) {
        console.error('Error processing uploaded file:', error);
        toast.error('Error processing uploaded file');
      }
    });

    // Handle upload errors
    uppy.on('upload-error', (file, error) => {
      console.error('Upload error:', error);
      toast.error(`Upload failed for ${file?.name}: ${error.message}`);
    });

    // Handle file restrictions
    uppy.on('restriction-failed', (file, error) => {
      toast.error(`File restriction: ${error.message}`);
    });

    // Handle complete upload batch
    uppy.on('complete', (result) => {
      if (result?.successful && result.successful.length > 0) {
        toast.success(`Successfully uploaded ${result.successful.length} file(s)`);
        setIsModalOpen(false);
        onClose?.();
      }
    });

    uppyRef.current = uppy;

    return () => {
      uppy.destroy();
    };
  }, [maxFiles, maxSize, allowedTypes, uploadMutation, onClose]);

  // Sync modal state with prop
  useEffect(() => {
    console.log('Modal state sync - isOpen prop:', isOpen, 'current modal state:', isModalOpen);
    setIsModalOpen(isOpen);
  }, [isOpen]);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed to:', isModalOpen);
  }, [isModalOpen]);

  // Handle URL input
  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    try {
      new URL(urlInput); // Validate URL
      const newUrls = [...uploadedUrls, urlInput];
      setUploadedUrls(newUrls);
      onUploadComplete(newUrls);
      setUrlInput('');
      toast.success('Image URL added');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    onUploadComplete(newUrls);
  };

  // Handle modal close
  const handleModalClose = () => {
    console.log('Modal closing');
    setIsModalOpen(false);
    onClose?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Trigger Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Upload Files button clicked, Uppy ready:', !!uppyRef.current);
            if (uppyRef.current) {
              setIsModalOpen(true);
            } else {
              console.error('Uppy instance not ready');
              toast.error('Upload system not ready. Please try again in a moment.');
            }
          }}
          className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Files
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Webcam button clicked, Uppy ready:', !!uppyRef.current);
            if (uppyRef.current) {
              setIsModalOpen(true);
              // Auto-open webcam after modal opens
              setTimeout(() => {
                const webcamPlugin = uppyRef.current?.getPlugin('Webcam');
                if (webcamPlugin) {
                  try {
                    // Try different methods to activate webcam
                    if ('start' in webcamPlugin) {
                      (webcamPlugin as any).start();
                    } else if ('render' in webcamPlugin) {
                      (webcamPlugin as any).render();
                    } else if ('requestPermissions' in webcamPlugin) {
                      (webcamPlugin as any).requestPermissions();
                    }
                  } catch (error) {
                    console.log('Webcam activation method not available:', error);
                  }
                }
              }, 500); // Increased timeout to ensure modal is fully rendered
            } else {
              console.error('Uppy instance not ready for webcam');
              toast.error('Upload system not ready. Please try again in a moment.');
            }
          }}
          className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <Video className="w-4 h-4" />
          Camera
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Audio button clicked, Uppy ready:', !!uppyRef.current);
            if (uppyRef.current) {
              setIsModalOpen(true);
            } else {
              toast.error('Upload system not ready. Please try again in a moment.');
            }
          }}
          className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <Mic className="w-4 h-4" />
          Audio
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Screen capture button clicked, Uppy ready:', !!uppyRef.current);
            if (uppyRef.current) {
              setIsModalOpen(true);
            } else {
              toast.error('Upload system not ready. Please try again in a moment.');
            }
          }}
          className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <Monitor className="w-4 h-4" />
          Screen
        </Button>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="image-url" className="text-sm font-medium">
          Or add from URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim()}
            size="sm"
            className="px-3"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-20 object-cover rounded border hover:opacity-90 transition-opacity"
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Preview image loaded:', url);
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Preview image failed to load:', url);
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAzNUw2NSA1MEgzNUw1MCAzNVoiIGZpbGw9IiM5QjlCQTAiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMjAiIHN0cm9rZT0iIzlCOUJBMCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlCOUJBMCIgZm9udC1zaXplPSI4Ij5FcnJvcjwvdGV4dD4KPC9zdmc+Cg==';
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uppy Dashboard Modal */}
      {uppyRef.current && (
        <DashboardModal
          uppy={uppyRef.current}
          open={isModalOpen}
          onRequestClose={handleModalClose}
          closeModalOnClickOutside
          animateOpenClose
          browserBackButtonClose
        />
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Debug: Modal Open: {isModalOpen.toString()}, Uppy Ready: {!!uppyRef.current}
        </div>
      )}
    </div>
  );
}
