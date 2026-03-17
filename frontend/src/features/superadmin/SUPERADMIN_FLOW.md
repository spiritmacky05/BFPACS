# SuperAdmin Feature Architecture & Security Report

This document details the administrative management workflows and security protocols for the BFPACS application.

## 1. Administrative Privileges
Access to the SuperAdmin module is strictly gated at both the frontend and backend levels.

*   **Frontend Guard:** The `SuperAdminPage` component uses the `useAuth` hook to verify that the current user's role is exactly `superadmin`. If not, a "Access Denied" view is rendered.
*   **Backend Security:** All endpoints under `/api/v1/admin/*` are protected by specialized middleware that validates the JWT and checks the `user.role` column in the database.
*   **Verification:** The `useUserManagement` hook only triggers data fetching if the initial `role` check passes locally, minimizing unnecessary API requests.

## 2. User Management Lifecycle
Tracing the flow of administrative changes:

1.  **Discovery:** The `useUserManagement` hook calls `superadminApi.listUsers()`.
2.  **Interaction:** The administrator clicks a user record in the list, opening the `UserEditModal`.
3.  **Refinement:** Admin modifies roles, approval status, or station assignments within the modal.
4.  **Persistence:** On save, the hook calls `superadminApi.updateUser(id, payload)`.
5.  **Synchronization:** Following a successful update, the hook triggers a `loadUsers()` refresh to ensure the UI reflects the latest database state globally.

## 3. System Health & Auditing
*   **Health Checks:** The feature includes a "System Health" tab that pings the `/health` endpoint to verify database connectivity and PostGIS status.
*   **Privileged Operations:** Manual approvals and role escalations are logged server-side (if configured in the Gin backend) to ensure an audit trail for sensitive changes.

## 4. Feature Structure
```text
src/features/superadmin/
├── api/          # superadmin.api.js
├── components/   # UserEditModal.jsx
├── hooks/        # useUserManagement.js
├── pages/        # SuperAdminPage.jsx
└── SUPERADMIN_FLOW.md
```
