# BFPACS Backend — Architecture & Development Reference Guide

> A comprehensive reference for the BFPACS (Bureau of Fire Protection Alarm and Command System) Go REST API.
> Built with Go + Gin + GORM + PostgreSQL/PostGIS.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Database Layer — GORM + PostgreSQL](#3-database-layer--gorm--postgresql)
4. [Connection Pooling](#4-connection-pooling)
5. [Domain Models](#5-domain-models)
6. [Repository Pattern — GORM](#6-repository-pattern--gorm)
7. [Geo Handling Strategy](#7-geo-handling-strategy)
8. [HTTP Handlers — Gin Framework](#8-http-handlers--gin-framework)
9. [NFC / PIN Check-in System](#9-nfc--pin-check-in-system)
10. [Router & Middleware](#10-router--middleware)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Environment Configuration](#12-environment-configuration)
13. [Entry Point — main.go Wiring](#13-entry-point--maingo-wiring)
14. [Docker Deployment](#14-docker-deployment)
15. [API Reference Summary](#15-api-reference-summary)
16. [Common Patterns & Recipes](#16-common-patterns--recipes)

---

## 1. Technology Stack

| Layer            | Technology                          | Reason                                                           |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Language         | Go 1.25                             | Compiled, statically typed, excellent concurrency                |
| HTTP Framework   | Gin v1.12                           | High-performance, minimal overhead, idiomatic routing            |
| ORM              | GORM v1.31                          | Mature Go ORM with AutoMigrate, hooks, transactions              |
| Database Driver  | gorm/driver/postgres (pgx under)    | GORM's PostgreSQL driver backed by pgx/v5                        |
| Database         | PostgreSQL 15 + PostGIS             | ACID compliance, spatial queries, trigger support                |
| Authentication   | golang-jwt/jwt/v5 + bcrypt          | JWT tokens for API auth, bcrypt password hashing                 |
| Rate Limiting    | ulule/limiter/v3                    | Memory-based rate limiter for auth endpoint protection           |
| UUID Generation  | gen_random_uuid() (PG) + google/uuid| RFC-4122 UUIDs at both database and application layer            |
| Config           | godotenv                            | `.env` file loading for local development                        |

---

## 2. Project Structure

```
BFPACS/
├── .env                        # Environment variables (never commit to git)
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker orchestration (db + backend + frontend)
├── bfpacs_backup.sql           # Database seed / backup SQL
├── setup_db.sh                 # One-time local database setup script
├── ARCHITECTURE.md             # This file
│
├── backend/                    # Go REST API (standalone Go module)
│   ├── .dockerignore           # Docker build exclusions for backend
│   ├── Dockerfile              # Multi-stage Go build
│   ├── go.mod / go.sum         # Go module definition
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go         # Application entry point — wires everything together
│   │   └── seed/
│   │       └── main.go         # Standalone seeder (alternative to auto-seed)
│   └── internal/
│       ├── database/
│       │   ├── db.go           # GORM connection pool + AutoMigrate
│       │   └── seed.go         # Initial user seeding (superadmin, admin, user)
│       ├── models/             # Go structs with GORM + JSON tags
│       │   ├── auth.go         # RegisterRequest, LoginRequest, AuthResponse
│       │   ├── checkin.go      # PersonnelIncidentLog, NFC/PIN/Manual requests
│       │   ├── deployment.go   # Deployment, DeploymentAssignment
│       │   ├── equipment.go    # LogisticalEquipment, borrow/return requests
│       │   ├── fleet.go        # Fleet, FleetMovementLog
│       │   ├── hydrant.go      # Hydrant, NearbyHydrant
│       │   ├── incident.go     # FireIncident, IncidentDispatch
│       │   ├── notification.go # Notification
│       │   ├── personnel.go    # DutyPersonnel
│       │   ├── report.go       # SituationalReport
│       │   ├── station.go      # Station
│       │   └── user.go         # User (with BeforeSave hook)
│       ├── repository/         # Data access layer — one file per domain
│       │   ├── deployment_repo.go
│       │   ├── dispatch_repo.go
│       │   ├── equipment_repo.go
│       │   ├── fleet_repo.go
│       │   ├── hydrant_repo.go
│       │   ├── incident_repo.go
│       │   ├── notification_repo.go
│       │   ├── personnel_repo.go
│       │   ├── report_repo.go
│       │   ├── station_repo.go
│       │   └── user_repo.go
│       ├── handlers/           # HTTP layer — one file per domain
│       │   ├── auth_handler.go # Register, Login + JWT generation
│       │   ├── deployment_handler.go
│       │   ├── dispatch_handler.go
│       │   ├── equipment_handler.go
│       │   ├── fleet_handler.go
│       │   ├── hydrant_handler.go
│       │   ├── incident_handler.go
│       │   ├── notification_handler.go
│       │   ├── personnel_handler.go
│       │   ├── report_handler.go
│       │   └── station_handler.go
│       ├── middleware/         # HTTP middleware
│       │   ├── auth_middleware.go   # JWT validation (RequireAuth)
│       │   ├── rate_limiter.go     # 5 req/sec on auth routes
│       │   └── security_middleware.go # CORS, CSP, HSTS, security headers
│       └── checkin/            # Self-contained NFC/PIN check-in module
│           ├── checkin_repo.go # Atomic check-in with transaction
│           └── checkin_handler.go # NFC, PIN, Manual check-in handlers
│
└── frontend/                   # React SPA (Vite + Tailwind)
    ├── .dockerignore           # Docker build exclusions for frontend
    ├── Dockerfile              # Multi-stage React + Nginx build
    ├── package.json            # Node dependencies
    ├── vite.config.js          # Vite build config
    └── src/                    # React source code
        ├── api/                # API client modules
        ├── components/         # Reusable UI components
        ├── context/            # React context providers
        ├── hooks/              # Custom React hooks
        ├── lib/                # Utility libraries
        ├── pages/              # Page components
        └── utils/              # Helper functions
```

### Why `internal/`?

The `internal/` directory in Go is a language-enforced access boundary. No code outside this module can import packages inside `internal/`. This keeps domain logic private.

### The Three-Layer Architecture

```
Request → Handler → Repository → PostgreSQL
         (HTTP)    (GORM)       (Data)
```

- **Handler**: Parse/validate HTTP input, call the repo, return responses
- **Repository**: Execute GORM queries, return domain types
- **PostgreSQL**: Store data, enforce constraints, run triggers

---

## 3. Database Layer — GORM + PostgreSQL

### GORM AutoMigrate

On startup, GORM's `AutoMigrate` creates or updates tables to match the Go struct definitions:

```go
db.AutoMigrate(
    &models.User{},
    &models.Station{},
    &models.Fleet{},
    // ... all 14 models
)
```

AutoMigrate will:
- Create tables that don't exist
- Add columns that are missing
- Create indexes defined in GORM tags
- **Never** drop columns or data (safe for production)

### Schema Design Principles

**1. UUID Primary Keys**

```go
ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
```

Uses PostgreSQL's native `gen_random_uuid()` function. UUIDs are globally unique, safe to merge across environments, and don't expose row counts.

**2. Timestamps**

Models use `CreatedAt` and `UpdatedAt` fields which GORM auto-populates. Domain-specific timestamps (like `CheckInTime`) use the `autoCreateTime` tag:

```go
CreatedAt   time.Time  `json:"created_at"`
UpdatedAt   time.Time  `json:"updated_at"`
CheckInTime time.Time  `json:"check_in_time" gorm:"autoCreateTime"`
```

**3. Indexes via GORM Tags**

```go
StationID *uuid.UUID `gorm:"type:uuid;index"`         // B-tree index
Email     string     `gorm:"uniqueIndex;not null"`     // unique B-tree index
```

Composite indexes for multi-column queries:

```go
IncidentID  *uuid.UUID `gorm:"type:uuid;index:idx_checkin_incident_personnel"`
PersonnelID *uuid.UUID `gorm:"type:uuid;index:idx_checkin_incident_personnel"`
```

**4. Nullable Fields = Pointer Types**

Any column that can be `NULL` must be a pointer in Go:

```go
Lat *float64 `json:"lat,omitempty"` // nil = no GPS fix
```

The `json:"omitempty"` tag omits nil fields from JSON output.

---

## 4. Connection Pooling

GORM uses Go's `database/sql` pool under the hood:

```go
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(5)           // Keep 5 warm connections
sqlDB.SetMaxOpenConns(25)          // Max 25 simultaneous connections
sqlDB.SetConnMaxLifetime(5 * time.Minute)  // Recycle after 5 min
sqlDB.SetConnMaxIdleTime(3 * time.Minute)  // Release idle after 3 min
```

### Connection Pool Math

```
MaxOpenConns = 25
Each request holds a connection for ~1ms–10ms
At 25 connections: ~2,500–25,000 req/sec throughput
Beyond 25 concurrent DB requests → they queue (backpressure)
```

### GORM Log Level

In development: `logger.Info` (logs all SQL queries).
In production (`GIN_MODE=release`): `logger.Warn` (only slow queries and errors).

---

## 5. Domain Models

Models are Go structs with both GORM and JSON tags:

```go
type Fleet struct {
    ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    StationID   *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid;index"`
    EngineCode  string     `json:"engine_code"`
    Status      string     `json:"status"`
    Lat         *float64   `json:"lat,omitempty"`
    Lng         *float64   `json:"lng,omitempty"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}
```

### Key Design Decisions

**Separate Request Structs**: Never use the same struct for DB output and HTTP input:

```go
type CreateFleetRequest struct {
    EngineCode  string `json:"engine_code" binding:"required"`
    PlateNumber string `json:"plate_number" binding:"required"`
}
```

This prevents clients from setting server-only fields like `id` or `created_at`.

**GORM Hooks**: The `User` model uses a `BeforeSave` hook to lowercase emails:

```go
func (u *User) BeforeSave(tx *gorm.DB) error {
    u.Email = strings.ToLower(u.Email)
    return nil
}
```

---

## 6. Repository Pattern — GORM

Each repository holds a `*gorm.DB` reference injected via constructor:

```go
type PersonnelRepo struct {
    db *gorm.DB
}

func NewPersonnelRepo(db *gorm.DB) *PersonnelRepo {
    return &PersonnelRepo{db: db}
}
```

### The Three Query Patterns

**Pattern 1: Single record lookup**

```go
func (r *PersonnelRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
    var p models.DutyPersonnel
    if err := r.db.WithContext(ctx).Where("id = ?", id).First(&p).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil  // not found — not an error
        }
        return nil, err      // real DB error
    }
    return &p, nil
}
```

**Pattern 2: List query**

```go
func (r *PersonnelRepo) GetAll(ctx context.Context) ([]models.DutyPersonnel, error) {
    var list []models.DutyPersonnel
    err := r.db.WithContext(ctx).Order("full_name").Find(&list).Error
    return list, err
}
```

**Pattern 3: Partial update (PATCH semantics)**

```go
func (r *IncidentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateIncidentStatusRequest) error {
    updates := make(map[string]interface{})
    if req.IncidentStatus != nil {
        updates["incident_status"] = *req.IncidentStatus
    }
    // ... only set non-nil fields
    return r.db.WithContext(ctx).Model(&models.FireIncident{}).Where("id = ?", id).Updates(updates).Error
}
```

### Transactions for Race-Safe Operations

```go
func (r *EquipmentRepo) BorrowItem(ctx context.Context, id uuid.UUID, req models.BorrowEquipmentRequest) error {
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        var equip models.LogisticalEquipment
        if err := tx.Where("id = ?", id).First(&equip).Error; err != nil {
            return err
        }
        if equip.Status == "Borrowed" {
            return ErrAlreadyBorrowed
        }
        return tx.Model(&equip).Updates(map[string]interface{}{
            "borrower_name": req.BorrowerName,
            "status":        "Borrowed",
        }).Error
    })
}
```

### Always Pass Context

Every method accepts `context.Context` for request cancellation, timeouts, and tracing:

```go
data, err := h.Repo.GetAll(c.Request.Context())
```

---

## 7. Geo Handling Strategy

The project uses PostGIS Docker image but currently stores coordinates as plain `lat`/`lng` float64 columns (not PostGIS geography columns). This is a pragmatic choice that works for the current scale.

### Nearby Hydrant Search — Haversine Formula

The hydrant nearby search uses a raw SQL Haversine formula against the `lat`/`lng` columns:

```go
query := `
    SELECT *, (
        6371000 * acos(
            cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
            sin(radians(?)) * sin(radians(lat))
        )
    ) AS distance_meters
    FROM hydrants
    WHERE (...) <= ? AND lat IS NOT NULL AND lng IS NOT NULL
    ORDER BY distance_meters
`
```

### Future: PostGIS Migration Path

When scaling requires indexed spatial queries, the migration path is:

1. Add `geography(Point,4326)` columns alongside `lat`/`lng`
2. Create GiST indexes on the geography columns
3. Write PostGIS data on INSERT/UPDATE (using `ST_MakePoint(lng, lat)::geography`)
4. Replace Haversine WHERE with `ST_DWithin(geo_column, ST_MakePoint(?, ?)::geography, ?)`
5. Replace manual distance with `ST_Distance(geo_column, point)`

---

## 8. HTTP Handlers — Gin Framework

Handlers are thin — HTTP concerns only. No SQL, no business logic.

```go
func (h *IncidentHandler) Create(c *gin.Context) {
    var req models.CreateIncidentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    incident, err := h.Repo.Create(c.Request.Context(), req)
    if err != nil {
        log.Printf("[IncidentHandler.Create] %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create incident"})
        return
    }
    c.JSON(http.StatusCreated, incident)
}
```

### HTTP Status Conventions

| Situation                | Status Code          |
| ------------------------ | -------------------- |
| Successful GET           | `200 OK`             |
| Successful POST          | `201 Created`        |
| Invalid request / UUID   | `400 Bad Request`    |
| Missing/invalid JWT      | `401 Unauthorized`   |
| Not found                | `404 Not Found`      |
| Duplicate / conflict     | `409 Conflict`       |
| Rate limited             | `429 Too Many`       |
| Server/DB error          | `500 Internal Error` |

### Error Handling Pattern

Internal errors are logged server-side with context. Clients receive generic messages:

```go
if err != nil {
    log.Printf("[HandlerName.Method] %v", err)                    // server log
    c.JSON(500, gin.H{"error": "failed to perform operation"})    // client response
    return
}
```

### Not-Found vs DB-Error Pattern

Repos return `(nil, nil)` for not-found, handlers differentiate:

```go
result, err := h.Repo.GetByID(ctx, id)
if err != nil { /* 500 — DB error */ }
if result == nil { /* 404 — not found */ }
```

---

## 9. NFC / PIN Check-in System

The check-in module (`internal/checkin/`) is operationally critical. It uses atomic transactions to prevent duplicate check-ins from scanner glitches or double-taps.

### Flow

```
NFC Scanner taps tag → POST /api/v1/checkin/nfc
  1. GetPersonnelByNFCTag(tagID) → indexed lookup on nfc_tag_id (UNIQUE)
  2. CheckInAtomic(personnelID, incidentID, "NFC")
     └─ Transaction: COUNT active check-ins → if 0, INSERT new log
  3. Response: 201 Created with log + personnel data
```

### Race Prevention

`CheckInAtomic` runs the duplicate check AND insert inside a single GORM transaction, eliminating the TOCTOU (Time-of-Check-to-Time-of-Use) race condition:

```go
func (r *CheckInRepo) CheckInAtomic(ctx context.Context, ...) (*models.PersonnelIncidentLog, error) {
    err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        var count int64
        tx.Model(&models.PersonnelIncidentLog{}).
            Where("personnel_id = ? AND incident_id = ? AND check_out_time IS NULL", ...).
            Count(&count)
        if count > 0 {
            return ErrAlreadyCheckedIn
        }
        // ... create log entry atomically
    })
}
```

---

## 10. Router & Middleware

### Route Structure

```
/api/v1/
├── /health                 (public)
├── /auth/
│   ├── POST /register      (public, rate-limited)
│   └── POST /login         (public, rate-limited)
└── (all below require JWT)
    ├── /personnel           CRUD + duty-status
    ├── /fleets              CRUD + location + movement logs
    ├── /incidents           CRUD + status updates
    ├── /dispatches          dispatch fleet + status updates
    ├── /deployments         CRUD + fleet assignments
    ├── /hydrants            CRUD + nearby search
    ├── /stations            CRUD
    ├── /reports             create + query by incident/deployment
    ├── /notifications       get + mark read (JWT-enforced ownership)
    ├── /equipment           CRUD + borrow/return
    └── /checkin             NFC + PIN + manual + logs
```

### Middleware Stack

| Middleware        | Scope    | Purpose                                        |
| ----------------- | -------- | ---------------------------------------------- |
| CORSMiddleware    | Global   | Exact-match origin allowlist (prevents bypass)  |
| SecurityHeaders   | Global   | CSP, HSTS, X-Frame-Options, nosniff            |
| RateLimiter       | Auth only| 5 req/sec per IP on login/register              |
| RequireAuth       | Protected| JWT validation, sets userID + role in context    |

---

## 11. Authentication & Authorization

### JWT Flow

1. User registers/logs in → server returns JWT (24h expiry)
2. Client sends `Authorization: Bearer <token>` on all subsequent requests
3. `RequireAuth` middleware validates token, extracts `user_id` and `role`
4. Handlers access via `c.Get("userID")` and `c.Get("role")`

### Password Security

- Hashed with bcrypt at `DefaultCost` (currently 10 rounds)
- `PasswordHash` field uses `json:"-"` tag — never serialized to JSON
- Login returns generic "Invalid email or password" for both wrong email and wrong password

### JWT Secret Safety

- In production (`GIN_MODE=release`): server refuses to start without `JWT_SECRET`
- In development: falls back to hardcoded default with warning log

---

## 12. Environment Configuration

### Required Variables

| Variable       | Required | Description                                    |
| -------------- | -------- | ---------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string                   |
| `JWT_SECRET`   | Prod     | HMAC signing key for JWT (fatal if missing)    |
| `PORT`         | No       | Server port (default: 8080)                    |
| `GIN_MODE`     | No       | `release` for production, `debug` for dev      |

### Security Rules

1. Never commit `.env` to git (it's in `.gitignore`)
2. In Docker, set secrets via environment variables
3. Production `JWT_SECRET` must be a strong random string

---

## 13. Entry Point — main.go Wiring

Uses manual dependency injection — explicit, testable, no magic:

```go
func main() {
    godotenv.Load()
    db := database.NewConnectionPool()

    // Construct repos (all share the same *gorm.DB)
    personnelRepo := repository.NewPersonnelRepo(db)
    // ...

    // Construct handlers (each gets its repo)
    personnelH := handlers.NewPersonnelHandler(personnelRepo)
    // ...

    // Build router, register routes
    r := gin.Default()
    // ...

    // Graceful shutdown with signal handling
    srv := &http.Server{Addr: ":8080", Handler: r}
    go srv.ListenAndServe()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    srv.Shutdown(ctx)
}
```

---

## 14. Docker Deployment

### Services (docker-compose.yml)

| Service    | Image                     | Port       | Purpose                |
| ---------- | ------------------------- | ---------- | ---------------------- |
| `db`       | postgis/postgis:15-3.4    | 5433:5432  | PostgreSQL + PostGIS   |
| `backend`  | backend/Dockerfile        | 8081:8080  | Go API server          |
| `frontend` | frontend/Dockerfile       | 5173:80    | React SPA + Nginx proxy|

### Health Checks

- **db**: `pg_isready` every 10s
- **backend**: HTTP GET `/api/v1/health` every 15s (10s start period)
- **frontend**: depends on backend health before starting

### Backend Dockerfile (`backend/Dockerfile`)

Multi-stage build with static binary (no CGO). Build context is `./backend`:

```dockerfile
FROM golang:1.25-alpine AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-server ./cmd/api/main.go

FROM alpine:latest
COPY --from=builder /app/api-server .
USER bfp  # non-root
CMD ["./api-server"]
```

### Frontend Dockerfile (`frontend/Dockerfile`)

React build → Nginx with SPA fallback and API reverse proxy. Build context is `./frontend`:

- All `/api/` requests proxied to `backend:8080`
- All other paths serve `index.html` (React Router)
- Static assets cached with 1-year expiry
- Gzip compression enabled

---

## 15. API Reference Summary

| Method | Path                                        | Auth | Description                    |
| ------ | ------------------------------------------- | ---- | ------------------------------ |
| GET    | `/api/v1/health`                            | No   | Health check                   |
| POST   | `/api/v1/auth/register`                     | No   | Register new user              |
| POST   | `/api/v1/auth/login`                        | No   | Login, get JWT                 |
| GET    | `/api/v1/personnel`                         | JWT  | List all duty personnel        |
| GET    | `/api/v1/personnel/:id`                     | JWT  | Get personnel by UUID          |
| POST   | `/api/v1/personnel`                         | JWT  | Create personnel record        |
| PATCH  | `/api/v1/personnel/:id/duty-status`         | JWT  | Update duty status             |
| GET    | `/api/v1/fleets`                            | JWT  | List all fleet vehicles        |
| GET    | `/api/v1/fleets/:id`                        | JWT  | Get fleet by UUID              |
| POST   | `/api/v1/fleets`                            | JWT  | Register new fleet vehicle     |
| PATCH  | `/api/v1/fleets/:id`                        | JWT  | Update fleet fields            |
| PATCH  | `/api/v1/fleets/:id/location`               | JWT  | Update GPS location            |
| POST   | `/api/v1/fleets/:id/log-movement`           | JWT  | Log BFP status code            |
| GET    | `/api/v1/fleets/:id/movement-logs`          | JWT  | Get movement history           |
| GET    | `/api/v1/incidents`                         | JWT  | List all fire incidents        |
| GET    | `/api/v1/incidents/:id`                     | JWT  | Get incident by UUID           |
| POST   | `/api/v1/incidents`                         | JWT  | Report new 10-70               |
| PATCH  | `/api/v1/incidents/:id/status`              | JWT  | Update alarm/status            |
| GET    | `/api/v1/dispatches?incident_id=`           | JWT  | List dispatches for incident   |
| POST   | `/api/v1/dispatches`                        | JWT  | Dispatch fleet to incident     |
| PATCH  | `/api/v1/dispatches/:id/status`             | JWT  | Update BFP radio code          |
| GET    | `/api/v1/deployments`                       | JWT  | List all deployments           |
| GET    | `/api/v1/deployments/:id`                   | JWT  | Get deployment by UUID         |
| POST   | `/api/v1/deployments`                       | JWT  | Create new deployment          |
| POST   | `/api/v1/deployments/:id/assign-fleet`      | JWT  | Assign fleet to deployment     |
| GET    | `/api/v1/deployments/:id/assignments`       | JWT  | List fleet assignments         |
| GET    | `/api/v1/hydrants`                          | JWT  | List all hydrants              |
| GET    | `/api/v1/hydrants/nearby?lat=&lng=&radius=` | JWT  | Nearest hydrants (Haversine)   |
| GET    | `/api/v1/hydrants/:id`                      | JWT  | Get hydrant by UUID            |
| POST   | `/api/v1/hydrants`                          | JWT  | Register new hydrant           |
| GET    | `/api/v1/stations`                          | JWT  | List all fire stations         |
| GET    | `/api/v1/stations/:id`                      | JWT  | Get station by UUID            |
| POST   | `/api/v1/stations`                          | JWT  | Register new station           |
| POST   | `/api/v1/reports`                           | JWT  | Submit situational report      |
| GET    | `/api/v1/reports/incident/:id`              | JWT  | Reports for incident           |
| GET    | `/api/v1/reports/deployment/:id`            | JWT  | Reports for deployment         |
| GET    | `/api/v1/notifications`                     | JWT  | Get own notifications          |
| PATCH  | `/api/v1/notifications/:id/read`            | JWT  | Mark notification read         |
| PATCH  | `/api/v1/notifications/read-all`            | JWT  | Mark all own notifications read|
| GET    | `/api/v1/equipment?station_id=`             | JWT  | List equipment (filter)        |
| POST   | `/api/v1/equipment`                         | JWT  | Add new equipment              |
| PUT    | `/api/v1/equipment/:id`                     | JWT  | Update equipment               |
| DELETE | `/api/v1/equipment/:id`                     | JWT  | Delete equipment               |
| PATCH  | `/api/v1/equipment/:id/borrow`              | JWT  | Record equipment borrow        |
| PATCH  | `/api/v1/equipment/:id/return`              | JWT  | Record equipment return        |
| POST   | `/api/v1/checkin/nfc`                       | JWT  | NFC tag check-in               |
| POST   | `/api/v1/checkin/pin`                       | JWT  | PIN check-in                   |
| POST   | `/api/v1/checkin/manual`                    | JWT  | Admin deploy by UUID           |
| GET    | `/api/v1/checkin/logs?incident_id=`         | JWT  | Check-in log for incident      |

---

## 16. Common Patterns & Recipes

### Adding a New Domain (e.g. "Vehicles")

1. **Model** → `internal/models/vehicle.go` (struct with GORM + JSON tags)
2. **Repository** → `internal/repository/vehicle_repo.go` (GORM queries)
3. **Handler** → `internal/handlers/vehicle_handler.go` (HTTP logic)
4. **Wire in main.go**:
   ```go
   vehicleRepo := repository.NewVehicleRepo(db)
   vehicleH := handlers.NewVehicleHandler(vehicleRepo)
   v := protected.Group("/vehicles")
   v.GET("", vehicleH.GetAll)
   v.POST("", vehicleH.Create)
   ```

### Query Timeout

```go
func (r *Repo) SlowQuery(ctx context.Context) ([]Model, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    var list []Model
    err := r.db.WithContext(ctx).Find(&list).Error
    return list, err
}
```

### Transactional Multi-Table Operations

```go
err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&incident).Error; err != nil {
        return err  // triggers rollback
    }
    if err := tx.Create(&dispatch).Error; err != nil {
        return err  // triggers rollback
    }
    return nil  // commit
})
```

---

_Built with Go 1.25, Gin v1.12, GORM v1.31, PostgreSQL 15, PostGIS — 2026_
