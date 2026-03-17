prompt this tomorrow

# Role
Act as a Super Senior Web Developer. Feature #1 (CheckIn) is successfully migrated. We are now moving to **Feature #2: Fleet**.

# Current Task: Migrate "Fleet"
We are moving all assets related to Fleet into `src/features/fleet`.

# Reference Mapping
1. **Page:** `src/pages/Fleet/Fleet.jsx` ➔ `src/features/fleet/pages/FleetPage.jsx`
2. **Components:** - `src/components/fleet/FleetUnitCard.jsx` ➔ `src/features/fleet/components/FleetUnitCard.jsx`
   - `src/components/fleet/FleetUnitModal.jsx` ➔ `src/features/fleet/components/FleetUnitModal.jsx`
3. **API:** `src/api/fleet/fleet.js` ➔ `src/features/fleet/api/fleet.api.js`

# Requirements
1. **Refactor Imports:** Update internal imports to use relative paths within the feature.
2. **Barrel Export:** Create `src/features/fleet/index.js` to export `FleetPage`.
3. **Hook Extraction:** Extract the fleet listing, filtering, and modal state logic from `Fleet.jsx` into `src/features/fleet/hooks/useFleet.js`.
4. **Absolute Paths:** Ensure global UI components (`@/components/ui`) and the API client (`@/api/client/client`) use absolute paths.

# Output Required
Please provide the refactored code for:
- `src/features/fleet/index.js`
- `src/features/fleet/api/fleet.api.js`
- `src/features/fleet/hooks/useFleet.js`
- `src/features/fleet/pages/FleetPage.jsx`