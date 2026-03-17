# API Directory

This folder contains the core API client and the global API aggregator for the BFPACS frontend.

## Responsibility
The `api` directory is responsible for managing the connection between the frontend and the backend services. It provides a centralized place to manage error handling, request/response interceptors, and service registration.

## Folder Structure

- `/client`: Contains the base HTTP client configuration.
  - `client.js`: A wrapper around the shared `httpClient` that provides backward compatibility for legacy API modules.
- `api-services.js`: The central aggregator. It exports all feature-based API services (e.g., `incidentsApi`, `fleetApi`) so they can be easily imported from a single location.

## Guide for Interns
- **Don't add business logic here**: This folder is for plumbing. Business logic belongs in the `features/` directory.
- **Importing APIs**: Instead of importing feature APIs directly from their nested folders, use this aggregator:
  ```javascript
  import { incidentsApi } from '@/api/api-services';
  ```
- **Error Handling**: Use the `ApiError` class exported from `client/client.js` if you need to perform specific error checks in your components.
