# Shared Directory

This folder contains code that is truly global and shared across the entire application, primarily the core HTTP client.

## Responsibility
The `shared` directory provides the foundational building blocks that all other modules (especially features) depend on.

## Content
- `httpClient.js`: The "Source of Truth" for all network requests.
  - Handles automatic injection of the `Authorization` (JWT) token.
  - Handles global error redirection (e.g., redirecting to `/login` on a 401 error).
  - Normalizes backend error responses into a consistent `ApiClientError` shape.

## Guide for Interns
- **Don't rewrite fetch logic**: Every feature API should use the `httpClient` exported from here.
- **Environment Variables**: The `httpClient` uses `import.meta.env.VITE_API_URL` to determine where to send requests. Ensure your `.env` file is set up correctly.
- **Interceptors**: If you need to add a global header or log all requests, `httpClient.js` is the place to do it.
