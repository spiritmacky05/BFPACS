/**
 * shared/httpClient.js
 *
 * Why this file exists:
 * - We want ONE HTTP client across the frontend.
 * - This keeps auth token handling, error handling, and redirects in one place.
 * - Feature API files should only describe endpoint paths, not HTTP plumbing.
 */

import axios from 'axios';

/**
 * Base URL for every API request.
 * We keep a safe local fallback so onboarding is easy for interns.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Shared Axios instance used by all feature API modules.
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Small custom error so UI code can rely on a consistent shape.
 */
export class ApiClientError extends Error {
  constructor({ message, status, code, details }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Extract token before every request.
 * Why in interceptor: removes duplicate token logic in each API function.
 */
axiosInstance.interceptors.request.use((config) => {
  const authToken = localStorage.getItem('bfp_token');

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

/**
 * Normalize backend errors so components/hooks receive predictable fields.
 */
function toApiClientError(error) {
  const status = error?.response?.status;
  const errorPayload = error?.response?.data;

  const message =
    errorPayload?.error ||
    errorPayload?.message ||
    error?.message ||
    'Something went wrong while talking to the server.';

  const code = errorPayload?.code || 'UNEXPECTED_ERROR';
  const details = errorPayload?.details || null;

  return new ApiClientError({ message, status, code, details });
}

/**
 * Handle response success/fail globally.
 * Why redirect on 401: keeps auth behavior consistent in every feature.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem('bfp_token');
      localStorage.removeItem('bfp_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(toApiClientError(error));
  }
);

/**
 * Utility: return backend payload directly.
 * Why: component code can consume plain data without `.data` everywhere.
 */
function unwrapData(response) {
  return response?.data;
}

/**
 * Public client used by feature API modules.
 */
export const httpClient = {
  get: (path, config) => axiosInstance.get(path, config).then(unwrapData),
  post: (path, body, config) => axiosInstance.post(path, body, config).then(unwrapData),
  patch: (path, body, config) => axiosInstance.patch(path, body, config).then(unwrapData),
  put: (path, body, config) => axiosInstance.put(path, body, config).then(unwrapData),
  delete: (path, config) => axiosInstance.delete(path, config).then(unwrapData),
};

export default httpClient;
