import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId?: string;
  userId?: string;
  conversationId?: string;
  [key: string]: unknown;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Access the current asynchronous request context, if any.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Convenience helper to get the active requestId from the current async execution context.
 */
export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId;
}

/**
 * Runs a callback within the scope of a given RequestContext.
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}
