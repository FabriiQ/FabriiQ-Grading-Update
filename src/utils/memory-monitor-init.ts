import { initializeMemoryMonitoring } from './memory-monitor';

// Initialize memory monitoring when this module is imported
let isInitialized = false;

export function ensureMemoryMonitoringInitialized() {
  if (!isInitialized && typeof window === 'undefined') {
    try {
      initializeMemoryMonitoring();
      isInitialized = true;
      console.log('Memory monitoring initialized successfully');
    } catch (error) {
      console.error('Failed to initialize memory monitoring:', error);
    }
  }
}

// Auto-initialize on server side
if (typeof window === 'undefined') {
  ensureMemoryMonitoringInitialized();
}
