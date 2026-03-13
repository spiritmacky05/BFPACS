# Dispatch Feature Flow (Intern-Friendly)

## 1) Folder structure

- [frontend/src/features/dispatch](frontend/src/features/dispatch)
  - [api/dispatch.api.js](frontend/src/features/dispatch/api/dispatch.api.js)
  - [api/dispatchAssets.api.js](frontend/src/features/dispatch/api/dispatchAssets.api.js)
  - [hooks/useDispatchPage.js](frontend/src/features/dispatch/hooks/useDispatchPage.js)
  - [services/dispatchWorkflow.service.js](frontend/src/features/dispatch/services/dispatchWorkflow.service.js)
  - [services/dispatchHistory.service.js](frontend/src/features/dispatch/services/dispatchHistory.service.js)
  - [components/DispatchPage](frontend/src/features/dispatch/pages/DispatchPage.jsx)
  - [components/DispatchToolbar.jsx](frontend/src/features/dispatch/components/DispatchToolbar.jsx)
  - [components/DispatchList.jsx](frontend/src/features/dispatch/components/DispatchList.jsx)
  - [components/DispatchCard.jsx](frontend/src/features/dispatch/components/DispatchCard.jsx)
  - [components/DispatchCreateModal.jsx](frontend/src/features/dispatch/components/DispatchCreateModal.jsx)
  - [components/DispatchFilterSortPanel.jsx](frontend/src/features/dispatch/components/DispatchFilterSortPanel.jsx)
  - [components/DispatchPersonnelCard.jsx](frontend/src/features/dispatch/components/DispatchPersonnelCard.jsx)
  - [lib/dispatch.constants.js](frontend/src/features/dispatch/lib/dispatch.constants.js)

---

## 2) Data flow (UI → hook → service → API → backend)

### A. Initial page load

1. [DispatchPage](frontend/src/features/dispatch/pages/DispatchPage.jsx) mounts.
2. It calls [useDispatchPage](frontend/src/features/dispatch/hooks/useDispatchPage.js).
3. The hook loads:
   - active incidents
   - responders
   - personnel
   - equipment
   - stations
4. The hook selects the first active incident (if present).
5. The hook loads dispatch records for that incident.
6. Page renders sections using prepared, filtered data.

### B. Create dispatch order

1. User opens modal and selects responders.
2. [DispatchCreateModal](frontend/src/features/dispatch/components/DispatchCreateModal.jsx) calls `submitDispatchOrder`.
3. Hook calls [createDispatchBatch](frontend/src/features/dispatch/services/dispatchWorkflow.service.js).
4. Service:
   - creates dispatch records
   - updates responder ACS status to `ACS Activated`
   - appends local status history
5. Hook refreshes dispatch list and responder list.

### C. Progress dispatch status

1. User clicks next status button in [DispatchCard](frontend/src/features/dispatch/components/DispatchCard.jsx).
2. Page calls `updateDispatchStatus` from hook.
3. Hook calls [progressDispatchStatus](frontend/src/features/dispatch/services/dispatchWorkflow.service.js).
4. Service:
   - updates dispatch status
   - stores status history entry
   - if completed, sets responder status back to `Serviceable`
5. Hook refreshes dispatch + responder data.

---

## 3) Responsibility map

## Page container

- [DispatchPage](frontend/src/features/dispatch/pages/DispatchPage.jsx)
- Responsibility:
  - layout and composition
  - role-based visibility
  - wiring hook data/actions to child components

## Hook

- [useDispatchPage](frontend/src/features/dispatch/hooks/useDispatchPage.js)
- Responsibility:
  - load server data
  - manage local UI state
  - run user actions through services
  - expose filtered/sorted lists

## Services

- [dispatchWorkflow.service.js](frontend/src/features/dispatch/services/dispatchWorkflow.service.js)
- [dispatchHistory.service.js](frontend/src/features/dispatch/services/dispatchHistory.service.js)
- Responsibility:
  - multi-entity workflow logic
  - local timeline persistence

## API layer

- [dispatch.api.js](frontend/src/features/dispatch/api/dispatch.api.js)
- [dispatchAssets.api.js](frontend/src/features/dispatch/api/dispatchAssets.api.js)
- Responsibility:
  - endpoint paths only
  - no rendering logic
  - no page orchestration logic

---

## 4) State management strategy

## UI state (local in hook)

- create modal open/close
- selected incident/responders
- dispatch notes
- expanded dispatch rows
- filter + sort state

## Server state (loaded via API)

- incidents
- dispatches
- responders
- personnel
- equipment
- stations

Why this split helps beginners:
- UI interactions are local and predictable.
- Server calls are centralized and easier to trace.

---

## 5) Patterns applied

1. Feature-first folder structure
2. Container + presentational components
3. Service layer for side-effect workflows
4. Single shared HTTP client (`shared/lib/httpClient.js`)
5. Tailwind classes centralized in `const styles` objects
6. Inline comments focused on “why”
