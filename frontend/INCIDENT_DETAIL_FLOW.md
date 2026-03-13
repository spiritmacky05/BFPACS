# Incident Detail Feature Flow (Intern-Friendly)

## 1) Refactored folder structure

This feature now follows **feature-first architecture**.

- [frontend/src/features/incidentDetail](frontend/src/features/incidentDetail)
  - [api/incidentDetail.api.js](frontend/src/features/incidentDetail/api/incidentDetail.api.js)
  - [api/incidentDetailAssets.api.js](frontend/src/features/incidentDetail/api/incidentDetailAssets.api.js)
  - [services/incidentDetailStatusWorkflow.service.js](frontend/src/features/incidentDetail/services/incidentDetailStatusWorkflow.service.js)
  - [hooks/useIncidentDetail.js](frontend/src/features/incidentDetail/hooks/useIncidentDetail.js)
  - [components/IncidentDetailHeader.jsx](frontend/src/features/incidentDetail/components/IncidentDetailHeader.jsx)
  - [components/IncidentActions.jsx](frontend/src/features/incidentDetail/components/IncidentActions.jsx)
  - [components/IncidentDetailCard.jsx](frontend/src/features/incidentDetail/components/IncidentDetailCard.jsx)
  - [components/InfoRow.jsx](frontend/src/features/incidentDetail/components/InfoRow.jsx)
  - [pages/IncidentDetailPage.jsx](frontend/src/features/incidentDetail/pages/IncidentDetailPage.jsx)
  - [index.js](frontend/src/features/incidentDetail/index.js)

Shared client used:
- [frontend/src/shared/lib/httpClient.js](frontend/src/shared/lib/httpClient.js)

---

## 2) Data flow (UI → hook → service → API → backend)

## A. Load incident detail

1. Page container [IncidentDetailPage.jsx](frontend/src/features/incidentDetail/pages/IncidentDetailPage.jsx) calls `useIncidentDetail()`.
2. Hook reads `id` from URL query params.
3. Hook calls `incidentDetailApi.getById(id)`.
4. API calls shared `httpClient.get('/incidents/:id')`.
5. Backend endpoint responds with incident model.
6. Hook stores data in page state and exposes it to UI components.

## B. Change incident status with workflow

1. User clicks action button in [IncidentActions.jsx](frontend/src/features/incidentDetail/components/IncidentActions.jsx).
2. Page calls hook `requestStatusChange(status)`.
3. Hook opens confirmation state with clear copy.
4. On confirm, hook runs service `applyIncidentDetailStatusWorkflow()`.
5. Service calls `incidentDetailApi.updateStatus()`.
6. If status is `Done`, service also:
   - fetches dispatches via `incidentDetailAssetsApi.getDispatchesByIncident()`
   - releases fleet via `incidentDetailAssetsApi.updateFleetUnit(..., { status: 'Serviceable' })`
7. Hook reloads incident data so UI stays fresh.

## C. Print/export flow

1. Hook builds printable HTML string from current incident.
2. Page injects printable content into hidden print container.
3. User clicks print action.
4. Hook opens new window, writes print HTML, and triggers browser print.

---

## 3) Responsibility map

## Page container
- [IncidentDetailPage.jsx](frontend/src/features/incidentDetail/pages/IncidentDetailPage.jsx)
- Responsibility:
  - Compose feature UI sections.
  - Wire hook state/actions to child components.
  - Render modals and section layout.

## Hook
- [useIncidentDetail.js](frontend/src/features/incidentDetail/hooks/useIncidentDetail.js)
- Responsibility:
  - Fetch and refresh incident data.
  - Manage UI state (active tab, edit modal, ACS modal, pending action).
  - Build printable payload.
  - Expose handlers to the page.

## Service / use-case
- [incidentDetailStatusWorkflow.service.js](frontend/src/features/incidentDetail/services/incidentDetailStatusWorkflow.service.js)
- Responsibility:
  - Encapsulate status transition business logic.
  - Coordinate cross-entity updates (incidents + dispatch + fleet).

## API layer
- [incidentDetail.api.js](frontend/src/features/incidentDetail/api/incidentDetail.api.js)
- [incidentDetailAssets.api.js](frontend/src/features/incidentDetail/api/incidentDetailAssets.api.js)
- Responsibility:
  - Keep endpoint paths in one place.
  - No UI logic.
  - No orchestration logic.

---

## 4) State management strategy

## UI state (local)
Managed in hook via `useState`:
- modal open/close state
- active section tab
- pending confirmation action
- print refs and section refs

## Server state (feature fetch/mutation)
Current implementation is hook-driven async state for this page:
- `incident` data model
- load/reload lifecycle
- status mutation workflow

Why this split is good for beginners:
- UI state is immediate and page-scoped.
- server state is loaded via dedicated API/service functions and refreshed after mutations.

---

## 5) Best-practice patterns applied

1. **Feature-first folder structure**
2. **Container + presentational components**
3. **Service layer for cross-entity rules**
4. **Single shared HTTP client**
5. **Readable comments explaining “why”**
6. **Tailwind class strings moved to `const styles` objects**

---

## 6) Incremental rollout note

Route can point to [IncidentDetailPage.jsx](frontend/src/features/incidentDetail/pages/IncidentDetailPage.jsx) while legacy page file is removed.
This allows safe, testable migration without backend changes.
