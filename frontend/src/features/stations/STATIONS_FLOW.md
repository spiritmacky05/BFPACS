# Stations Feature Architecture & Data Flow

This document details how fire station data is managed and distributed across the BFPACS application.

## 1. Global Distribution
Fire stations are a core entity that many other features depend on (Fleet, Personnel, Hydrants, Users).

*   **API Hydration:** The `stationsApi.list()` and `stationsApi.listPublic()` provide station data. `listPublic` is specifically used for the registration flow where users need to pick a station before they are authenticated.
*   **Context/Hooks:** Other features often fetch the station list via `stationsApi` to populate dropdowns or filters.
*   **Filtering:** The `StationFilter` component is a portable UI piece that takes any list of objects (with station-identifying keys) and provides a multi-level filter (Station -> City -> District -> Region).

## 2. Entity Relationships
A "Station" object is structured as follows:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `station_name` | String | human-readable name (e.g., "Quezon City Fire Station"). |
| `city` | String | City or Municipality. |
| `district` | String | District identifier. |
| `region` | String | Regional identifier. |
| `address_text` | String | Physical address. |
| `contact_number` | String | Official contact line. |
| `lat` / `lng` | Float | Geographic coordinates for map placement. |

## 3. Component Strategy
*   **StationFilter:** Although used globally, this component lives within the `stations` feature as it is the domain owner of station-based logic. It is exported via the feature barrel file for use in Dispatch, Fleet, and Personnel modules.
*   **MapView Integration:** The `StationsPage` utilizes the common `MapView` to render station locations based on the `lat`/`lng` entity fields.

## 4. Feature Structure
```text
src/features/stations/
├── api/          # stations.api.js
├── components/   # StationFilter.jsx
├── hooks/        # useStations.js
├── pages/        # StationsPage.jsx
└── STATIONS_FLOW.md
```
