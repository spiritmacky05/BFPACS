package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// IncidentRepo handles fire_incidents table
type IncidentRepo struct {
	Pool *pgxpool.Pool
}

func NewIncidentRepo(pool *pgxpool.Pool) *IncidentRepo {
	return &IncidentRepo{Pool: pool}
}

func (r *IncidentRepo) GetAll(ctx context.Context) ([]models.FireIncident, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, reported_by, location_text,
		       ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		       date_time_reported, occupancy_type, involved_type, alarm_status,
		       incident_status, ground_commander, ics_commander,
		       total_injured, total_rescued, occupancy_category,
		       involves_hazardous_materials, response_type, created_at, updated_at
		FROM fire_incidents ORDER BY date_time_reported DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.FireIncident
	for rows.Next() {
		var i models.FireIncident
		if err := rows.Scan(&i.ID, &i.ReportedBy, &i.LocationText, &i.Lat, &i.Lng,
			&i.DateTimeReported, &i.OccupancyType, &i.InvolvedType, &i.AlarmStatus,
			&i.IncidentStatus, &i.GroundCommander, &i.ICSCommander,
			&i.TotalInjured, &i.TotalRescued, &i.OccupancyCategory,
			&i.InvolvesHazardousMaterials, &i.ResponseType, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, i)
	}
	return list, nil
}

func (r *IncidentRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.FireIncident, error) {
	var i models.FireIncident
	err := r.Pool.QueryRow(ctx, `
		SELECT id, reported_by, location_text,
		       ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		       date_time_reported, occupancy_type, involved_type, alarm_status,
		       incident_status, ground_commander, ics_commander,
		       total_injured, total_rescued, occupancy_category,
		       involves_hazardous_materials, response_type, created_at, updated_at
		FROM fire_incidents WHERE id=$1`, id).Scan(
		&i.ID, &i.ReportedBy, &i.LocationText, &i.Lat, &i.Lng,
		&i.DateTimeReported, &i.OccupancyType, &i.InvolvedType, &i.AlarmStatus,
		&i.IncidentStatus, &i.GroundCommander, &i.ICSCommander,
		&i.TotalInjured, &i.TotalRescued, &i.OccupancyCategory,
		&i.InvolvesHazardousMaterials, &i.ResponseType, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &i, nil
}

// Create inserts a new fire incident. The DB trigger will auto-create notifications.
func (r *IncidentRepo) Create(ctx context.Context, req models.CreateIncidentRequest) (*models.FireIncident, error) {
	alarmStatus := req.AlarmStatus
	if alarmStatus == "" {
		alarmStatus = "1st Alarm"
	}
	responseType := req.ResponseType
	if responseType == "" {
		responseType = "Fire Incident"
	}

	var i models.FireIncident
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO fire_incidents
		    (reported_by, location_text, geo_location, occupancy_type, involved_type,
		     alarm_status, ground_commander, occupancy_category,
		     involves_hazardous_materials, response_type)
		VALUES ($1,$2,
		        CASE WHEN $3::float8 IS NOT NULL AND $4::float8 IS NOT NULL
		             THEN ST_MakePoint($4,$3)::geography ELSE NULL END,
		        $5,$6,$7,$8,$9,$10,$11)
		RETURNING id, reported_by, location_text,
		          ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		          date_time_reported, occupancy_type, involved_type, alarm_status,
		          incident_status, ground_commander, ics_commander,
		          total_injured, total_rescued, occupancy_category,
		          involves_hazardous_materials, response_type, created_at, updated_at`,
		req.ReportedBy, req.LocationText, req.Lat, req.Lng,
		req.OccupancyType, req.InvolvedType, alarmStatus, req.GroundCommander,
		req.OccupancyCategory, req.InvolvesHazardousMaterials, responseType).Scan(
		&i.ID, &i.ReportedBy, &i.LocationText, &i.Lat, &i.Lng,
		&i.DateTimeReported, &i.OccupancyType, &i.InvolvedType, &i.AlarmStatus,
		&i.IncidentStatus, &i.GroundCommander, &i.ICSCommander,
		&i.TotalInjured, &i.TotalRescued, &i.OccupancyCategory,
		&i.InvolvesHazardousMaterials, &i.ResponseType, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *IncidentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateIncidentStatusRequest) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE fire_incidents SET
		    incident_status = COALESCE($1, incident_status),
		    alarm_status    = COALESCE($2, alarm_status),
		    ground_commander= COALESCE($3, ground_commander),
		    ics_commander   = COALESCE($4, ics_commander),
		    total_injured   = COALESCE($5, total_injured),
		    total_rescued   = COALESCE($6, total_rescued),
		    updated_at      = NOW()
		WHERE id=$7`,
		req.IncidentStatus, req.AlarmStatus, req.GroundCommander, req.ICSCommander,
		req.TotalInjured, req.TotalRescued, id)
	return err
}
