# BFPACS Backend — Architecture & Development Reference Guide

> A comprehensive reference for building production-grade Go REST APIs backed by PostgreSQL with PostGIS.  
> Written based on the actual construction of the BFPACS (Bureau of Fire Protection Automated Check-in System) backend.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Database Layer — PostgreSQL + PostGIS](#3-database-layer--postgresql--postgis)
4. [Connection Pooling — pgxpool](#4-connection-pooling--pgxpool)
5. [Domain Models](#5-domain-models)
6. [Repository Pattern — Raw SQL](#6-repository-pattern--raw-sql)
7. [PostGIS Geo Handling Strategy](#7-postgis-geo-handling-strategy)
8. [HTTP Handlers — Gin Framework](#8-http-handlers--gin-framework)
9. [NFC Check-in System](#9-nfc-check-in-system)
10. [Router & Middleware](#10-router--middleware)
11. [Environment Configuration](#11-environment-configuration)
12. [Entry Point — main.go Wiring](#12-entry-point--maingo-wiring)
13. [Production Readiness Checklist](#13-production-readiness-checklist)
14. [Deployment Guide](#14-deployment-guide)
15. [API Reference Summary](#15-api-reference-summary)
16. [Common Patterns & Recipes](#16-common-patterns--recipes)

---

## 1. Technology Stack

| Layer           | Technology                        | Reason                                                                            |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Language        | Go 1.25                           | Compiled, statically typed, excellent concurrency                                 |
| HTTP Framework  | Gin v1.12                         | High-performance, minimal overhead, idiomatic routing                             |
| Database Driver | pgx/v5                            | Native PostgreSQL driver, faster than `database/sql`, first-class PostGIS support |
| Connection Pool | pgxpool                           | Built-in to pgx, production-grade with health checks                              |
| Database        | PostgreSQL 17                     | ACID compliance, advanced types, trigger support                                  |
| Geo Extension   | PostGIS                           | Spatial queries (`ST_DWithin`, `ST_MakePoint`, `ST_X`, `ST_Y`)                    |
| UUID Generation | uuid-ossp (PG) + google/uuid (Go) | RFC-4122 UUIDs at both the DB and application layer                               |
| Config          | godotenv                          | `.env` file loading for local development                                         |

**Why no ORM?** PostgreSQL features like PostGIS spatial types, `RETURNING` clauses, database triggers, and custom ENUM types cannot be reliably expressed through most Go ORMs. Raw SQL gives you complete control, zero overhead, and predictable query behavior.

---

## 2. Project Structure

```
BFPACS/
├── .env                        # Environment variables (never commit to git)
├── go.mod                      # Go module definition
├── go.sum                      # Dependency checksums
├── ARCHITECTURE.md             # This file
├── setup_db.sh                 # One-time database setup script
│
├── cmd/
│   └── api/
│       └── main.go             # Application entry point — wires everything together
│
└── internal/
    ├── database/
    │   └── db.go               # pgxpool initialization with production settings
    │
    ├── models/                 # Pure Go structs — no DB annotations
    │   ├── personnel.go
    │   ├── fleet.go
    │   ├── incident.go
    │   ├── deployment.go
    │   ├── hydrant.go
    │   ├── station.go
    │   ├── user.go
    │   ├── report.go
    │   ├── notification.go
    │   ├── equipment.go
    │   └── checkin.go
    │
    ├── repository/             # All SQL lives here — one file per domain
    │   ├── personnel_repo.go
    │   ├── fleet_repo.go
    │   ├── incident_repo.go
    │   ├── dispatch_repo.go
    │   ├── deployment_repo.go
    │   ├── hydrant_repo.go
    │   ├── station_repo.go
    │   ├── report_repo.go
    │   ├── notification_repo.go
    │   └── equipment_repo.go
    │
    ├── handlers/               # HTTP layer — one file per domain
    │   ├── personnel_handler.go
    │   ├── fleet_handler.go
    │   ├── incident_handler.go
    │   ├── dispatch_handler.go
    │   ├── deployment_handler.go
    │   ├── hydrant_handler.go
    │   ├── station_handler.go
    │   ├── report_handler.go
    │   ├── notification_handler.go
    │   └── equipment_handler.go
    │
    └── checkin/                # Self-contained NFC/PIN module
        ├── checkin_repo.go
        └── checkin_handler.go
```

### Why `internal/`?

The `internal/` directory in Go is a language-enforced access boundary. No code outside this module can import packages inside `internal/`. This keeps your domain logic private and prevents external packages from depending on implementation details.

### The Three-Layer Architecture

```
Request → Handler → Repository → PostgreSQL
         (HTTP)    (SQL)        (Data)
```

Each layer has a single responsibility:

- **Handler**: Parse/validate input, call the repo, return HTTP responses
- **Repository**: Execute SQL, scan results into structs, return domain types
- **PostgreSQL**: Store data, enforce constraints, run triggers

---

## 3. Database Layer — PostgreSQL + PostGIS

### Schema Design Principles

The BFPACS schema follows these conventions:

**1. UUID Primary Keys (not auto-increment integers)**

```sql
id uuid DEFAULT public.uuid_generate_v4() NOT NULL
```

UUIDs are globally unique — safe to generate at the application layer, safe to merge across environments, and don't expose row counts to clients.

**2. Timestamps with Time Zone**

```sql
created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
```

Always store in UTC. The `+08:00` offset you see in responses is the PostgreSQL session timezone applied at read time, not stored in the field.

**3. Soft ENUMs via CHECK constraints**

```sql
CONSTRAINT check_bfp_rank CHECK (
  rank::text = ANY (ARRAY['FO1','FO2','FO3','SFO1',...])
)
```

More portable than PostgreSQL ENUM types — easier to add new values without a schema migration.

**4. PostGIS Geography Columns**

```sql
current_location public.geography(Point,4326)
```

`geography(Point,4326)` stores WGS84 coordinates (the same coordinate system as GPS). The `4326` is the SRID (Spatial Reference ID for standard GPS lat/lng).

**5. GiST Indexes on Geography Columns**

```sql
CREATE INDEX idx_fleets_current_location ON fleets USING gist (current_location);
```

GiST (Generalized Search Tree) is required for spatial queries. Without this index, `ST_DWithin` would do a full table scan.

**6. Database Triggers for Automated Notifications**

```sql
CREATE TRIGGER trg_new_incident_alert
  AFTER INSERT ON fire_incidents
  FOR EACH ROW EXECUTE FUNCTION notify_new_incident();
```

The trigger automatically inserts notification records for all Station Commanders whenever a new incident is reported. This logic lives in the database — not in the application — ensuring notifications fire regardless of which service inserts the data.

---

## 4. Connection Pooling — pgxpool

### The Pool Configuration (`internal/database/db.go`)

```go
func NewConnectionPool() *pgxpool.Pool {
    connStr := os.Getenv("DATABASE_URL")
    config, err := pgxpool.ParseConfig(connStr)

    // --- Production tuning ---
    config.MaxConns = 20              // Max simultaneous DB connections
    config.MinConns = 2               // Keep 2 connections warm at all times
    config.MaxConnLifetime = 30 * time.Minute  // Recycle connections (avoids stale TCP)
    config.MaxConnIdleTime = 5 * time.Minute   // Release idle connections after 5 min
    config.HealthCheckPeriod = 1 * time.Minute // Ping idle connections to keep them alive

    pool, _ := pgxpool.NewWithConfig(context.Background(), config)
    pool.Ping(context.Background()) // Fail fast at startup if DB is unreachable
    return pool
}
```

### Why a Pool Matters

Without a pool, every HTTP request would open a new TCP connection to PostgreSQL (expensive: ~5ms–50ms per connection). With a pool, connections are reused — a request gets a connection from the warm pool in microseconds.

### Connection Pool Math

```
MaxConns = 20
Concurrent requests that need DB = 20 max (beyond that, they queue)

For a typical API:
  - Each request holds a connection for ~1ms–10ms
  - At 20 connections, you can serve ~2,000–20,000 req/sec
```

### The DATABASE_URL Format

```
postgres://[user]:[password]@[host]:[port]/[database]
postgres://bfp_admin:@Ultraman13@localhost:5432/bfpacs_db
```

Note: The `@` symbol in the password is URL-encoded in some clients but pgx handles it correctly as-is.

---

## 5. Domain Models

Models are **plain Go structs with JSON tags**. They have zero coupling to the database driver.

```go
// internal/models/fleet.go
type Fleet struct {
    ID          uuid.UUID  `json:"id"`
    EngineCode  string     `json:"engine_code"`
    Status      string     `json:"status"`
    Lat         *float64   `json:"lat,omitempty"`   // nil if no GPS fix
    Lng         *float64   `json:"lng,omitempty"`
    CreatedAt   time.Time  `json:"created_at"`
}
```

### Key Design Decisions

**Pointer types for nullable fields (`*string`, `*float64`, `*uuid.UUID`)**

PostgreSQL `NULL` maps to Go `nil`. Any column that can be NULL in the schema must be a pointer in Go, otherwise scanning will fail with a nil dereference.

```go
// BAD: will panic if DB value is NULL
var name string
rows.Scan(&name)

// GOOD: safely handles NULL
var name *string
rows.Scan(&name)  // name is nil if DB returns NULL
```

**`omitempty` on nullable fields**

The `json:"field,omitempty"` tag skips the field entirely in JSON output if it's nil. This keeps responses clean — a fleet with no GPS fix won't have `"lat": null` in the JSON.

**Separate Request structs**

Never use the same struct for both database output and HTTP input. Always define separate `CreateXRequest` and `UpdateXRequest` structs:

```go
type CreateFleetRequest struct {
    EngineCode  string  `json:"engine_code" binding:"required"`
    PlateNumber string  `json:"plate_number" binding:"required"`
    // ...only fields the client is allowed to set
}

type Fleet struct {
    // ...all fields including server-set ones like id, created_at
}
```

This prevents clients from setting fields like `id` or `created_at` that should only be set by the server.

---

## 6. Repository Pattern — Raw SQL

Each repository struct holds a reference to the shared `*pgxpool.Pool`. Methods execute SQL directly.

### Anatomy of a Repository

```go
type PersonnelRepo struct {
    Pool *pgxpool.Pool           // shared pool — injected via constructor
}

func NewPersonnelRepo(pool *pgxpool.Pool) *PersonnelRepo {
    return &PersonnelRepo{Pool: pool}
}
```

### The Three Query Patterns

**Pattern 1: `QueryRow` — single row result**

```go
func (r *PersonnelRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
    var p models.DutyPersonnel
    err := r.Pool.QueryRow(ctx,
        `SELECT id, full_name, rank, duty_status FROM duty_personnel WHERE id=$1`,
        id,
    ).Scan(&p.ID, &p.FullName, &p.Rank, &p.DutyStatus)

    if errors.Is(err, pgx.ErrNoRows) {
        return nil, nil  // not found, not an error
    }
    if err != nil {
        return nil, err  // real error
    }
    return &p, nil
}
```

**Pattern 2: `Query` — multiple row results**

```go
func (r *PersonnelRepo) GetAll(ctx context.Context) ([]models.DutyPersonnel, error) {
    rows, err := r.Pool.Query(ctx,
        `SELECT id, full_name, rank, duty_status FROM duty_personnel ORDER BY full_name`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()  // ALWAYS defer close to release the connection back to pool

    var list []models.DutyPersonnel
    for rows.Next() {
        var p models.DutyPersonnel
        if err := rows.Scan(&p.ID, &p.FullName, &p.Rank, &p.DutyStatus); err != nil {
            return nil, err
        }
        list = append(list, p)
    }
    return list, nil
}
```

**Pattern 3: `Exec` — no result needed (UPDATE, DELETE)**

```go
func (r *PersonnelRepo) UpdateDutyStatus(ctx context.Context, id uuid.UUID, status string) error {
    _, err := r.Pool.Exec(ctx,
        `UPDATE duty_personnel SET duty_status=$1, updated_at=NOW() WHERE id=$2`,
        status, id)
    return err
}
```

### RETURNING Clause — Insert and Get in One Round-Trip

Instead of doing INSERT then SELECT, use PostgreSQL's `RETURNING`:

```go
// BAD: two round-trips to the database
r.Pool.Exec(ctx, `INSERT INTO fleets (...) VALUES (...)`)
r.Pool.QueryRow(ctx, `SELECT * FROM fleets WHERE id=$1`, id)

// GOOD: one round-trip
err := r.Pool.QueryRow(ctx, `
    INSERT INTO fleets (engine_code, plate_number, vehicle_type)
    VALUES ($1,$2,$3)
    RETURNING id, engine_code, plate_number, created_at`,  // get back the created row
    req.EngineCode, req.PlateNumber, req.VehicleType,
).Scan(&f.ID, &f.EngineCode, &f.PlateNumber, &f.CreatedAt)
```

### COALESCE for Partial Updates (PATCH semantics)

When only some fields should be updated, use `COALESCE` to keep existing values for nil inputs:

```go
r.Pool.Exec(ctx, `
    UPDATE fire_incidents SET
        incident_status = COALESCE($1, incident_status),
        alarm_status    = COALESCE($2, alarm_status),
        ground_commander= COALESCE($3, ground_commander),
        updated_at      = NOW()
    WHERE id=$4`,
    req.IncidentStatus,    // nil = keep existing value
    req.AlarmStatus,       // nil = keep existing value
    req.GroundCommander,   // nil = keep existing value
    id)
```

### Always Pass Context

Every repository method accepts `context.Context` as its first parameter. This allows:

- **Request cancellation**: If the HTTP client disconnects, the SQL query is cancelled
- **Timeouts**: You can set a deadline that propagates to the DB query
- **Tracing**: Future instrumentation can trace DB calls back to HTTP requests

```go
// Handler always passes c.Request.Context() — this is the request's context
data, err := h.Repo.GetAll(c.Request.Context())
```

---

## 7. PostGIS Geo Handling Strategy

PostGIS stores geographic points in a binary format that Go cannot scan directly into a struct. The solution is to use PostGIS functions to convert to/from standard float64 values.

### Reading: Binary → float64

Use SQL functions `ST_Y()` (latitude) and `ST_X()` (longitude) in the SELECT:

```sql
SELECT
    id,
    engine_code,
    ST_Y(current_location::geometry) AS lat,   -- extracts latitude
    ST_X(current_location::geometry) AS lng    -- extracts longitude
FROM fleets
```

Then scan normally:

```go
var lat, lng *float64  // pointer because the column can be NULL (no GPS fix)
rows.Scan(&f.ID, &f.EngineCode, &lat, &lng)
f.Lat = lat
f.Lng = lng
```

### Writing: float64 → PostGIS Point

Use `ST_MakePoint(longitude, latitude)` — **note: longitude comes first**, not latitude:

```sql
UPDATE fleets
SET current_location = ST_MakePoint($1, $2)::geography
WHERE id = $3
-- args: lng, lat, id
```

### Conditional Geo INSERT

When lat/lng are optional (nullable), use a CASE expression instead of building dynamic SQL:

```sql
INSERT INTO fire_incidents (location_text, geo_location)
VALUES ($1,
    CASE
        WHEN $2::float8 IS NOT NULL AND $3::float8 IS NOT NULL
        THEN ST_MakePoint($3, $2)::geography   -- ST_MakePoint(lng, lat)
        ELSE NULL
    END
)
-- args: locationText, lat, lng
```

### Nearest Neighbor Search with ST_DWithin

For the hydrant nearby search, PostGIS compares geography objects and uses the GiST index automatically:

```sql
SELECT
    id, hydrant_code,
    ST_Y(location::geometry) AS lat,
    ST_X(location::geometry) AS lng,
    ST_Distance(location, ST_MakePoint($1,$2)::geography) AS distance_meters  -- actual distance in meters
FROM hydrants
WHERE ST_DWithin(location, ST_MakePoint($1,$2)::geography, $3)  -- within $3 meters
ORDER BY distance_meters
-- args: lng, lat, radiusMeters
```

This query runs in milliseconds even with thousands of hydrants because it uses the GiST index.

### Summary of PostGIS Functions Used

| Function                   | Purpose                                                | Example                            |
| -------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `ST_MakePoint(lng, lat)`   | Create a point geometry                                | `ST_MakePoint(121.034, 14.655)`    |
| `::geography`              | Cast geometry to geography (uses meters for distances) | `ST_MakePoint(...)::geography`     |
| `ST_Y(geom::geometry)`     | Extract latitude from geography                        | `ST_Y(location::geometry)`         |
| `ST_X(geom::geometry)`     | Extract longitude from geography                       | `ST_X(location::geometry)`         |
| `ST_DWithin(a, b, radius)` | True if two geographies are within `radius` meters     | `ST_DWithin(location, point, 500)` |
| `ST_Distance(a, b)`        | Distance in meters between two geographies             | `ST_Distance(loc, point)`          |

---

## 8. HTTP Handlers — Gin Framework

Handlers are thin — they only deal with HTTP concerns. No SQL, no business logic.

### Anatomy of a Handler

```go
type IncidentHandler struct {
    Repo *repository.IncidentRepo  // dependency injected via constructor
}

func NewIncidentHandler(repo *repository.IncidentRepo) *IncidentHandler {
    return &IncidentHandler{Repo: repo}
}

func (h *IncidentHandler) Create(c *gin.Context) {
    // 1. Parse and validate the request body
    var req models.CreateIncidentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 2. Call the repository (pass request context for cancellation support)
    incident, err := h.Repo.Create(c.Request.Context(), req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // 3. Return the result
    c.JSON(http.StatusCreated, incident)
}
```

### HTTP Status Code Conventions

| Situation                                 | Status Code                 |
| ----------------------------------------- | --------------------------- |
| Successful GET                            | `200 OK`                    |
| Successful POST (created new resource)    | `201 Created`               |
| Successful PATCH/PUT (updated)            | `200 OK`                    |
| Invalid request body / bad UUID           | `400 Bad Request`           |
| Resource not found                        | `404 Not Found`             |
| Duplicate constraint (already checked in) | `409 Conflict`              |
| Database or server error                  | `500 Internal Server Error` |

### UUID Parsing Pattern

All IDs are UUIDs. Parse them early and return 400 if invalid:

```go
id, err := uuid.Parse(c.Param("id"))
if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
    return
}
```

### Differentiating "not found" from "DB error"

The repository returns `(nil, nil)` for not-found vs `(nil, err)` for actual errors:

```go
// In repository:
if errors.Is(err, pgx.ErrNoRows) {
    return nil, nil  // not found — caller decides how to respond
}
return nil, err     // real error

// In handler:
result, err := h.Repo.GetByID(ctx, id)
if err != nil {
    c.JSON(500, gin.H{"error": err.Error()})  // DB error
    return
}
if result == nil {
    c.JSON(404, gin.H{"error": "not found"})  // not found
    return
}
c.JSON(200, result)
```

---

## 9. NFC Check-in System

The NFC check-in module (`internal/checkin/`) is the most operationally critical part of the system. It must be fast, idempotent, and clear in its responses.

### Flow Diagram

```
NFC Scanner taps tag
      ↓
POST /api/v1/checkin/nfc
  body: { "nfc_tag_id": "NFC-BFP-2026-001", "incident_id": "uuid" }
      ↓
1. GetPersonnelByNFCTag(tagID)
   → SELECT ... FROM duty_personnel WHERE nfc_tag_id = $1
   → If nil: 404 "NFC tag not registered"
      ↓
2. IsCheckedIn(personnelID, incidentID)
   → SELECT COUNT(*) FROM personnel_incident_logs
     WHERE personnel_id=$1 AND incident_id=$2 AND check_out_time IS NULL
   → If true: 409 "Already checked in"
      ↓
3. CheckIn(personnelID, incidentID, "NFC")
   → INSERT INTO personnel_incident_logs (...)
   → Returns the new log record
      ↓
4. Response: 201 Created
   {
     "log": { "id": "...", "check_in_time": "...", "check_in_method": "NFC" },
     "personnel": { "full_name": "Juan Dela Cruz", "rank": "SFO2", ... },
     "message": "Check-in successful via NFC"
   }
```

### Why the Duplicate Check Matters

Without `IsCheckedIn`, a scanner glitch or double-tap could insert two check-in records for the same person at the same incident. The check is:

1. Cheap — hits the primary key index
2. Correct — checks `check_out_time IS NULL` (meaning currently checked in, not just ever checked in)

### The `duty_personnel.nfc_tag_id` Index

The schema has a `UNIQUE` constraint on `nfc_tag_id`:

```sql
ALTER TABLE duty_personnel ADD CONSTRAINT duty_personnel_nfc_tag_id_key UNIQUE (nfc_tag_id);
```

A UNIQUE constraint automatically creates a B-tree index. So `WHERE nfc_tag_id = $1` is always an indexed lookup — O(log n) regardless of table size.

---

## 10. Router & Middleware

### Route Grouping with Versioning

```go
v1 := r.Group("/api/v1")
{
    p := v1.Group("/personnel")
    {
        p.GET("", personnelH.GetAll)
        p.GET("/:id", personnelH.GetByID)
        p.POST("", personnelH.Create)
        p.PATCH("/:id/duty-status", personnelH.UpdateDutyStatus)
    }
    // ...
}
```

Prefixing all routes with `/api/v1` allows you to introduce `/api/v2` alongside the existing API when breaking changes are needed, without disrupting existing clients.

### CORS Middleware

CORS (Cross-Origin Resource Sharing) is required for browser-based frontends to call the API from a different origin (domain). The middleware runs before every request:

```go
r.Use(func(c *gin.Context) {
    c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
    c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
    c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if c.Request.Method == "OPTIONS" {
        c.AbortWithStatus(204)  // pre-flight request handled
        return
    }
    c.Next()
})
```

**For production**: Replace `"*"` with your specific frontend domain to prevent unauthorized cross-origin calls.

### Health Check Endpoint

```go
r.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok", "service": "BFPACS API"})
})
```

Used by load balancers, uptime monitors (UptimeRobot, Grafana), and Docker healthcheck directives to verify the service is alive.

---

## 11. Environment Configuration

### The `.env` File

```env
DATABASE_URL=postgres://bfp_admin:password@localhost:5432/bfpacs_db
PORT=8080
```

Loaded by `godotenv` at startup:

```go
if err := godotenv.Load(); err != nil {
    log.Println("No .env file found, reading environment variables directly")
}
```

The fallback is intentional — in production, environment variables are set by the server/container directly (not via `.env` file). The `.env` file is for local development only.

### Security Rules

1. **Never commit `.env` to git.** Add it to `.gitignore`.
2. In production, inject secrets via environment variables, not files.
3. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production credentials.

### Reading Environment Variables

```go
connStr := os.Getenv("DATABASE_URL")
port := os.Getenv("PORT")
if port == "" {
    port = "8080"  // sensible default
}
```

---

## 12. Entry Point — main.go Wiring

`main.go` follows the **Dependency Injection** pattern — it constructs all components and injects their dependencies manually:

```go
func main() {
    godotenv.Load()                      // 1. Load config
    pool := database.NewConnectionPool() // 2. Create shared DB pool
    defer pool.Close()                   // 3. Close pool on shutdown (cleanup)

    // 4. Construct repositories (each gets the same pool)
    personnelRepo := repository.NewPersonnelRepo(pool)
    fleetRepo     := repository.NewFleetRepo(pool)
    // ...

    // 5. Construct handlers (each gets its repo)
    personnelH := handlers.NewPersonnelHandler(personnelRepo)
    fleetH     := handlers.NewFleetHandler(fleetRepo)
    // ...

    // 6. Build the router and register routes
    r := gin.Default()
    // ... register routes ...

    // 7. Start the server
    r.Run(":" + os.Getenv("PORT"))
}
```

### Why Manual Dependency Injection?

- **Explicit**: You can see exactly what each component depends on
- **Testable**: Swap out a real repo for a mock in tests
- **No magic**: No reflection, no containers, no frameworks — just Go constructors

The single `pool` is shared across all repositories. This is correct — the pool itself manages connection allocation and returns connections after each query.

---

## 13. Production Readiness Checklist

### Security

- [ ] Replace CORS `"*"` with specific frontend origin
- [ ] Add JWT authentication middleware (verify token on protected routes)
- [ ] Hash passwords with bcrypt before storing (currently `password_hash` field)
- [ ] Add rate limiting middleware (e.g. `golang.org/x/time/rate`)
- [ ] Use HTTPS via reverse proxy (Nginx/Caddy) in front of the Go server
- [ ] Never log sensitive fields (passwords, NFC tag IDs)
- [ ] Remove `.env` from source control (add to `.gitignore`)

### Performance

- [ ] Switch Gin to release mode: `gin.SetMode(gin.ReleaseMode)` or `GIN_MODE=release`
- [ ] Add database query timeouts: `ctx, cancel := context.WithTimeout(ctx, 5*time.Second)`
- [ ] Add database indexes for frequently queried columns (already done via the backup schema)
- [ ] Enable query result caching for slow, rarely-changing data (e.g. station list)

### Reliability

- [ ] Add structured logging (e.g. `zap` or `slog`) instead of `log.Println`
- [ ] Add database connection retry logic on startup
- [ ] Implement graceful shutdown:
  ```go
  quit := make(chan os.Signal, 1)
  signal.Notify(quit, os.Interrupt)
  <-quit
  pool.Close()
  ```
- [ ] Add request timeout middleware
- [ ] Set up database connection string validation at startup

### Observability

- [ ] Add request logging middleware (Gin's default logger is good for dev)
- [ ] Add Prometheus metrics endpoint (`/metrics`)
- [ ] Set up distributed tracing (OpenTelemetry)
- [ ] Configure alerting on error rate spikes

---

## 14. Deployment Guide

### Option A: Single VPS (Recommended for BFP Scale)

**1. Build the binary on your development machine:**

```bash
# Cross-compile for Linux x86_64 (if your dev machine is different)
GOOS=linux GOARCH=amd64 go build -o bfpacs-api ./cmd/api/main.go
```

**2. Copy to server:**

```bash
scp bfpacs-api user@your-server-ip:/opt/bfpacs/
```

**3. Create a systemd service file** (`/etc/systemd/system/bfpacs.service`):

```ini
[Unit]
Description=BFPACS API Server
After=network.target postgresql.service

[Service]
Type=simple
User=bfpacs
WorkingDirectory=/opt/bfpacs
ExecStart=/opt/bfpacs/bfpacs-api
Restart=always
RestartSec=5
Environment=DATABASE_URL=postgres://bfp_admin:password@localhost:5432/bfpacs_db
Environment=PORT=8080
Environment=GIN_MODE=release

[Install]
WantedBy=multi-user.target
```

**4. Enable and start:**

```bash
systemctl daemon-reload
systemctl enable bfpacs
systemctl start bfpacs
systemctl status bfpacs
```

**5. Set up Nginx as a reverse proxy** (`/etc/nginx/sites-available/bfpacs`):

```nginx
server {
    listen 80;
    server_name api.bfpacs.gov.ph;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**6. Add HTTPS with Certbot:**

```bash
certbot --nginx -d api.bfpacs.gov.ph
```

### Option B: Docker

**`Dockerfile`:**

```dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o bfpacs-api ./cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/bfpacs-api .
EXPOSE 8080
CMD ["./bfpacs-api"]
```

**Build and run:**

```bash
docker build -t bfpacs-api .
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL="postgres://bfp_admin:password@host.docker.internal:5432/bfpacs_db" \
  -e GIN_MODE=release \
  bfpacs-api
```

---

## 15. API Reference Summary

| Method | Path                                        | Description                                 |
| ------ | ------------------------------------------- | ------------------------------------------- |
| GET    | `/health`                                   | Service health check                        |
| GET    | `/api/v1/personnel`                         | List all duty personnel                     |
| GET    | `/api/v1/personnel/:id`                     | Get personnel by UUID                       |
| POST   | `/api/v1/personnel`                         | Create new personnel record                 |
| PATCH  | `/api/v1/personnel/:id/duty-status`         | Update duty status (On/Off Duty)            |
| GET    | `/api/v1/fleets`                            | List all fleet vehicles                     |
| GET    | `/api/v1/fleets/:id`                        | Get fleet vehicle by UUID                   |
| POST   | `/api/v1/fleets`                            | Register new fleet vehicle                  |
| PATCH  | `/api/v1/fleets/:id/location`               | Update GPS location `{lat, lng}`            |
| POST   | `/api/v1/fleets/:id/log-movement`           | Log BFP status code movement                |
| GET    | `/api/v1/fleets/:id/movement-logs`          | Get movement history                        |
| GET    | `/api/v1/incidents`                         | List all fire incidents                     |
| GET    | `/api/v1/incidents/:id`                     | Get incident by UUID                        |
| POST   | `/api/v1/incidents`                         | Report new 10-70 (auto-notifies commanders) |
| PATCH  | `/api/v1/incidents/:id/status`              | Update alarm/incident status                |
| GET    | `/api/v1/dispatches?incident_id=`           | List dispatches for an incident             |
| POST   | `/api/v1/dispatches`                        | Dispatch fleet to incident (En Route)       |
| PATCH  | `/api/v1/dispatches/:id/status`             | Update BFP code (10-23 Arrived, etc.)       |
| GET    | `/api/v1/deployments`                       | List all deployments                        |
| GET    | `/api/v1/deployments/:id`                   | Get deployment by UUID                      |
| POST   | `/api/v1/deployments`                       | Create new deployment                       |
| POST   | `/api/v1/deployments/:id/assign-fleet`      | Assign fleet to deployment                  |
| GET    | `/api/v1/deployments/:id/assignments`       | List fleet assignments                      |
| GET    | `/api/v1/hydrants`                          | List all hydrants                           |
| GET    | `/api/v1/hydrants/nearby?lat=&lng=&radius=` | Nearest hydrants (PostGIS)                  |
| GET    | `/api/v1/hydrants/:id`                      | Get hydrant by UUID                         |
| POST   | `/api/v1/hydrants`                          | Register new hydrant                        |
| GET    | `/api/v1/stations`                          | List all fire stations                      |
| GET    | `/api/v1/stations/:id`                      | Get station by UUID                         |
| POST   | `/api/v1/stations`                          | Register new fire station                   |
| POST   | `/api/v1/reports`                           | Submit situational report                   |
| GET    | `/api/v1/reports/incident/:id`              | Reports for an incident                     |
| GET    | `/api/v1/reports/deployment/:id`            | Reports for a deployment                    |
| GET    | `/api/v1/notifications?user_id=`            | Get notifications for a user                |
| PATCH  | `/api/v1/notifications/:id/read`            | Mark notification as read                   |
| PATCH  | `/api/v1/notifications/read-all?user_id=`   | Mark all as read                            |
| GET    | `/api/v1/equipment?station_id=`             | List equipment (filter by station)          |
| POST   | `/api/v1/equipment`                         | Add new equipment                           |
| PATCH  | `/api/v1/equipment/:id/borrow`              | Record equipment borrow                     |
| PATCH  | `/api/v1/equipment/:id/return`              | Record equipment return                     |
| POST   | `/api/v1/checkin/nfc`                       | NFC tag check-in to incident                |
| POST   | `/api/v1/checkin/pin`                       | PIN check-in to incident                    |
| GET    | `/api/v1/checkin/logs?incident_id=`         | Check-in log for an incident                |

---

## 16. Common Patterns & Recipes

### Pattern: Adding a New Domain (e.g. "Vehicles")

1. **Add the model** → `internal/models/vehicle.go`
2. **Add the repository** → `internal/repository/vehicle_repo.go`
3. **Add the handler** → `internal/handlers/vehicle_handler.go`
4. **Wire in main.go**:
   ```go
   vehicleRepo := repository.NewVehicleRepo(pool)
   vehicleH    := handlers.NewVehicleHandler(vehicleRepo)
   v := v1.Group("/vehicles")
   v.GET("", vehicleH.GetAll)
   v.POST("", vehicleH.Create)
   ```

### Pattern: Adding Authentication

Add a JWT middleware that runs before protected route groups:

```go
authMiddleware := func(c *gin.Context) {
    token := c.GetHeader("Authorization")
    // validate JWT...
    if invalid {
        c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
        return
    }
    c.Next()
}

protected := v1.Group("/")
protected.Use(authMiddleware)
protected.POST("/incidents", incidentH.Create)  // now requires valid JWT
```

### Pattern: Query Timeout

Always add a timeout to prevent slow queries from holding connections:

```go
func (r *IncidentRepo) GetAll(ctx context.Context) ([]models.FireIncident, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    rows, err := r.Pool.Query(ctx, `SELECT ...`)
    // ...
}
```

### Pattern: Transaction for Multi-Table Operations

Use a transaction when multiple inserts must succeed or fail together:

```go
tx, err := r.Pool.Begin(ctx)
if err != nil {
    return nil, err
}
defer tx.Rollback(ctx)  // no-op if already committed

_, err = tx.Exec(ctx, `INSERT INTO incidents ...`)
_, err = tx.Exec(ctx, `INSERT INTO dispatches ...`)

if err := tx.Commit(ctx); err != nil {
    return nil, err
}
```

---

_Built with Go 1.25, Gin v1.12, pgx/v5, PostgreSQL 17, PostGIS — March 2026_
