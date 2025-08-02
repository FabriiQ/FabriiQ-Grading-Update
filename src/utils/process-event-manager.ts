/**
 * Process Event Manager
 * 
 * Centralized management of process event listeners to prevent memory leaks
 * and MaxListenersExceededWarning
 */

import { logger } from '@/server/api/utils/logger';

type EventHandler = (...args: any[]) => void | Promise<void>;
type EventName = 'exit' | 'SIGINT' | 'SIGTERM' | 'beforeExit' | 'uncaughtException' | 'unhandledRejection';

class ProcessEventManager {
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private initialized = false;

  /**
   * Initialize the process event manager
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Increase max listeners to prevent warnings
    process.setMaxListeners(20);

    // Set up master event handlers
    process.on('exit', this.handleExit.bind(this));
    process.on('SIGINT', this.handleSIGINT.bind(this));
    process.on('SIGTERM', this.handleSIGTERM.bind(this));
    process.on('beforeExit', this.handleBeforeExit.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

    this.initialized = true;
    logger.debug('Process event manager initialized');
  }

  /**
   * Add a handler for a specific event
   */
  public addHandler(event: EventName, handler: EventHandler): void {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);
    logger.debug(`Added handler for ${event} event`);
  }

  /**
   * Remove a handler for a specific event
   */
  public removeHandler(event: EventName, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
      logger.debug(`Removed handler for ${event} event`);
    }
  }

  /**
   * Execute all handlers for a specific event
   */
  private async executeHandlers(event: EventName, ...args: any[]): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }

    const promises: Promise<void>[] = [];
    
    for (const handler of handlers) {
      try {
        const result = handler(...args);
        if (result && typeof result === 'object' && typeof result.then === 'function') {
          promises.push(result as Promise<void>);
        }
      } catch (error) {
        logger.error(`Error in ${event} handler`, { error });
      }
    }

    // Wait for all async handlers to complete
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  private handleExit(code: number): void {
    logger.debug(`Process exit with code ${code}`);
    this.executeHandlers('exit', code).catch(() => {});
  }

  private async handleSIGINT(): Promise<void> {
    logger.debug('Received SIGINT signal');
    await this.executeHandlers('SIGINT');
    process.exit(0);
  }

  private async handleSIGTERM(): Promise<void> {
    logger.debug('Received SIGTERM signal');
    await this.executeHandlers('SIGTERM');
    process.exit(0);
  }

  private async handleBeforeExit(code: number): Promise<void> {
    logger.debug(`Process beforeExit with code ${code}`);
    await this.executeHandlers('beforeExit', code);
  }

  private async handleUncaughtException(error: Error): Promise<void> {
    logger.error('Uncaught exception', { error });
    await this.executeHandlers('uncaughtException', error);
    process.exit(1);
  }

  private async handleUnhandledRejection(reason: any, promise: Promise<any>): Promise<void> {
    logger.error('Unhandled rejection', { reason, promise });
    await this.executeHandlers('unhandledRejection', reason, promise);
  }

  /**
   * Get the number of handlers for each event
   */
  public getHandlerCounts(): Record<EventName, number> {
    const counts: Partial<Record<EventName, number>> = {};
    for (const [event, handlers] of this.handlers) {
      counts[event] = handlers.size;
    }
    return counts as Record<EventName, number>;
  }
}

// Singleton instance
const processEventManager = new ProcessEventManager();

// Export convenience functions
export function addProcessHandler(event: EventName, handler: EventHandler): void {
  processEventManager.addHandler(event, handler);
}

export function removeProcessHandler(event: EventName, handler: EventHandler): void {
  processEventManager.removeHandler(event, handler);
}

export function getProcessHandlerCounts(): Record<EventName, number> {
  return processEventManager.getHandlerCounts();
}

// Auto-initialize on server side
if (typeof window === 'undefined') {
  processEventManager.initialize();
}

export default processEventManager;
