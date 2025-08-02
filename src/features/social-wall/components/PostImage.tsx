'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PostImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  /** Whether to use object-fit: contain (fit entire image) or cover (fill container) */
  objectFit?: 'contain' | 'cover';
  /** Whether to maintain aspect ratio */
  maintainAspectRatio?: boolean;
}

export function PostImage({
  src,
  alt,
  className,
  onClick,
  objectFit = 'contain',
  maintainAspectRatio = true
}: PostImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-700 rounded-lg",
          className
        )}
      >
        <div className="text-center p-4">
          <svg 
            className="w-8 h-8 mx-auto mb-2 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p>Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900",
      maintainAspectRatio && "aspect-video",
      className
    )}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full cursor-pointer hover:opacity-90 transition-opacity",
          objectFit === 'contain' ? "object-contain" : "object-cover",
          !isLoaded && "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
}
