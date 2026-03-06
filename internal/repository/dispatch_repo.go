package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// DispatchRepo handles incident_dispatches table
type DispatchRepo struct {
	Pool *pgxpool.Pool
}

func NewDispatchRepo(pool *pgxpool.Pool) *DispatchRepo {
	return &DispatchRepo{Pool: pool}
}

func scanDispatch(row pgx.Row) (*models.IncidentDispatch, error) {
	var d models.IncidentDispatch
	err := row.Scan(&d.ID, &d.IncidentID, &d.FleetID, &d.DispatchStatus,
		&d.CheckInTime, &d.CheckOutTime, &d.SituationalReport)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// DispatchFleet creates a new dispatch record with status "En Route"
func (r *DispatchRepo) DispatchFleet(ctx context.Context, req models.DispatchFleetRequest) (*models.IncidentDispatch, error) {
	row := r.Pool.QueryRow(ctx, `
		INSERT INTO incident_dispatches (incident_id, fleet_id, dispatch_status)
		VALUES ($1,$2,'En Route')
		RETURNING id, incident_id, fleet_id, dispatch_status, check_in_time, check_out_time, situational_report`,
		req.IncidentID, req.FleetID)
	d, err := scanDispatch(row)
	if err != nil {
		return nil, err
	}
	return d, nil
}

// UpdateStatus updates the BFP radio code status (e.g. "10-23 Arrived at Scene")
func (r *DispatchRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateDispatchStatusRequest) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE incident_dispatches
		SET dispatch_status    = $1,
		    situational_report = COALESCE($2, situational_report)
		WHERE id=$3`,
		req.DispatchStatus, req.SituationalReport, id)
	return err
}

func (r *DispatchRepo) GetByIncident(ctx context.Context, incidentID uuid.UUID) ([]models.IncidentDispatch, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, incident_id, fleet_id, dispatch_status, check_in_time, check_out_time, situational_report
		FROM incident_dispatches WHERE incident_id=$1 ORDER BY check_in_time DESC`, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.IncidentDispatch
	for rows.Next() {
		var d models.IncidentDispatch
		if err := rows.Scan(&d.ID, &d.IncidentID, &d.FleetID, &d.DispatchStatus,
			&d.CheckInTime, &d.CheckOutTime, &d.SituationalReport); err != nil {
			return nil, err
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *DispatchRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.IncidentDispatch, error) {
	row := r.Pool.QueryRow(ctx, `
		SELECT id, incident_id, fleet_id, dispatch_status, check_in_time, check_out_time, situational_report
		FROM incident_dispatches WHERE id=$1`, id)
	d, err := scanDispatch(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return d, nil
}
