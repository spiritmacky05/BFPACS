# BFPACS Application Context

## Overview
BFPACS (Bureau of Fire Protection Automated Command System) is a full-stack application designed to manage, monitor, and coordinate fire protection operations. It provides tools for incident management, personnel and equipment tracking, station administration, notifications, and more. The system is built with a Go backend and a modern JavaScript frontend (likely React + Vite + Tailwind CSS).

## Key Features
- **Incident Management:** Log, update, and track fire and emergency incidents.
- **Personnel Management:** Track check-ins, assignments, and details of fire personnel.
- **Equipment & Fleet Management:** Manage fire trucks, hydrants, and other equipment.
- **Station Administration:** Handle station data, deployment, and reporting.
- **Authentication & Authorization:** Secure login, user roles, and permissions.
- **Notifications:** Real-time or batched notifications for relevant events.
- **Admin & Superadmin Panels:** Advanced controls for high-level users.

## Architecture
- **Backend:**
  - Language: Go
  - Structure: Modular, with internal packages for models, handlers, repositories, middleware, and database logic.
  - API: RESTful endpoints for all major resources (incidents, personnel, equipment, etc.)
  - Security: Includes authentication, rate limiting, and security middleware.
  - Database: Managed via Go code and SQL scripts.
  - Dockerized for deployment.

- **Frontend:**
  - Framework: React (with Vite for fast builds)
  - Styling: Tailwind CSS
  - State Management: Likely React Context or similar
  - API Integration: Axios-based client for backend communication
  - Modular features: Each domain (auth, checkin, dashboard, etc.) has its own folder with components, hooks, and pages.
  - Dockerized for deployment.

- **DevOps:**
  - Docker Compose for multi-service orchestration
  - Caddyfile for web server/reverse proxy
  - Scripts for DB setup and secret generation

## Intended Users
- Fire station personnel
- Command center operators
- Administrators and superadmins

## Usage Context
BFPACS is intended for use by fire protection agencies to digitize and streamline their operations, improve response times, and centralize data management for incidents, personnel, and resources.

## Additional Notes
- The project is actively developed and refactored, as indicated by architecture and refactor analysis docs.
- The codebase is organized for scalability and maintainability, with clear separation of concerns.
- The frontend and backend are both containerized for easy deployment.

---
This document provides a high-level context for the BFPACS application, suitable for onboarding AI or developers to the project.