# Duty Personnel Feature Flow

This feature owns the Duty Personnel page and all related UI behavior.

## Files and Responsibilities

- `api/dutyPersonnel.api.js`
  - All HTTP calls for personnel and station data.
- `hooks/useDutyPersonnelPage.js`
  - Page orchestration: loading, filters, modal state, submit/delete/status actions.
- `services/dutyPersonnelForm.service.js`
  - Pure form helpers (parse/join certifications, skill toggle limits, payload builders).
- `components/*`
  - Small presentational building blocks:
    - toolbar stats + add button
    - search bar
    - duty status filter
    - location filter/sort panel
    - personnel table
    - create/edit modal
    - confirmation modal
- `pages/DutyPersonnelPage.jsx`
  - Container page that wires hook state + feature components.

## Runtime Flow

1. Page loads and calls `loadPageData()` from `useDutyPersonnelPage`.
2. Hook fetches personnel + stations in parallel.
3. User filters/searches/sorts; `filteredPersonnel` is recomputed with `useMemo`.
4. User actions:
   - **Add/Edit** opens form modal, builds payload, saves, reloads list.
   - **Toggle Duty Status** shows confirmation, updates status, reloads list.
   - **Delete** shows confirmation, deletes record, reloads list.
5. UI remains declarative; API details stay inside feature API files.
