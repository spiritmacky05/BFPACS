package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// FleetRepo handles all DB ops for fleets and fleet_movement_logs
type FleetRepo struct {
	Pool *pgxpool.Pool
}

func NewFleetRepo(pool *pgxpool.Pool) *FleetRepo {
	return &FleetRepo{Pool: pool}
}

// scanFleet scans a fleet row, extracting lat/lng from PostGIS using ST_X/ST_Y
func scanFleetRow(row pgx.Row) (*models.Fleet, error) {
	var f models.Fleet
	err := row.Scan(
		&f.ID, &f.StationID, &f.UserID, &f.EngineCode, &f.PlateNumber,
		&f.VehicleType, &f.FTCapacity, &f.Status, &f.ACSStatus,
		&f.Lat, &f.Lng, &f.CurrentAssignmentStatus, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FleetRepo) GetAll(ctx context.Context) ([]models.Fleet, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, station_id, user_id, engine_code, plate_number, vehicle_type,
		       ft_capacity, status, acs_status,
		       ST_Y(current_location::geometry) AS lat,
		       ST_X(current_location::geometry) AS lng,
		       current_assignment_status, created_at, updated_at
		FROM fleets ORDER BY engine_code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Fleet
	for rows.Next() {
		var f models.Fleet
		if err := rows.Scan(
			&f.ID, &f.StationID, &f.UserID, &f.EngineCode, &f.PlateNumber,
			&f.VehicleType, &f.FTCapacity, &f.Status, &f.ACSStatus,
			&f.Lat, &f.Lng, &f.CurrentAssignmentStatus, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, nil
}

func (r *FleetRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Fleet, error) {
	row := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, user_id, engine_code, plate_number, vehicle_type,
		       ft_capacity, status, acs_status,
		       ST_Y(current_location::geometry) AS lat,
		       ST_X(current_location::geometry) AS lng,
		       current_assignment_status, created_at, updated_at
		FROM fleets WHERE id=$1`, id)
	f, err := scanFleetRow(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return f, nil
}

func (r *FleetRepo) Create(ctx context.Context, req models.CreateFleetRequest) (*models.Fleet, error) {
	status := req.Status
	if status == "" {
		status = "Serviceable"
	}
	acsStatus := req.ACSStatus
	if acsStatus == "" {
		acsStatus = "Inactive"
	}
	row := r.Pool.QueryRow(ctx, `
		INSERT INTO fleets (station_id, user_id, engine_code, plate_number, vehicle_type,
		                    ft_capacity, status, acs_status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING id, station_id, user_id, engine_code, plate_number, vehicle_type,
		          ft_capacity, status, acs_status,
		          ST_Y(current_location::geometry) AS lat,
		          ST_X(current_location::geometry) AS lng,
		          current_assignment_status, created_at, updated_at`,
		req.StationID, req.UserID, req.EngineCode, req.PlateNumber, req.VehicleType,
		req.FTCapacity, status, acsStatus)
	return scanFleetRow(row)
}

// UpdateLocation sets the fleet's current GPS position using PostGIS ST_MakePoint(lng, lat)
func (r *FleetRepo) UpdateLocation(ctx context.Context, id uuid.UUID, lat, lng float64) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE fleets
		SET current_location = ST_MakePoint($1,$2)::geography,
		    updated_at = NOW()
		WHERE id=$3`, lng, lat, id)
	return err
}

// LogMovement inserts a BFP status code event into fleet_movement_logs
func (r *FleetRepo) LogMovement(ctx context.Context, fleetID uuid.UUID, req models.LogMovementRequest) (*models.FleetMovementLog, error) {
	var log models.FleetMovementLog

	// Use a consistent query without the conditional location
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO fleet_movement_logs
		    (dispatch_id, fleet_id, status_code, location_point, battery_level, heading, purpose, destination_text, odometer_reading)
		VALUES ($1,$2,$3,
		        CASE WHEN $4::float8 IS NOT NULL AND $5::float8 IS NOT NULL
		             THEN ST_MakePoint($5,$4)::geography ELSE NULL END,
		        $6,$7,$8,$9,$10)
		RETURNING id, dispatch_id, fleet_id, status_code,
		          ST_Y(location_point::geometry), ST_X(location_point::geometry),
		          recorded_at, battery_level, heading, purpose, destination_text, odometer_reading`,
		req.DispatchID, fleetID, req.StatusCode,
		req.Lat, req.Lng,
		req.BatteryLevel, req.Heading, req.Purpose, req.DestinationText, req.OdometerReading).Scan(
		&log.ID, &log.DispatchID, &log.FleetID, &log.StatusCode,
		&log.Lat, &log.Lng,
		&log.RecordedAt, &log.BatteryLevel, &log.Heading, &log.Purpose, &log.DestinationText, &log.OdometerReading)
	if err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *FleetRepo) GetMovementLogs(ctx context.Context, fleetID uuid.UUID) ([]models.FleetMovementLog, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, dispatch_id, fleet_id, status_code,
		       ST_Y(location_point::geometry), ST_X(location_point::geometry),
		       recorded_at, battery_level, heading, purpose, destination_text, odometer_reading
		FROM fleet_movement_logs WHERE fleet_id=$1 ORDER BY recorded_at DESC`, fleetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.FleetMovementLog
	for rows.Next() {
		var l models.FleetMovementLog
		if err := rows.Scan(&l.ID, &l.DispatchID, &l.FleetID, &l.StatusCode,
			&l.Lat, &l.Lng, &l.RecordedAt, &l.BatteryLevel,
			&l.Heading, &l.Purpose, &l.DestinationText, &l.OdometerReading); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}
