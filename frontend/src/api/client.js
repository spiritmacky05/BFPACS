/**
 * api/client.js
 *
 * The single HTTP client for all BFPACS backend calls.
 * All requests go to VITE_API_URL (defaults to http://localhost:8080).
 *
 * Usage:
 *   import api from '@/api/client';
 *   const incidents = await api.get('/incidents');
 *   const created   = await api.post('/incidents', body);
 *   await api.patch('/incidents/:id/status', body);
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const token = localStorage.getItem('bfp_token');
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('bfp_user');
      localStorage.removeItem('bfp_token');
      window.location.href = '/login';
    }

    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      message = json.error ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;
export { ApiError };
