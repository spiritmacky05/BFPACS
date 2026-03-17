# Features Directory

This is the most important directory in the codebase. It follows a **Feature-Based Architecture**.

## Responsibility
Each subfolder here represents a standalone "module" or "feature" of the application (e.g., Auth, Fleet, Incidents). Each feature should be as self-contained as possible.

## Standard Feature Structure
Most features follow this pattern:
- `/api`: Feature-specific API calls.
- `/components`: UI components used only within this feature.
- `/hooks`: Custom React hooks for the feature's logic.
- `/pages`: Full-page components.
- `index.js`: The "public API" for the feature. Only what is exported here can be used by other parts of the app.

## List of Features

- **auth**: Login, registration, and user session management.
- **fleet**: Vehicle tracking and management.
- **incidents**: Emergency incident listing and management.
- **dispatch**: Dispatcher tools and assignment logic.
- **personnel**: User profiles and personnel records.
- **shared**: Components and logic shared *across* features (like the UI kit).

## Guide for Interns
- **Encapsulation**: If you are working on the "Fleet" feature, try to keep all your changes within `src/features/fleet`.
- **Shared UI**: If you need a generic button or input, check `src/features/shared/ui` first.
- **Barrel Exports**: Always use the `index.js` in a feature folder to export components or hooks that need to be accessed from outside the feature.
