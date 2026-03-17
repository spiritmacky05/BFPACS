# Personnel Feature Architecture & Data Flow

This document details how personnel data, profiles, and assignments are managed within BFPACS.

## 1. Data Retrieval & Filtering

The Personnel list is the primary interface for managing duty personnel.

*   **API Layer:** `personnel.api.js` provides methods for list, create, update, and duty-status management.
*   **Orchestration:** `usePersonnel.js` handles the complex filtering logic:
    *   **Search:** Filters by `full_name`, `rank`, or `shift`.
    *   **Duty Status:** Filters by `All`, `On Duty`, `Off Duty`, or `On Leave`.
    *   **Station Filters:** Dynamically derived options for `Station`, `City`, `District`, and `Region` based on the loaded personnel's station metadata.

## 2. Profile Linking & Detailed View

Each personnel record in the list (or elsewhere in the app via `PersonnelLink`) can navigate to the `PersonnelProfilePage`.

*   **Flow:** The `PersonnelLink` component takes a personnel `id` and `name` and constructs a link to `/PersonnelProfile?id=<uuid>`.
*   **Profile Orchestration:** `usePersonnelProfile.js` handles data hydration for the profile:
    *   Fetches the individual `person` record.
    *   Lists all `equipment` and filters for assets where `borrower_name` matches the personnel's name.
    *   Scans active `incidents` to detect if the personnel is assigned as a **Ground Commander** (stored on incident) or has a manual **Check-In** log (via `checkinApi`).

## 3. External Dependencies

The Personnel feature provides critical data to other modules:

*   **Dispatch:** The `dispatch` feature relies on personnel data to allow incident commanders to see who is available for assignment.
*   **Check-In/Check-Out:** The `checkin` feature uses personnel IDs to log attendance and on-scene time.
*   **Equipment:** The `equipment` feature tracks which personnel currently hold logistical assets.

## 4. Feature Structure

```text
src/features/personnel/
├── api/          # personnel.api.js
├── components/   # PersonnelLink.jsx, Table fragments
├── hooks/        # usePersonnel.js, usePersonnelProfile.js
├── pages/        # PersonnelPage.jsx, PersonnelProfilePage.jsx
└── PERSONNEL_FLOW.md
```
