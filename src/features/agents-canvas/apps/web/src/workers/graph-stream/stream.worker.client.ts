// Client-side wrapper for the Web Worker to prevent server-side execution
import { StreamConfig } from "./streamWorker.types";

let worker: Worker | null = null;

export const createStreamWorker = () => {
  // Only create worker in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  if (!worker) {
    worker = new Worker(
      new URL('./stream.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }

  return worker;
};

export const terminateStreamWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
};

export type { StreamConfig };
