/**
 * api/client/client.js
 *
 * Compatibility wrapper around the shared HTTP client.
 *
 * Why this file still exists:
 * - Many existing API modules still import `@/api/client/client`.
 * - We keep a stable import path while removing duplicate fetch logic.
 */

import { ApiClientError, httpClient } from '@/shared/httpClient';

/**
 * Backward-compatible error class name.
 *
 * Existing code checks `instanceof ApiError`, so we keep this export.
 */
export class ApiError extends ApiClientError {
  constructor({ message, status, code, details }) {
    super({ message, status, code, details });
    this.name = 'ApiError';
  }
}

/**
 * Wrap shared client errors into `ApiError` for legacy consumers.
 */
async function withLegacyErrorShape(requestPromise) {
  try {
    return await requestPromise;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ApiError({
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details,
      });
    }

    throw error;
  }
}

const api = {
  get: (path) => withLegacyErrorShape(httpClient.get(path)),
  post: (path, body) => withLegacyErrorShape(httpClient.post(path, body)),
  patch: (path, body) => withLegacyErrorShape(httpClient.patch(path, body)),
  put: (path, body) => withLegacyErrorShape(httpClient.put(path, body)),
  delete: (path) => withLegacyErrorShape(httpClient.delete(path)),
};

export default api;
