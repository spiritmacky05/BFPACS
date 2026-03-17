# Utils Directory

This folder contains general-purpose utility functions that help with common tasks throughout the application.

## Responsibility
The `utils` directory is strictly for **Stateless Helper Functions**. It should not contain React components or hooks.

## Content
- `navigation.js`: Contains helper functions for routing and URL generation.
  - `createPageUrl(pageName)`: Standardizes how page names are converted into valid URL paths.

## Guide for Interns
- **Keep it Simple**: Functions here should be "Pure Functions" (input goes in, output comes out, no side effects).
- **Naming**: Use descriptive names for your utility files (e.g., `date-utils.js`, `format-utils.js`) instead of generic names.
- **Avoid Duplication**: Before writing a helper function to format a date or currency, check if a utility already exists here.
