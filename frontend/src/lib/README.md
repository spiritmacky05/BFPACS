# Lib Directory

This folder contains third-party configuration and internal libraries that are not related to a specific feature.

## Responsibility
`lib` stores the setup and configuration for global libraries like Axios, React Query, and internal utility frameworks.

## Subdirectories

- `/axios`: Custom Axios instance configuration (though most logic has moved to `shared/httpClient.js`).
- `/query-client`: Configuration for TanStack Query (React Query), including default cache settings.
- `/utils`: Core internal utility functions.
  - `cn.js`: The `cn` (Class Name) utility for safely merging Tailwind CSS classes.
  - `utils.js`: The entry point for library utilities.
- `/PageNotFound`: The global 404 page component.

## Guide for Interns
- **Modifying Configuration**: Be careful when changing files here, as they affect the entire application globally.
- **Using `cn`**: Whenever you are conditionally applying Tailwind classes, import `cn` from here:
  ```javascript
  import { cn } from '@/lib/utils/utils';
  ```
