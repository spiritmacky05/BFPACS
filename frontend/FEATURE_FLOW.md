# Incidents Feature Flow (Intern-Friendly)

## 1) Refactored folder structure

This feature now follows **feature-first architecture**.

- [frontend/src/features/incidents](frontend/src/features/incidents)
  - [api/incidents.api.js](frontend/src/features/incidents/api/incidents.api.js)
  - [api/incidentAssets.api.js](frontend/src/features/incidents/api/incidentAssets.api.js)
  - [hooks/useIncidentsPage.js](frontend/src/features/incidents/hooks/useIncidentsPage.js)
  - [services/incidentStatusWorkflow.service.js](frontend/src/features/incidents/services/incidentStatusWorkflow.service.js)
  - [components/IncidentsToolbar.jsx](frontend/src/features/incidents/components/IncidentsToolbar.jsx)
  - [components/IncidentsList.jsx](frontend/src/features/incidents/components/IncidentsList.jsx)
  - [components/IncidentCard.jsx](frontend/src/features/incidents/components/IncidentCard.jsx)
  - [components/IncidentsTable.jsx](frontend/src/features/incidents/components/IncidentsTable.jsx)
  - [components/IncidentCreateModal.jsx](frontend/src/features/incidents/components/IncidentCreateModal.jsx)
  - [pages/IncidentsPage.jsx](frontend/src/features/incidents/pages/IncidentsPage.jsx)
  - [lib/queryKeys.js](frontend/src/features/incidents/lib/queryKeys.js)
  - [index.js](frontend/src/features/incidents/index.js)

Shared HTTP client:
- [frontend/src/shared/lib/httpClient.js](frontend/src/shared/lib/httpClient.js)

---

## 2) Data flow: UI → hooks → service → API → backend

## A. Read incidents list

1. **UI page** [IncidentsPage.jsx](frontend/src/features/incidents/pages/IncidentsPage.jsx)
2. Calls **hook** `useIncidentsPage()` in [useIncidentsPage.js](frontend/src/features/incidents/hooks/useIncidentsPage.js)
3. Hook uses **React Query** with key from [queryKeys.js](frontend/src/features/incidents/lib/queryKeys.js)
4. Query calls **API layer** `incidentsApi.list()` from [incidents.api.js](frontend/src/features/incidents/api/incidents.api.js)
5. API layer calls **shared HTTP client** [httpClient.js](frontend/src/shared/lib/httpClient.js)
6. HTTP client sends request to backend endpoint: `GET /api/v1/incidents`

## B. Update incident status (with cross-entity workflow)

1. User clicks status action button in [IncidentCard.jsx](frontend/src/features/incidents/components/IncidentCard.jsx)
2. Callback goes to **hook** `requestStatusChange()`
3. User confirms via `ConfirmationModal` in [IncidentsPage.jsx](frontend/src/features/incidents/pages/IncidentsPage.jsx)
4. Hook executes mutation that calls service `applyIncidentStatusWorkflow()` from [incidentStatusWorkflow.service.js](frontend/src/features/incidents/services/incidentStatusWorkflow.service.js)
5. Service updates incident status through `incidentsApi.updateStatus()`
6. If status is `Fire Out`, service also:
   - fetches dispatches via `incidentAssetsApi.getDispatchesByIncident()`
   - updates fleet unit status via `incidentAssetsApi.updateFleetUnit()`
   - logs movement via `incidentAssetsApi.logFleetMovement()`
7. Hook invalidates incidents query key, then UI auto-refreshes.

## C. Create incident

1. User opens modal [IncidentCreateModal.jsx](frontend/src/features/incidents/components/IncidentCreateModal.jsx)
2. Form state lives in `useIncidentsPage()`
3. Submit calls `createIncidentMutation`
4. Mutation calls `incidentsApi.create()`
5. API uses [httpClient.js](frontend/src/shared/lib/httpClient.js) to `POST /api/v1/incidents`
6. Query invalidation refreshes list.

---

## 3) Responsibilities by layer

## Page container
- [IncidentsPage.jsx](frontend/src/features/incidents/pages/IncidentsPage.jsx)
- Responsibilities:
  - Compose feature components
  - Wire callbacks and role-based permissions
  - Render modal/dialog containers

## Hooks
- [useIncidentsPage.js](frontend/src/features/incidents/hooks/useIncidentsPage.js)
- Responsibilities:
  - Manage page UI state (filter, view mode, modal visibility, pending action)
  - Fetch server data with React Query
  - Execute mutations and invalidate query keys
  - Expose simple handler functions to the page

## Service / use-case
- [incidentStatusWorkflow.service.js](frontend/src/features/incidents/services/incidentStatusWorkflow.service.js)
- Responsibilities:
  - Hold business rule for status transition side effects
  - Coordinate incidents + dispatches + fleet APIs
  - Keep page/hook free from cross-entity details

## API layer
- [incidents.api.js](frontend/src/features/incidents/api/incidents.api.js)
- [incidentAssets.api.js](frontend/src/features/incidents/api/incidentAssets.api.js)
- Responsibilities:
  - Map frontend calls to backend endpoints only
  - No presentation logic
  - No workflow orchestration logic

## Shared HTTP client
- [httpClient.js](frontend/src/shared/lib/httpClient.js)
- Responsibilities:
  - Add auth header
  - Normalize API errors
  - Handle 401 redirect behavior in one place

---

## 4) State management strategy

## UI state (local/page state)
Managed in `useState` inside [useIncidentsPage.js](frontend/src/features/incidents/hooks/useIncidentsPage.js):
- selected filter
- current view mode
- create modal visibility
- editing incident target
- pending confirmation action
- create form values

## Server state
Managed by React Query in [useIncidentsPage.js](frontend/src/features/incidents/hooks/useIncidentsPage.js):
- incidents list query (`incidentsQueryKeys.list(...)`)
- create/update/delete mutations
- cache invalidation after successful mutations

Why this split is best practice:
- UI state changes often and is local to this page.
- Server state is asynchronous, shared, and should be cached/invalidation-driven.

---

## 5) Best-practice patterns applied

1. **Feature-first organization**
   - Easy navigation for new developers.

2. **Container + presentational components**
   - Page/container orchestrates data.
   - Child components focus on rendering.

3. **Service layer for business logic**
   - Cross-entity logic is centralized and reusable.

4. **Single HTTP client**
   - Authentication + error handling is standardized.

5. **Feature-specific query keys**
   - Predictable caching and invalidation behavior.

6. **Beginner-friendly naming and comments**
   - Files explain not only *what* but also *why*.

7. **Tailwind readability improvement**
   - Component class strings are kept in `styles` constants for easier scanning.

---

## 6) How to adopt this incrementally

1. Keep current production route as-is.
2. Add a temporary route to new [IncidentsPage.jsx](frontend/src/features/incidents/pages/IncidentsPage.jsx).
3. Verify behavior parity.
4. Replace old page route when validated.
5. Repeat same template for `Equipment`, `Hydrants`, and `IncidentDetail`.
