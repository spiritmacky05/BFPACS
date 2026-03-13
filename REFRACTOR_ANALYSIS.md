# Refactor Analysis Report (Beginner-Friendly)

> Scope note: This report analyzes the current workspace **excluding** `bfpacs_update` as requested.

## Project Overview

This repository is a full-stack BFP incident management system:

- **Frontend**: React + Vite app in `frontend/`
- **Backend**: Go + Gin + GORM API in `backend/`
- **Database**: PostgreSQL/PostGIS (via Docker)
- **Infra**: `docker-compose.yml`, DB seed SQL, setup scripts

At a high level, the architecture is already separated into frontend and backend, which is good. The biggest refactor need is **within each side**: reduce large files, centralize repeated logic, and make data flow easier to follow.

---

## Folder/Architecture Analysis

## Root-level structure

- `backend/`  
  Go REST API (auth, incidents, dispatch, equipment, hydrants, stations, check-in, admin).
- `frontend/`  
  React web app with pages, hooks, components, API clients.
- `docker-compose.yml`  
  Runs DB + backend + frontend containers.
- `bfpacs_backup.sql`  
  Initial/backup SQL data for DB bootstrap.
- `setup_db.sh`, `generate_secrets.sh`  
  Local setup scripts.
- `ARCHITECTURE.md`  
  Existing architecture guide (already detailed).
- `api`, `seed`, `backend/api`, `backend/main`  
  Compiled binaries currently in repo/workspace (should be build artifacts, not source).

### Observations

- Good: clear top-level separation of concerns.
- Improve: build artifacts are present at repo root and backend root; add or enforce `.gitignore` rules for binaries.

---

## Backend architecture (`backend/`)

### What each folder/file group does

- `cmd/api/main.go`  
  App entry point: env loading, DB setup, dependency wiring, route registration, HTTP server startup.
- `cmd/seed/main.go`  
  Manual seeding entrypoint.
- `internal/database/`  
  DB connection (`db.go`) and startup seed logic (`seed.go`).
- `internal/models/`  
  Request/response/domain models shared by handlers and repositories.
- `internal/repository/`  
  Data access layer (GORM queries).
- `internal/handlers/`  
  HTTP endpoints (bind JSON, call repos, return status).
- `internal/middleware/`  
  Auth, CORS/security headers, rate limiting.
- `internal/checkin/`  
  Specialized module for NFC/PIN/manual check-in logic.

### Files mixing too many responsibilities

1. **`cmd/api/main.go`**
   - Handles env validation, DB setup, repository/handler construction, all routes, and server lifecycle.
   - Refactor into:
     - `internal/app/bootstrap.go` (dependency wiring)
     - `internal/http/router.go` + route modules per domain
     - `cmd/api/main.go` as thin startup only

2. **Role checks spread across handlers**
   - Many handlers manually check role/station access.
   - Add authorization middleware/policy helpers to avoid duplicated if/else logic.

3. **Potential API contract drift between frontend and backend docs/comments**
   - Example: dispatch frontend comments still mention `fleet_id`, backend expects `user_id`.

4. **`cmd/seed/main.go` uses hardcoded env path and legacy role casing**
   - Hardcoded absolute `.env` path and inconsistent role values (`SuperAdmin` vs lowercase normalized roles).

### Backend structure recommendation

```text
backend/
  cmd/api/main.go
  internal/
    app/
      bootstrap.go           # Build repos/services/handlers
    http/
      router.go              # Global middleware + API group
      routes/
        auth_routes.go
        incident_routes.go
        dispatch_routes.go
        ...
    domain/
      incident/
        model.go
        repository.go
        service.go
        handler.go
      equipment/
      hydrant/
      ...
    shared/
      middleware/
      auth/
      errors/
      response/
      validation/
```

This makes each feature easier to trace end-to-end.

---

## Frontend architecture (`frontend/`)

### What each folder/file group does

- `src/main.jsx`  
  React app mount.
- `src/App.jsx`  
  Root providers + router + protected route logic.
- `src/Layout.jsx`  
  Main shell (sidebar/topbar/navigation state).
- `src/pages/`  
  Page-level screens (Dashboard, Incidents, IncidentDetail, Equipment, Hydrants, etc.).
- `src/components/`  
  Reusable UI and feature components.
- `src/components/ui/`  
  Shared design-system components (shadcn/radix style set).
- `src/hooks/`  
  Reusable React hooks (`useDashboardData`, `useMyStation`, etc.).
- `src/api/`  
  API layer modules per resource.
- `src/context/AuthContext/`  
  Authentication context (user/token/login/register/logout).
- `src/lib/axios/axios.js` and `src/api/client/client.js`  
  Two different HTTP client approaches currently coexisting.

### Files mixing too many responsibilities

Large page files currently combine UI + API + role logic + modal orchestration + filtering + transformations:

- `pages/PersonnelProfile/PersonnelProfile.jsx` (~571 lines)
- `pages/Hydrants/Hydrants.jsx` (~495 lines)
- `pages/Equipment/Equipment.jsx` (~490 lines)
- `pages/Incidents/Incidents.jsx` (~468 lines)
- `pages/IncidentDetail/IncidentDetail.jsx` (~463 lines)
- `pages/DutyPersonnel/DutyPersonnel.jsx` (~437 lines)
- `Layout.jsx` (~274 lines)

### Additional architecture issues

1. **Two HTTP stacks in one app**
   - `api/client/client.js` uses `fetch`
   - `lib/axios/axios.js` uses Axios
   - This creates duplicated token/401 handling.

2. **Old Base44 serverless functions still in `frontend/functions/`**
   - Uses `@base44/sdk` and Deno runtime patterns not aligned with current Go backend architecture.

3. **Utility duplication**
   - `src/utils/index.js` and `src/utils/index.ts` both define `createPageUrl` with different behavior.

4. **`PageNotFound` expects `isFetched` from auth context**
   - Auth context does not provide this field; this is confusing for maintainers.

### Frontend structure recommendation

```text
frontend/src/
  app/
    providers/
      AuthProvider.jsx
      QueryProvider.jsx
    router/
      AppRouter.jsx
      ProtectedRoute.jsx
    layout/
      AppLayout.jsx
      Sidebar.jsx
      Topbar.jsx

  features/
    incidents/
      api/
        incidents.api.js
      hooks/
        useIncidentsPage.js
        useIncidentActions.js
      components/
        IncidentFilters.jsx
        IncidentList.jsx
        IncidentCard.jsx
        IncidentCreateModal.jsx
      pages/
        IncidentsPage.jsx

    dispatch/
    equipment/
    hydrants/
    personnel/
    stations/
    auth/

  shared/
    ui/
    hooks/
    lib/
      httpClient.js
    utils/
    constants/
    types/
```

This "feature-first" structure helps beginners locate code by business domain.

---

## Data Flow Map

Current flow (simplified):

```text
UI Page/Component
  -> local state (useState/useEffect)
  -> custom hook (sometimes)
  -> API module (frontend/src/api/*)
  -> HTTP client (fetch or axios)
  -> Gin handler (backend/internal/handlers/*)
  -> repository (backend/internal/repository/*)
  -> GORM
  -> PostgreSQL/PostGIS
```

## End-to-end example: incident status update

```text
Incidents.jsx / IncidentDetail.jsx
  -> incidentsApi.updateStatus(id, payload)
  -> PATCH /api/v1/incidents/:id/status
  -> IncidentHandler.UpdateStatus
  -> IncidentRepo.UpdateStatus
  -> fire_incidents table update
  -> optional follow-up side effects in frontend (fleet updates/logs)
```

## End-to-end example: login

```text
Login.jsx
  -> useAuth().login(email, password)
  -> POST /auth/login
  -> AuthHandler.Login + JWT
  -> token/user saved in localStorage
  -> interceptors/client add Authorization header for future calls
```

## Confusing dependencies today

1. **Page-level side effects are scattered**
   - Some cross-entity side effects happen in pages (example: incident status update also updates fleet state).

2. **Mixed responsibility between pages and hooks**
   - Some pages use hooks well (`useDispatchManager`), others keep everything inline.

3. **API docs/comments do not always match backend behavior**
   - Can cause wrong payload assumptions.

4. **Authorization rules are partly frontend and partly backend**
   - Frontend hides UI by role, backend also checks role in some places but not uniformly.

## Clearer data flow target

```text
Page (UI only)
  -> Feature Hook (state + orchestration)
    -> Service/Use-case function (business action)
      -> API client (single shared HTTP client)
        -> Backend endpoint
```

Use this rule of thumb:

- **Component**: render + user events
- **Hook**: state orchestration
- **Service**: business logic (what should happen)
- **API module**: request formatting only

---

## Refactor Recommendations (with code snippets)

## 1) Split large page into hook + small components

### Current pain
`Incidents.jsx` handles: fetching, filtering, create modal state, status transitions, fleet side effects, list/table rendering.

### Target split
- `useIncidentsPage()` hook for data + actions
- `IncidentToolbar`, `IncidentList`, `IncidentCreateModal`, `IncidentActions`

### Example hook

```jsx
// features/incidents/hooks/useIncidentsPage.js
import { useEffect, useMemo, useState } from 'react';
import { incidentsApi } from '../api/incidents.api';

export function useIncidentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await incidentsApi.list();
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter(i => i.incident_status === filter);
  }, [items, filter]);

  return {
    loading,
    filter,
    setFilter,
    items: filteredItems,
    reload: load,
  };
}
```

### Example page container

```jsx
// features/incidents/pages/IncidentsPage.jsx
import { useIncidentsPage } from '../hooks/useIncidentsPage';
import { IncidentToolbar } from '../components/IncidentToolbar';
import { IncidentList } from '../components/IncidentList';

export default function IncidentsPage() {
  const vm = useIncidentsPage();

  return (
    <>
      <IncidentToolbar filter={vm.filter} onFilterChange={vm.setFilter} />
      <IncidentList loading={vm.loading} items={vm.items} />
    </>
  );
}
```

---

## 2) Unify HTTP client into one shared module

### Current pain
Two clients (`fetch` and Axios) both handle token and 401 logic.

### Recommendation
Pick one (Axios is already used in auth) and centralize in `shared/lib/httpClient.js`.

```js
// shared/lib/httpClient.js
import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('bfp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Then each API file only maps endpoint methods.

---

## 3) Move multi-entity business actions out of pages

### Current pain
`Incidents.jsx` and `IncidentDetail.jsx` include side effects that touch incidents + dispatches + fleet.

### Recommendation
Create service-like use-case functions:

```js
// features/incidents/services/closeIncident.js
export async function closeIncident({ incidentId, incidentsApi, dispatchesApi, fleetApi }) {
  await incidentsApi.updateStatus(incidentId, { incident_status: 'Done' });
  const dispatches = await dispatchesApi.getByIncident(incidentId);
  await Promise.all((dispatches ?? []).map((d) =>
    fleetApi.update(d.fleet_id, { status: 'Serviceable' })
  ));
}
```

Now page code is simpler and easier to test.

---

## 4) Backend: introduce service layer for domain logic

### Current pain
Some business rules are in handlers, some in repositories, some in frontend pages.

### Recommendation
Use `Handler -> Service -> Repository` for complex actions.

```go
// internal/domain/incident/service.go
type Service struct {
  incidents  IncidentRepository
  dispatches DispatchRepository
  fleets     FleetRepository
}

func (s *Service) CloseIncident(ctx context.Context, id uuid.UUID) error {
  if err := s.incidents.UpdateStatus(ctx, id, "Done"); err != nil {
    return err
  }
  // optional: centralize cross-entity side effects here
  return nil
}
```

This makes frontend thinner and keeps core rules server-side.

---

## 5) Normalize naming and comments for beginners

### Recommended naming rules

- Prefer full nouns over abbreviations in public code:
  - `inc` -> `incident`
  - `eq` -> `equipmentItem`
- Use explicit boolean names:
  - `isSuperAdmin`, `isStationScopedUser`
- Add short comments for “why”, not “what”.

### Example comment style

```js
// Why: regular users should never see other stations' equipment.
const stationId = currentUser.station_id;
```

---

## 6) Remove or isolate legacy Base44 artifacts

`frontend/functions/*.ts` still depends on Base44 SDK + Deno APIs and does not match current backend architecture. Either:

- remove if unused, or
- move to `legacy/base44/` with a clear README note.

---

## 7) Build a consistent route + role policy map

Create a single policy table (doc + code), for example:

- user: read own station resources
- admin: manage station resources
- superadmin: global management

Then enforce policies via middleware/helpers, not ad-hoc checks in each handler.

---

## Best Practices & Notes

## State management strategy that scales

- Keep **server state** in React Query (`useQuery`, `useMutation`) instead of manual `useEffect` + `useState` in every page.
- Keep **UI state** (modals, selected rows, tab state) local in components/hooks.
- Use query keys by feature:
  - `['incidents']`
  - `['incident', incidentId]`
  - `['dispatches', incidentId]`

This reduces duplicate loaders, stale state bugs, and manual refresh logic.

## Design patterns to adopt gradually

1. **Feature-first module structure**  
   Easier onboarding: beginners can work in one feature folder.

2. **Container + Presentational components**  
   Pages orchestrate data, presentational components focus on UI.

3. **Service/use-case functions**  
   Move cross-entity workflows out of page components.

4. **Single HTTP abstraction**  
   One place for token refresh, 401 handling, logging.

5. **Error shape standardization**  
   Backend should return consistent `{ error, code, details? }` format.

## Quick-win refactor priority list

1. Unify frontend HTTP client.
2. Extract `Incidents`, `IncidentDetail`, `Equipment`, `Hydrants`, `PersonnelProfile` into feature hooks + smaller components.
3. Split backend `cmd/api/main.go` into router/bootstrap modules.
4. Centralize backend authorization policy checks.
5. Remove/relocate legacy Base44 functions.
6. Remove build artifacts from source tracking (`api`, `seed`, `backend/api`, `backend/main`).

## Beginner-friendly implementation roadmap

- **Week 1:** client unification + one feature refactor (`Incidents`).
- **Week 2:** second feature refactor (`Equipment` or `Hydrants`) + shared modal/form utilities.
- **Week 3:** backend router split + policy middleware.
- **Week 4:** introduce service layer for incident/dispatch workflows.

---

If you want, the next step can be a concrete **Phase 1 implementation PR plan** (file-by-file checklist) that starts with the safest high-impact changes first.