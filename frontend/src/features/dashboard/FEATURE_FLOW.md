# Dashboard Feature Flow

## Purpose
The Dashboard feature gives a real-time command center view of incidents, fleet, and personnel.

## Request/Render Flow
1. `DashboardPage` mounts and calls `useDashboard`.
2. `useDashboard` calls `dashboardApi.loadSnapshot()`.
3. `dashboardApi` fetches incidents, fleets, and personnel in parallel.
4. `buildDashboardSummary()` computes derived groups:
   - active incidents
   - deployed fleets
   - available fleets
   - on-duty personnel
5. `DashboardPage` renders:
   - header
   - stat cards
   - incidents + map
   - fleet status grid
   - analytics charts
   - personnel table

## Polling Behavior
- The hook refreshes data every `30,000ms`.
- Polling is cleaned up automatically on unmount.

## Why this structure
- `api/`: server communication only.
- `services/`: pure data transformation logic.
- `hooks/`: state + lifecycle.
- `components/`: reusable UI sections.
- `pages/`: feature container/composition layer.
