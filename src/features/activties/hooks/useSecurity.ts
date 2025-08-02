'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Permission } from '../services/security.service';

/**
 * Hook for security and access control in React components
 */
export function useSecurity() {
  const { data: session } = useSession();
  const [securityContext, setSecurityContext] = useState({
    isAuthenticated: false,
    userRole: null as string | null,
    permissions: [] as Permission[],
    userId: null as string | null,
  });

  useEffect(() => {
    if (session?.user) {
      setSecurityContext({
        isAuthenticated: true,
        userRole: session.user.userType || null,
        permissions: [], // Will be populated from user permissions when available
        userId: session.user.id || null,
      });
    } else {
      setSecurityContext({
        isAuthenticated: false,
        userRole: null,
        permissions: [],
        userId: null,
      });
    }
  }, [session]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return securityContext.permissions.includes(permission);
  }, [securityContext.permissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(permission => securityContext.permissions.includes(permission));
  }, [securityContext.permissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(permission => securityContext.permissions.includes(permission));
  }, [securityContext.permissions]);

  const canAccessResource = useCallback((
    permission: Permission,
    resourceOwnerId?: string
  ): boolean => {
    if (!hasPermission(permission)) {
      return false;
    }

    // If resource has an owner, check if user is the owner or has admin privileges
    if (resourceOwnerId && securityContext.userId !== resourceOwnerId) {
      const adminPermissions = [Permission.MANAGE_USERS, Permission.SYSTEM_ADMIN];
      return hasAnyPermission(adminPermissions);
    }

    return true;
  }, [hasPermission, hasAnyPermission, securityContext.userId]);

  return {
    ...securityContext,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
  };
}

/**
 * Hook for input validation and sanitization
 */
export function useInputValidation() {
  const sanitizeInput = useCallback((input: string): string => {
    // Basic HTML sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }, []);

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const validateFileName = useCallback((fileName: string): boolean => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }, []);

  return {
    sanitizeInput,
    validateEmail,
    validatePassword,
    validateFileName,
  };
}

/**
 * Hook for rate limiting
 */
export function useRateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  const [requestCount, setRequestCount] = useState(0);
  const [resetTime, setResetTime] = useState(Date.now() + windowMs);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    if (now > resetTime) {
      // Reset window
      setRequestCount(1);
      setResetTime(now + windowMs);
      return true;
    }
    
    if (requestCount >= maxRequests) {
      return false;
    }
    
    setRequestCount(prev => prev + 1);
    return true;
  }, [requestCount, resetTime, maxRequests, windowMs]);

  const getRemainingRequests = useCallback((): number => {
    return Math.max(0, maxRequests - requestCount);
  }, [maxRequests, requestCount]);

  const getResetTimeRemaining = useCallback((): number => {
    return Math.max(0, resetTime - Date.now());
  }, [resetTime]);

  return {
    checkRateLimit,
    getRemainingRequests,
    getResetTimeRemaining,
    isLimited: requestCount >= maxRequests,
  };
}

/**
 * Hook for secure file upload
 */
export function useSecureFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];

    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    // Check file name for suspicious patterns
    if (/[<>:"/\\|?*]/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          setIsUploading(false);
          
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ success: true, url: response.url });
            } catch {
              resolve({ success: false, error: 'Invalid response from server' });
            }
          } else {
            resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
          }
        });

        xhr.addEventListener('error', () => {
          setIsUploading(false);
          resolve({ success: false, error: 'Network error during upload' });
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      return { success: false, error: 'Upload failed' };
    }
  }, [validateFile]);

  return {
    uploadFile,
    validateFile,
    uploadProgress,
    isUploading,
    uploadError,
  };
}

/**
 * Hook for audit logging
 */
export function useAuditLog() {
  const { userId } = useSecurity();

  const logAction = useCallback(async (action: {
    type: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
  }) => {
    try {
      const logEntry = {
        ...action,
        userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // In production, send to audit logging service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry),
        });
      } else {
        console.log('Audit Log (Dev):', logEntry);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, [userId]);

  return { logAction };
}

/**
 * Hook for Content Security Policy compliance
 */
export function useCSPCompliance() {
  const [cspViolations, setCspViolations] = useState<string[]>([]);

  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation = `${event.violatedDirective}: ${event.blockedURI}`;
      setCspViolations(prev => [...prev, violation]);
      
      // Log CSP violation
      console.warn('CSP Violation:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy,
      });
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  const clearViolations = useCallback(() => {
    setCspViolations([]);
  }, []);

  return {
    cspViolations,
    clearViolations,
    hasViolations: cspViolations.length > 0,
  };
}
