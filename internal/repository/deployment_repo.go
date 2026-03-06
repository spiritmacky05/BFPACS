package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// DeploymentRepo handles deployments and deployment_assignments
type DeploymentRepo struct {
	Pool *pgxpool.Pool
}

func NewDeploymentRepo(pool *pgxpool.Pool) *DeploymentRepo {
	return &DeploymentRepo{Pool: pool}
}

func (r *DeploymentRepo) GetAll(ctx context.Context) ([]models.Deployment, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, name_of_deployment, location_text,
		       ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		       status, team_leader, remarks, start_time, end_time, created_at, updated_at
		FROM deployments ORDER BY start_time DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Deployment
	for rows.Next() {
		var d models.Deployment
		if err := rows.Scan(&d.ID, &d.NameOfDeployment, &d.LocationText, &d.Lat, &d.Lng,
			&d.Status, &d.TeamLeader, &d.Remarks, &d.StartTime, &d.EndTime, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *DeploymentRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Deployment, error) {
	var d models.Deployment
	err := r.Pool.QueryRow(ctx, `
		SELECT id, name_of_deployment, location_text,
		       ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		       status, team_leader, remarks, start_time, end_time, created_at, updated_at
		FROM deployments WHERE id=$1`, id).Scan(
		&d.ID, &d.NameOfDeployment, &d.LocationText, &d.Lat, &d.Lng,
		&d.Status, &d.TeamLeader, &d.Remarks, &d.StartTime, &d.EndTime, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *DeploymentRepo) Create(ctx context.Context, req models.CreateDeploymentRequest) (*models.Deployment, error) {
	var d models.Deployment
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO deployments (name_of_deployment, location_text, geo_location, team_leader, remarks)
		VALUES ($1,$2,
		        CASE WHEN $3::float8 IS NOT NULL AND $4::float8 IS NOT NULL
		             THEN ST_MakePoint($4,$3)::geography ELSE NULL END,
		        $5,$6)
		RETURNING id, name_of_deployment, location_text,
		          ST_Y(geo_location::geometry), ST_X(geo_location::geometry),
		          status, team_leader, remarks, start_time, end_time, created_at, updated_at`,
		req.NameOfDeployment, req.LocationText, req.Lat, req.Lng, req.TeamLeader, req.Remarks).Scan(
		&d.ID, &d.NameOfDeployment, &d.LocationText, &d.Lat, &d.Lng,
		&d.Status, &d.TeamLeader, &d.Remarks, &d.StartTime, &d.EndTime, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// AssignFleet creates a deployment_assignments record
func (r *DeploymentRepo) AssignFleet(ctx context.Context, deploymentID uuid.UUID, req models.AssignFleetToDeploymentRequest) (*models.DeploymentAssignment, error) {
	var a models.DeploymentAssignment
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO deployment_assignments (deployment_id, fleet_id)
		VALUES ($1,$2)
		RETURNING id, deployment_id, fleet_id, check_in_time, check_out_time, situation_update, photo_url`,
		deploymentID, req.FleetID).Scan(
		&a.ID, &a.DeploymentID, &a.FleetID, &a.CheckInTime, &a.CheckOutTime,
		&a.SituationUpdate, &a.PhotoURL)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *DeploymentRepo) GetAssignments(ctx context.Context, deploymentID uuid.UUID) ([]models.DeploymentAssignment, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, deployment_id, fleet_id, check_in_time, check_out_time, situation_update, photo_url
		FROM deployment_assignments WHERE deployment_id=$1 ORDER BY check_in_time`, deploymentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.DeploymentAssignment
	for rows.Next() {
		var a models.DeploymentAssignment
		if err := rows.Scan(&a.ID, &a.DeploymentID, &a.FleetID, &a.CheckInTime,
			&a.CheckOutTime, &a.SituationUpdate, &a.PhotoURL); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}
