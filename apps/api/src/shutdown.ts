import type { Server } from 'node:http';
import { logger } from './logger/index.js';

export type CleanupHandler = () => Promise<void> | void;
export type ExitHandler = (code: number) => void;

export class ShutdownManager {
  private isShuttingDown = false;
  private cleanupHandlers: Array<{ name: string; handler: CleanupHandler }> = [];
  private server: Server | null = null;
  private timeoutMs: number;
  private exitHandler: ExitHandler;

  constructor(timeoutMs = 10000, exitHandler: ExitHandler = (code) => process.exit(code)) {
    this.timeoutMs = timeoutMs;
    this.exitHandler = exitHandler;
  }

  public registerServer(server: Server): void {
    this.server = server;
  }

  public registerCleanup(name: string, handler: CleanupHandler): void {
    this.cleanupHandlers.push({ name, handler });
  }

  public getIsShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  public async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring duplicate signal', { signal });
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}. Starting graceful shutdown...`, { signal });

    // Enforce bounded timeout to prevent hanging indefinitely
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process exit.', {
        timeoutMs: this.timeoutMs,
      });
      this.exitHandler(1);
    }, this.timeoutMs);

    forceExitTimer.unref();

    try {
      // 1. Stop accepting new HTTP connections
      if (this.server && this.server.listening) {
        await new Promise<void>((resolve, reject) => {
          this.server?.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        logger.info('HTTP server stopped accepting connections');
      }

      // 2. Execute registered cleanup handlers (in reverse registration order)
      for (const { name, handler } of [...this.cleanupHandlers].reverse()) {
        logger.info(`Closing resource: ${name}...`);
        await handler();
        logger.info(`Resource closed: ${name}`);
      }

      clearTimeout(forceExitTimer);
      logger.info('Graceful shutdown completed successfully');
      this.exitHandler(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.exitHandler(1);
    }
  }

  public attachSignalListeners(): void {
    const handleSignal = (signal: string) => {
      void this.shutdown(signal);
    };

    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGINT', () => handleSignal('SIGINT'));
  }
}

export const shutdownManager = new ShutdownManager();

export function setupGracefulShutdown(server: Server): ShutdownManager {
  shutdownManager.registerServer(server);
  shutdownManager.attachSignalListeners();
  return shutdownManager;
}
